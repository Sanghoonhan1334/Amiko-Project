import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> }
) {
  const { paymentKey } = await params;
  try {

    if (!paymentKey) {
      return NextResponse.json(
        { success: false, message: '결제 키가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('[PAYMENT] 결제 상태 조회:', paymentKey);

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 결제 정보 조회
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_key', paymentKey)
      .single()

    if (fetchError) {
      console.error('❌ 결제 정보 조회 실패:', fetchError)
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentKey: payment.payment_key,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        receiptUrl: payment.receipt_url,
        approvedAt: payment.approved_at,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        booking: payment.bookings
      }
    });

  } catch (error: unknown) {
    console.error('[PAYMENT] 결제 조회 처리 실패:', error);
    return NextResponse.json(
      { success: false, message: '결제 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
