import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * GET /api/admin/education/moderation/reports
 *
 * Query params: status, severity, session_id, page, limit
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
  const reportType = searchParams.get('report_type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit

  let query = (supabaseServer as any)
    .from('education_moderation_reports')
    .select(`
      *,
      session:education_sessions(id, scheduled_at),
      course:education_courses(id, title)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)
  if (sessionId) query = query.eq('session_id', sessionId)
  if (reportType) query = query.eq('report_type', reportType)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Quick stats
  const { data: allStats } = await (supabaseServer as any)
    .from('education_moderation_reports')
    .select('status, severity')

  const stats = {
    total: (allStats || []).length,
    pending: (allStats || []).filter((r: any) => r.status === 'pending').length,
    reviewing: (allStats || []).filter((r: any) => r.status === 'reviewing').length,
    actioned: (allStats || []).filter((r: any) => r.status === 'actioned').length,
    dismissed: (allStats || []).filter((r: any) => r.status === 'dismissed').length,
    critical: (allStats || []).filter((r: any) => r.severity === 'critical').length,
    high: (allStats || []).filter((r: any) => r.severity === 'high').length,
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
