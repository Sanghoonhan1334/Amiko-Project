import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';

export async function GET() {
  try {
    console.log('🔔 [CRON] 리마인더 작업 시작...')

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 현재 시간부터 24시간 후까지의 예약을 조회
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 24시간 후 예약 중 리마인더가 아직 발송되지 않은 것들
    const { data: upcomingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        users!inner(id, email, name),
        consultants!inner(id, name, specialty, email)
      `)
      .eq('status', 'confirmed')
      .gte('start_at', now.toISOString())
      .lte('start_at', tomorrow.toISOString())
      .eq('reminder_sent', false);

    if (bookingError) {
      console.error('❌ 예약 조회 실패:', bookingError);
      return NextResponse.json({ error: '예약 조회 실패' }, { status: 500 });
    }

    console.log(`📊 리마인더 대상 예약: ${upcomingBookings?.length || 0}건`);

    if (!upcomingBookings || upcomingBookings.length === 0) {
      console.log('✅ 리마인더 발송할 예약이 없습니다.');
      return NextResponse.json({ 
        success: true, 
        message: '리마인더 발송할 예약이 없습니다.',
        count: 0
      });
    }

    let successCount = 0;
    let failureCount = 0;

    // 각 예약에 대해 리마인더 발송
    for (const booking of upcomingBookings) {
      try {
        console.log(`📧 [BOOKING ${booking.id}] 리마인더 발송 시작`);

        // 1. 고객에게 푸시 알림 발송
        try {
          const pushResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: booking.user_id,
              title: '⏰ 내일 상담 예정!',
              body: `${booking.consultants.name} 상담사와의 상담이 내일 ${new Date(booking.start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 예정되어 있습니다.`,
              data: {
                type: 'consultation_reminder',
                bookingId: booking.id,
                url: '/bookings'
              }
            })
          });

          if (pushResponse.ok) {
            console.log(`✅ [BOOKING ${booking.id}] 고객 푸시 알림 발송 성공`);
          } else {
            console.warn(`⚠️ [BOOKING ${booking.id}] 고객 푸시 알림 발송 실패:`, pushResponse.status);
          }
        } catch (pushError) {
          console.error(`❌ [BOOKING ${booking.id}] 고객 푸시 알림 발송 중 오류:`, pushError);
        }

        // 2. 고객에게 리마인더 이메일 발송
        try {
          const emailResult = await emailService.sendNotificationEmail(
            booking.users.email,
            'consultation_reminder',
            {
              consultantName: booking.consultants.name,
              bookingDate: new Date(booking.start_at).toLocaleString('ko-KR'),
              duration: booking.duration,
              consultantSpecialty: booking.consultants.specialty
            }
          );

          if (emailResult.success) {
            console.log(`✅ [BOOKING ${booking.id}] 고객 리마인더 이메일 발송 성공`);
          } else {
            console.warn(`⚠️ [BOOKING ${booking.id}] 고객 리마인더 이메일 발송 실패:`, emailResult.error);
          }
        } catch (emailError) {
          console.error(`❌ [BOOKING ${booking.id}] 고객 리마인더 이메일 발송 중 오류:`, emailError);
        }

        // 3. 상담사에게 푸시 알림 발송
        try {
          const consultantPushResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: booking.consultant_id,
              title: '⏰ 내일 상담 예정!',
              body: `${booking.users.name || '고객'}님과의 상담이 내일 ${new Date(booking.start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 예정되어 있습니다.`,
              data: {
                type: 'consultation_reminder',
                bookingId: booking.id,
                url: '/admin/bookings'
              }
            })
          });

          if (consultantPushResponse.ok) {
            console.log(`✅ [BOOKING ${booking.id}] 상담사 푸시 알림 발송 성공`);
          } else {
            console.warn(`⚠️ [BOOKING ${booking.id}] 상담사 푸시 알림 발송 실패:`, consultantPushResponse.status);
          }
        } catch (consultantPushError) {
          console.error(`❌ [BOOKING ${booking.id}] 상담사 푸시 알림 발송 중 오류:`, consultantPushError);
        }

        // 4. 상담사에게 리마인더 이메일 발송 (선택사항)
        if (booking.consultants.email) {
          try {
            const consultantEmailResult = await emailService.sendNotificationEmail(
              booking.consultants.email,
              'consultation_reminder_consultant',
              {
                customerName: booking.users.name || '고객',
                bookingDate: new Date(booking.start_at).toLocaleString('ko-KR'),
                duration: booking.duration
              }
            );

            if (consultantEmailResult.success) {
              console.log(`✅ [BOOKING ${booking.id}] 상담사 리마인더 이메일 발송 성공`);
            } else {
              console.warn(`⚠️ [BOOKING ${booking.id}] 상담사 리마인더 이메일 발송 실패:`, consultantEmailResult.error);
            }
          } catch (consultantEmailError) {
            console.error(`❌ [BOOKING ${booking.id}] 상담사 리마인더 이메일 발송 중 오류:`, consultantEmailError);
          }
        }

        // 5. 예약에 리마인더 발송 완료 표시
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`❌ [BOOKING ${booking.id}] 리마인더 발송 상태 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ [BOOKING ${booking.id}] 리마인더 발송 상태 업데이트 성공`);
          successCount++;
        }

      } catch (bookingError) {
        console.error(`❌ [BOOKING ${booking.id}] 리마인더 발송 중 오류:`, bookingError);
        failureCount++;
      }
    }

    console.log(`🎯 [CRON REMINDER] 완료 - 성공: ${successCount}건, 실패: ${failureCount}건`);

    return NextResponse.json({
      success: true,
      message: '리마인더 발송이 완료되었습니다.',
      results: {
        total: upcomingBookings.length,
        success: successCount,
        failure: failureCount
      }
    });

  } catch (error) {
    console.error('❌ [CRON REMINDER] 스케줄러 실행 실패:', error);
    
    return NextResponse.json(
      { 
        error: '리마인더 스케줄러 실행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// POST로도 호출 가능하게 함 (테스트용)
export async function POST() {
  return GET();
}
