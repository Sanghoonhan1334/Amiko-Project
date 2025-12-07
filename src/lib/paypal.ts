// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  currency: 'USD',
  locale: 'en_US',
};

// PayPal 결제 요청 데이터 타입
export interface PayPalPaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
  bookingId?: string;
}

// PayPal 결제 응답 타입
export interface PayPalPaymentResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

// PayPal 결제 생성 함수
export const createPayPalOrder = async (paymentData: PayPalPaymentRequest) => {
  try {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        bookingId: paymentData.bookingId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create PayPal order');
    }

    return {
      success: true,
      orderId: data.orderId,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Order creation failed:', error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// PayPal 결제 승인 함수
export const approvePayPalOrder = async (orderId: string) => {
  try {
    const response = await fetch('/api/paypal/approve-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to approve PayPal order');
    }

    return {
      success: true,
      order: data.order,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Order approval failed:', error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
