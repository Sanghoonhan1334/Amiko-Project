import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<{ content: string; prompt_tokens: number; completion_tokens: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const txt = await response.text()
    throw new Error(`DeepSeek error ${response.status}: ${txt}`)
  }

  const json = await response.json()
  return {
    content: json.choices?.[0]?.message?.content || '',
    prompt_tokens: json.usage?.prompt_tokens || 0,
    completion_tokens: json.usage?.completion_tokens || 0,
  }
}

/**
 * GET /api/education/sessions/[id]/summary
 * Returns the stored summary for this session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error

    const { id: sessionId } = await params

    const { data, error } = await (supabase as any)
      .from('session_summaries')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ summary: data || null })
  } catch (err) {
    console.error('[Summary] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/education/sessions/[id]/summary
 * Generate (or regenerate) a session summary using DeepSeek.
 * Instructor or admin only.
 * Optionally: ?regenerate=true to overwrite an existing summary.
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
    const regenerate = new URL(request.url).searchParams.get('regenerate') === 'true'

    // Verify session + instructor/admin access
    const { data: session, error: sessErr } = await supabase
      .from('education_sessions')
      .select('id, course_id, status, course:education_courses(instructor:instructor_profiles(user_id))')
      .eq('id', sessionId)
      .single()

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const instructorUserId = (
      (session.course as { instructor?: { user_id?: string } } | null)?.instructor
    )?.user_id
    const admin = await isAdminUser(userId)
    if (instructorUserId !== userId && !admin) {
      return NextResponse.json({ error: 'Only the instructor can generate a summary' }, { status: 403 })
    }

    // Check if summary already exists
    const { data: existing } = await (supabase as any)
      .from('session_summaries')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existing && !regenerate) {
      return NextResponse.json({ error: 'Summary already exists. Use ?regenerate=true to overwrite.' }, { status: 409 })
    }

    // Fetch final captions
    const { data: captions, error: capErr } = await supabase
      .from('education_caption_events')
      .select('speaker_uid, text_content, sequence_number')
      .eq('session_id', sessionId)
      .eq('is_partial', false)
      .order('sequence_number', { ascending: true })
      .limit(500)

    if (capErr) {
      return NextResponse.json({ error: 'Failed to fetch captions' }, { status: 500 })
    }

    if (!captions || captions.length === 0) {
      return NextResponse.json({ error: 'No captions available for this session' }, { status: 422 })
    }

    const transcript = captions
      .map(c => `[${c.speaker_uid}]: ${c.text_content}`)
      .join('\n')

    const systemPrompt = `You are an educational assistant specializing in Korean-Spanish language learning.
Given a session transcript, produce a structured JSON summary.
Return ONLY valid JSON — no markdown, no extra text.`

    const userPrompt = `Transcript of the education session:
"""
${transcript.substring(0, 8000)}
"""

Return a JSON object with exactly these keys:
- "summary": a 3–5 sentence summary of the class in Spanish
- "key_topics": an array of 3–8 topic strings (in Spanish)
- "duration_minutes": estimated duration in minutes (integer, estimate from sequence count)
`

    const result = await callDeepSeek(systemPrompt, userPrompt)

    let parsed: { summary?: string; key_topics?: string[]; duration_minutes?: number } = {}
    try {
      parsed = JSON.parse(result.content)
    } catch {
      // If JSON parse fails, use raw content as summary
      parsed = { summary: result.content, key_topics: [], duration_minutes: null as unknown as number }
    }

    const summaryData = {
      session_id: sessionId,
      course_id: (session as any).course_id,
      summary_text: parsed.summary || result.content,
      key_topics: parsed.key_topics || [],
      duration_minutes: parsed.duration_minutes || null,
      source_caption_count: captions.length,
      provider: 'deepseek',
      model: 'deepseek-chat',
      prompt_tokens: result.prompt_tokens,
      completion_tokens: result.completion_tokens,
      generated_at: new Date().toISOString(),
    }

    let data: unknown
    if (existing) {
      const { data: updated, error: updErr } = await (supabase as any)
        .from('session_summaries')
        .update(summaryData)
        .eq('session_id', sessionId)
        .select()
        .single()
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      data = updated
    } else {
      const { data: inserted, error: insErr } = await (supabase as any)
        .from('session_summaries')
        .insert(summaryData)
        .select()
        .single()
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      data = inserted
    }

    return NextResponse.json({ success: true, summary: data })
  } catch (err) {
    console.error('[Summary] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
