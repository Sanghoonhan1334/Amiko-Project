import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/video/sessions/[sessionId]/access-status
// Check if the current user can access (join) this session
export async function GET(
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

    // Get session
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

    // Check session status
    if (session.status === "cancelled") {
      return NextResponse.json({
        can_access: false,
        reason: "session_cancelled",
      });
    }

    if (session.status === "completed") {
      return NextResponse.json({
        can_access: false,
        reason: "session_completed",
      });
    }

    // Check timing — can enter 15 min before scheduled_at
    const scheduledTime = new Date(session.scheduled_at).getTime();
    const now = Date.now();
    const minutesUntil = (scheduledTime - now) / (1000 * 60);
    const sessionEndTime =
      scheduledTime + (session.duration_minutes || 30) * 60 * 1000;

    if (now > sessionEndTime) {
      return NextResponse.json({
        can_access: false,
        reason: "session_ended",
      });
    }

    if (!isHost) {
      // Check booking + payment
      const { data: booking } = await supabase
        .from("vc_bookings")
        .select("id, payment_status, status")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .not("status", "in", '("cancelled","refunded")')
        .single();

      if (!booking) {
        return NextResponse.json({
          can_access: false,
          reason: "not_enrolled",
        });
      }

      if (booking.payment_status !== "paid") {
        return NextResponse.json({
          can_access: false,
          reason: "payment_pending",
          booking_id: booking.id,
        });
      }

      // Check blocked users
      const { data: reports } = await supabase
        .from("vc_reports")
        .select("id")
        .eq("reported_user_id", user.id)
        .eq("status", "resolved")
        .limit(1);

      if (reports && reports.length > 0) {
        return NextResponse.json({
          can_access: false,
          reason: "user_blocked",
        });
      }

      // Check timing for non-host
      if (minutesUntil > 15) {
        return NextResponse.json({
          can_access: false,
          reason: "too_early",
          available_at: new Date(scheduledTime - 15 * 60 * 1000).toISOString(),
        });
      }
    }

    return NextResponse.json({
      can_access: true,
      is_host: isHost,
      session_status: session.status,
      scheduled_at: session.scheduled_at,
      minutes_until_start: Math.max(0, Math.round(minutesUntil)),
    });
  } catch (err) {
    console.error("[ACCESS_STATUS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
