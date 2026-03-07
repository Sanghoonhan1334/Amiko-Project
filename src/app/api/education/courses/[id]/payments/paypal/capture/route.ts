import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'
import { getPayPalOrder, capturePayPalOrder } from '@/lib/paypal-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/payments/paypal/capture
// Captura el pago, activa la inscripción y habilita el acceso completo al curso.
// Body: { paypal_order_id: string, user_id: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id
    const { paypal_order_id } = await request.json()

    if (!paypal_order_id) {
      return NextResponse.json({ error: 'paypal_order_id is required' }, { status: 400 })
    }

    // Obtener el enrollment y validar que pertenece al usuario y al curso
    const { data: enrollment, error: enrollError } = await supabase
      .from('education_enrollments')
      .select(`
        id, student_id, course_id, paypal_order_id, amount_paid,
        payment_status, enrollment_status,
        course:education_courses(
          id, title, slug, price_usd, max_students, enrolled_count,
          instructor_id, status,
          instructor:instructor_profiles(user_id, display_name)
        )
      `)
      .eq('course_id', id)
      .eq('student_id', user_id)
      .single()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Validar que la orden pertenece a este enrollment
    if (enrollment.paypal_order_id !== paypal_order_id) {
      return NextResponse.json({ error: 'Order ID does not match enrollment' }, { status: 400 })
    }

    // Evitar captura doble
    if (['payment_captured', 'completed'].includes(enrollment.payment_status)) {
      return NextResponse.json({ error: 'Payment already captured' }, { status: 409 })
    }

    // Verificar cupos otra vez (podría haberse llenado mientras el usuario pagaba)
    const course = (enrollment.course as unknown) as {
      price_usd: number
      max_students: number
      enrolled_count: number
      status: string
      title: string
      slug?: string
      instructor?: { user_id?: string; display_name?: string }
    } | null

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.enrolled_count >= course.max_students) {
      return NextResponse.json({
        error: 'Course is now full. Cannot complete enrollment.',
        refund_needed: true
      }, { status: 400 })
    }

    // Verificar la orden en PayPal antes de capturar
    const checkData = await getPayPalOrder(paypal_order_id)
    if (!checkData) {
      return NextResponse.json({ error: 'Failed to verify PayPal order' }, { status: 500 })
    }

    // Validar monto y moneda
    const orderAmount = parseFloat(
      checkData.purchase_units?.[0]?.amount?.value || '0'
    )
    const orderCurrency = checkData.purchase_units?.[0]?.amount?.currency_code || 'USD'
    const expectedAmount = parseFloat(String(course.price_usd))

    if (Math.abs(orderAmount - expectedAmount) > 0.01) {
      return NextResponse.json({
        error: 'Amount mismatch. Expected ' + expectedAmount + ' but got ' + orderAmount
      }, { status: 400 })
    }

    if (orderCurrency !== 'USD') {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }

    // Estado debe ser APPROVED
    if (checkData.status !== 'APPROVED') {
      return NextResponse.json({
        error: `Order is not approved. Current status: ${checkData.status}`
      }, { status: 400 })
    }

    // Capturar el pago en PayPal
    const captureResult = await capturePayPalOrder(paypal_order_id)
    const captureData = captureResult.data

    if (!captureResult.ok || captureData.status !== 'COMPLETED') {
      console.error('[Education PayPal] capture failed:', captureData)
      return NextResponse.json({
        error: 'PayPal capture failed',
        details: (captureData as { message?: string; details?: unknown }).message || (captureData as { message?: string; details?: unknown }).details
      }, { status: 500 })
    }

    const captureId = ((captureData as { purchase_units?: Array<{payments?: {captures?: Array<{id: string}>}}>}).purchase_units?.[0]?.payments?.captures?.[0]?.id)

    // Activar inscripción — este es el único punto donde se concede acceso
    const now = new Date().toISOString()

    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('education_enrollments')
      .update({
        payment_status: 'completed',
        enrollment_status: 'active',
        paypal_capture_id: captureId,
        enrolled_at: now
      })
      .eq('id', enrollment.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education] enrollment activation error:', updateError)
      return NextResponse.json({ error: 'Payment captured but enrollment activation failed' }, { status: 500 })
    }

    // Actualizar/crear registro de pago
    await supabase
      .from('course_payments')
      .update({
        paypal_capture_id: captureId,
        status: 'captured',
        raw_payload: captureData
      })
      .eq('paypal_order_id', paypal_order_id)

    // Notificar al estudiante
    const courseSlug = course.slug || id
    await supabase.from('notifications').insert({
      user_id,
      type: 'education_enrollment_confirmed',
      title: '🎉 ¡Inscripción confirmada!',
      message: `Tu inscripción en "${course.title}" fue confirmada. ¡Bienvenido al curso!`,
      link: `/education/course/${courseSlug}`,
      is_read: false
    })

    // Notificar al instructor
    const instructorUserId = course.instructor?.user_id
    if (instructorUserId) {
      await supabase.from('notifications').insert({
        user_id: instructorUserId,
        type: 'education_new_student',
        title: '👤 Nuevo estudiante inscrito',
        message: `Un estudiante se ha inscrito en tu curso "${course.title}".`,
        link: `/education?tab=instructor`,
        is_read: false
      })
    }

    return NextResponse.json({
      success: true,
      enrollment: updatedEnrollment,
      capture_id: captureId,
      amount_paid: course.price_usd,
      course_title: course.title,
      message: 'Payment captured and enrollment activated successfully'
    })
  } catch (err) {
    console.error('[Education PayPal] capture error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
