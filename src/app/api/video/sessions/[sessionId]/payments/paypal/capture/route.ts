import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl =
    process.env.PAYPAL_API_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
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

// POST /api/video/sessions/[sessionId]/payments/paypal/capture
// Captures (finalizes) a PayPal order after user approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { paypal_order_id } = body;

    if (!paypal_order_id) {
      return NextResponse.json(
        { error: "paypal_order_id is required" },
        { status: 400 },
      );
    }

    // Find our record
    const { data: orderRecord } = await supabase
      .from("vc_paypal_orders")
      .select("*")
      .eq("paypal_order_id", paypal_order_id)
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!orderRecord) {
      return NextResponse.json(
        { error: "PayPal order not found" },
        { status: 404 },
      );
    }

    if (orderRecord.status === "captured") {
      return NextResponse.json(
        { error: "Payment already captured" },
        { status: 400 },
      );
    }

    // Capture with PayPal
    const paypalApiBase =
      process.env.PAYPAL_API_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com");

    const captureResponse = await fetch(
      `${paypalApiBase}/v2/checkout/orders/${paypal_order_id}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify({}),
      },
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("[VC_PAYPAL_CAPTURE] PayPal error:", captureData);

      // Update our record as failed
      await supabase
        .from("vc_paypal_orders")
        .update({ status: "failed", paypal_raw: captureData })
        .eq("id", orderRecord.id);

      return NextResponse.json(
        { error: "Payment capture failed" },
        { status: 500 },
      );
    }

    const captureId =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerEmail = captureData.payer?.email_address;
    const payerId = captureData.payer?.payer_id;

    // Update PayPal order record
    await supabase
      .from("vc_paypal_orders")
      .update({
        status: "captured",
        paypal_capture_id: captureId || null,
        paypal_payer_id: payerId || null,
        paypal_payer_email: payerEmail || null,
        paypal_raw: captureData,
      })
      .eq("id", orderRecord.id);

    // Update booking to paid + confirmed using admin client to bypass RLS
    const adminClient = createAdminClient();
    if (orderRecord.booking_id) {
      await adminClient
        .from("vc_bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          paypal_order_id: paypal_order_id,
          amount_paid: orderRecord.amount_usd,
          host_share: parseFloat((orderRecord.amount_usd * 0.7).toFixed(2)),
          platform_share: parseFloat((orderRecord.amount_usd * 0.3).toFixed(2)),
        })
        .eq("id", orderRecord.booking_id);
    }

    // Log access (payment confirmed)
    await supabase.from("vc_rtc_access_logs").insert({
      session_id: sessionId,
      user_id: user.id,
      action: "token_issued",
      reason: "payment_captured",
    });

    return NextResponse.json({
      success: true,
      capture_id: captureId,
      booking_id: orderRecord.booking_id,
      status: "captured",
    });
  } catch (err) {
    console.error("[VC_PAYPAL_CAPTURE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
