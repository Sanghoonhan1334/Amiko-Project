import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * GET /api/admin/moderation/stats — Moderation overview dashboard
 *
 * Returns aggregated stats for the admin panel:
 *  - report counts by status/severity
 *  - flag counts by status/severity
 *  - repeat offenders
 *  - affected sessions
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authenticated) return auth.response

  if (!supabaseServer) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    // Fetch all reports
    const { data: reports } = await supabaseServer
      .from('amiko_meet_moderation_reports')
      .select('id, status, severity, reported_user_id, reported_user_name, session_id, created_at')

    // Fetch all flags
    const { data: flags } = await supabaseServer
      .from('amiko_meet_moderation_flags')
      .select('id, status, severity, flagged_user_id, flagged_user_name, session_id, created_at')

    const reportList = (reports || []) as any[]
    const flagList = (flags || []) as any[]

    // Report stats
    const reportStats = {
      total: reportList.length,
      pending: reportList.filter(r => r.status === 'pending').length,
      reviewing: reportList.filter(r => r.status === 'reviewing').length,
      resolved: reportList.filter(r => r.status === 'resolved').length,
      dismissed: reportList.filter(r => r.status === 'dismissed').length,
      high_risk: reportList.filter(r => r.severity === 'high_risk').length,
      warning: reportList.filter(r => r.severity === 'warning').length,
      informative: reportList.filter(r => r.severity === 'informative').length,
    }

    // Flag stats
    const flagStats = {
      total: flagList.length,
      active: flagList.filter(f => f.status === 'active').length,
      reviewed: flagList.filter(f => f.status === 'reviewed').length,
      false_positive: flagList.filter(f => f.status === 'false_positive').length,
      confirmed: flagList.filter(f => f.status === 'confirmed').length,
      high_risk: flagList.filter(f => f.severity === 'high_risk').length,
      warning: flagList.filter(f => f.severity === 'warning').length,
      informative: flagList.filter(f => f.severity === 'informative').length,
    }

    // Repeat offenders (users with 2+ reports)
    const userReportCounts = new Map<string, { name: string; reports: number; flags: number }>()
    for (const r of reportList) {
      if (!r.reported_user_id) continue
      const existing = userReportCounts.get(r.reported_user_id) || { name: r.reported_user_name || 'Unknown', reports: 0, flags: 0 }
      existing.reports++
      userReportCounts.set(r.reported_user_id, existing)
    }
    for (const f of flagList) {
      if (!f.flagged_user_id) continue
      const existing = userReportCounts.get(f.flagged_user_id) || { name: f.flagged_user_name || 'Unknown', reports: 0, flags: 0 }
      existing.flags++
      userReportCounts.set(f.flagged_user_id, existing)
    }

    const repeatOffenders = Array.from(userReportCounts.entries())
      .filter(([, v]) => v.reports + v.flags >= 2)
      .map(([userId, v]) => ({
        user_id: userId,
        user_name: v.name,
        report_count: v.reports,
        flag_count: v.flags,
        total: v.reports + v.flags,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)

    // Affected sessions
    const sessionIds = new Set<string>()
    reportList.forEach(r => sessionIds.add(r.session_id))
    flagList.forEach(f => sessionIds.add(f.session_id))

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentReports = reportList.filter(r => r.created_at > sevenDaysAgo).length
    const recentFlags = flagList.filter(f => f.created_at > sevenDaysAgo).length

    return NextResponse.json({
      success: true,
      stats: {
        reports: reportStats,
        flags: flagStats,
        repeat_offenders: repeatOffenders,
        affected_sessions: sessionIds.size,
        recent: {
          reports_7d: recentReports,
          flags_7d: recentFlags,
        },
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
