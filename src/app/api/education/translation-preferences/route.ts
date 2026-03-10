import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/education/translation-preferences
 *
 * Returns the authenticated user's education translation preferences.
 * Returns sensible defaults if no record exists yet.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { data, error } = await supabase
      .from('education_translation_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Return defaults — do not 404
      return NextResponse.json({
        preferences: {
          user_id: userId,
          display_mode: 'original_and_translated',
          target_language: 'es',
          auto_translate: true,
        },
      })
    }

    return NextResponse.json({ preferences: data })
  } catch (err) {
    console.error('[Education Translation Prefs] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/education/translation-preferences
 *
 * Update (or create) the authenticated user's education translation preferences.
 *
 * Body (all optional):
 *   display_mode:     'none' | 'translated_only' | 'original_and_translated'
 *   target_language:  'ko' | 'es' | 'en'
 *   auto_translate:   boolean
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const body = await request.json()
    const update: Record<string, unknown> = {}

    if (
      body.display_mode !== undefined &&
      ['none', 'translated_only', 'original_and_translated'].includes(body.display_mode)
    ) {
      update.display_mode = body.display_mode
    }

    if (
      body.target_language !== undefined &&
      ['ko', 'es', 'en'].includes(body.target_language)
    ) {
      update.target_language = body.target_language
    }

    if (typeof body.auto_translate === 'boolean') {
      update.auto_translate = body.auto_translate
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid fields to update. Accepted: display_mode, target_language, auto_translate',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('education_translation_preferences')
      .upsert({ user_id: userId, ...update }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[Education Translation Prefs] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (err) {
    console.error('[Education Translation Prefs] PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
