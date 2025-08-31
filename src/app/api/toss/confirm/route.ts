import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// orderId로 booking_id 찾기
async function findBookingIdByOrderId(orderId: string): Promise<string> {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (error || !booking) {
      console.warn('[CONFIRM] booking을 찾을 수 없음:', orderId);
      // 임시 UUID 반환 (실제 운영에서는 에러 처리 필요)
      return '00000000-0000-0000-0000-000000000000';
    }

    return booking.id;
  } catch (error) {
    console.error('[CONFIRM] booking 조회 실패:', error);
    return '00000000-0000-0000-0000-000000000000';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    // 유효성 검사
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log('[CONFIRM] 결제 확인 요청:', { paymentKey, orderId, amount });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Toss Secret Key 확인
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey || secretKey === 'test_sk_abcdef1234567890...') {
      console.warn('[CONFIRM] Toss Secret Key가 설정되지 않음');
      return NextResponse.json(
        { success: false, message: 'Toss Secret Key가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Basic 인증 헤더 생성
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    // Toss 결제 확인 API 호출
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json();
      console.error('[CONFIRM] Toss API 오류:', errorData);
      return NextResponse.json(
        { success: false, message: `Toss API 오류: ${errorData.message || tossResponse.statusText}` },
        { status: tossResponse.status }
      );
    }

    const paymentData = await tossResponse.json();
    console.log('[CONFIRM] Toss 결제 확인 성공:', paymentData);

    // Supabase 테이블 존재 여부 확인
    try {
      const { error: tableError } = await supabase
        .from('payments')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('[CONFIRM] payments 테이블 확인 실패:', tableError);
        // 테이블이 없어도 Toss 결제는 성공으로 처리
        return NextResponse.json({
          success: true,
          message: '결제가 성공적으로 확인되었습니다. (DB 저장 생략)',
          data: {
            paymentKey,
            orderId,
            amount,
            status: paymentData.status,
            receiptUrl: paymentData.receipt?.url,
            method: paymentData.method,
            approvedAt: paymentData.approvedAt,
          }
        });
      }

      // 중복 결제 방지: orderId로 기존 결제 확인
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, amount, status, payment_key')
        .eq('order_id', orderId)
        .single();

      if (existingPayment) {
        console.warn('[CONFIRM] 중복 결제 시도 감지:', existingPayment);
        
        // 이미 동일한 paymentKey로 처리된 결제인 경우
        if (existingPayment.payment_key === paymentKey) {
          console.log('[CONFIRM] 동일한 paymentKey로 이미 처리된 결제:', paymentKey);
          return NextResponse.json({
            success: true,
            message: '이미 처리된 결제입니다.',
            data: {
              paymentKey,
              orderId,
              amount,
              status: existingPayment.status,
              receiptUrl: paymentData.receipt?.url,
              method: paymentData.method,
              approvedAt: paymentData.approvedAt,
            }
          });
        }
        
        // 금액 검증 (위변조 방지)
        if (existingPayment.amount !== amount) {
          console.error('[CONFIRM] 금액 불일치:', { db: existingPayment.amount, toss: amount });
          return NextResponse.json(
            { success: false, message: '결제 금액이 일치하지 않습니다.' },
            { status: 400 }
          );
        }

        // 이미 완료된 결제인 경우
        if (existingPayment.status === 'confirmed') {
          return NextResponse.json({
            success: true,
            message: '이미 완료된 결제입니다.',
            data: {
              paymentKey,
              orderId,
              amount,
              status: 'confirmed',
              receiptUrl: paymentData.receipt?.url,
              method: paymentData.method,
              approvedAt: paymentData.approvedAt,
            }
          });
        }
      }

      // Supabase payments 테이블에 저장/업데이트
      let dbPaymentData;
      if (existingPayment) {
        // 기존 결제 정보 업데이트
        const { data: updatedPayment, error } = await supabase
          .from('payments')
          .update({
            payment_key: paymentKey,
            amount: amount,
            status: paymentData.status === 'DONE' ? 'confirmed' : 'pending',
            method: paymentData.method,
            receipt_url: paymentData.receipt?.url,
            approved_at: paymentData.approvedAt,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .select()
          .single();

        if (error) {
          console.error('[CONFIRM] 결제 업데이트 실패:', error);
          throw error;
        }
        dbPaymentData = updatedPayment;
      } else {
        // 새 결제 정보 저장
        const { data: newPayment, error } = await supabase
          .from('payments')
          .insert({
            payment_key: paymentKey,
            order_id: orderId,
            amount: amount,
            status: paymentData.status === 'DONE' ? 'confirmed' : 'pending',
            method: paymentData.method,
            receipt_url: paymentData.receipt?.url,
            approved_at: paymentData.approvedAt,
            // orderId로 booking 찾아서 연결
            booking_id: await findBookingIdByOrderId(orderId)
          })
          .select()
          .single();

        if (error) {
          console.error('[CONFIRM] 결제 저장 실패:', error);
          throw error;
        }
        dbPaymentData = newPayment;
      }

      console.log('[CONFIRM] Supabase 저장/업데이트 성공:', dbPaymentData);

    } catch (dbError) {
      console.error('[CONFIRM] DB 처리 중 오류:', dbError);
      // DB 오류가 있어도 Toss 결제는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: '결제가 성공적으로 확인되었습니다.',
      data: {
        paymentKey,
        orderId,
        amount,
        status: paymentData.status,
        receiptUrl: paymentData.receipt?.url,
        method: paymentData.method,
        approvedAt: paymentData.approvedAt,
      }
    });

  } catch (error: unknown) {
    console.error('[CONFIRM] 결제 확인 처리 실패:', error);
    return NextResponse.json(
      { success: false, message: '결제 확인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
