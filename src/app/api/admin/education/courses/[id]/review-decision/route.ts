import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/admin/education/courses/[id]/review-decision
// El administrador toma una decisión sobre un curso enviado a revisión
// Payload: { decision: 'approved' | 'rejected' | 'changes_requested', notes: string, admin_user_id?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const adminUserId = auth.user.id

    const isAdmin = await isAdminUser(adminUserId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { decision, notes } = body

    if (!decision) {
      return NextResponse.json({ error: 'decision is required' }, { status: 400 })
    }

    const validDecisions = ['approved', 'rejected', 'changes_requested']
    if (!validDecisions.includes(decision)) {
      return NextResponse.json({
        error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      }, { status: 400 })
    }

    if ((decision === 'rejected' || decision === 'changes_requested') && !notes) {
      return NextResponse.json({
        error: `notes are required when decision is "${decision}"`
      }, { status: 400 })
    }

    // Obtener el curso
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select(`
        id, title, slug, status,
        instructor:instructor_profiles(user_id, display_name)
      `)
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Solo se puede revisar si está en submitted_for_review
    if (course.status !== 'submitted_for_review') {
      return NextResponse.json({
        error: `Course is not pending review. Current status: "${course.status}"`
      }, { status: 400 })
    }

    // Mapear decisión a estado
    const statusMap: Record<string, string> = {
      approved: 'published',
      rejected: 'rejected',
      changes_requested: 'changes_requested'
    }
    const newStatus = statusMap[decision]

    // Preparar actualización
    const updatePayload: Record<string, unknown> = { status: newStatus }
    if (decision === 'rejected') {
      updatePayload.rejection_reason = notes
    }

    // Actualizar curso
    const { data: updated, error: updateError } = await supabase
      .from('education_courses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education Admin] review-decision error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Registrar en historial con quien tomó la decisión
    if (adminUserId) {
      await supabase.from('course_status_history').insert({
        course_id: id,
        from_status: 'submitted_for_review',
        to_status: newStatus,
        changed_by: adminUserId,
        notes: notes || null
      })
    }

    // Notificar al instructor
    const instructorUserId = (course.instructor as { user_id?: string } | null)?.user_id
    if (instructorUserId) {
      const notificationMap: Record<string, { title: string; message: string }> = {
        approved: {
          title: '✅ ¡Curso aprobado!',
          message: `Tu curso "${course.title}" ha sido aprobado y publicado en el marketplace.`
        },
        rejected: {
          title: '❌ Curso rechazado',
          message: `Tu curso "${course.title}" fue rechazado. Motivo: ${notes}`
        },
        changes_requested: {
          title: '📝 Se requieren cambios',
          message: `Tu curso "${course.title}" necesita ajustes antes de ser publicado. Notas: ${notes}`
        }
      }

      const notif = notificationMap[decision]
      await supabase.from('notifications').insert({
        user_id: instructorUserId,
        type: `education_course_${decision}`,
        title: notif.title,
        message: notif.message,
        link: decision === 'approved'
          ? `/education/course/${course.slug || course.id}`
          : `/education?tab=instructor`,
        is_read: false
      })
    }

    return NextResponse.json({
      course: updated,
      decision,
      message: `Course ${decision.replace('_', ' ')} successfully.`
    })
  } catch (err) {
    console.error('[Education Admin] review-decision error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
