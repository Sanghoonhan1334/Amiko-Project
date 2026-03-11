import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/video/sessions/[sessionId]/captions/stop
// Host stops real-time captioning for the session
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

    // ── Verify host ──
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("id, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const hostData = session.host as any;
    const hostUserId = Array.isArray(hostData) ? hostData[0]?.user_id : hostData?.user_id;
    if (hostUserId !== user.id) {
      return NextResponse.json({ error: "Only the host can stop captions" }, { status: 403 });
    }

    // ── Stop the task ──
    const admin = createAdminClient();
    const { data: task, error: taskError } = await admin
      .from("vc_stt_tasks")
      .update({
        status: "stopped",
        stopped_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .in("status", ["active", "starting"])
      .select()
      .single();

    if (taskError || !task) {
      return NextResponse.json({ message: "No active caption task to stop" }, { status: 200 });
    }

    return NextResponse.json({
      message: "Captions stopped",
      task_id: task.id,
      status: task.status,
    });
  } catch (err) {
    console.error("[CAPTIONS_STOP] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
