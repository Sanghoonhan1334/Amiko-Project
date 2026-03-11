import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateEducationalNotes,
  buildTranscript,
  type CaptionEvent,
} from "@/lib/vc-ai-generator";
import { isSessionParticipant } from "@/lib/vc-participant-check";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/sessions/[sessionId]/post-session/generate-notes
 * Generate AI educational notes from transcript.
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

    // Check if notes already exist for this user
    const { data: existingNotes } = await admin
      .from("vc_educational_notes")
      .select("id, status")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .eq("generated_by", "ai");

    const readyNotes = existingNotes?.filter((n) => n.status === "ready");
    if (readyNotes && readyNotes.length > 0) {
      return NextResponse.json(
        { error: "Notes already generated", note_ids: readyNotes.map((n) => n.id) },
        { status: 409 }
      );
    }

    // Delete any failed/generating notes before regenerating
    if (existingNotes && existingNotes.length > 0) {
      await admin
        .from("vc_educational_notes")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("generated_by", "ai")
        .in("status", ["generating", "failed"]);
    }

    // Get session
    const { data: session } = await admin
      .from("vc_sessions")
      .select("id")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get captions
    const { data: captions } = await admin
      .from("vc_caption_events")
      .select("speaker_name, content, language, timestamp_ms")
      .eq("session_id", sessionId)
      .eq("is_final", true)
      .order("sequence_number", { ascending: true });

    if (!captions || captions.length < 2) {
      return NextResponse.json(
        { error: "Not enough transcript data (minimum 2 captions required)" },
        { status: 400 }
      );
    }

    // Build transcript and generate
    try {
      const transcript = buildTranscript(captions as CaptionEvent[]);
      const noteResults = await generateEducationalNotes(transcript);

      // Insert each note type as a separate row
      const insertedNotes = [];
      for (const note of noteResults) {
        if (note.items.length === 0) continue;

        const { data: inserted, error } = await admin
          .from("vc_educational_notes")
          .insert({
            session_id: sessionId,
            user_id: user.id,
            note_type: note.type,
            title: note.title_ko, // Store Korean title (bilingual content is in items)
            content: note.items,
            source_language: "mixed",
            target_language: "mixed",
            generated_by: "ai",
            ai_model: "deepseek-chat",
            status: "ready",
          })
          .select()
          .single();

        if (error) {
          console.error(`[Notes] Failed to insert ${note.type}:`, error);
          continue;
        }

        insertedNotes.push({
          ...inserted,
          title_ko: note.title_ko,
          title_es: note.title_es,
        });
      }

      if (insertedNotes.length === 0) {
        return NextResponse.json(
          { error: "No educational content could be extracted from transcript" },
          { status: 500 }
        );
      }

      return NextResponse.json({ notes: insertedNotes }, { status: 201 });
    } catch (aiError) {
      console.error("[Notes] AI generation failed:", aiError);
      return NextResponse.json(
        { error: "Notes generation failed. You can try again later." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[Notes] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
