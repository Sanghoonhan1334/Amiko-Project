import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PATCH /api/education/caption-preferences
 *
 * Update the authenticated user's education caption display preferences.
 * Creates the record if it doesn't exist (upsert).
 *
 * Body (all optional):
 *   captions_enabled: boolean
 *   font_size: 'small' | 'medium' | 'large'
 *   position: 'top' | 'bottom'
 *   background_opacity: number (0..1)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const body = await request.json()

    // Whitelist + validate
    const update: Record<string, unknown> = {}

    if (typeof body.captions_enabled === 'boolean') {
      update.captions_enabled = body.captions_enabled
    }

    if (body.font_size && ['small', 'medium', 'large'].includes(body.font_size)) {
      update.font_size = body.font_size
    }

    if (body.position && ['top', 'bottom'].includes(body.position)) {
      update.position = body.position
    }

    if (typeof body.background_opacity === 'number') {
      const opacity = Math.max(0, Math.min(1, body.background_opacity))
      update.background_opacity = opacity
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Accepted: captions_enabled, font_size, position, background_opacity' },
        { status: 400 }
      )
    }

    // Upsert: create if not exists, update if exists
    const { data, error } = await supabase
      .from('user_caption_preferences')
      .upsert(
        { user_id: userId, ...update },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('[Education Caption Prefs] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (err) {
    console.error('[Education Caption Prefs] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/education/caption-preferences
 *
 * Returns the authenticated user's education caption preferences.
 * Returns defaults if no record exists.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { data, error } = await supabase
      .from('user_caption_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({
        preferences: {
          user_id: userId,
          captions_enabled: true,
          font_size: 'medium',
          position: 'bottom',
          background_opacity: 0.7,
        },
      })
    }

    return NextResponse.json({ preferences: data })
  } catch (err) {
    console.error('[Education Caption Prefs] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
