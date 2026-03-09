import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/sessions/[id]/presence/leave
// Registra la salida de un participante de la sesión y calcula asistencia
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

    // Obtener sesión con duración y hora de inicio
    const { data: session, error } = await supabase
      .from('education_sessions')
      .select('id, status, scheduled_at, duration_minutes, started_at, course_id')
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const now = new Date()
    const leftAt = now.toISOString()

    // Obtener el registro de asistencia actual
    const { data: attendance } = await supabase
      .from('education_attendance')
      .select('id, joined_at, status')
      .eq('session_id', id)
      .eq('student_id', user_id)
      .single()

    if (!attendance || !attendance.joined_at) {
      // Puede ser el instructor — no registramos asistencia del instructor
      return NextResponse.json({ success: true, message: 'No attendance record found' })
    }

    // Calcular tiempo total conectado
    const joinedAt = new Date(attendance.joined_at)
    const totalSecondsConnected = Math.max(
      0,
      Math.floor((now.getTime() - joinedAt.getTime()) / 1000)
    )

    // Calcular estado de asistencia con umbrales
    const scheduledAt = new Date(session.scheduled_at)
    const durationSeconds = (session.duration_minutes || 60) * 60
    const joinDelaySeconds = Math.max(
      0,
      Math.floor((joinedAt.getTime() - scheduledAt.getTime()) / 1000)
    )
    const pctAttended = (totalSecondsConnected / durationSeconds) * 100
    const pctLate = (joinDelaySeconds / durationSeconds) * 100

    let attendanceStatus = 'attended'
    if (pctAttended < 20) {
      attendanceStatus = 'absent'
    } else if (pctLate > 15 && pctAttended < 75) {
      attendanceStatus = 'late'
    } else if (pctLate > 15) {
      attendanceStatus = 'late'
    } else if (pctAttended < 80) {
      attendanceStatus = 'left_early'
    }

    // Actualizar registro
    const { data: updated, error: updateError } = await supabase
      .from('education_attendance')
      .update({
        left_at: leftAt,
        total_seconds_connected: totalSecondsConnected,
        status: attendanceStatus
      })
      .eq('session_id', id)
      .eq('student_id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education] presence leave update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      left_at: leftAt,
      total_seconds_connected: totalSecondsConnected,
      attendance_status: attendanceStatus,
      pct_attended: Math.round(pctAttended)
    })
  } catch (err) {
    console.error('[Education] presence/leave error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
