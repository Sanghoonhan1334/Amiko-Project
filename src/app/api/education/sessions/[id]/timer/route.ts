import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/sessions/[id]/timer
// Devuelve el estado de tiempo de la sesión: cuánto falta, cuándo termina, etc.
// El backend controla el tiempo — el frontend solo consulta.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error

    const { data: session, error } = await supabase
      .from('education_sessions')
      .select('id, status, scheduled_at, duration_minutes, started_at, ended_at')
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const now = new Date()
    const durationMs = (session.duration_minutes || 60) * 60 * 1000

    // Determinar momento de inicio real para calcular el timer
    const startedAt = session.started_at
      ? new Date(session.started_at)
      : new Date(session.scheduled_at)

    const endsAt = new Date(startedAt.getTime() + durationMs)
    const remainingMs = Math.max(0, endsAt.getTime() - now.getTime())
    const remainingSeconds = Math.floor(remainingMs / 1000)
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

    // Avisos de cierre
    const closing5min = remainingSeconds <= 5 * 60 && remainingSeconds > 0
    const closing10min = remainingSeconds <= 10 * 60 && remainingSeconds > 0
    const closing1min = remainingSeconds <= 60 && remainingSeconds > 0

    // Report whether session time has expired
    // Note: actual session status transitions (live → ending → completed) should
    // be performed via POST /sessions/[id]/end or a cron job — NOT as a
    // side-effect of a GET request, which causes race conditions when multiple
    // clients poll simultaneously.
    const sessionEnded = session.status === 'live' && remainingSeconds === 0

    return NextResponse.json({
      session_id: id,
      status: session.status,
      started_at: session.started_at || null,
      scheduled_at: session.scheduled_at,
      ends_at: endsAt.toISOString(),
      duration_minutes: session.duration_minutes || 60,
      remaining_seconds: remainingSeconds,
      elapsed_seconds: Math.max(0, elapsedSeconds),
      progress_percent: Math.min(100, Math.round((elapsedSeconds / ((session.duration_minutes || 60) * 60)) * 100)),
      warnings: {
        closing_10min: closing10min,
        closing_5min: closing5min,
        closing_1min: closing1min,
        ended: remainingSeconds === 0,
        should_end_session: sessionEnded
      }
    })
  } catch (err) {
    console.error('[Education] timer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
