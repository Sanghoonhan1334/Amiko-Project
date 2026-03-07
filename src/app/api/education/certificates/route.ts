import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/certificates - Issue a certificate for a completed enrollment
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { enrollment_id } = await request.json()

    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 })
    }

    // Get enrollment with course and instructor data
    const { data: enrollment, error: enrollError } = await supabase
      .from('education_enrollments')
      .select(`
        *,
        course:education_courses(
          id, title, category, total_classes, class_duration_minutes,
          instructor:instructor_profiles(display_name, user_id)
        )
      `)
      .eq('id', enrollment_id)
      .single()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Verify ownership — only the enrolled student can request their certificate
    if (enrollment.student_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Must be completed
    if (enrollment.enrollment_status !== 'completed') {
      return NextResponse.json({ error: 'Course not yet completed' }, { status: 400 })
    }

    // Already issued?
    if (enrollment.certificate_issued && enrollment.certificate_url) {
      return NextResponse.json({
        certificate_url: enrollment.certificate_url,
        already_issued: true
      })
    }

    // Get student profile
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', enrollment.student_id)
      .single()

    const studentName = studentProfile?.full_name || studentProfile?.username || 'Estudiante'

    // Generate certificate URL (points to the rendered certificate page)
    const certificateUrl = `/education/certificate/${enrollment.id}`

    // Update enrollment with certificate info
    const { error: updateError } = await supabase
      .from('education_enrollments')
      .update({
        certificate_issued: true,
        certificate_url: certificateUrl
      })
      .eq('id', enrollment_id)

    if (updateError) {
      console.error('[Education] Certificate update error:', updateError)
      return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 })
    }

    // Create notification for the student
    await supabase.from('notifications').insert({
      user_id: enrollment.student_id,
      type: 'education_certificate',
      title: `🎓 ¡Certificado disponible!`,
      message: `Tu certificado para "${enrollment.course?.title}" está listo para descargar.`,
      link: certificateUrl,
      is_read: false
    })

    return NextResponse.json({
      certificate_url: certificateUrl,
      student_name: studentName,
      course_title: enrollment.course?.title,
      issued: true
    }, { status: 201 })
  } catch (err) {
    console.error('[Education] certificate POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/education/certificates?enrollmentId=xxx - Get certificate data for rendering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')

    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 })
    }

    const { data: enrollment, error } = await supabase
      .from('education_enrollments')
      .select(`
        *,
        course:education_courses(
          id, title, category, total_classes, class_duration_minutes, level,
          teaching_language, start_date, end_date,
          instructor:instructor_profiles(display_name, photo_url, is_verified)
        )
      `)
      .eq('id', enrollmentId)
      .single()

    if (error || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (!enrollment.certificate_issued) {
      return NextResponse.json({ error: 'Certificate not yet issued' }, { status: 400 })
    }

    // Get student profile
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', enrollment.student_id)
      .single()

    return NextResponse.json({
      certificate: {
        enrollment_id: enrollment.id,
        student_name: studentProfile?.full_name || studentProfile?.username || 'Estudiante',
        student_avatar: studentProfile?.avatar_url,
        course_title: enrollment.course?.title,
        course_category: enrollment.course?.category,
        course_level: enrollment.course?.level,
        teaching_language: enrollment.course?.teaching_language,
        total_classes: enrollment.course?.total_classes,
        class_duration_minutes: enrollment.course?.class_duration_minutes,
        instructor_name: enrollment.course?.instructor?.display_name,
        instructor_verified: enrollment.course?.instructor?.is_verified,
        completed_at: enrollment.completed_at,
        enrolled_at: enrollment.enrolled_at,
        certificate_id: `AMIKO-EDU-${enrollment.id.slice(0, 8).toUpperCase()}`
      }
    })
  } catch (err) {
    console.error('[Education] certificate GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
