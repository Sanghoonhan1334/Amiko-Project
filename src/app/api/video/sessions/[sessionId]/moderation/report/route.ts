import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_REASONS = [
  "harassment",
  "insults",
  "spam",
  "offensive_content",
  "inappropriate_behavior",
  "other",
] as const;

/**
 * POST /api/video/sessions/[sessionId]/moderation/report
 * Submit a moderation report during a mentor videocall session.
 * Auth: requires user JWT.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // ── Auth ──
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reason, description, reported_user_id, evidence_caption_ids } = body;

    // ── Validate ──
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason", valid_reasons: VALID_REASONS },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify session exists
    const { data: session } = await admin
      .from("vc_sessions")
      .select("id")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Prevent duplicate reports from same user for same session+reason
    const { data: existing } = await admin
      .from("vc_moderation_reports")
      .select("id")
      .eq("session_id", sessionId)
      .eq("reporter_user_id", user.id)
      .eq("reason", reason)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already reported this issue for this session" },
        { status: 409 }
      );
    }

    // Determine initial severity based on reason
    const severityMap: Record<string, string> = {
      harassment: "high_risk",
      insults: "warning",
      spam: "informative",
      offensive_content: "warning",
      inappropriate_behavior: "warning",
      other: "informative",
    };

    const { data: report, error: insertError } = await admin
      .from("vc_moderation_reports")
      .insert({
        session_id: sessionId,
        reporter_user_id: user.id,
        reported_user_id: reported_user_id || null,
        reason,
        severity: severityMap[reason] || "informative",
        description: description?.trim() || null,
        evidence_caption_ids: evidence_caption_ids || null,
        status: "pending",
        action_taken: "none",
      })
      .select("id, reason, severity, status, created_at")
      .single();

    if (insertError) {
      console.error("[MODERATION_REPORT] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("[MODERATION_REPORT] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
