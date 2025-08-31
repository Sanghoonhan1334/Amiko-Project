import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Toss 상태를 DB 상태로 매핑
function mapTossStatusToDbStatus(tossStatus: string): string {
  switch (tossStatus) {
    case 'DONE':
      return 'confirmed';
    case 'CANCELED':
      return 'cancelled';
    case 'ABORTED':
      return 'failed';
    case 'PENDING':
      return 'pending';
    default:
      return 'pending';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('toss-signature');

    console.log('[WEBHOOK] Toss 웹훅 수신:', { signature, bodyLength: body.length });

    // 서명 검증 (보안 키 사용)
    const webhookSecretKey = process.env.TOSS_WEBHOOK_SECRET_KEY || process.env.TOSS_SECRET_KEY;
    if (!webhookSecretKey || webhookSecretKey === 'test_sk_abcdef1234567890...') {
      console.warn('[WEBHOOK] Toss Webhook Secret Key가 설정되지 않음');
      return NextResponse.json({ success: false, message: 'Webhook Secret Key 미설정' }, { status: 500 });
    }

    // HMAC-SHA256 서명 검증
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecretKey)
      .update(body)
      .digest('base64');

    if (signature !== expectedSignature) {
      console.error('[WEBHOOK] 서명 검증 실패:', { 
        received: signature, 
        expected: expectedSignature 
      });
      return NextResponse.json({ success: false, message: '서명 검증 실패' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    console.log('[WEBHOOK] 웹훅 데이터:', webhookData);

    // 웹훅 타입별 처리
    switch (webhookData.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(webhookData);
        break;
      case 'PAYMENT_CANCELED':
        await handlePaymentCanceled(webhookData);
        break;
      case 'PAYMENT_FAILED':
        await handlePaymentFailed(webhookData);
        break;
      default:
        console.log('[WEBHOOK] 알 수 없는 이벤트 타입:', webhookData.eventType);
    }

    return NextResponse.json({ success: true, message: '웹훅 처리 완료' });

  } catch (error: unknown) {
    console.error('[WEBHOOK] 웹훅 처리 실패:', error);
    return NextResponse.json(
      { success: false, message: '웹훅 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}

async function handlePaymentStatusChanged(data: Record<string, unknown>) {
  console.log('[WEBHOOK] 결제 상태 변경:', data);
  
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const paymentKey = (data.data as Record<string, unknown>).paymentKey;
    const newStatus = (data.data as Record<string, unknown>).status;
    
    // Supabase에서 결제 상태 업데이트
    const { error } = await supabase
      .from('payments')
      .update({ 
        status: mapTossStatusToDbStatus(newStatus as string),
        updated_at: new Date().toISOString()
      })
      .eq('payment_key', paymentKey);
    
    if (error) {
      console.error('[WEBHOOK] 결제 상태 업데이트 실패:', error);
    } else {
      console.log('[WEBHOOK] 결제 상태 업데이트 성공:', { paymentKey, newStatus });
    }
  } catch (error) {
    console.error('[WEBHOOK] 결제 상태 변경 처리 실패:', error);
  }
}

async function handlePaymentCanceled(data: Record<string, unknown>) {
  console.log('[WEBHOOK] 결제 취소:', data);
  
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const paymentKey = (data.data as Record<string, unknown>).paymentKey;
    
    // Supabase에서 결제 상태를 취소로 업데이트
    const { error } = await supabase
      .from('payments')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('payment_key', paymentKey);
    
    if (error) {
      console.error('[WEBHOOK] 결제 취소 상태 업데이트 실패:', error);
    } else {
      console.log('[WEBHOOK] 결제 취소 상태 업데이트 성공:', paymentKey);
    }
  } catch (error) {
    console.error('[WEBHOOK] 결제 취소 처리 실패:', error);
  }
}

async function handlePaymentFailed(data: Record<string, unknown>) {
  console.log('[WEBHOOK] 결제 실패:', data);
  
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const paymentKey = (data.data as Record<string, unknown>).paymentKey;
    
    // Supabase에서 결제 상태를 실패로 업데이트
    const { error } = await supabase
      .from('payments')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_key', paymentKey);
    
    if (error) {
      console.error('[WEBHOOK] 결제 실패 상태 업데이트 실패:', error);
    } else {
      console.log('[WEBHOOK] 결제 실패 상태 업데이트 성공:', paymentKey);
    }
  } catch (error) {
    console.error('[WEBHOOK] 결제 실패 처리 실패:', error);
  }
}
