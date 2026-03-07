import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/certificate/generate
// Genera el certificado para el estudiante si cumple los requisitos.
// Puede llamarse automáticamente al finalizar el curso o manualmente.
// Body: { user_id: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id

    // Obtener inscripción
    const { data: enrollment, error: enrollError } = await supabase
      .from('education_enrollments')
      .select(`
        id, student_id, payment_status, enrollment_status,
        progress_percentage, completed_classes, certificate_issued, certificate_url,
        enrolled_at, completed_at,
        course:education_courses(
          id, title, slug, category, level, teaching_language,
          total_classes, class_duration_minutes, allow_recording,
          instructor:instructor_profiles(id, display_name, is_verified)
        )
      `)
      .eq('course_id', id)
      .eq('student_id', user_id)
      .single()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    if (enrollment.payment_status !== 'completed') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })
    }

    // Verificar criterio de elegibilidad: 80% de asistencia mínima
    const progress = enrollment.progress_percentage || 0
    if (progress < 80 && enrollment.enrollment_status !== 'completed') {
      return NextResponse.json({
        error: 'Certificate not yet eligible. Minimum 80% course completion required.',
        current_progress: progress,
        required_progress: 80
      }, { status: 400 })
    }

    // Verificar si ya existe certificado en la tabla dedicada
    const { data: existing } = await supabase
      .from('course_certificates')
      .select('id, certificate_code, issued_at, pdf_url')
      .eq('course_id', id)
      .eq('student_id', user_id)
      .single()

    if (existing) {
      return NextResponse.json({
        certificate: existing,
        already_exists: true,
        message: 'Certificate already issued'
      })
    }

    // Generar código de certificado único
    const enrollmentShort = enrollment.id.replace(/-/g, '').slice(0, 8).toUpperCase()
    const timestampBase = Date.now().toString(36).toUpperCase().slice(-4)
    const certificateCode = `AMIKO-EDU-${enrollmentShort}-${timestampBase}`

    // Calcular tasa de asistencia para el certificado
    const { data: sessions } = await supabase
      .from('education_sessions')
      .select('id')
      .eq('course_id', id)
      .eq('status', 'completed')

    const sessionIds = (sessions || []).map(s => s.id)
    let attendancePercentage = 0

    if (sessionIds.length > 0) {
      const { count: attendedCount } = await supabase
        .from('education_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user_id)
        .in('session_id', sessionIds)
        .in('status', ['attended', 'completed', 'late'])

      const total = (enrollment.course as { total_classes?: number } | null)?.total_classes || 1
      attendancePercentage = Math.round(((attendedCount || 0) / total) * 100)
    }

    // URL del certificado (página de vista)
    const pdfUrl = `/education/certificate/${enrollment.id}`

    // Insertar en tabla course_certificates
    const { data: certificate, error: certError } = await supabase
      .from('course_certificates')
      .insert({
        course_id: id,
        enrollment_id: enrollment.id,
        student_id: user_id,
        certificate_code: certificateCode,
        issued_at: new Date().toISOString(),
        pdf_url: pdfUrl,
        attendance_percentage: attendancePercentage,
        is_valid: true
      })
      .select()
      .single()

    if (certError) {
      console.error('[Education] certificate insert error:', certError)
      return NextResponse.json({ error: certError.message }, { status: 500 })
    }

    // Actualizar enrollment también (retrocompatibilidad)
    await supabase
      .from('education_enrollments')
      .update({
        certificate_issued: true,
        certificate_url: pdfUrl,
        enrollment_status: 'completed',
        completed_at: enrollment.completed_at || new Date().toISOString()
      })
      .eq('id', enrollment.id)

    // Notificar al estudiante
    const courseTitle = (enrollment.course as { title?: string } | null)?.title || 'curso'
    await supabase.from('notifications').insert({
      user_id,
      type: 'education_certificate',
      title: '🎓 ¡Certificado disponible!',
      message: `Has completado "${courseTitle}". Tu certificado está listo para descargar.`,
      link: pdfUrl,
      is_read: false
    })

    return NextResponse.json({
      certificate,
      certificate_code: certificateCode,
      pdf_url: pdfUrl,
      attendance_percentage: attendancePercentage,
      message: 'Certificate generated successfully'
    }, { status: 201 })
  } catch (err) {
    console.error('[Education] certificate generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/education/courses/[id]/certificate/generate?userId=xxx
// Verificar elegibilidad sin emitir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { data: enrollment } = await supabase
      .from('education_enrollments')
      .select('id, payment_status, enrollment_status, progress_percentage, certificate_issued')
      .eq('course_id', id)
      .eq('student_id', userId)
      .single()

    if (!enrollment) {
      return NextResponse.json({ eligible: false, reason: 'not_enrolled' })
    }

    const { data: existing } = await supabase
      .from('course_certificates')
      .select('certificate_code, issued_at, pdf_url')
      .eq('course_id', id)
      .eq('student_id', userId)
      .single()

    const progress = enrollment.progress_percentage || 0
    const eligible = progress >= 80 || enrollment.enrollment_status === 'completed'

    return NextResponse.json({
      eligible,
      already_issued: !!existing,
      certificate: existing || null,
      current_progress: progress,
      required_progress: 80,
      enrollment_status: enrollment.enrollment_status
    })
  } catch (err) {
    console.error('[Education] certificate check error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
