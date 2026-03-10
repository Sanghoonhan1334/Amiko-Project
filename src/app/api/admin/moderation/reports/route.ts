import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * GET /api/admin/moderation/reports — List all moderation reports
 *
 * Query params:
 *   status    — filter by status (pending, reviewing, resolved, dismissed)
 *   severity  — filter by severity (informative, warning, high_risk)
 *   page      — pagination page (default: 1)
 *   limit     — items per page (default: 20, max: 100)
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
    .from('amiko_meet_moderation_reports')
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

  // Also get stats
  const { data: statsData } = await supabaseServer
    .from('amiko_meet_moderation_reports')
    .select('status, severity')

  const stats = {
    total: (statsData || []).length,
    pending: (statsData || []).filter((r: any) => r.status === 'pending').length,
    reviewing: (statsData || []).filter((r: any) => r.status === 'reviewing').length,
    resolved: (statsData || []).filter((r: any) => r.status === 'resolved').length,
    dismissed: (statsData || []).filter((r: any) => r.status === 'dismissed').length,
    high_risk: (statsData || []).filter((r: any) => r.severity === 'high_risk').length,
  }

  return NextResponse.json({
    success: true,
    reports: data || [],
    total: count || 0,
    page,
    limit,
    stats,
  })
}

/**
 * PATCH /api/admin/moderation/reports — Update report status (body: { id, status, action_taken, resolution_notes })
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { id, status, action_taken, resolution_notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (status) {
      const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }
      updates.status = status
    }
    if (action_taken !== undefined) updates.action_taken = action_taken
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes

    if (status === 'resolved' || status === 'dismissed') {
      updates.resolved_by = auth.user.id
      updates.resolved_at = new Date().toISOString()
    }

    const { data, error } = await (supabaseServer
      .from('amiko_meet_moderation_reports') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, report: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
