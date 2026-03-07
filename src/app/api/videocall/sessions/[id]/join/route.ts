import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// POST: Join a session (get Agora token)
// Only authorized users (host or users with paid booking) can join.
// Token lifetime is scoped to the remaining session duration.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("vc_sessions")
      .select("*, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Reject if session is already completed or cancelled
    if (session.status === "completed" || session.status === "cancelled") {
      return NextResponse.json(
        { error: "Session is no longer active" },
        { status: 410 },
      );
    }

    // Check session is active or about to start (within 15 min)
    const scheduledTime = new Date(session.scheduled_at);
    const now = new Date();
    const minutesUntilStart =
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

    const isHost = session.host?.user_id === user.id;
    let bookingId: string | null = null;

    if (!isHost) {
      // Verify booking with paid status
      const { data: booking } = await supabase
        .from("vc_bookings")
        .select("*")
        .eq("session_id", id)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .in("status", ["confirmed", "joined"])
        .single();

      if (!booking) {
        return NextResponse.json(
          { error: "No valid paid booking found. Please complete payment first." },
          { status: 403 },
        );
      }

      bookingId = booking.id;

      // Can join 15 minutes before
      if (minutesUntilStart > 15) {
        return NextResponse.json(
          {
            error: "Session not yet available",
            available_at: new Date(
              scheduledTime.getTime() - 15 * 60 * 1000,
            ).toISOString(),
          },
          { status: 425 },
        );
      }

      // Check session hasn't exceeded its max duration (30 min after start + 5 min grace)
      if (session.started_at) {
        const maxEndTime =
          new Date(session.started_at).getTime() +
          (session.duration_minutes + 5) * 60 * 1000;
        if (now.getTime() > maxEndTime) {
          return NextResponse.json(
            { error: "Session has ended" },
            { status: 410 },
          );
        }
      }

      // Update booking status
      await supabase
        .from("vc_bookings")
        .update({ status: "joined", joined_at: now.toISOString() })
        .eq("id", booking.id);
    }

    // Update session to live if it's time (host or scheduled time passed)
    if (session.status === "scheduled" && (isHost || minutesUntilStart <= 0)) {
      const updates: Record<string, unknown> = { status: "live" };
      if (!session.started_at) {
        updates.started_at = now.toISOString();
      }
      if (isHost) {
        updates.host_joined_at = now.toISOString();
      }
      await supabase.from("vc_sessions").update(updates).eq("id", id);
    }

    // Generate Agora token
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: "Video service not configured" },
        { status: 500 },
      );
    }

    // Use uid as a numeric hash for Agora
    const uid =
      Math.abs(
        user.id.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0),
      ) % 100000;

    // Token lifetime scoped to remaining session time + buffer
    const sessionStartMs = session.started_at
      ? new Date(session.started_at).getTime()
      : scheduledTime.getTime();
    const sessionEndMs = sessionStartMs + session.duration_minutes * 60 * 1000;
    const remainingSeconds = Math.max(
      Math.ceil((sessionEndMs - now.getTime()) / 1000) + 300, // 5 min buffer
      600, // at least 10 min
    );

    let token = "";
    try {
      const { RtcTokenBuilder, RtcRole } = await import("agora-token");
      const expireTime = Math.floor(Date.now() / 1000) + remainingSeconds;
      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        session.agora_channel,
        uid,
        RtcRole.PUBLISHER,
        expireTime,
        0,
      );
    } catch (tokenErr) {
      console.error("[VC_JOIN] Token error:", tokenErr);
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 },
      );
    }

    // Audit trail
    await supabase.from("vc_session_audit").insert({
      session_id: id,
      user_id: user.id,
      action: "user_joined",
      details: {
        is_host: isHost,
        booking_id: bookingId,
        token_expires_in: remainingSeconds,
      },
    });

    return NextResponse.json({
      channel: session.agora_channel,
      token,
      uid,
      appId,
      isHost,
      tokenExpiresIn: remainingSeconds,
      session: {
        id: session.id,
        title: session.title,
        duration_minutes: session.duration_minutes,
        scheduled_at: session.scheduled_at,
        status: session.status === "scheduled" ? "live" : session.status,
      },
    });
  } catch (err) {
    console.error("[VC_JOIN] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
