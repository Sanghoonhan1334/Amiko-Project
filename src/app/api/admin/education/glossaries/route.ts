import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { invalidateEducationGlossaryCache } from '@/lib/education-glossary'

/**
 * GET  /api/admin/education/glossaries — List entries (context: education + general)
 * POST /api/admin/education/glossaries — Create a new entry
 */

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const category     = searchParams.get('category')
  const action       = searchParams.get('action')
  const language     = searchParams.get('language')
  const context      = searchParams.get('context')   // 'education' | 'general' | 'all'
  const search       = searchParams.get('search')
  const activeOnly   = searchParams.get('active_only') !== 'false'
  const page         = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit        = Math.min(200, parseInt(searchParams.get('limit') || '50'))
  const offset       = (page - 1) * limit

  let query = supabaseServer
    .from('cultural_glossaries')
    .select('*', { count: 'exact' })
    .order('priority', { ascending: false })
    .order('term',     { ascending: true  })
    .range(offset, offset + limit - 1)

  if (activeOnly) query = query.eq('is_active', true)

  // Default: show education + general; 'all' shows everything
  if (context === 'all') {
    // no filter
  } else if (context) {
    query = query.eq('context', context)
  } else {
    query = query.in('context', ['education', 'general'])
  }

  if (language)  query = query.eq('source_language', language)
  if (category)  query = query.eq('category', category)
  if (action)    query = query.eq('action', action)
  if (search)    query = query.ilike('term', `%${search}%`)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    glossaries: data || [],
    total: count || 0,
    page,
    limit,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      term,
      source_language,
      target_language,
      action,
      preferred_translation,
      category,
      context,
      context_hint,
      priority,
      is_active,
    } = body

    // Validation
    if (!term?.trim() || !source_language || !action) {
      return NextResponse.json(
        { success: false, error: 'term, source_language, and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['translate', 'preserve', 'no_translate', 'annotate', 'transliterate']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    const validLanguages = ['ko', 'es', 'en']
    if (!validLanguages.includes(source_language)) {
      return NextResponse.json(
        { success: false, error: 'source_language must be "ko", "es", or "en"' },
        { status: 400 }
      )
    }

    if (action !== 'no_translate' && !preferred_translation?.trim()) {
      return NextResponse.json(
        { success: false, error: `preferred_translation is required for action "${action}"` },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('cultural_glossaries')
      .insert({
        term: term.trim(),
        source_language,
        target_language: target_language || null,
        action,
        preferred_translation: preferred_translation?.trim() || null,
        category: category || 'general',
        context: context || 'education',
        context_hint: context_hint || null,
        priority: priority ?? 0,
        is_active: is_active ?? true,
        created_by: auth.user.id,
      } as any)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A glossary entry with this term already exists for this language/context' },
          { status: 409 }
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    invalidateEducationGlossaryCache()

    return NextResponse.json({ success: true, glossary: data }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request body'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}
