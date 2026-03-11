import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/video/moderation/reports
 * List mentor videocall moderation reports with filters.
 *
 * Query params:
 *   status     — pending|reviewing|resolved|dismissed
 *   severity   — informative|warning|high_risk
 *   session_id — filter by specific session
 *   limit      — max results (default 50, max 200)
 *   offset     — pagination offset
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const sessionId = searchParams.get("session_id");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Number(searchParams.get("offset")) || 0;

  const admin = createAdminClient();

  let query = admin
    .from("vc_moderation_reports")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);
  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error, count } = await query;

  if (error) {
    console.error("[ADMIN_MOD_REPORTS] Query error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }

  // Also fetch summary stats
  const [pending, reviewing, highRisk] = await Promise.all([
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("status", "reviewing"),
    admin.from("vc_moderation_reports").select("id", { count: "exact", head: true }).eq("severity", "high_risk").in("status", ["pending", "reviewing"]),
  ]);

  return NextResponse.json({
    reports: data || [],
    total: count || 0,
    stats: {
      pending: pending.count || 0,
      reviewing: reviewing.count || 0,
      high_risk_active: highRisk.count || 0,
    },
  });
}

/**
 * PATCH /api/admin/video/moderation/reports
 * Update a report's status, action, or resolution notes.
 *
 * Body: { id, status?, action_taken?, resolution_notes? }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) return auth.response;

  const body = await request.json();
  const { id, status, action_taken, resolution_notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Report ID required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const update: Record<string, any> = {};

  if (status) update.status = status;
  if (action_taken) update.action_taken = action_taken;
  if (resolution_notes !== undefined) update.resolution_notes = resolution_notes;

  // Set resolved metadata
  if (status === "resolved" || status === "dismissed") {
    update.resolved_by = auth.user.id;
    update.resolved_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("vc_moderation_reports")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[ADMIN_MOD_REPORTS] Update error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
