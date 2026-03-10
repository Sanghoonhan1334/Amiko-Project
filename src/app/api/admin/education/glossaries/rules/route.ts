import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { invalidateEducationGlossaryCache } from '@/lib/education-glossary'

/**
 * GET  /api/admin/education/glossaries/rules — List translation rules
 * POST /api/admin/education/glossaries/rules — Create a rule
 */

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active_only') !== 'false'
  const context    = searchParams.get('context')
  const phase      = searchParams.get('phase')

  let query = supabaseServer
    .from('translation_rules')
    .select('*', { count: 'exact' })
    .order('priority', { ascending: false })
    .order('name',     { ascending: true  })

  if (activeOnly) query = query.eq('is_active', true)
  if (context === 'all') { /* no filter */ }
  else if (context) query = query.eq('context', context)
  else query = query.in('context', ['education', 'general'])
  if (phase) query = query.eq('phase', phase)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, rules: data || [], total: count || 0 })
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
      name, description, pattern, replacement,
      phase, source_language, target_language,
      context, flags, priority, is_active,
    } = body

    if (!name?.trim() || !pattern?.trim() || !replacement) {
      return NextResponse.json(
        { success: false, error: 'name, pattern, and replacement are required' },
        { status: 400 }
      )
    }

    // Validate regex
    try { new RegExp(pattern, flags || 'gi') } catch {
      return NextResponse.json(
        { success: false, error: `Invalid regex pattern: ${pattern}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('translation_rules')
      .insert({
        name: name.trim(),
        description: description || null,
        pattern: pattern.trim(),
        replacement,
        phase: phase || 'pre',
        source_language: source_language || null,
        target_language: target_language || null,
        context: context || 'education',
        flags: flags || 'gi',
        priority: priority ?? 0,
        is_active: is_active ?? true,
        created_by: auth.user.id,
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    invalidateEducationGlossaryCache()

    return NextResponse.json({ success: true, rule: data }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request body'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}
