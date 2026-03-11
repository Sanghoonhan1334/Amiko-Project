import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/submit-for-review
// El instructor envía el borrador a revisión del administrador
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id

    // Obtener el curso con su instructor
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select(`
        *,
        sessions:education_sessions(id),
        instructor:instructor_profiles(id, user_id, display_name)
      `)
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Solo se puede enviar si está en draft, changes_requested o rejected
    if (!['draft', 'changes_requested', 'rejected'].includes(course.status)) {
      return NextResponse.json({
        error: `Cannot submit course with status "${course.status}". Only draft, changes_requested, or rejected courses can be submitted.`
      }, { status: 400 })
    }

    // Validar que el solicitante sea el instructor del curso
    if (course.instructor?.user_id !== user_id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Validar que el curso tenga mínimo los campos obligatorios
    const missingFields: string[] = []
    if (!course.title) missingFields.push('title')
    if (!course.description) missingFields.push('description')
    if (!course.category) missingFields.push('category')
    if (!course.level) missingFields.push('level')
    if (!course.teaching_language) missingFields.push('teaching_language')
    if (!course.price_usd) missingFields.push('price_usd')
    if (!course.total_classes || course.total_classes < 1) missingFields.push('total_classes')

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Course is incomplete. Fill in all required fields before submitting.',
        missing_fields: missingFields
      }, { status: 422 })
    }

    // Validar que tenga al menos una sesión programada
    if (!course.sessions || course.sessions.length === 0) {
      return NextResponse.json({
        error: 'Course must have at least one scheduled session before submitting for review.'
      }, { status: 422 })
    }

    // Cambiar estado a submitted_for_review
    const { data: updated, error: updateError } = await supabase
      .from('education_courses')
      .update({ status: 'submitted_for_review' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education] submit-for-review error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Registrar historial de estado
    const { error: historyError } = await supabase
      .from('course_status_history')
      .insert({
        course_id: id,
        previous_status: course.status,
        new_status: 'submitted_for_review',
        changed_by: user_id,
        notes: 'Submitted for review by instructor',
      })
    if (historyError) console.error('[Education] Failed to record status history:', historyError)

    // Notificar a los administradores (buscar usuarios con rol admin)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins?.length) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'education_course_submitted',
        title: '📋 Curso pendiente de revisión',
        message: `El instructor ${course.instructor?.display_name || 'desconocido'} ha enviado el curso "${course.title}" para revisión.`,
        link: `/admin/education`,
        is_read: false
      }))
      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({
      course: updated,
      message: 'Course submitted for review successfully.'
    })
  } catch (err) {
    console.error('[Education] submit-for-review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
