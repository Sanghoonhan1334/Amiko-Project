import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { emailService } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentKey, orderId, amount } = body;

    console.log('🔍 [API] Toss 결제 승인 요청:', { paymentKey, orderId, amount });

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Toss Payments API 호출하여 결제 승인
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Toss 결제 승인 실패:', data);
      return NextResponse.json(
        { success: false, message: data.message || '결제 승인에 실패했습니다.' },
        { status: response.status }
      );
    }

    console.log('✅ Toss 결제 승인 성공:', data);

    // 1. 예약 상태를 'pending' -> 'confirmed'로 변경
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

    // 2. 고객에게 결제 완료 이메일 발송
    if (updatedBooking.users) {
      try {
        await emailService.sendNotificationEmail(
          updatedBooking.users.email,
          'payment_confirmed',
          {
            consultantName: updatedBooking.consultants.name,
            bookingDate: new Date(updatedBooking.start_at).toLocaleString('ko-KR'),
            duration: updatedBooking.duration,
            amount: updatedBooking.payment_amount,
            topic: updatedBooking.topic,
            paymentMethod: data.method
          }
        );
        console.log('✅ 결제 완료 이메일 발송 성공');
      } catch (emailError) {
        console.error('❌ 결제 완료 이메일 발송 실패:', emailError);
        // 이메일 발송 실패는 결제 승인 실패로 처리하지 않음
      }
    }

    const approveResult = {
      success: true,
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      amount: data.totalAmount,
      status: data.status,
      approvedAt: data.approvedAt,
      method: data.method,
      booking: updatedBooking
    };

    return NextResponse.json({
      success: true,
      data: approveResult,
      message: '결제가 성공적으로 승인되었습니다.'
    });

  } catch (error) {
    console.error('❌ 결제 승인 처리 실패:', error);
    return NextResponse.json(
      { success: false, message: '결제 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
