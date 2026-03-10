import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Auto-flag patterns — checked on description text
const FLAG_PATTERNS = [
  { pattern: /\b(odio|hate|kill|matar|muerte|violencia)\b/i, severity: 'high' },
  { pattern: /\b(spam|bot|scam|estafa|hack)\b/i, severity: 'medium' },
]

/**
 * POST /api/education/sessions/[id]/moderation
 * Submit a moderation report from within a live session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const reporterId = auth.user.id

    const { id: sessionId } = await params

    const {
      reported_user_id = null,
      report_type = 'other',
      severity = 'low',
      description,
      evidence = null,
    } = await request.json()

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }

    const validTypes = ['user_behavior', 'message_content', 'technical', 'other']
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validTypes.includes(report_type) || !validSeverities.includes(severity)) {
      return NextResponse.json({ error: 'Invalid report_type or severity' }, { status: 400 })
    }

    // Verify session exists and get course_id
    const { data: session, error: sessErr } = await supabase
      .from('education_sessions')
      .select('id, course_id')
      .eq('id', sessionId)
      .single()

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: report, error: insertErr } = await (supabase as any)
      .from('education_moderation_reports')
      .insert({
        session_id: sessionId,
        course_id: session.course_id,
        reporter_id: reporterId,
        reported_user_id,
        report_type,
        severity,
        description: description.trim(),
        evidence,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[Moderation] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    // Auto-flag based on description patterns
    for (const { pattern, severity: flagSeverity } of FLAG_PATTERNS) {
      if (pattern.test(description)) {
        await (supabase as any)
          .from('education_moderation_flags')
          .insert({
            session_id: sessionId,
            course_id: session.course_id,
            source_type: 'chat',
            source_id: report.id,
            flagged_text: description.trim().substring(0, 500),
            trigger_pattern: pattern.source,
            severity: flagSeverity,
            auto_generated: true,
          })
          .then(() => {}) // fire-and-forget
        break
      }
    }

    return NextResponse.json({ success: true, report_id: report.id }, { status: 201 })
  } catch (err) {
    console.error('[Moderation] report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/education/sessions/[id]/moderation
 * Get reports filed by the current user for this session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { id: sessionId } = await params

    const { data, error } = await (supabase as any)
      .from('education_moderation_reports')
      .select('id, report_type, severity, status, description, created_at')
      .eq('session_id', sessionId)
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reports: data || [] })
  } catch (err) {
    console.error('[Moderation] get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
