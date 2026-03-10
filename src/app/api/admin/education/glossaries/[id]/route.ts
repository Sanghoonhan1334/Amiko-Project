import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { invalidateEducationGlossaryCache } from '@/lib/education-glossary'

/**
 * PATCH  /api/admin/education/glossaries/[id] — Update a glossary entry
 * DELETE /api/admin/education/glossaries/[id] — Delete (or soft-delete) an entry
 */

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const allowed = [
      'term', 'source_language', 'target_language', 'action',
      'preferred_translation', 'category', 'context', 'context_hint',
      'priority', 'is_active',
    ]

    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    // Validate action if provided
    if (update.action) {
      const validActions = ['translate', 'preserve', 'no_translate', 'annotate', 'transliterate']
      if (!validActions.includes(update.action as string)) {
        return NextResponse.json(
          { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await (supabaseServer as any)
      .from('cultural_glossaries')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Glossary entry not found' }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    invalidateEducationGlossaryCache()

    return NextResponse.json({ success: true, glossary: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request body'
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await params

  // Support soft-delete via ?hard=true query param
  const { searchParams } = new URL(request.url)
  const hardDelete = searchParams.get('hard') === 'true'

  if (hardDelete) {
    const { error } = await (supabaseServer as any)
      .from('cultural_glossaries')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  } else {
    // Soft-delete: mark inactive
    const { error } = await (supabaseServer as any)
      .from('cultural_glossaries')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }

  invalidateEducationGlossaryCache()

  return NextResponse.json({ success: true, deleted: id, hard: hardDelete })
}
