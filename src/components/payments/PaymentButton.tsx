"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loadTossPayments } from "@tosspayments/payment-sdk";

interface PaymentButtonProps {
  amount: number;                // KRW 정수 (예: 50000)
  orderId?: string;              // 없으면 내부에서 생성
  orderName: string;
  customerName: string;
  customerEmail?: string;
  bookingId?: string;            // 예약 ID 추가
  className?: string;
  disabled?: boolean;
}

export default function PaymentButton({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  bookingId,
  className = "",
  disabled = false
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPayment = async () => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);

      // ✅ 공개키 주입 확인 (앞 몇 글자만 출력)
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      console.log("[DEBUG] CLIENT KEY prefix:", String(clientKey || "").slice(0, 12)); // test_ck_로 시작해야 정상
      console.log("[DEBUG] amount:", amount, "orderId prop:", orderId);
      console.log("[DEBUG] orderName:", orderName, "customerName:", customerName);

      // 더미 모드(키 없음) 처리
      if (!clientKey || clientKey === "your_client_key") {
        console.warn("⚠️ 더미 모드: 실제 Toss Payments 키가 설정되지 않음");
        const finalOrderId = orderId || `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const successUrl = `${window.location.origin}/payments/success?paymentKey=dummy_${Date.now()}&orderId=${finalOrderId}&amount=${amount}${bookingId ? `&bookingId=${bookingId}` : ''}`;
        setTimeout(() => (window.location.href = successUrl), 1000);
        return;
      }

      // ✅ 실제 Toss SDK 사용
      const tossPayments = await loadTossPayments(clientKey);

      // ✅ 유니크 주문번호 보장
      const finalOrderId =
        orderId || `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // ✅ success/fail URL은 "깨끗하게" 넘김 (Toss가 쿼리 붙여서 리다이렉트함)
      const origin = window.location.origin;

      await tossPayments.requestPayment("CARD", {
        amount: Math.floor(amount),       // 정수
        orderId: finalOrderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${origin}/payments/success${bookingId ? `?bookingId=${bookingId}` : ''}`,
        failUrl: `${origin}/payments/fail${bookingId ? `?bookingId=${bookingId}` : ''}`,
      });

      console.log("✅ Toss Payments 결제 요청 완료");
    } catch (error: unknown) {
      console.error('결제 처리 실패:', error)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <Button
      type="button" // ✅ 폼 submit 방지
      onClick={requestPayment}
      disabled={disabled || isLoading}
      className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    >
      {isLoading ? "결제 처리 중..." : "결제하기"}
    </Button>
  );
}
