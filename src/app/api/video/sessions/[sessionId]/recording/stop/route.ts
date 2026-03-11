import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSessionParticipant } from "@/lib/vc-participant-check";

export const dynamic = "force-dynamic";

/**
 * POST /api/video/sessions/[sessionId]/recording/stop
 * Stop an active recording and optionally receive upload metadata.
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
    const { recording_id, storage_url, storage_path, file_size_bytes, duration_seconds, format } = body;

    const admin = createAdminClient();

    // Find the active recording — must be owned by the requesting user
    let query = admin
      .from("vc_session_recordings")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "recording")
      .eq("recorded_by", user.id);

    if (recording_id) {
      query = query.eq("id", recording_id);
    }

    const { data: recording } = await query.single();

    if (!recording) {
      return NextResponse.json({ error: "No active recording found or not authorized" }, { status: 404 });
    }

    // Determine new status based on whether storage info is provided
    const newStatus = storage_url ? "ready" : "uploading";

    const { data: updated, error } = await admin
      .from("vc_session_recordings")
      .update({
        status: newStatus,
        ended_at: new Date().toISOString(),
        ...(storage_url && { storage_url }),
        ...(storage_path && { storage_path }),
        ...(file_size_bytes && { file_size_bytes }),
        ...(duration_seconds && { duration_seconds }),
        ...(format && { format }),
      })
      .eq("id", recording.id)
      .select()
      .single();

    if (error) {
      console.error("[Recording] Stop error:", error);
      return NextResponse.json({ error: "Failed to stop recording" }, { status: 500 });
    }

    return NextResponse.json({ recording: updated });
  } catch (err) {
    console.error("[Recording] Stop error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
