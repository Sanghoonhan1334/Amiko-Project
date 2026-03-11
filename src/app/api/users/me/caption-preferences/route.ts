import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// GET  /api/users/me/caption-preferences — Read preferences
// PATCH /api/users/me/caption-preferences — Update preferences
// Supports both amiko_meet and vc (marketplace) caption preferences via ?module= query param
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()

    let user = (await supabase.auth.getUser()).data.user
    if (!user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7))
        user = data.user
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const module = url.searchParams.get('module') || 'vc'
    const table = module === 'meet' ? 'amiko_meet_caption_preferences' : 'vc_caption_preferences'

    const { data: prefs } = await supabase
      .from(table)
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
    const supabase = await createSupabaseClient()

    let user = (await supabase.auth.getUser()).data.user
    if (!user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7))
        user = data.user
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const module = body.module || 'vc'
    const table = module === 'meet' ? 'amiko_meet_caption_preferences' : 'vc_caption_preferences'

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
    if (body.speaking_language && ['ko', 'es', 'en'].includes(body.speaking_language)) {
      updates.speaking_language = body.speaking_language
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Atomic upsert — avoids TOCTOU race condition
    const { data: prefs, error: upsertErr } = await supabase
      .from(table)
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
