import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_TYPES = ['recording', 'transcript', 'translation'] as const
type ConsentType = typeof VALID_TYPES[number]

/**
 * POST /api/education/sessions/[id]/consents
 * Record the authenticated user's consent for a session.
 *
 * Body: { consents: { recording?: boolean, transcript?: boolean, translation?: boolean } }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { id: sessionId } = await params
    const body = await request.json()
    const consents: Partial<Record<ConsentType, boolean>> = body.consents || {}

    // Verify session exists
    const { data: session, error: sessErr } = await supabase
      .from('education_sessions')
      .select('id')
      .eq('id', sessionId)
      .single()

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || null
    const userAgent = request.headers.get('user-agent') || null

    const rows = VALID_TYPES
      .filter(t => t in consents)
      .map(t => ({
        session_id: sessionId,
        user_id: userId,
        consent_type: t,
        granted: Boolean(consents[t]),
        granted_at: consents[t] ? new Date().toISOString() : null,
        ip_address: ip,
        user_agent: userAgent,
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No consent types provided' }, { status: 400 })
    }

    const { error: upsertErr } = await (supabase as any)
      .from('session_consents')
      .upsert(rows, { onConflict: 'session_id,user_id,consent_type' })

    if (upsertErr) {
      console.error('[Consents] upsert error:', upsertErr)
      return NextResponse.json({ error: 'Failed to save consents' }, { status: 500 })
    }

    return NextResponse.json({ success: true, saved: rows.map(r => r.consent_type) })
  } catch (err) {
    console.error('[Consents] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/education/sessions/[id]/consents
 * Get the current user's consents for a session.
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
      .from('session_consents')
      .select('consent_type, granted, granted_at')
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return as a map for convenience: { recording: true, transcript: false, ... }
    const consentMap: Record<ConsentType, boolean> = {
      recording: false,
      transcript: false,
      translation: false,
    }
    for (const row of (data || []) as { consent_type: ConsentType; granted: boolean }[]) {
      consentMap[row.consent_type] = row.granted
    }

    return NextResponse.json({ consents: consentMap, raw: data || [] })
  } catch (err) {
    console.error('[Consents] get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
