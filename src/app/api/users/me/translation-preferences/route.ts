import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET  /api/users/me/translation-preferences — Read preferences
// PATCH /api/users/me/translation-preferences — Update preferences

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
      .from('amiko_meet_translation_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Return defaults if none saved
    return NextResponse.json({
      preferences: prefs || {
        display_mode: 'original_and_translated',
        target_language: 'es',
        auto_translate: true,
      },
    })
  } catch (err: any) {
    console.error('[Translation Prefs GET]', err)
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
    if (body.display_mode !== undefined &&
        ['none', 'translated_only', 'original_and_translated'].includes(body.display_mode)) {
      updates.display_mode = body.display_mode
    }
    if (body.target_language !== undefined && ['ko', 'es'].includes(body.target_language)) {
      updates.target_language = body.target_language
    }
    if (typeof body.auto_translate === 'boolean') {
      updates.auto_translate = body.auto_translate
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Atomic upsert
    const { data: prefs, error: upsertErr } = await (supabaseServer as any)
      .from('amiko_meet_translation_preferences')
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (upsertErr) {
      console.error('[Translation Prefs Upsert]', upsertErr)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (err: any) {
    console.error('[Translation Prefs PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
