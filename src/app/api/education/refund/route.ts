import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'
import { refundPayPalCapture } from '@/lib/paypal-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/refund - Process a refund for an education enrollment
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { enrollment_id, reason } = await request.json()

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

    // Verify ownership — only the student who enrolled can request a refund
    if (enrollment.student_id !== userId) {
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

    // Process PayPal refund using the capture ID stored on the enrollment
    let paypalRefundId = null
    const captureId: string | null = enrollment.paypal_capture_id || null

    if (captureId) {
      try {
        const refundResult = await refundPayPalCapture(captureId, {
          amount: parseFloat(String(enrollment.amount_paid)),
          note: reason || 'Education course refund - AMIKO'
        })
        if (!refundResult.ok) {
          console.error('[Education] PayPal refund error:', refundResult.data)
          return NextResponse.json({
            error: 'PayPal refund failed',
            details: (refundResult.data as { message?: string }).message
          }, { status: 500 })
        }
        paypalRefundId = refundResult.data.id as string
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
