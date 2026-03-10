import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPayPalToken, getPayPalBase } from '@/lib/paypal-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/education/webhooks/paypal
 *
 * Handles PayPal webhook events for the education module:
 *   - PAYMENT.CAPTURE.COMPLETED  → activate enrollment
 *   - PAYMENT.CAPTURE.DENIED     → mark payment failed
 *   - PAYMENT.CAPTURE.REFUNDED   → mark payment refunded
 *
 * Set PAYPAL_WEBHOOK_ID in your environment to enable signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let event: Record<string, unknown>
    try {
      event = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Verify PayPal webhook signature when webhook ID is configured
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (webhookId) {
      const verified = await verifyWebhookSignature(request.headers, rawBody, webhookId)
      if (!verified) {
        console.warn('[Education Webhook] PayPal signature verification failed')
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }

    const eventType = event.event_type as string
    const resource = event.resource as Record<string, unknown>

    console.log(`[Education Webhook] Received event: ${eventType}`)

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleCaptureCompleted(resource)
        break

      case 'PAYMENT.CAPTURE.DENIED':
        await handleCaptureDenied(resource)
        break

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handleCaptureRefunded(resource)
        break

      default:
        // Unhandled event – acknowledge receipt so PayPal doesn't retry
        console.log(`[Education Webhook] Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Education Webhook] Error processing webhook:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCaptureCompleted(resource: Record<string, unknown>) {
  const captureId = resource.id as string
  const orderId = (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
    .supplementary_data?.related_ids?.order_id

  if (!captureId) {
    console.warn('[Education Webhook] CAPTURE.COMPLETED missing capture ID')
    return
  }

  // Look up the enrollment via capture or order ID
  const { data: enrollment } = await supabase
    .from('education_enrollments')
    .select('id, student_id, course_id, payment_status, enrollment_status')
    .or(
      `paypal_capture_id.eq.${captureId}${orderId ? `,paypal_order_id.eq.${orderId}` : ''}`
    )
    .single()

  if (!enrollment) {
    console.warn('[Education Webhook] CAPTURE.COMPLETED: no enrollment found for captureId:', captureId)
    return
  }

  // Idempotency — skip if already activated
  if (['completed', 'active'].includes(enrollment.enrollment_status)) {
    return
  }

  const now = new Date().toISOString()

  await supabase
    .from('education_enrollments')
    .update({
      payment_status: 'completed',
      enrollment_status: 'active',
      paypal_capture_id: captureId,
      enrolled_at: now
    })
    .eq('id', enrollment.id)

  // Increment enrolled_count on the course
  const { data: currentCourse } = await supabase
    .from('education_courses')
    .select('enrolled_count')
    .eq('id', enrollment.course_id)
    .single()

  if (currentCourse) {
    await supabase
      .from('education_courses')
      .update({ enrolled_count: (currentCourse.enrolled_count || 0) + 1 })
      .eq('id', enrollment.course_id)
  }

  // Update course_payments record
  await supabase
    .from('course_payments')
    .update({ paypal_capture_id: captureId, status: 'captured' })
    .or(`paypal_capture_id.eq.${captureId}${orderId ? `,paypal_order_id.eq.${orderId}` : ''}`)

  console.log(`[Education Webhook] Enrollment ${enrollment.id} activated via webhook`)
}

async function handleCaptureDenied(resource: Record<string, unknown>) {
  const captureId = resource.id as string
  const orderId = (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
    .supplementary_data?.related_ids?.order_id

  if (!captureId && !orderId) {
    console.warn('[Education Webhook] CAPTURE.DENIED missing IDs')
    return
  }

  const query = supabase
    .from('education_enrollments')
    .update({ payment_status: 'failed', enrollment_status: 'cancelled' })

  if (orderId) {
    await query.eq('paypal_order_id', orderId)
  } else if (captureId) {
    await query.eq('paypal_capture_id', captureId)
  }

  // Update course_payments record
  if (orderId || captureId) {
    const cpQuery = supabase
      .from('course_payments')
      .update({ status: 'failed' })
    if (orderId) {
      await cpQuery.eq('paypal_order_id', orderId)
    } else {
      await cpQuery.eq('paypal_capture_id', captureId)
    }
  }

  console.log(`[Education Webhook] Payment denied for captureId: ${captureId}`)
}

async function handleCaptureRefunded(resource: Record<string, unknown>) {
  const refundId = resource.id as string
  // The capture ID is in links or seller_payable_breakdown
  const captureId = (resource as { links?: Array<{ rel: string; href: string }> })
    .links
    ?.find(l => l.rel === 'up')
    ?.href
    ?.split('/')
    ?.pop()

  if (!captureId) {
    console.warn('[Education Webhook] CAPTURE.REFUNDED: could not determine capture ID, refundId:', refundId)
    return
  }

  const { data: enrollment } = await supabase
    .from('education_enrollments')
    .select('id, student_id, course_id')
    .eq('paypal_capture_id', captureId)
    .single()

  if (!enrollment) {
    console.warn('[Education Webhook] CAPTURE.REFUNDED: no enrollment found for captureId:', captureId)
    return
  }

  await supabase
    .from('education_enrollments')
    .update({
      payment_status: 'refunded',
      enrollment_status: 'refunded'
    })
    .eq('id', enrollment.id)

  // Decrement enrolled_count on refund
  const { data: currentCourse } = await supabase
    .from('education_courses')
    .select('enrolled_count')
    .eq('id', enrollment.course_id)
    .single()

  if (currentCourse && (currentCourse.enrolled_count || 0) > 0) {
    await supabase
      .from('education_courses')
      .update({ enrolled_count: currentCourse.enrolled_count - 1 })
      .eq('id', enrollment.course_id)
  }

  // Notify student
  await supabase.from('notifications').insert({
    user_id: enrollment.student_id,
    type: 'education_refund',
    title: '💰 Reembolso procesado',
    message: 'Tu reembolso ha sido procesado por PayPal.',
    link: '/education?tab=my-courses',
    is_read: false
  })

  console.log(`[Education Webhook] Enrollment ${enrollment.id} marked refunded via webhook`)
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
  webhookId: string
): Promise<boolean> {
  try {
    const token = await getPayPalToken()

    const verifyBody = {
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody)
    }

    const res = await fetch(`${getPayPalBase()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(verifyBody)
    })

    const data = await res.json()
    return data.verification_status === 'SUCCESS'
  } catch (err) {
    console.error('[Education Webhook] Signature verification error:', err)
    return false
  }
}
