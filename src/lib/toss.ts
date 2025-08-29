// Toss Payments Configuration
export const TOSS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'pk_test_dummy',
  secretKey: process.env.TOSS_SECRET_KEY || 'sk_test_dummy',
  webhookSecret: process.env.TOSS_WEBHOOK_SECRET || 'wh_dummy',
  // CORS 제거: 내부 API 경로만 사용
  baseUrl: '/api/payments'
}

// Toss Payments SDK 초기화 (클라이언트 사이드)
export const initializeTossPayments = async () => {
  if (typeof window !== 'undefined') {
    try {
      // 새로운 Toss Payments SDK 사용
      const { loadTossPayments } = await import('@tosspayments/payment-sdk');
      const tossPayments = await loadTossPayments(TOSS_CONFIG.clientKey);
      
      console.log('✅ Toss Payments SDK 초기화 완료');
      return tossPayments;
    } catch (error) {
      console.error('❌ Toss Payments SDK 초기화 실패:', error);
      return null;
    }
  }
  return null;
}

// 결제 요청 타입 정의
export interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail: string
  successUrl: string
  failUrl: string
}

// 결제 응답 타입 정의
export interface PaymentResponse {
  success: boolean
  paymentKey?: string
  orderId?: string
  error?: string
}

// 결제 요청 함수
export const requestPayment = async (paymentData: PaymentRequest) => {
  try {
    const tossPayments = await initializeTossPayments();
    if (!tossPayments) {
      throw new Error('Toss Payments SDK 초기화 실패');
    }

    // 결제 요청
    await tossPayments.requestPayment('카드', {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      successUrl: paymentData.successUrl,
      failUrl: paymentData.failUrl,
    });

    return { success: true };
  } catch (error) {
    console.error('결제 요청 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}
