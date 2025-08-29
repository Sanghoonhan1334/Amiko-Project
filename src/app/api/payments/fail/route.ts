import { NextResponse } from 'next/server';

// CORS 프리: 내부 API이므로 CORS 설정 불필요
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, message, orderId, paymentKey, amount } = body;

    console.log('🔍 [API] 결제 실패 처리 요청 받음:', {
      code,
      message,
      orderId,
      paymentKey,
      amount
    });

    // TODO: 실제 결제 실패 처리 로직 구현
    // 1. 결제 실패 정보 저장
    // 2. 예약 상태 업데이트 (pending -> failed)
    // 3. 실패 원인 분석 및 로깅
    // 4. 고객에게 실패 안내 이메일 발송

    // 임시 응답
    const failResult = {
      success: true,
      orderId: orderId,
      failedAt: new Date().toISOString(),
      status: 'failed',
      reason: message
    };

    console.log('✅ 결제 실패 처리 성공:', failResult);

    return NextResponse.json({ 
      success: true, 
      data: failResult,
      message: '결제 실패 처리가 완료되었습니다.'
    });
    
  } catch (error) {
    console.error('결제 실패 처리 실패:', error);
    return NextResponse.json(
      { success: false, message: '결제 실패 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
