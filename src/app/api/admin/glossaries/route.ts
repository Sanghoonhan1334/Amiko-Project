import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { invalidateGlossaryCache } from '@/lib/meet-glossary'

/**
 * GET  /api/admin/glossaries — List all glossary entries
 * POST /api/admin/glossaries — Create a new entry
 */

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language')
  const category = searchParams.get('category')
  const rule = searchParams.get('rule')
  const search = searchParams.get('search')
  const activeOnly = searchParams.get('active_only') !== 'false'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = (page - 1) * limit

  let query = supabaseServer
    .from('amiko_meet_cultural_glossaries')
    .select('*', { count: 'exact' })
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (activeOnly) query = query.eq('is_active', true)
  if (language) query = query.eq('source_language', language)
  if (category) query = query.eq('category', category)
  if (rule) query = query.eq('rule', rule)
  if (search) query = query.ilike('source_term', `%${search}%`)

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
      source_term,
      source_language,
      rule,
      target_value,
      target_language,
      category,
      context_hint,
      priority,
      is_active,
    } = body

    // Validation
    if (!source_term || !source_language || !rule) {
      return NextResponse.json(
        { success: false, error: 'source_term, source_language, and rule are required' },
        { status: 400 }
      )
    }

    const validRules = ['translate', 'no_translate', 'preserve', 'transliterate', 'annotate']
    if (!validRules.includes(rule)) {
      return NextResponse.json(
        { success: false, error: `Invalid rule. Must be one of: ${validRules.join(', ')}` },
        { status: 400 }
      )
    }

    if (!['ko', 'es'].includes(source_language)) {
      return NextResponse.json(
        { success: false, error: 'source_language must be "ko" or "es"' },
        { status: 400 }
      )
    }

    if (rule !== 'no_translate' && !target_value) {
      return NextResponse.json(
        { success: false, error: `target_value is required for rule "${rule}"` },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('amiko_meet_cultural_glossaries')
      .insert({
        source_term: source_term.trim(),
        source_language,
        rule,
        target_value: target_value?.trim() || null,
        target_language: target_language || null,
        category: category || 'general',
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
          { success: false, error: 'A glossary entry with this term already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    invalidateGlossaryCache()

    return NextResponse.json({ success: true, glossary: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
