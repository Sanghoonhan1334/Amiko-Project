import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/video/sessions/[sessionId]/recording
 * Get recording info for this session.
 */
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

    const admin = createAdminClient();

    const { data: recordings, error } = await admin
      .from("vc_session_recordings")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
    }

    return NextResponse.json({
      recordings: recordings || [],
      has_active: recordings?.some((r) => ["recording", "uploading", "processing"].includes(r.status)),
    });
  } catch (err) {
    console.error("[Recording] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/video/sessions/[sessionId]/recording
 * Update recording metadata (e.g., after upload completes).
 */
export async function PATCH(
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

    const body = await request.json();
    const { recording_id, storage_url, storage_path, file_size_bytes, duration_seconds, format, status } = body;

    if (!recording_id) {
      return NextResponse.json({ error: "recording_id required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: recording } = await admin
      .from("vc_session_recordings")
      .select("id, recorded_by")
      .eq("id", recording_id)
      .eq("session_id", sessionId)
      .single();

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    if (recording.recorded_by !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (storage_url) updateData.storage_url = storage_url;
    if (storage_path) updateData.storage_path = storage_path;
    if (file_size_bytes) updateData.file_size_bytes = file_size_bytes;
    if (duration_seconds) updateData.duration_seconds = duration_seconds;
    if (format) updateData.format = format;
    if (status && ["ready", "failed", "deleted"].includes(status)) {
      updateData.status = status;
    }

    const { data: updated, error } = await admin
      .from("vc_session_recordings")
      .update(updateData)
      .eq("id", recording_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update recording" }, { status: 500 });
    }

    return NextResponse.json({ recording: updated });
  } catch (err) {
    console.error("[Recording] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
