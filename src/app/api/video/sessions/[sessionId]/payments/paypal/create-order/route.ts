import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

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

// POST /api/video/sessions/[sessionId]/payments/paypal/create-order
// Creates a PayPal order for this session's price and stores it in vc_paypal_orders
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7));
        user = data.user;
      }
    }
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get session
    const { data: session } = await supabase
      .from("vc_sessions")
      .select(
        "id, title, price_usd, max_participants, current_participants, status",
      )
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "cancelled" || session.status === "completed") {
      return NextResponse.json(
        { error: "Session is no longer available" },
        { status: 400 },
      );
    }

    if (session.current_participants >= session.max_participants) {
      return NextResponse.json({ error: "Session is full" }, { status: 400 });
    }

    if (!session.price_usd || session.price_usd <= 0) {
      return NextResponse.json(
        { error: "This is a free session, no payment needed" },
        { status: 400 },
      );
    }

    // Check user has a pending booking
    const { data: booking } = await supabase
      .from("vc_bookings")
      .select("id, payment_status")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .in("payment_status", ["pending"])
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "You must enroll first before paying" },
        { status: 400 },
      );
    }

    const amount = Number(session.price_usd).toFixed(2);

    // Create PayPal order
    const paypalApiBase =
      process.env.PAYPAL_API_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://helloamiko.com";

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `vc_session_${sessionId}`,
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description: `AMIKO Video Session: ${session.title}`,
          custom_id: booking.id,
        },
      ],
      application_context: {
        brand_name: "AMIKO",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${baseUrl}/videocall?payment=success&session=${sessionId}`,
        cancel_url: `${baseUrl}/videocall?payment=cancelled&session=${sessionId}`,
      },
    };

    const paypalResponse = await fetch(`${paypalApiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getPayPalAccessToken()}`,
      },
      body: JSON.stringify(orderData),
    });

    const paypalData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      console.error("[VC_PAYPAL] Create order error:", paypalData);
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 },
      );
    }

    // Store in vc_paypal_orders
    const { error: insertError } = await supabase
      .from("vc_paypal_orders")
      .insert({
        session_id: sessionId,
        booking_id: booking.id,
        user_id: user.id,
        paypal_order_id: paypalData.id,
        amount_usd: session.price_usd,
        currency: "USD",
        status: "created",
        paypal_raw: paypalData,
      });

    if (insertError) {
      console.error("[VC_PAYPAL] Insert order record error:", insertError);
    }

    // Get approval URL
    const approveUrl = paypalData.links?.find(
      (l: { rel: string }) => l.rel === "approve",
    )?.href;

    return NextResponse.json({
      paypal_order_id: paypalData.id,
      approve_url: approveUrl,
      booking_id: booking.id,
    });
  } catch (err) {
    console.error("[VC_PAYPAL] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
