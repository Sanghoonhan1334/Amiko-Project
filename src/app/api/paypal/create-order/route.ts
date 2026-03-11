import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase";
import { validateProductAndAmount } from "@/lib/paypal-products";
import { getPayPalToken, getPayPalBase } from "@/lib/paypal-server";

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
    // 인증 검증 — getUser()로 JWT를 서버에서 검증 (getSession은 클라이언트 토큰을 신뢰하므로 안전하지 않음)
    const supabaseClient = await createSupabaseClient()
    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    const authenticatedUserId = authUser.id

    const body = await request.json();
    const {
      orderId,
      orderName,
      customerName,
      customerEmail,
      bookingId,
      productId,   // ID del catálogo servidor — reemplaza amount/productType/productData del cliente
      // amount, userId, productType, productData ignorados (se obtienen del catálogo)
    } = body;

    // Validar producto y precio desde el catálogo servidor (nunca del cliente)
    const clientAmount = Number(body.amount)
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }
    const product = validateProductAndAmount(productId, clientAmount)
    if (!product) {
      return NextResponse.json(
        { error: "Invalid product or tampered amount" },
        { status: 400 }
      )
    }

    // 필수 필드 검증
    if (!orderId || !orderName) {
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
            value: product.amountUsd.toFixed(2), // precio canónico del servidor
          },
          description: product.name,
          custom_id: bookingId || "",
        },
      ],
      application_context: {
        brand_name: "AMIKO",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://helloamiko.com"}/payments/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://helloamiko.com"}/payments/fail`,
      },
    };

    // PayPal API 호출
    const paypalApiBase = getPayPalBase();
    const paypalResponse = await fetch(`${paypalApiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getPayPalToken()}`,
      },
      body: JSON.stringify(orderData),
    });

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
      user_id: authenticatedUserId,  // siempre del token, nunca del body
      provider: "paypal",
      payment_id: paypalData.id,
      order_id: orderId,
      amount: product.amountUsd,     // precio canónico del servidor
      currency: "USD",
      country: "US",
      status: "pending",
      product_type: product.productType,
      product_data: product.meta,
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
