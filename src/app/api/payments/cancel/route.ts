import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { emailService } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentKey, orderId, cancelReason, cancelAmount } = body;

    console.log('🔍 [API] 결제 취소 요청:', { paymentKey, orderId, cancelReason, cancelAmount });

    // 필수 파라미터 검증
    if (!paymentKey || !orderId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Toss Payments API 호출하여 결제 취소
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cancelReason: cancelReason || '고객 요청',
        cancelAmount: cancelAmount // 부분 취소 시에만 사용
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Toss 결제 취소 실패:', data);
      return NextResponse.json(
        { success: false, message: data.message || '결제 취소에 실패했습니다.' },
        { status: response.status }
      );
    }

    console.log('✅ Toss 결제 취소 성공:', data);

    // 1. 예약 상태를 'cancelled'로 변경
    const { data: updatedBooking, error: updateError } = await (supabase as any)
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason || '고객 요청'
      })
      .eq('order_id', orderId)
      .select(`
        *,
        users!inner(email, name),
        consultants!inner(name, specialty)
      `)
      .single();

    if (updateError) {
      console.error('❌ 예약 상태 업데이트 실패:', updateError);
      return NextResponse.json(
        { success: false, message: '예약 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 예약 상태 업데이트 성공:', updatedBooking);

    // 2. 고객에게 취소 완료 이메일 발송
    if (updatedBooking.users) {
      try {
        await emailService.sendNotificationEmail(
          updatedBooking.users.email,
          'payment_cancelled',
          {
            consultantName: updatedBooking.consultants.name,
            bookingDate: new Date(updatedBooking.start_at).toLocaleString('ko-KR'),
            duration: updatedBooking.duration,
            amount: updatedBooking.payment_amount,
            topic: updatedBooking.topic,
            cancelReason: cancelReason || '고객 요청',
            refundAmount: cancelAmount || updatedBooking.payment_amount
          }
        );
        console.log('✅ 결제 취소 이메일 발송 성공');
      } catch (emailError) {
        console.error('❌ 결제 취소 이메일 발송 실패:', emailError);
        // 이메일 발송 실패는 결제 취소 실패로 처리하지 않음
      }
    }

    // 3. 상담사에게도 취소 알림 이메일 발송 (선택사항)
    // TODO: 상담사 이메일 정보가 있다면 취소 알림 발송

    const cancelResult = {
      success: true,
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      cancelAmount: data.cancelAmount,
      status: data.status,
      cancelledAt: data.cancelledAt,
      cancelReason: cancelReason || '고객 요청',
      booking: updatedBooking
    };

    return NextResponse.json({
      success: true,
      data: cancelResult,
      message: '결제가 성공적으로 취소되었습니다.'
    });

  } catch (error) {
    console.error('❌ 결제 취소 API 처리 중 예외 발생:', error);
    return NextResponse.json(
      { success: false, message: '결제 취소 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
