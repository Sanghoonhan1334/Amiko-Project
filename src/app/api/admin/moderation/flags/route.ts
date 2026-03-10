import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * GET /api/admin/moderation/flags — List all auto-detected flags
 *
 * Query params:
 *   status     — filter by status (active, reviewed, false_positive, confirmed)
 *   severity   — filter by severity
 *   session_id — filter by session
 *   page / limit
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const sessionId = searchParams.get('session_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit

  let query = supabaseServer
    .from('amiko_meet_moderation_flags')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)
  if (sessionId) query = query.eq('session_id', sessionId)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    flags: data || [],
    total: count || 0,
    page,
    limit,
  })
}

/**
 * PATCH /api/admin/moderation/flags — Update flag status
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { id, status, review_notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    const validStatuses = ['active', 'reviewed', 'false_positive', 'confirmed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (status) updates.status = status
    if (review_notes !== undefined) updates.review_notes = review_notes
    if (status && status !== 'active') {
      updates.reviewed_by = auth.user.id
      updates.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await (supabaseServer
      .from('amiko_meet_moderation_flags') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, flag: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
