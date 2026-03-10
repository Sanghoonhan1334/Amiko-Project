import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { invalidateGlossaryCache } from '@/lib/meet-glossary'

/**
 * PATCH  /api/admin/glossaries/[id] — Update a glossary entry
 * DELETE /api/admin/glossaries/[id] — Delete a glossary entry
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const allowedFields = [
      'source_term', 'source_language', 'rule', 'target_value',
      'target_language', 'category', 'context_hint', 'priority', 'is_active',
    ]

    const updates: Record<string, any> = { updated_by: auth.user.id }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Validate rule if provided
    if (updates.rule) {
      const validRules = ['translate', 'no_translate', 'preserve', 'transliterate', 'annotate']
      if (!validRules.includes(updates.rule)) {
        return NextResponse.json(
          { success: false, error: `Invalid rule. Must be one of: ${validRules.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (updates.source_language && !['ko', 'es'].includes(updates.source_language)) {
      return NextResponse.json(
        { success: false, error: 'source_language must be "ko" or "es"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('amiko_meet_cultural_glossaries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Glossary entry not found' }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    invalidateGlossaryCache()

    return NextResponse.json({ success: true, glossary: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await context.params

  const { error } = await supabaseServer
    .from('amiko_meet_cultural_glossaries')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  invalidateGlossaryCache()

  return NextResponse.json({ success: true, deleted: id })
}
