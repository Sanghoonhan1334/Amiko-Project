import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayPalWebhook, extractWebhookHeaders } from "@/lib/paypal-webhook-verify";

// POST /api/webhooks/paypal — PayPal webhook handler for videocall payments
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // ⚠️ SEGURIDAD CRÍTICA: Verificar firma PayPal antes de procesar cualquier evento
    const webhookId = process.env.PAYPAL_WEBHOOK_ID_VC || process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      console.error('[VC_WEBHOOK] PAYPAL_WEBHOOK_ID not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const headers = extractWebhookHeaders(request)
    const isValid = await verifyPayPalWebhook(body, headers, webhookId)
    if (!isValid) {
      console.error('[VC_WEBHOOK] INVALID SIGNATURE — request rejected')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const webhookData = JSON.parse(body);

    const eventType = webhookData.event_type;
    const resource = webhookData.resource;

    if (!resource || !resource.id) {
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 },
      );
    }

    console.log("[VC_WEBHOOK] Event:", eventType, "Resource ID:", resource.id);

    const adminClient = createAdminClient();

    // Try to find VC paypal order by capture ID or order ID
    const paypalOrderId =
      resource.supplementary_data?.related_ids?.order_id || resource.id;

    const { data: vcOrder } = await adminClient
      .from("vc_paypal_orders")
      .select("*, booking:vc_bookings(*)")
      .or(
        `paypal_order_id.eq.${paypalOrderId},paypal_capture_id.eq.${resource.id}`,
      )
      .single();

    if (!vcOrder) {
      // Not a VC payment — pass through (might be handled by existing webhook)
      console.log("[VC_WEBHOOK] Not a VC order, skipping:", paypalOrderId);
      return NextResponse.json({ received: true, handled: false });
    }

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        // Payment captured successfully
        await adminClient
          .from("vc_paypal_orders")
          .update({
            status: "captured",
            paypal_capture_id: resource.id,
            paypal_payer_email: resource.payer?.email_address || null,
            paypal_raw: resource,
          })
          .eq("id", vcOrder.id);

        // Confirm booking
        if (vcOrder.booking_id) {
          await adminClient
            .from("vc_bookings")
            .update({
              payment_status: "paid",
              status: "confirmed",
              paypal_order_id: vcOrder.paypal_order_id,
              amount_paid: vcOrder.amount_usd,
              host_share: parseFloat((vcOrder.amount_usd * 0.7).toFixed(2)),
              platform_share: parseFloat((vcOrder.amount_usd * 0.3).toFixed(2)),
            })
            .eq("id", vcOrder.booking_id);
        }

        // Create notification
        await adminClient.from("vc_notifications").insert({
          user_id: vcOrder.user_id,
          session_id: vcOrder.session_id,
          type: "payment_confirmed",
          title: "Payment Confirmed",
          message: `Your payment of $${vcOrder.amount_usd} has been confirmed.`,
        });

        console.log("[VC_WEBHOOK] Payment captured for order:", vcOrder.id);
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.FAILED": {
        await adminClient
          .from("vc_paypal_orders")
          .update({ status: "failed", paypal_raw: resource })
          .eq("id", vcOrder.id);

        if (vcOrder.booking_id) {
          await adminClient
            .from("vc_bookings")
            .update({ payment_status: "failed", status: "cancelled" })
            .eq("id", vcOrder.booking_id);
        }

        console.log("[VC_WEBHOOK] Payment failed for order:", vcOrder.id);
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED": {
        await adminClient
          .from("vc_paypal_orders")
          .update({ status: "refunded", paypal_raw: resource })
          .eq("id", vcOrder.id);

        if (vcOrder.booking_id) {
          await adminClient
            .from("vc_bookings")
            .update({ payment_status: "refunded", status: "refunded" })
            .eq("id", vcOrder.booking_id);
        }

        // Notify user
        await adminClient.from("vc_notifications").insert({
          user_id: vcOrder.user_id,
          session_id: vcOrder.session_id,
          type: "refund_processed",
          title: "Refund Processed",
          message: `Your refund of $${vcOrder.amount_usd} has been processed.`,
        });

        console.log("[VC_WEBHOOK] Refund for order:", vcOrder.id);
        break;
      }

      default:
        console.log("[VC_WEBHOOK] Unhandled event:", eventType);
    }

    return NextResponse.json({ received: true, handled: true });
  } catch (err) {
    console.error("[VC_WEBHOOK] Exception:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
