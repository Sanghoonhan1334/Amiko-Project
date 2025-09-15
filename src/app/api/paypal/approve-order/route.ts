import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // PayPal 주문 승인
    const paypalResponse = await fetch(
      `${process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify({}),
      }
    );

    const paypalData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      console.error('PayPal 승인 에러:', paypalData);
      return NextResponse.json(
        { error: 'PayPal 주문 승인 실패' },
        { status: 500 }
      );
    }

    // 결제 정보 추출
    const purchaseUnit = paypalData.purchase_units[0];
    const referenceId = purchaseUnit.reference_id;
    const amount = parseFloat(purchaseUnit.payments.captures[0].amount.value) * 100; // 달러를 센트로 변환
    const customId = purchaseUnit.custom_id;

    console.log('PayPal 결제 완료:', { orderId, referenceId, amount, customId });

    // 데이터베이스 업데이트
    if (customId) {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'paypal',
          payment_id: orderId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customId);

      if (error) {
        console.error('예약 상태 업데이트 실패:', error);
      }
    }

    // 결제 기록 저장
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: referenceId,
        payment_id: orderId,
        amount: amount,
        currency: 'USD',
        status: 'completed',
        payment_method: 'paypal',
        paypal_data: paypalData,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error('결제 기록 저장 실패:', paymentError);
    }

    return NextResponse.json({
      order: paypalData,
    });

  } catch (error) {
    console.error('PayPal 주문 승인 API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PayPal Access Token 획득
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal 클라이언트 ID 또는 시크릿이 설정되지 않았습니다.');
  }

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`PayPal Access Token 획득 실패: ${data.error_description || data.error}`);
  }

  return data.access_token;
}
