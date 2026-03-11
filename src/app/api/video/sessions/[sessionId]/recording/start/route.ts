import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSessionParticipant } from "@/lib/vc-participant-check";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/sessions/[sessionId]/recording/start
 * Start a recording (after verifying all consents).
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { recording_type = "audio" } = body;

    if (!["video", "audio", "transcript"].includes(recording_type)) {
      return NextResponse.json({ error: "Invalid recording_type" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify session exists and is live
    const { data: session } = await admin
      .from("vc_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "live") {
      return NextResponse.json({ error: "Session is not live" }, { status: 400 });
    }

    // Check all participants have consented to recording
    const { data: consents } = await admin
      .from("vc_session_consents")
      .select("user_id, recording_consent")
      .eq("session_id", sessionId);

    if (!consents || consents.length === 0) {
      return NextResponse.json(
        { error: "No consents registered. All participants must consent before recording." },
        { status: 403 }
      );
    }

    const allConsented = consents.every((c) => c.recording_consent);
    if (!allConsented) {
      return NextResponse.json(
        { error: "Not all participants have consented to recording" },
        { status: 403 }
      );
    }

    // Check if there's already an active recording
    const { data: existingRecording } = await admin
      .from("vc_session_recordings")
      .select("id, status")
      .eq("session_id", sessionId)
      .in("status", ["pending", "recording", "uploading", "processing"])
      .single();

    if (existingRecording) {
      return NextResponse.json(
        { error: "A recording is already in progress", recording: existingRecording },
        { status: 409 }
      );
    }

    // Create recording record
    const { data: recording, error } = await admin
      .from("vc_session_recordings")
      .insert({
        session_id: sessionId,
        recorded_by: user.id,
        recording_type,
        status: "recording",
        consent_verified: true,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Recording] Start error:", error);
      return NextResponse.json({ error: "Failed to start recording" }, { status: 500 });
    }

    return NextResponse.json({ recording }, { status: 201 });
  } catch (err) {
    console.error("[Recording] Start error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
