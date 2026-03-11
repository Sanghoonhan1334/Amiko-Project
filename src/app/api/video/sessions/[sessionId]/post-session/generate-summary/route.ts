import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateSessionSummary,
  buildTranscript,
  type CaptionEvent,
} from "@/lib/vc-ai-generator";
import { isSessionParticipant } from "@/lib/vc-participant-check";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/sessions/[sessionId]/post-session/generate-summary
 * Generate AI summary from transcript.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a participant
    if (!(await isSessionParticipant(sessionId, user.id))) {
      return NextResponse.json({ error: "Not a session participant" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Check if summary already exists
    const { data: existing } = await admin
      .from("vc_session_summaries")
      .select("id, status")
      .eq("session_id", sessionId)
      .single();

    if (existing?.status === "ready") {
      return NextResponse.json(
        { error: "Summary already exists", summary_id: existing.id },
        { status: 409 }
      );
    }

    // If there's a failed or generating summary, delete it so we can regenerate
    if (existing) {
      await admin.from("vc_session_summaries").delete().eq("id", existing.id);
    }

    // Get session info
    const { data: session } = await admin
      .from("vc_sessions")
      .select("id, duration_minutes, started_at, ended_at")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get captions (final only)
    const { data: captions } = await admin
      .from("vc_caption_events")
      .select("speaker_name, content, language, timestamp_ms")
      .eq("session_id", sessionId)
      .eq("is_final", true)
      .order("sequence_number", { ascending: true });

    if (!captions || captions.length < 2) {
      return NextResponse.json(
        { error: "Not enough transcript data to generate summary (minimum 2 captions required)" },
        { status: 400 }
      );
    }

    // Get translation count
    const { count: translationCount } = await admin
      .from("vc_translation_events")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    // Create placeholder summary
    const { data: placeholder } = await admin
      .from("vc_session_summaries")
      .insert({
        session_id: sessionId,
        status: "generating",
        generated_by: "ai",
        ai_model: "deepseek-chat",
        duration_minutes: session.duration_minutes,
        total_captions: captions.length,
        total_translations: translationCount || 0,
      })
      .select()
      .single();

    // Build transcript and generate summary
    try {
      const transcript = buildTranscript(captions as CaptionEvent[]);
      const result = await generateSessionSummary(transcript, session.duration_minutes);

      const { error: updateError } = await admin
        .from("vc_session_summaries")
        .update({
          summary_ko: result.summary_ko,
          summary_es: result.summary_es,
          topics: result.topics,
          vocabulary: result.vocabulary,
          cultural_notes: result.cultural_notes,
          key_points: result.key_points,
          word_count_stats: result.word_count_stats,
          status: "ready",
        })
        .eq("id", placeholder!.id);

      if (updateError) throw updateError;

      // Fetch final result
      const { data: summary } = await admin
        .from("vc_session_summaries")
        .select("*")
        .eq("id", placeholder!.id)
        .single();

      return NextResponse.json({ summary }, { status: 201 });
    } catch (aiError) {
      // Mark as failed but don't corrupt session
      await admin
        .from("vc_session_summaries")
        .update({
          status: "failed",
          error_message: aiError instanceof Error ? aiError.message : "Unknown AI error",
        })
        .eq("id", placeholder!.id);

      console.error("[Summary] AI generation failed:", aiError);
      return NextResponse.json(
        { error: "Summary generation failed. You can try again later." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[Summary] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
