import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET  /api/users/me/caption-preferences — Read preferences
// PATCH /api/users/me/caption-preferences — Update preferences
export async function GET(request: NextRequest) {
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

    const { data: prefs } = await (supabaseServer as any)
      .from('amiko_meet_caption_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Return defaults if no preferences saved
    return NextResponse.json({
      preferences: prefs || {
        captions_enabled: true,
        font_size: 'medium',
        position: 'bottom',
        speaking_language: 'es',
      },
    })
  } catch (err: any) {
    console.error('[Caption Prefs GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const updates: Record<string, any> = {}

    // Validate and pick allowed fields
    if (typeof body.captions_enabled === 'boolean') {
      updates.captions_enabled = body.captions_enabled
    }
    if (body.font_size && ['small', 'medium', 'large'].includes(body.font_size)) {
      updates.font_size = body.font_size
    }
    if (body.position && ['top', 'bottom'].includes(body.position)) {
      updates.position = body.position
    }
    if (body.speaking_language && ['ko', 'es'].includes(body.speaking_language)) {
      updates.speaking_language = body.speaking_language
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Atomic upsert — avoids TOCTOU race condition
    const { data: prefs, error: upsertErr } = await (supabaseServer as any)
      .from('amiko_meet_caption_preferences')
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (upsertErr) {
      console.error('[Caption Prefs Upsert]', upsertErr)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (err: any) {
    console.error('[Caption Prefs PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
