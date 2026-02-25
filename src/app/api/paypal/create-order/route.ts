import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are not configured");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderId,
      orderName,
      customerName,
      customerEmail,
      userId,
      bookingId,
      productType,
      productData,
    } = body;

    // 필수 필드 검증
    if (!amount || !orderId || !orderName || !userId) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 },
      );
    }

    // PayPal API 호출을 위한 데이터 준비
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: "USD",
            value: Number(amount).toFixed(2), // amount ya viene en dólares desde el cliente
          },
          description: orderName,
          custom_id: bookingId || "",
        },
      ],
      application_context: {
        brand_name: "Amiko",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://helloamiko.com"}/payments/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://helloamiko.com"}/payments/fail`,
      },
    };

    // PayPal API 호출
    const paypalResponse = await fetch(
      `${process.env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com"}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify(orderData),
      },
    );

    const paypalData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error("[PayPal] API error:", paypalData);
      }
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 },
      );
    }

    // 구매 기록 생성 (pending 상태)
    const purchaseRecord = {
      user_id: userId,
      provider: "paypal",
      payment_id: paypalData.id,
      order_id: orderId,
      amount: Number(amount),
      currency: "USD",
      country: "US",
      status: "pending",
      product_type: productType || "coupon",
      product_data: productData || {},
      paypal_data: paypalData,
    };

    console.log(
      "[PayPal] Inserting purchase record:",
      JSON.stringify(purchaseRecord, null, 2),
    );

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert(purchaseRecord)
      .select()
      .single();

    if (purchaseError) {
      console.error(
        "[PayPal] Failed to create purchase record:",
        JSON.stringify(purchaseError, null, 2),
      );
      return NextResponse.json(
        {
          error: "Failed to create purchase record",
          details:
            purchaseError.message ||
            purchaseError.code ||
            JSON.stringify(purchaseError),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      orderId: paypalData.id,
      purchaseId: purchase.id,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[PayPal] Create order API error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PayPal Access Token 획득
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl =
    process.env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal client ID or secret is not configured");
  }

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Failed to get PayPal access token: ${data.error_description || data.error}`,
    );
  }

  return data.access_token;
}
