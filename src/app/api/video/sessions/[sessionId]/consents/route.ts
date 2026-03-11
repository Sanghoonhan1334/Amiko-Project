import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSessionParticipant } from "@/lib/vc-participant-check";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/sessions/[sessionId]/consents
 * Register or update user consent for recording/transcription/translation.
 *
 * GET /api/video/sessions/[sessionId]/consents
 * Get all consents for this session (to verify all participants agreed).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Auth
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
    const {
      recording_consent = false,
      transcription_consent = false,
      translation_consent = false,
    } = body;

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

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Upsert consent
    const { data: consent, error } = await admin
      .from("vc_session_consents")
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          recording_consent,
          transcription_consent,
          translation_consent,
          consented_at: new Date().toISOString(),
          ip_address: ip,
          user_agent: userAgent,
        },
        { onConflict: "session_id,user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[Consents] Upsert error:", error);
      return NextResponse.json({ error: "Failed to save consent" }, { status: 500 });
    }

    return NextResponse.json({ consent }, { status: 200 });
  } catch (err) {
    console.error("[Consents] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
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

    // Return consents without IP/UA for non-admin users
    const { data: consents, error } = await admin
      .from("vc_session_consents")
      .select("id, session_id, user_id, recording_consent, transcription_consent, translation_consent, consented_at, created_at")
      .eq("session_id", sessionId);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch consents" }, { status: 500 });
    }

    // Check if all participants have consented to recording
    const allRecordingConsent = consents.length > 0 && consents.every((c) => c.recording_consent);

    return NextResponse.json({
      consents,
      all_recording_consent: allRecordingConsent,
      total_consents: consents.length,
    });
  } catch (err) {
    console.error("[Consents] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
