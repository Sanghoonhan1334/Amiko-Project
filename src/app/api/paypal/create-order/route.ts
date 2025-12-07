import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      orderId, 
      orderName, 
      customerName, 
      customerEmail, 
      bookingId,
      productType,
      productData
    } = body;

    // 필수 필드 검증
    if (!amount || !orderId || !orderName) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // PayPal API 호출을 위한 데이터 준비
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: 'USD',
            value: (amount / 100).toFixed(2), // 센트를 달러로 변환
          },
          description: orderName,
          custom_id: bookingId || '',
        },
      ],
      application_context: {
        brand_name: 'Amiko',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/fail`,
      },
    };

    // PayPal API 호출
    const paypalResponse = await fetch(
      `${process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const paypalData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PayPal] API error:', paypalData);
      }
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    // 구매 기록 생성 (pending 상태)
    const purchaseData = {
      orderId,
      paymentId: paypalData.id,
      amount: amount / 100,
      productType: productType || 'coupon',
      productData: productData || {},
      paypalData: paypalData
    };

    return NextResponse.json({
      orderId: paypalData.id,
      purchaseData
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Create order API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
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
    throw new Error('PayPal client ID or secret is not configured');
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
    throw new Error(`Failed to get PayPal access token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}
