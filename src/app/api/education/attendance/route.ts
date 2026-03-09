import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCertificateEmail } from '@/lib/education-email'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/attendance - Mark attendance
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const student_id = auth.user.id

    const { session_id, status } = await request.json()

    if (!session_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = { status }

    if (status === 'completed') {
      updateData.joined_at = now
    }

    const { data, error } = await supabase
      .from('education_attendance')
      .upsert({
        session_id,
        student_id,
        ...updateData
      }, { onConflict: 'session_id,student_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update enrollment progress
    const { data: session } = await supabase
      .from('education_sessions')
      .select('course_id')
      .eq('id', session_id)
      .single()

    if (session) {
      const { count: completedCount } = await supabase
        .from('education_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student_id)
        .in('status', ['attended', 'completed', 'late'])
        .in('session_id',
          (await supabase.from('education_sessions').select('id').eq('course_id', session.course_id)).data?.map(s => s.id) || []
        )

      const { data: course } = await supabase
        .from('education_courses')
        .select('total_classes')
        .eq('id', session.course_id)
        .single()

      if (course) {
        const progress = Math.round(((completedCount || 0) / course.total_classes) * 100)
        const isCompleted = progress >= 100

        const { data: updatedEnrollment } = await supabase
          .from('education_enrollments')
          .update({
            completed_classes: completedCount || 0,
            progress_percentage: progress,
            enrollment_status: isCompleted ? 'completed' : 'active',
            completed_at: isCompleted ? now : null
          })
          .eq('course_id', session.course_id)
          .eq('student_id', student_id)
          .select('id, certificate_issued')
          .single()

        // Auto-issue certificate when course is completed
        if (isCompleted && updatedEnrollment && !updatedEnrollment.certificate_issued) {
          const certUrl = `/education/certificate/${updatedEnrollment.id}`
          await supabase
            .from('education_enrollments')
            .update({
              certificate_issued: true,
              certificate_url: certUrl
            })
            .eq('id', updatedEnrollment.id)

          // Notify student about certificate
          await supabase.from('notifications').insert({
            user_id: student_id,
            type: 'education_certificate',
            title: '🎓 ¡Certificado disponible!',
            message: `Has completado el curso. Tu certificado está listo para descargar.`,
            link: certUrl,
            is_read: false
          })

          // Send certificate email
          try {
            const { data: studentProfile } = await supabase
              .from('profiles')
              .select('email, username, full_name')
              .eq('id', student_id)
              .single()

            const { data: courseData } = await supabase
              .from('education_courses')
              .select('title')
              .eq('id', session.course_id)
              .single()

            if (studentProfile?.email) {
              await sendCertificateEmail(
                studentProfile.email,
                studentProfile.full_name || studentProfile.username || 'Estudiante',
                courseData?.title || 'Curso AMIKO',
                certUrl
              )
            }
          } catch (emailErr) {
            console.error('[Education] Certificate email error:', emailErr)
          }
        }
      }
    }

    return NextResponse.json({ attendance: data })
  } catch (err) {
    console.error('[Education] attendance error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/education/attendance?sessionId=xxx or studentId=xxx&courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')

    let query = supabase.from('education_attendance').select('*')

    if (sessionId) query = query.eq('session_id', sessionId)
    if (studentId) query = query.eq('student_id', studentId)

    // If courseId, filter by sessions belonging to that course
    if (courseId) {
      const { data: sessions } = await supabase
        .from('education_sessions')
        .select('id')
        .eq('course_id', courseId)

      if (sessions) {
        query = query.in('session_id', sessions.map(s => s.id))
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attendance: data || [] })
  } catch (err) {
    console.error('[Education] attendance GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
