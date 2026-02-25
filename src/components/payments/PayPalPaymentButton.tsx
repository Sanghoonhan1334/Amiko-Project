"use client";

import { useState } from "react";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { PAYPAL_CONFIG } from "@/lib/paypal";

interface PayPalPaymentButtonProps {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  userId: string;
  bookingId?: string;
  productType?: string;
  productData?: any;
  className?: string;
  disabled?: boolean;
}

export default function PayPalPaymentButton({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  userId,
  bookingId,
  productType,
  productData,
  className = "",
  disabled = false,
}: PayPalPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [{ isPending, isRejected, isResolved }] = usePayPalScriptReducer();

  // Debug: log SDK state on each render
  if (typeof window !== "undefined") {
    console.log("[PayPal Button] SDK state:", {
      isPending,
      isRejected,
      isResolved,
      clientId: PAYPAL_CONFIG.clientId || "(empty)",
      amount,
      productType,
    });
  }

  const createOrder = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          orderId,
          orderName,
          customerName,
          customerEmail,
          userId,
          bookingId,
          productType,
          productData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.details || data.error || "PayPal 주문 생성 실패";
        console.error("[PayPal] Create order failed:", data);
        throw new Error(detail);
      }

      return data.orderId;
    } catch (error) {
      console.error("PayPal 주문 생성 실패:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "Error al crear la orden de PayPal";
      setErrorMessage(msg);
      alert(`Error al procesar el pago: ${msg}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/paypal/approve-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "PayPal 주문 승인 실패");
      }

      // 결제 성공 시 리다이렉트
      window.location.href = `/payments/success?orderId=${orderId}&paypalOrderId=${data.orderID}&amount=${amount}`;
    } catch (error) {
      console.error("PayPal 주문 승인 실패:", error);
      setErrorMessage("Error al aprobar el pago. Inténtalo de nuevo.");
      alert("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (error: any) => {
    console.error("PayPal 결제 에러:", error);
    setErrorMessage("Error en el sistema de pagos. Inténtalo más tarde.");
    alert("결제 처리 중 오류가 발생했습니다.");
    setIsLoading(false);
  };

  const isClientIdValid =
    !!PAYPAL_CONFIG.clientId &&
    PAYPAL_CONFIG.clientId !== "test" &&
    PAYPAL_CONFIG.clientId !== "sb";

  if (!isClientIdValid) {
    console.warn(
      "[PayPal Button] Invalid or missing clientId:",
      PAYPAL_CONFIG.clientId,
    );
    return (
      <div className={className}>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
            Sistema de pagos no disponible
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            PayPal no está configurado. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* PayPal SDK loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-500">Cargando PayPal...</span>
        </div>
      )}

      {/* PayPal SDK failed to load */}
      {isRejected && (
        <div className="text-center py-4">
          <p className="text-sm text-red-500 mb-2">
            No se pudo cargar PayPal. Verifica tu conexión e inténtalo de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:underline"
          >
            Recargar página
          </button>
        </div>
      )}

      {/* Processing payment indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-2 mb-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
          <span className="text-sm text-gray-600">Procesando pago...</span>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-2">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {errorMessage}
          </p>
        </div>
      )}

      {/* PayPal buttons - hidden while SDK is loading or failed */}
      {!isRejected && (
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={() => {
            setErrorMessage(null);
            setIsLoading(false);
          }}
          disabled={disabled || isLoading}
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          }}
        />
      )}
    </div>
  );
}
