import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cron job: auto-close expired video sessions that are still "live" or "scheduled"
// Should run every 5 minutes via Vercel Cron
// 만료된 영상 세션 자동 종료 크론잡 — 5분마다 실행

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = {
      closedLive: 0,
      closedScheduled: 0,
      bookingsCompleted: 0,
      errors: [] as string[],
    };

    // 1. Close "live" sessions that have exceeded their duration
    //    End time = (started_at or scheduled_at) + duration_minutes
    const { data: liveSessions } = await supabase
      .from("vc_sessions")
      .select("id, scheduled_at, started_at, duration_minutes")
      .eq("status", "live");

    if (liveSessions) {
      for (const session of liveSessions) {
        const startTime = session.started_at
          ? new Date(session.started_at).getTime()
          : new Date(session.scheduled_at).getTime();
        const durationMs = (session.duration_minutes || 30) * 60 * 1000;
        const endTime = startTime + durationMs;

        if (now.getTime() > endTime) {
          // Close the session
          const { error: updateError } = await supabase
            .from("vc_sessions")
            .update({
              status: "completed",
              ended_at: now.toISOString(),
            })
            .eq("id", session.id)
            .eq("status", "live");

          if (updateError) {
            results.errors.push(
              `Failed to close live session ${session.id}: ${updateError.message}`,
            );
            continue;
          }

          // Complete all "joined" bookings
          const { data: updated } = await supabase
            .from("vc_bookings")
            .update({
              status: "completed",
              left_at: now.toISOString(),
            })
            .eq("session_id", session.id)
            .eq("status", "joined")
            .select("id");

          results.closedLive++;
          results.bookingsCompleted += updated?.length || 0;
        }
      }
    }

    // 2. Mark "scheduled" sessions as "no_show" if they are 30+ minutes
    //    past their scheduled_at + duration and were never started
    const noShowThreshold = new Date(
      now.getTime() - 30 * 60 * 1000,
    ).toISOString();

    const { data: staleSessions } = await supabase
      .from("vc_sessions")
      .select("id, scheduled_at, duration_minutes")
      .eq("status", "scheduled")
      .lt("scheduled_at", noShowThreshold);

    if (staleSessions) {
      for (const session of staleSessions) {
        const scheduledEnd =
          new Date(session.scheduled_at).getTime() +
          (session.duration_minutes || 30) * 60 * 1000;
        const grace = scheduledEnd + 30 * 60 * 1000; // 30 min grace after session end

        if (now.getTime() > grace) {
          const { error: updateError } = await supabase
            .from("vc_sessions")
            .update({
              status: "no_show",
              ended_at: now.toISOString(),
            })
            .eq("id", session.id)
            .eq("status", "scheduled");

          if (updateError) {
            results.errors.push(
              `Failed to mark session ${session.id} as no_show: ${updateError.message}`,
            );
          } else {
            results.closedScheduled++;
          }
        }
      }
    }

    console.log("[VC_CLEANUP] Results:", results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("[VC_CLEANUP] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
