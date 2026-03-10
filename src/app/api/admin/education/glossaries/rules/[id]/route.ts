import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { invalidateEducationGlossaryCache } from '@/lib/education-glossary'

/**
 * PATCH  /api/admin/education/glossaries/rules/[id]
 * DELETE /api/admin/education/glossaries/rules/[id]
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
      'name', 'description', 'pattern', 'replacement', 'phase',
      'source_language', 'target_language', 'context', 'flags', 'priority', 'is_active',
    ]

    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    // Re-validate regex if pattern changed
    if (update.pattern) {
      try { new RegExp(update.pattern as string, (update.flags as string) || 'gi') } catch {
        return NextResponse.json(
          { success: false, error: `Invalid regex pattern: ${update.pattern}` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await (supabaseServer as any)
      .from('translation_rules')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    invalidateEducationGlossaryCache()

    return NextResponse.json({ success: true, rule: data })
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
  const { searchParams } = new URL(request.url)
  const hardDelete = searchParams.get('hard') === 'true'

  if (hardDelete) {
    const { error } = await supabaseServer.from('translation_rules').delete().eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } else {
    const { error } = await (supabaseServer as any).from('translation_rules').update({ is_active: false }).eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  invalidateEducationGlossaryCache()

  return NextResponse.json({ success: true, deleted: id, hard: hardDelete })
}
