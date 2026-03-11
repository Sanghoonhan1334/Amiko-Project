import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/video/sessions/[sessionId]/captions/history
// Returns final caption events for a session (short history for late joiners)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    // ── Auth ──
    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7));
        user = data.user;
      }
    }
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ── Query params ──
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const afterSequence = parseInt(url.searchParams.get("after") || "0");
    const onlyFinal = url.searchParams.get("final") === "true";

    // ── Fetch caption events ──
    let query = supabase
      .from("vc_caption_events")
      .select("id, speaker_uid, speaker_name, content, language, is_final, confidence, sequence_number, timestamp_ms, created_at")
      .eq("session_id", sessionId)
      .gt("sequence_number", afterSequence)
      .order("sequence_number", { ascending: true })
      .limit(limit);

    if (onlyFinal) {
      query = query.eq("is_final", true);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("[CAPTIONS_HISTORY] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch captions" }, { status: 500 });
    }

    // ── Check if STT task is active ──
    const { data: task } = await supabase
      .from("vc_stt_tasks")
      .select("id, status")
      .eq("session_id", sessionId)
      .single();

    return NextResponse.json({
      events: events || [],
      stt_status: task?.status || "idle",
      has_more: (events?.length || 0) === limit,
    });
  } catch (err) {
    console.error("[CAPTIONS_HISTORY] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
