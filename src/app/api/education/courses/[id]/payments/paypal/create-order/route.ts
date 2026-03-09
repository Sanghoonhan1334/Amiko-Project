import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'
import { getPayPalToken, getPayPalBase } from '@/lib/paypal-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
// Crea una orden PayPal para inscribirse en el curso.
// Body: { user_id: string, customer_name?: string, customer_email?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id
    const { customer_name, customer_email } = await request.json()

    // Obtener curso
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select('id, title, price_usd, max_students, enrolled_count, status')
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Validaciones
    if (!['published', 'in_progress'].includes(course.status)) {
      return NextResponse.json({ error: 'Course is not available for enrollment' }, { status: 400 })
    }

    if (course.enrolled_count >= course.max_students) {
      return NextResponse.json({ error: 'Course is full' }, { status: 400 })
    }

    // Verificar que no esté ya inscrito
    const { data: existing } = await supabase
      .from('education_enrollments')
      .select('id, payment_status, enrollment_status')
      .eq('course_id', id)
      .eq('student_id', user_id)
      .single()

    if (existing) {
      if (['payment_created', 'payment_approved', 'completed'].includes(existing.payment_status)) {
        return NextResponse.json({ error: 'Already enrolled or payment in progress' }, { status: 409 })
      }
    }

    // Verificar que el instructor no se inscriba en su propio curso
    const { data: instructor } = await supabase
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (instructor) {
      const { data: ownCourse } = await supabase
        .from('education_courses')
        .select('id')
        .eq('id', id)
        .eq('instructor_id', instructor.id)
        .single()

      if (ownCourse) {
        return NextResponse.json({ error: 'Instructors cannot enroll in their own courses' }, { status: 400 })
      }
    }

    // Crear/actualizar enrollment en pending_payment
    let enrollmentId: string

    if (existing) {
      const { data: updated } = await supabase
        .from('education_enrollments')
        .update({ payment_status: 'pending', enrollment_status: 'pending_payment' })
        .eq('id', existing.id)
        .select('id')
        .single()
      enrollmentId = updated!.id
    } else {
      const { data: created } = await supabase
        .from('education_enrollments')
        .insert({
          course_id: id,
          student_id: user_id,
          amount_paid: course.price_usd,
          payment_status: 'pending',
          enrollment_status: 'pending_payment'
        })
        .select('id')
        .single()
      enrollmentId = created!.id
    }

    // Crear orden en PayPal
    const appBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://helloamiko.com'
    const token = await getPayPalToken()
    const PAYPAL_BASE = getPayPalBase()

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: enrollmentId,
          amount: {
            currency_code: 'USD',
            value: Number(course.price_usd).toFixed(2)
          },
          description: `Inscripción: ${course.title}`,
          custom_id: `edu_enrollment_${enrollmentId}`
        }
      ],
      application_context: {
        brand_name: 'Amiko',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${appBase}/education/checkout/${id}?status=success&enrollment=${enrollmentId}`,
        cancel_url: `${appBase}/education/checkout/${id}?status=cancel`
      }
    }

    if (customer_name || customer_email) {
      Object.assign(orderPayload, {
        payer: {
          name: customer_name ? { given_name: customer_name.split(' ')[0], surname: customer_name.split(' ').slice(1).join(' ') } : undefined,
          email_address: customer_email
        }
      })
    }

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    })

    const orderData = await orderRes.json()

    if (!orderRes.ok) {
      console.error('[Education PayPal] create-order failed:', orderData)
      return NextResponse.json({
        error: 'Failed to create PayPal order',
        details: orderData.message
      }, { status: 500 })
    }

    // Guardar paypal_order_id en enrollment y en course_payments
    await supabase
      .from('education_enrollments')
      .update({
        paypal_order_id: orderData.id,
        payment_status: 'payment_created'
      })
      .eq('id', enrollmentId)

    await supabase.from('course_payments').insert({
      course_id: id,
      enrollment_id: enrollmentId,
      user_id,
      provider: 'paypal',
      paypal_order_id: orderData.id,
      amount: course.price_usd,
      currency: 'USD',
      status: 'created',
      raw_payload: orderData
    })

    // Extraer URL de aprobación para el frontend
    const approveUrl = orderData.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve'
    )?.href

    return NextResponse.json({
      order_id: orderData.id,
      enrollment_id: enrollmentId,
      approve_url: approveUrl,
      amount: course.price_usd,
      currency: 'USD',
      course_title: course.title,
      status: 'created'
    }, { status: 201 })
  } catch (err) {
    console.error('[Education PayPal] create-order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
