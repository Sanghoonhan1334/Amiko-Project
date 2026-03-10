import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

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
      temperature: 0.3,
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
 * GET /api/education/sessions/[id]/notes
 * Returns the stored educational notes for the authenticated user.
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
      .from('educational_notes')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ notes: data || null })
  } catch (err) {
    console.error('[Notes] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/education/sessions/[id]/notes
 * Generate personalized educational notes for the authenticated user.
 * Any authenticated participant can request this.
 * Use ?regenerate=true to overwrite existing notes.
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

    // Verify session
    const { data: session, error: sessErr } = await supabase
      .from('education_sessions')
      .select('id, course_id')
      .eq('id', sessionId)
      .single()

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if notes already exist
    const { data: existing } = await (supabase as any)
      .from('educational_notes')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing && !regenerate) {
      return NextResponse.json({ error: 'Notes already exist. Use ?regenerate=true to overwrite.' }, { status: 409 })
    }

    // Fetch final captions for this session
    const { data: captions, error: capErr } = await supabase
      .from('education_caption_events')
      .select('speaker_uid, text_content, sequence_number')
      .eq('session_id', sessionId)
      .eq('is_partial', false)
      .order('sequence_number', { ascending: true })
      .limit(300)

    if (capErr) {
      return NextResponse.json({ error: 'Failed to fetch captions' }, { status: 500 })
    }

    if (!captions || captions.length === 0) {
      return NextResponse.json({ error: 'No captions available for this session' }, { status: 422 })
    }

    const transcript = captions
      .map(c => `[${c.speaker_uid}]: ${c.text_content}`)
      .join('\n')

    const systemPrompt = `You are an expert language-learning assistant for Korean-Spanish education.
Given a session transcript between Korean and Spanish speakers, generate structured educational notes.
Return ONLY valid JSON — no markdown, no extra text.`

    const userPrompt = `Session transcript:
"""
${transcript.substring(0, 6000)}
"""

Generate educational notes for a student. Return a JSON object with exactly these keys:
- "vocabulary": array of objects { "term": string, "translation": string, "example": string }
  (10-20 vocabulary items from both Korean and Spanish)
- "phrases": array of objects { "original": string, "translation": string, "context": string }
  (8-15 useful phrases or expressions used in class)
- "concepts": array of objects { "title": string, "explanation": string }
  (3-8 cultural, grammatical, or thematic concepts discussed)

All explanations in Spanish. Keep examples natural and contextually relevant.`

    const result = await callDeepSeek(systemPrompt, userPrompt)

    interface ParsedNotes {
      vocabulary?: Array<{ term: string; translation: string; example: string }>
      phrases?: Array<{ original: string; translation: string; context: string }>
      concepts?: Array<{ title: string; explanation: string }>
    }

    let parsed: ParsedNotes = {}
    try {
      parsed = JSON.parse(result.content)
    } catch {
      parsed = { vocabulary: [], phrases: [], concepts: [] }
    }

    const notesData = {
      session_id: sessionId,
      course_id: (session as any).course_id,
      user_id: userId,
      vocabulary: parsed.vocabulary || [],
      phrases: parsed.phrases || [],
      concepts: parsed.concepts || [],
      provider: 'deepseek',
      model: 'deepseek-chat',
      generated_at: new Date().toISOString(),
    }

    let data: unknown
    if (existing) {
      const { data: updated, error: updErr } = await (supabase as any)
        .from('educational_notes')
        .update(notesData)
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .select()
        .single()
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
      data = updated
    } else {
      const { data: inserted, error: insErr } = await (supabase as any)
        .from('educational_notes')
        .insert(notesData)
        .select()
        .single()
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      data = inserted
    }

    return NextResponse.json({ success: true, notes: data })
  } catch (err) {
    console.error('[Notes] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
