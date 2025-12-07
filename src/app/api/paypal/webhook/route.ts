import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('paypal-transmission-id');
    const certId = request.headers.get('paypal-cert-id');
    const authAlgo = request.headers.get('paypal-auth-algo');
    const transmissionSig = request.headers.get('paypal-transmission-sig');
    const transmissionTime = request.headers.get('paypal-transmission-time');

    // PayPal webhook 검증 (실제 운영에서는 검증 로직 추가)
    const webhookData = JSON.parse(body);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal Webhook] Received:', { eventType: webhookData.event_type, paymentId: webhookData.resource?.id });
    }

    // 이벤트 타입 확인
    const eventType = webhookData.event_type;
    const resource = webhookData.resource;

    if (!resource || !resource.id) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    const paymentId = resource.id;
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database connection is not configured' },
        { status: 500 }
      );
    }
    const supabase = supabaseClient;

    // 구매 기록 조회
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (purchaseError || !purchase) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PayPal Webhook] Purchase not found:', paymentId);
      }
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // 이벤트 타입별 처리
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(supabase, purchase, resource);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.FAILED':
        await handlePaymentFailed(supabase, purchase, resource);
        break;
        
      case 'PAYMENT.CAPTURE.CANCELLED':
        await handlePaymentCancelled(supabase, purchase, resource);
        break;
        
      default:
        if (process.env.NODE_ENV === 'development') {
          console.log('[PayPal Webhook] Unhandled event type:', eventType);
        }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal Webhook] Processing failed:', error);
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// 결제 완료 처리
async function handlePaymentCompleted(supabase: any, purchase: any, resource: any) {
  try {
    // 구매 상태 업데이트
    await supabase
      .from('purchases')
      .update({
        status: 'paid',
        paypal_data: resource,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchase.id);

    // 쿠폰 구매인 경우 쿠폰 적립
    if (purchase.product_type === 'coupon') {
      const productData = purchase.product_data || {};
      const couponMinutes = productData.coupon_minutes || 20;
      const couponCount = productData.coupon_count || 1;

      // 쿠폰 테이블에 추가
      await supabase
        .from('coupons')
        .insert({
          user_id: purchase.user_id,
          type: 'ako',
          amount: couponCount,
          minutes_remaining: couponMinutes,
          source: 'purchase',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1년 후
        });

      // 사용자에게 알림
      await supabase
        .from('notifications')
        .insert({
          user_id: purchase.user_id,
          type: 'coupon_received',
          title: '쿠폰 구매 완료!',
          message: `${couponMinutes}분 쿠폰이 적립되었습니다.`,
          data: {
            purchase_id: purchase.id,
            coupon_minutes: couponMinutes,
            coupon_count: couponCount
          },
          priority: 'normal'
        });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal Webhook] Payment completed:', purchase.id);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal Webhook] Failed to process payment completion:', error);
    }
  }
}

// 결제 실패 처리
async function handlePaymentFailed(supabase: any, purchase: any, resource: any) {
  try {
    await supabase
      .from('purchases')
      .update({
        status: 'failed',
        paypal_data: resource,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchase.id);

    // 사용자에게 알림
    await supabase
      .from('notifications')
      .insert({
        user_id: purchase.user_id,
        type: 'payment_failed',
        title: '결제 실패',
        message: '결제가 실패했습니다. 다시 시도해주세요.',
        data: {
          purchase_id: purchase.id,
          status: 'failed'
        },
        priority: 'normal'
      });

    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal Webhook] Payment failed:', purchase.id);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal Webhook] Failed to process payment failure:', error);
    }
  }
}

// 결제 취소 처리
async function handlePaymentCancelled(supabase: any, purchase: any, resource: any) {
  try {
    await supabase
      .from('purchases')
      .update({
        status: 'canceled',
        paypal_data: resource,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchase.id);

    // 사용자에게 알림
    await supabase
      .from('notifications')
      .insert({
        user_id: purchase.user_id,
        type: 'payment_failed',
        title: '결제 취소',
        message: '결제가 취소되었습니다.',
        data: {
          purchase_id: purchase.id,
          status: 'canceled'
        },
        priority: 'normal'
      });

    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal Webhook] Payment cancelled:', purchase.id);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal Webhook] Failed to process payment cancellation:', error);
    }
  }
}
