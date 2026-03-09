import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/video/sessions/[sessionId]/timer
// Returns current timer state for the session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    const { data: session } = await supabase
      .from("vc_sessions")
      .select(
        "id, scheduled_at, duration_minutes, status, started_at, ended_at",
      )
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = Date.now();
    const scheduledAt = new Date(session.scheduled_at).getTime();
    const durationMs = (session.duration_minutes || 30) * 60 * 1000;
    const startedAt = session.started_at
      ? new Date(session.started_at).getTime()
      : scheduledAt;
    const endTime = startedAt + durationMs;
    const remainingMs = Math.max(0, endTime - now);
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const elapsedMs = Math.max(0, now - startedAt);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // Session should auto-close
    const shouldClose = remainingMs <= 0 && session.status === "live";

    // If time is up and session is live, close it
    if (shouldClose) {
      const adminClient = createAdminClient();
      await adminClient
        .from("vc_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("status", "live");

      // Mark all joined bookings as completed
      await adminClient
        .from("vc_bookings")
        .update({ status: "completed", left_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("status", "joined");

      return NextResponse.json({
        status: "completed",
        remaining_seconds: 0,
        elapsed_seconds: Math.floor(durationMs / 1000),
        duration_minutes: session.duration_minutes,
        message: "Session has ended",
        closed_at: new Date().toISOString(),
      });
    }

    // Warning thresholds
    const warnings = [];
    if (remainingSeconds <= 300 && remainingSeconds > 60) {
      warnings.push("5_minutes_remaining");
    }
    if (remainingSeconds <= 60 && remainingSeconds > 0) {
      warnings.push("1_minute_remaining");
    }
    if (remainingSeconds <= 10 && remainingSeconds > 0) {
      warnings.push("closing_soon");
    }

    return NextResponse.json({
      status: session.status,
      scheduled_at: session.scheduled_at,
      started_at: session.started_at,
      duration_minutes: session.duration_minutes,
      remaining_seconds: remainingSeconds,
      elapsed_seconds: elapsedSeconds,
      end_time: new Date(endTime).toISOString(),
      warnings,
    });
  } catch (err) {
    console.error("[TIMER] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/video/sessions/[sessionId]/timer
// Force-close session (host or admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify host or admin
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("*, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const hostData = session.host as any;
    const isHost =
      (Array.isArray(hostData) ? hostData[0]?.user_id : hostData?.user_id) ===
      user.id;

    if (!isHost) {
      // Check admin
      const adminClient = createAdminClient();
      const { data: adminCheck } = await adminClient
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!adminCheck) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    if (session.status !== "live" && session.status !== "scheduled") {
      return NextResponse.json(
        { error: "Session cannot be closed" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    await adminClient
      .from("vc_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Complete all joined bookings
    await adminClient
      .from("vc_bookings")
      .update({ status: "completed", left_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("status", "joined");

    return NextResponse.json({
      success: true,
      status: "completed",
      ended_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[TIMER_CLOSE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
