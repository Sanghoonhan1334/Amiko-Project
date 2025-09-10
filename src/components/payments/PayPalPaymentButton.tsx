'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { PAYPAL_CONFIG } from '@/lib/paypal';

interface PayPalPaymentButtonProps {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  bookingId?: string;
  className?: string;
  disabled?: boolean;
}

export default function PayPalPaymentButton({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  bookingId,
  className = "",
  disabled = false
}: PayPalPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          orderId,
          orderName,
          customerName,
          customerEmail,
          bookingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'PayPal 주문 생성 실패');
      }

      return data.orderId;
    } catch (error) {
      console.error('PayPal 주문 생성 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/paypal/approve-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'PayPal 주문 승인 실패');
      }

      // 결제 성공 시 리다이렉트
      window.location.href = `/payments/success?orderId=${orderId}&paypalOrderId=${data.orderID}&amount=${amount}`;

    } catch (error) {
      console.error('PayPal 주문 승인 실패:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (error: any) => {
    console.error('PayPal 결제 에러:', error);
    alert('결제 처리 중 오류가 발생했습니다.');
    setIsLoading(false);
  };

  if (!PAYPAL_CONFIG.clientId) {
    return (
      <button
        disabled
        className={`w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg ${className}`}
      >
        PayPal 설정이 필요합니다
      </button>
    );
  }

  return (
    <div className={className}>
      <PayPalScriptProvider
        options={{
          clientId: PAYPAL_CONFIG.clientId,
          currency: PAYPAL_CONFIG.currency,
          locale: PAYPAL_CONFIG.locale,
        }}
      >
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          disabled={disabled || isLoading}
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
