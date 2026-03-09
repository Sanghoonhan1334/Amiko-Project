import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { translateCaptionEvent, type CaptionForTranslation } from '@/lib/meet-translation'

// POST /api/meet/sessions/[id]/translations/translate
// Manually triggers translation of a specific caption event.
// Also called internally (fire-and-forget) from the caption event endpoint.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await context.params
    const body = await request.json()
    const { caption_event_id } = body

    if (!caption_event_id) {
      return NextResponse.json({ error: 'caption_event_id is required' }, { status: 400 })
    }

    // Verify participant
    const { data: participant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['enrolled', 'joined'])
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Fetch the caption event
    const { data: caption, error: captionErr } = await (supabaseServer as any)
      .from('amiko_meet_caption_events')
      .select('id, session_id, speaker_user_id, speaker_name, content, language, is_final, sequence_number')
      .eq('id', caption_event_id)
      .eq('session_id', sessionId)
      .single()

    if (captionErr || !caption) {
      return NextResponse.json({ error: 'Caption event not found' }, { status: 404 })
    }

    // Translate
    const result = await translateCaptionEvent(caption as CaptionForTranslation)

    return NextResponse.json({
      translation: {
        caption_event_id: result.caption_event_id,
        original_content: result.original_content,
        original_language: result.original_language,
        translated_content: result.translated_content,
        translated_language: result.translated_language,
        provider: result.provider,
        translation_ms: result.translation_ms,
        success: result.success,
      },
    })
  } catch (err: any) {
    console.error('[Translate]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
