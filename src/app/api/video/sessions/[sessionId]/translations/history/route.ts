import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/video/sessions/[sessionId]/translations/history
// Returns translation events for a session (for late joiners)
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
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // ── Query params ──
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      200
    );
    const afterSequence = parseInt(url.searchParams.get("after") || "0");
    const targetLang = url.searchParams.get("target");

    // ── Fetch translation events ──
    let query = supabase
      .from("vc_translation_events")
      .select(
        "id, caption_event_id, source_language, target_language, original_content, translated_content, translation_engine, is_final, speaker_uid, speaker_name, sequence_number, timestamp_ms, created_at"
      )
      .eq("session_id", sessionId)
      .gt("sequence_number", afterSequence)
      .order("sequence_number", { ascending: true })
      .limit(limit);

    if (targetLang && ["ko", "es", "en"].includes(targetLang)) {
      query = query.eq("target_language", targetLang);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("[TRANSLATIONS_HISTORY] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch translations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: events || [],
      has_more: (events?.length || 0) === limit,
    });
  } catch (err) {
    console.error("[TRANSLATIONS_HISTORY] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
