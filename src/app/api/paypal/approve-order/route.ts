import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not configured')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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
      if (process.env.NODE_ENV === 'development') {
        console.error('[PayPal] Approval error:', paypalData);
      }
      return NextResponse.json(
        { error: 'Failed to approve PayPal order' },
        { status: 500 }
      );
    }

    // 결제 정보 추출
    const purchaseUnit = paypalData.purchase_units[0];
    const referenceId = purchaseUnit.reference_id; // This is our orderId
    const amount = parseFloat(purchaseUnit.payments.captures[0].amount.value);

    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal] Payment completed:', { orderId, referenceId, amount });
    }

    // Get purchase record to determine product type
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('order_id', referenceId)
      .single();

    if (purchaseError || !purchase) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PayPal] Purchase not found:', purchaseError);
      }
      return NextResponse.json(
        { error: 'Purchase record not found' },
        { status: 404 }
      );
    }

    // Update purchase status to paid
    const { error: updatePurchaseError } = await supabase
      .from('purchases')
      .update({
        status: 'paid',
        paypal_data: paypalData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    if (updatePurchaseError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PayPal] Failed to update purchase status:', updatePurchaseError);
      }
    }

    // Handle different product types
    switch (purchase.product_type) {
      case 'coupon':
        await handleCouponPurchase(purchase);
        break;
      case 'vip_subscription':
        await handleVipSubscriptionPurchase(purchase);
        break;
      case 'lecture':
        await handleLecturePurchase(purchase);
        break;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PayPal] Unknown product type:', purchase.product_type);
        }
    }

    return NextResponse.json({
      success: true,
      order: paypalData,
      product_type: purchase.product_type
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Approve order API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle coupon purchases
async function handleCouponPurchase(purchase: any) {
  const productData = purchase.product_data;
  const couponMinutes = productData.coupon_minutes || 20;
  const couponCount = productData.coupon_count || 1;

  // Create coupon record
  const { error } = await supabase
    .from('coupons')
    .insert({
      user_id: purchase.user_id,
      type: 'ako',
      amount: couponCount,
      source: 'purchase',
      description: `${couponMinutes}분 쿠폰 ${couponCount}개`,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    });

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Failed to create coupon:', error);
    }
  }
}

// Handle VIP subscription purchases
async function handleVipSubscriptionPurchase(purchase: any) {
  const productData = purchase.product_data;
  const planType = productData.plan_type;
  const durationMonths = productData.duration_months;

  let endDate = null;
  if (durationMonths) {
    endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);
  }

  // Create VIP subscription record
  const { error } = await supabase
    .from('vip_subscriptions')
    .insert({
      user_id: purchase.user_id,
      plan_type: planType,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: endDate ? endDate.toISOString() : null,
      price: purchase.amount,
      payment_method: 'paypal',
    });

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Failed to create VIP subscription:', error);
    }
  }
}

// Handle lecture purchases
async function handleLecturePurchase(purchase: any) {
  const productData = purchase.product_data;
  const lectureId = productData.lecture_id;

  // Check if lecture exists and has available spots
  const { data: lecture, error: lectureError } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .single();

  if (lectureError || !lecture) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Lecture not found:', lectureError);
    }
    return;
  }

  if (lecture.current_participants >= lecture.max_participants) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Lecture is full');
    }
    return;
  }

  // Create lecture enrollment
  const { error } = await supabase
    .from('lecture_enrollments')
    .insert({
      lecture_id: lectureId,
      user_id: purchase.user_id,
      purchase_id: purchase.id,
      status: 'enrolled',
    });

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Failed to create lecture enrollment:', error);
    }
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
