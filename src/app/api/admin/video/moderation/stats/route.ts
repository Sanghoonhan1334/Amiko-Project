import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/video/moderation/stats
 * Aggregated moderation stats for the mentor videocall admin dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) return auth.response;

  const admin = createAdminClient();

  const [
    pendingReports,
    reviewingReports,
    resolvedReports,
    highRiskReports,
    activeFlags,
    highRiskFlags,
    confirmedFlags,
  ] = await Promise.all([
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("severity", "high_risk").in("status", ["pending", "reviewing"]),
    admin.from("vc_moderation_flags").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("vc_moderation_flags").select("id", { count: "exact", head: true }).eq("severity", "high_risk").eq("status", "active"),
    admin.from("vc_moderation_flags").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);

  // Repeat offenders: users with 2+ reports (reported)
  const { data: topReported } = await admin
    .from("vc_moderation_reports")
    .select("reported_user_id")
    .not("reported_user_id", "is", null)
    .in("status", ["pending", "reviewing", "resolved"]);

  const reportCounts = new Map<string, number>();
  for (const r of topReported || []) {
    if (r.reported_user_id) {
      reportCounts.set(r.reported_user_id, (reportCounts.get(r.reported_user_id) || 0) + 1);
    }
  }
  const repeatOffenders = Array.from(reportCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ user_id: userId, report_count: count }));

  return NextResponse.json({
    reports: {
      pending: pendingReports.count || 0,
      reviewing: reviewingReports.count || 0,
      resolved: resolvedReports.count || 0,
      high_risk_active: highRiskReports.count || 0,
    },
    flags: {
      active: activeFlags.count || 0,
      high_risk_active: highRiskFlags.count || 0,
      confirmed: confirmedFlags.count || 0,
    },
    repeat_offenders: repeatOffenders,
  });
}
