import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';
import { adminNotificationService } from '@/lib/admin-notification-service';

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const body = await req.json();
    
    console.log('🔍 [WEBHOOK] Toss Payments 웹훅 수신:', body);

    // 웹훅 시그니처 검증 (보안 강화)
    const signature = (await headersList).get('toss-signature');
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // TODO: 실제 시그니처 검증 로직 구현
      // HMAC SHA256을 사용한 시그니처 검증
      console.log('🔐 웹훅 시그니처 검증:', signature);
    }

    const { 
      paymentKey, 
      orderId, 
      amount, 
      status, 
      method, 
      type 
    } = body;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 웹훅 타입에 따른 처리
    switch (type) {
      case 'PAYMENT_STATUS_CHANGED':
        if (status === 'DONE') {
          console.log('✅ 결제 완료 웹훅 처리:', { paymentKey, orderId, amount });
          
          // 1. 예약 상태를 'confirmed'로 변경 및 결제 정보 저장
          const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              payment_key: paymentKey,
              payment_amount: amount,
              payment_approved_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .select(`
              *,
              users!inner(id, email, name),
              consultants!inner(id, name, specialty)
            `)
            .single();

          if (updateError) {
            console.error('❌ 예약 상태 업데이트 실패:', updateError);
            throw new Error('예약 상태 업데이트 실패');
          }

          console.log('✅ 예약 상태 업데이트 성공:', updatedBooking);

          // 2. 결제 거래 정보 저장
          const { error: paymentError } = await supabase
            .from('payment_transactions')
            .insert({
              booking_id: updatedBooking.id,
              user_id: updatedBooking.user_id,
              amount: amount,
              payment_method: method || 'toss',
              status: 'completed',
              transaction_id: paymentKey,
              payment_date: new Date().toISOString()
            });

          if (paymentError) {
            console.error('❌ 결제 거래 정보 저장 실패:', paymentError);
          } else {
            console.log('✅ 결제 거래 정보 저장 성공');
          }

          // 3. 고객에게 푸시 알림 발송
          try {
            const pushResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: updatedBooking.user_id,
                title: '✅ 결제 완료!',
                body: `${updatedBooking.consultants.name} 상담사와의 상담이 확정되었습니다.`,
                data: {
                  type: 'payment_confirmed',
                  bookingId: updatedBooking.id,
                  url: '/bookings'
                }
              })
            });

            if (pushResponse.ok) {
              console.log('✅ 푸시 알림 발송 성공');
            } else {
              console.warn('⚠️ 푸시 알림 발송 실패:', pushResponse.status);
            }
          } catch (pushError) {
            console.error('❌ 푸시 알림 발송 중 오류:', pushError);
          }

          // 4. 고객에게 결제 완료 이메일 발송
          try {
            const emailResult = await emailService.sendNotificationEmail(
              updatedBooking.users.email,
              'payment_confirmed',
              {
                amount: amount,
                paymentMethod: method,
                consultantName: updatedBooking.consultants.name,
                bookingDate: new Date(updatedBooking.start_at).toLocaleString('ko-KR'),
                duration: updatedBooking.duration
              }
            );

            if (emailResult.success) {
              console.log('✅ 결제 완료 이메일 발송 성공');
            } else {
              console.warn('⚠️ 이메일 발송 실패:', emailResult.error);
            }
          } catch (emailError) {
            console.error('❌ 이메일 발송 중 오류:', emailError);
          }

          // 5. 상담사에게 새 예약 알림 (선택사항)
          try {
            const consultantPushResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: updatedBooking.consultant_id,
                title: '🎉 새로운 예약!',
                body: `${updatedBooking.users.name || '고객'}님이 상담을 예약했습니다.`,
                data: {
                  type: 'new_booking',
                  bookingId: updatedBooking.id,
                  url: '/admin/bookings'
                }
              })
            });

            if (consultantPushResponse.ok) {
              console.log('✅ 상담사 푸시 알림 발송 성공');
            }
          } catch (consultantPushError) {
            console.error('❌ 상담사 푸시 알림 발송 중 오류:', consultantPushError);
          }

          // 6. 관리자에게 새 예약 알림
          try {
            await adminNotificationService.notifyNewBooking({
              id: updatedBooking.id,
              user_name: updatedBooking.users.name || '고객',
              consultant_name: updatedBooking.consultants.name,
              start_at: updatedBooking.start_at,
              duration: updatedBooking.duration,
              amount: amount
            });
            console.log('✅ 관리자 새 예약 알림 발송 성공');
          } catch (adminNotifyError) {
            console.error('❌ 관리자 새 예약 알림 발송 중 오류:', adminNotifyError);
          }

          // 7. 관리자에게 결제 완료 알림
          try {
            await adminNotificationService.notifyPaymentCompleted({
              id: paymentKey,
              amount: amount,
              user_name: updatedBooking.users.name || '고객',
              consultant_name: updatedBooking.consultants.name,
              payment_method: method || 'toss'
            });
            console.log('✅ 관리자 결제 완료 알림 발송 성공');
          } catch (adminPaymentError) {
            console.error('❌ 관리자 결제 완료 알림 발송 중 오류:', adminPaymentError);
          }
          
        } else if (status === 'CANCELED') {
          console.log('❌ 결제 취소 웹훅 처리:', { paymentKey, orderId });
          
          // 1. 예약 상태를 'cancelled'로 변경
          const { data: cancelledBooking, error: cancelError } = await supabase
            .from('bookings')
            .update({ 
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancel_reason: '결제 취소'
            })
            .eq('order_id', orderId)
            .select(`
              *,
              users!inner(id, email, name),
              consultants!inner(id, name, specialty)
            `)
            .single();

          if (cancelError) {
            console.error('❌ 예약 취소 처리 실패:', cancelError);
            throw new Error('예약 취소 처리 실패');
          }

          console.log('✅ 예약 취소 처리 성공:', cancelledBooking);

          // 2. 결제 거래 정보 업데이트
          const { error: paymentCancelError } = await supabase
            .from('payment_transactions')
            .update({
              status: 'cancelled',
              refund_date: new Date().toISOString(),
              refund_amount: amount,
              refund_reason: '결제 취소'
            })
            .eq('transaction_id', paymentKey);

          if (paymentCancelError) {
            console.error('❌ 결제 거래 취소 정보 업데이트 실패:', paymentCancelError);
          } else {
            console.log('✅ 결제 거래 취소 정보 업데이트 성공');
          }

          // 3. 고객에게 취소 푸시 알림 발송
          try {
            const pushResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: cancelledBooking.user_id,
                title: '❌ 결제 취소 완료',
                body: `상담 예약이 취소되었습니다. 환불은 3-5일 내에 처리됩니다.`,
                data: {
                  type: 'payment_cancelled',
                  bookingId: cancelledBooking.id,
                  url: '/bookings'
                }
              })
            });

            if (pushResponse.ok) {
              console.log('✅ 취소 푸시 알림 발송 성공');
            } else {
              console.warn('⚠️ 취소 푸시 알림 발송 실패:', pushResponse.status);
            }
          } catch (pushError) {
            console.error('❌ 취소 푸시 알림 발송 중 오류:', pushError);
          }

          // 4. 고객에게 취소 안내 이메일 발송
          try {
            const emailResult = await emailService.sendNotificationEmail(
              cancelledBooking.users.email,
              'payment_cancelled',
              {
                consultantName: cancelledBooking.consultants.name,
                bookingDate: new Date(cancelledBooking.start_at).toLocaleString('ko-KR'),
                duration: cancelledBooking.duration,
                refundAmount: amount,
                cancelReason: '결제 취소'
              }
            );

            if (emailResult.success) {
              console.log('✅ 취소 안내 이메일 발송 성공');
            } else {
              console.warn('⚠️ 취소 안내 이메일 발송 실패:', emailResult.error);
            }
          } catch (emailError) {
            console.error('❌ 취소 안내 이메일 발송 중 오류:', emailError);
          }
        }
        break;

      case 'PAYMENT_CANCELED':
        console.log('❌ 결제 취소 웹훅 처리:', { paymentKey, orderId });
        
        // PAYMENT_STATUS_CHANGED의 CANCELED와 동일한 로직 수행
        const { data: cancelledBooking, error: cancelError } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_reason: '결제 취소'
          })
          .eq('order_id', orderId)
          .select(`
            *,
            users!inner(id, email, name),
            consultants!inner(id, name, specialty)
          `)
          .single();

        if (!cancelError && cancelledBooking) {
          // 푸시 알림 및 이메일 발송 (간소화)
          try {
            await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: cancelledBooking.user_id,
                title: '❌ 결제 취소',
                body: '상담 예약 결제가 취소되었습니다.',
                data: { type: 'payment_cancelled', url: '/bookings' }
              })
            });

            await emailService.sendNotificationEmail(
              cancelledBooking.users.email,
              'payment_cancelled',
              {
                consultantName: cancelledBooking.consultants.name,
                cancelReason: '결제 취소'
              }
            );
          } catch (error) {
            console.error('❌ 취소 알림 발송 중 오류:', error);
          }
        }
        break;

      default:
        console.log('ℹ️ 알 수 없는 웹훅 타입:', type);
    }

    // 웹훅 처리 성공 응답
    return NextResponse.json({ 
      success: true, 
      message: '웹훅이 성공적으로 처리되었습니다.' 
    });

  } catch (error) {
    console.error('❌ 웹훅 처리 실패:', error);
    
    // 웹훅 처리 실패 시에도 200 응답 (Toss가 재시도하지 않도록)
    return NextResponse.json({ 
      success: false, 
      message: '웹훅 처리 중 오류가 발생했습니다.' 
    }, { status: 200 });
  }
}
