import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * PATCH /api/admin/education/moderation/reports/[id]
 * Review or action a moderation report.
 * Body: { status, admin_notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await params
  const { status, admin_notes } = await request.json()

  const validStatuses = ['pending', 'reviewing', 'actioned', 'dismissed']
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid or missing status' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = { status }
  if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes
  if (status === 'actioned' || status === 'dismissed') {
    updatePayload.actioned_by = auth.user.id
    updatePayload.actioned_at = new Date().toISOString()
  }

  const { data, error } = await (supabaseServer as any)
    .from('education_moderation_reports')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, report: data })
}

/**
 * GET /api/admin/education/moderation/reports/[id]
 * Get full details of a single report.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await params

  const { data, error } = await (supabaseServer as any)
    .from('education_moderation_reports')
    .select(`
      *,
      session:education_sessions(id, scheduled_at),
      course:education_courses(id, title)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
  }

  // Also fetch auto-flags for this session
  const { data: flags } = await (supabaseServer as any)
    .from('education_moderation_flags')
    .select('*')
    .eq('session_id', data.session_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ success: true, report: data, session_flags: flags || [] })
}
