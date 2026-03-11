import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayPalToken, getPayPalBase } from "@/lib/paypal-server";

// POST /api/video/sessions/[sessionId]/payments/paypal/capture
// Captures (finalizes) a PayPal order after user approval
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
    const paypalApiBase = getPayPalBase();

    const captureResponse = await fetch(
      `${paypalApiBase}/v2/checkout/orders/${paypal_order_id}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getPayPalToken()}`,
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
          host_share: 0,
          platform_share: orderRecord.amount_usd,
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

    // Create notifications after successful payment
    try {
      // Get session title for notification message
      const { data: sessionData } = await supabase
        .from("vc_sessions")
        .select(
          "title, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)",
        )
        .eq("id", sessionId)
        .single();

      const sessionTitle = sessionData?.title || "Video Session";

      await adminClient.from("vc_notifications").insert({
        user_id: user.id,
        session_id: sessionId,
        type: "payment_confirmed",
        title: "Payment Confirmed",
        message: `Your payment of $${orderRecord.amount_usd} for "${sessionTitle}" has been confirmed.`,
      });

      // Notify host about new paid participant
      const hostData = sessionData?.host as any;
      const hostUserId = Array.isArray(hostData)
        ? hostData[0]?.user_id
        : hostData?.user_id;
      if (hostUserId) {
        await adminClient.from("vc_notifications").insert({
          user_id: hostUserId,
          session_id: sessionId,
          type: "session_booked",
          title: "New Participant",
          message: `A new participant has enrolled in your session "${sessionTitle}".`,
        });
      }
    } catch (notifErr) {
      console.error("[VC_PAYPAL_CAPTURE] Notification error:", notifErr);
    }

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
