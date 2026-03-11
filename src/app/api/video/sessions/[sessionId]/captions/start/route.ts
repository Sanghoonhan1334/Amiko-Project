import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/video/sessions/[sessionId]/captions/start
// Host starts real-time captioning for the session
export async function POST(
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

    // ── Verify session is live & user is the host ──
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("id, status, agora_channel, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const hostData = session.host as any;
    const hostUserId = Array.isArray(hostData) ? hostData[0]?.user_id : hostData?.user_id;
    const isHost = hostUserId === user.id;

    if (!isHost) {
      return NextResponse.json({ error: "Only the host can start captions" }, { status: 403 });
    }

    if (session.status !== "live") {
      return NextResponse.json({ error: "Session must be live to start captions" }, { status: 400 });
    }

    // ── Use admin client for writes (bypasses RLS) ──
    const admin = createAdminClient();

    // ── Check if task already exists ──
    const { data: existingTask } = await admin
      .from("vc_stt_tasks")
      .select("id, status")
      .eq("session_id", sessionId)
      .single();

    if (existingTask && existingTask.status === "active") {
      return NextResponse.json({ message: "Captions already active", task_id: existingTask.id });
    }

    // ── Upsert STT task ──
    const { data: task, error: taskError } = await admin
      .from("vc_stt_tasks")
      .upsert(
        {
          session_id: sessionId,
          status: "active",
          started_at: new Date().toISOString(),
          started_by: user.id,
          error_message: null,
        },
        { onConflict: "session_id" }
      )
      .select()
      .single();

    if (taskError) {
      console.error("[CAPTIONS_START] Task upsert error:", taskError);
      return NextResponse.json({ error: "Failed to start caption task" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Captions started",
      task_id: task.id,
      status: task.status,
    });
  } catch (err) {
    console.error("[CAPTIONS_START] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
