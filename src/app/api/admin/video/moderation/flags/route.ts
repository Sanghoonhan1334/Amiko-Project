import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/video/moderation/flags
 * List auto-detected content flags from mentor videocall sessions.
 *
 * Query params:
 *   status     — active|reviewed|false_positive|confirmed
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
    .from("vc_moderation_flags")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);
  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error, count } = await query;

  if (error) {
    console.error("[ADMIN_MOD_FLAGS] Query error:", error);
    return NextResponse.json({ error: "Failed to fetch flags" }, { status: 500 });
  }

  // Summary stats
  const [active, highRisk] = await Promise.all([
    admin.from("vc_moderation_flags").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("vc_moderation_flags").select("id", { count: "exact", head: true }).eq("severity", "high_risk").eq("status", "active"),
  ]);

  return NextResponse.json({
    flags: data || [],
    total: count || 0,
    stats: {
      active: active.count || 0,
      high_risk_active: highRisk.count || 0,
    },
  });
}

/**
 * PATCH /api/admin/video/moderation/flags
 * Update a flag's status or add review notes.
 *
 * Body: { id, status?, review_notes? }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) return auth.response;

  const body = await request.json();
  const { id, status, review_notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Flag ID required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const update: Record<string, any> = {};

  if (status) update.status = status;
  if (review_notes !== undefined) update.review_notes = review_notes;

  // Set reviewed metadata
  if (status === "reviewed" || status === "false_positive" || status === "confirmed") {
    update.reviewed_by = auth.user.id;
    update.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("vc_moderation_flags")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[ADMIN_MOD_FLAGS] Update error:", error);
    return NextResponse.json({ error: "Failed to update flag" }, { status: 500 });
  }

  return NextResponse.json({ flag: data });
}
