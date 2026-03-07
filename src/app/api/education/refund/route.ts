import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const baseUrl =
    process.env.PAYPAL_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com')

  if (!clientId || !clientSecret) {
    throw new Error('PayPal client ID or secret is not configured')
  }

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${data.error_description || data.error}`)
  }

  return data.access_token
}

// POST /api/education/refund - Process a refund for an education enrollment
export async function POST(request: NextRequest) {
  try {
    const { enrollment_id, student_id, reason } = await request.json()

    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 })
    }

    // Get enrollment with course data
    const { data: enrollment, error: enrollError } = await supabase
      .from('education_enrollments')
      .select(`
        *,
        course:education_courses(
          id, title, instructor_id, status,
          instructor:instructor_profiles(display_name, user_id)
        )
      `)
      .eq('id', enrollment_id)
      .single()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Verify ownership
    if (student_id && enrollment.student_id !== student_id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Already refunded?
    if (enrollment.payment_status === 'refunded') {
      return NextResponse.json({ error: 'Already refunded' }, { status: 400 })
    }

    // Check refund eligibility: only if student has completed less than 50% of classes
    if (enrollment.progress_percentage >= 50) {
      return NextResponse.json({
        error: 'Refund not eligible. Progress is above 50%.',
        progress: enrollment.progress_percentage
      }, { status: 400 })
    }

    // Process PayPal refund if we have a PayPal order ID
    let paypalRefundId = null
    if (enrollment.paypal_order_id) {
      try {
        const paypalApiBase =
          process.env.PAYPAL_API_BASE_URL ||
          (process.env.NODE_ENV === 'production'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com')

        const token = await getPayPalAccessToken()

        // First, get the capture ID from the order
        const orderRes = await fetch(
          `${paypalApiBase}/v2/checkout/orders/${enrollment.paypal_order_id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        const orderData = await orderRes.json()

        const captureId = orderData?.purchase_units?.[0]?.payments?.captures?.[0]?.id

        if (captureId) {
          // Issue refund
          const refundRes = await fetch(
            `${paypalApiBase}/v2/payments/captures/${captureId}/refund`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                amount: {
                  value: enrollment.amount_paid.toFixed(2),
                  currency_code: 'USD'
                },
                note_to_payer: reason || 'Education course refund - AMIKO'
              })
            }
          )
          const refundData = await refundRes.json()

          if (refundRes.ok) {
            paypalRefundId = refundData.id
          } else {
            console.error('[Education] PayPal refund error:', refundData)
            return NextResponse.json({
              error: 'PayPal refund failed',
              details: refundData.message || refundData.error
            }, { status: 500 })
          }
        }
      } catch (err) {
        console.error('[Education] PayPal refund error:', err)
        return NextResponse.json({ error: 'Failed to process PayPal refund' }, { status: 500 })
      }
    }

    // Update enrollment status
    const { error: updateError } = await supabase
      .from('education_enrollments')
      .update({
        payment_status: 'refunded',
        enrollment_status: 'refunded'
      })
      .eq('id', enrollment_id)

    if (updateError) {
      console.error('[Education] Enrollment update error after refund:', updateError)
      return NextResponse.json({ error: 'Refund processed but failed to update enrollment' }, { status: 500 })
    }

    // Update course enrolled count (decrement via trigger or manual)
    if (enrollment.course?.id) {
      const { count } = await supabase
        .from('education_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', enrollment.course.id)
        .in('enrollment_status', ['active', 'completed'])

      await supabase
        .from('education_courses')
        .update({ enrolled_count: count || 0 })
        .eq('id', enrollment.course.id)
    }

    // Notify student
    await supabase.from('notifications').insert({
      user_id: enrollment.student_id,
      type: 'education_refund',
      title: '💰 Reembolso procesado',
      message: `Tu reembolso de $${enrollment.amount_paid} para "${enrollment.course?.title}" ha sido procesado.`,
      link: '/education?tab=my-courses',
      is_read: false
    })

    // Notify instructor
    if (enrollment.course?.instructor?.user_id) {
      await supabase.from('notifications').insert({
        user_id: enrollment.course.instructor.user_id,
        type: 'education_refund',
        title: '📋 Reembolso de estudiante',
        message: `Un estudiante ha solicitado reembolso para "${enrollment.course?.title}".`,
        link: '/education?tab=instructor',
        is_read: false
      })
    }

    return NextResponse.json({
      success: true,
      refund_id: paypalRefundId,
      amount: enrollment.amount_paid,
      message: 'Refund processed successfully'
    })
  } catch (err) {
    console.error('[Education] refund error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
