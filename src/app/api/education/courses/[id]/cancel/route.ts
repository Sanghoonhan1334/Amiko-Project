import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'
import { refundPayPalCapture } from '@/lib/paypal-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/cancel
// Cancela el curso completo: bloquea acceso, cancela sesiones pendientes,
// inicia reembolsos según política, notifica a todos
// Body: { user_id: string, reason: string, process_refunds?: boolean }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id
    const { reason, process_refunds = true } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }

    // Obtener curso con instructor
    const { data: course, error } = await supabase
      .from('education_courses')
      .select(`
        id, title, status, slug,
        instructor:instructor_profiles(user_id)
      `)
      .eq('id', id)
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verificar autorización: instructor o admin
    const instructorUserId = (course.instructor as { user_id?: string } | null)?.user_id
    const isInstructor = instructorUserId === user_id
    if (!isInstructor) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user_id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Only the instructor or an admin can cancel this course' }, { status: 403 })
      }
    }

    if (['completed', 'cancelled'].includes(course.status)) {
      return NextResponse.json({ error: `Course is already ${course.status}` }, { status: 400 })
    }

    // 1. Cancelar el curso
    await supabase
      .from('education_courses')
      .update({ status: 'cancelled' })
      .eq('id', id)

    // 2. Cancelar todas las sesiones pendientes
    await supabase
      .from('education_sessions')
      .update({ status: 'cancelled' })
      .eq('course_id', id)
      .in('status', ['scheduled', 'ready'])

    // 3. Eliminar recordatorios pendientes
    const { data: sessionIds } = await supabase
      .from('education_sessions')
      .select('id')
      .eq('course_id', id)

    if (sessionIds?.length) {
      const ids = sessionIds.map(s => s.id)
      await supabase
        .from('education_reminders')
        .delete()
        .in('session_id', ids)
        .eq('sent', false)
    }

    // 4. Obtener inscripciones activas para reembolso
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('id, student_id, paypal_order_id, paypal_capture_id, amount_paid, payment_status')
      .eq('course_id', id)
      .in('enrollment_status', ['active', 'enrolled'])

    const refundResults: Array<{ student_id: string; status: string; amount?: number; error?: string }> = []

    if (enrollments?.length) {
      for (const enrollment of enrollments) {
        try {
          // Procesar reembolso PayPal si corresponde
          if (process_refunds && enrollment.paypal_capture_id) {
            const refundResult = await refundPayPalCapture(enrollment.paypal_capture_id as string, {
              amount: parseFloat(String(enrollment.amount_paid)),
              note: `Curso cancelado: ${course.title}. Motivo: ${reason}`
            })
            if (refundResult.ok) {
              refundResults.push({ student_id: enrollment.student_id, status: 'refunded', amount: enrollment.amount_paid })
            } else {
              refundResults.push({ student_id: enrollment.student_id, status: 'refund_failed', error: (refundResult.data as { message?: string }).message })
            }
          }

          // Actualizar estado de inscripción
          await supabase
            .from('education_enrollments')
            .update({
              enrollment_status: 'cancelled',
              payment_status: process_refunds ? 'refunded' : enrollment.payment_status
            })
            .eq('id', enrollment.id)

          // Notificar estudiante
          await supabase.from('notifications').insert({
            user_id: enrollment.student_id,
            type: 'education_course_cancelled',
            title: '⚠️ Curso cancelado',
            message: `El curso "${course.title}" ha sido cancelado. Motivo: ${reason}.${process_refunds ? ' Tu reembolso será procesado en breve.' : ''}`,
            link: '/education',
            is_read: false
          })
        } catch (refundErr) {
          console.error('[Education] course cancel refund error for enrollment', enrollment.id, refundErr)
          refundResults.push({ student_id: enrollment.student_id, status: 'error' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      course_id: id,
      enrollments_affected: enrollments?.length || 0,
      refund_results: refundResults,
      message: `Course cancelled. ${enrollments?.length || 0} enrollments affected.`
    })
  } catch (err) {
    console.error('[Education] course cancel error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
