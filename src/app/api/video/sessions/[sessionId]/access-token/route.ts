import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// POST /api/video/sessions/[sessionId]/access-token
// Issues an Agora RTC token ONLY to authorized users (paid + not blocked + within time window)
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

    const userAgent = request.headers.get("user-agent") || "";
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";

    // Get session
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("*, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", sessionId)
      .single();

    if (!session) {
      await logAccess(
        supabase,
        sessionId,
        user.id,
        "token_denied",
        0,
        ip,
        userAgent,
        "session_not_found",
      );
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const hostData = session.host as any;
    const isHost =
      (Array.isArray(hostData) ? hostData[0]?.user_id : hostData?.user_id) ===
      user.id;

    // Session must be active
    if (session.status === "cancelled") {
      await logAccess(
        supabase,
        sessionId,
        user.id,
        "token_denied",
        0,
        ip,
        userAgent,
        "session_cancelled",
      );
      return NextResponse.json(
        { error: "Session is cancelled" },
        { status: 403 },
      );
    }

    if (session.status === "completed") {
      await logAccess(
        supabase,
        sessionId,
        user.id,
        "token_denied",
        0,
        ip,
        userAgent,
        "session_completed",
      );
      return NextResponse.json({ error: "Session has ended" }, { status: 403 });
    }

    const scheduledTime = new Date(session.scheduled_at).getTime();
    const now = Date.now();
    const minutesUntil = (scheduledTime - now) / (1000 * 60);
    const sessionEndTime =
      scheduledTime + (session.duration_minutes || 30) * 60 * 1000;

    if (now > sessionEndTime) {
      await logAccess(
        supabase,
        sessionId,
        user.id,
        "token_denied",
        0,
        ip,
        userAgent,
        "session_expired",
      );
      return NextResponse.json(
        { error: "Session time has passed" },
        { status: 403 },
      );
    }

    if (!isHost) {
      // Verify payment
      const { data: booking } = await supabase
        .from("vc_bookings")
        .select("id, payment_status, status")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .not("status", "in", '("cancelled","refunded")')
        .single();

      if (!booking) {
        await logAccess(
          supabase,
          sessionId,
          user.id,
          "token_denied",
          0,
          ip,
          userAgent,
          "no_valid_payment",
        );
        return NextResponse.json(
          { error: "Payment required to access this session" },
          { status: 403 },
        );
      }

      // Check blocked
      const { data: reports } = await supabase
        .from("vc_reports")
        .select("id")
        .eq("reported_user_id", user.id)
        .eq("status", "resolved")
        .limit(1);

      if (reports && reports.length > 0) {
        await logAccess(
          supabase,
          sessionId,
          user.id,
          "token_denied",
          0,
          ip,
          userAgent,
          "user_blocked",
        );
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Cannot join more than 15 min early
      if (minutesUntil > 15) {
        await logAccess(
          supabase,
          sessionId,
          user.id,
          "token_denied",
          0,
          ip,
          userAgent,
          "too_early",
        );
        return NextResponse.json(
          {
            error: "Session not yet available",
            available_at: new Date(
              scheduledTime - 15 * 60 * 1000,
            ).toISOString(),
          },
          { status: 425 },
        );
      }
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

    // Deterministic numeric uid from user UUID
    const uid =
      Math.abs(
        user.id.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0),
      ) % 100000;

    let token = "";
    try {
      const { RtcTokenBuilder, RtcRole } = await import("agora-token");
      // Token valid for remaining session time + 10 min buffer
      const remainingSeconds = Math.max(
        Math.floor((sessionEndTime - now) / 1000) + 600,
        3600,
      );
      const expireTime = Math.floor(now / 1000) + remainingSeconds;
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
      console.error("[ACCESS_TOKEN] Token generation error:", tokenErr);
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 },
      );
    }

    // Update session to live if it's time
    if (session.status === "scheduled" && minutesUntil <= 0) {
      await supabase
        .from("vc_sessions")
        .update({ status: "live", started_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // Log successful token issuance
    await logAccess(
      supabase,
      sessionId,
      user.id,
      "token_issued",
      uid,
      ip,
      userAgent,
      null,
    );

    return NextResponse.json({
      channel: session.agora_channel,
      token,
      uid,
      appId,
      isHost,
      sessionId,
      title: session.title,
      duration_minutes: session.duration_minutes,
      scheduled_at: session.scheduled_at,
      token_expires_in: Math.floor((sessionEndTime - now) / 1000) + 600,
    });
  } catch (err) {
    console.error("[ACCESS_TOKEN] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function logAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  sessionId: string,
  userId: string,
  action: string,
  agoraUid: number,
  ip: string,
  userAgent: string,
  reason: string | null,
) {
  try {
    await supabase.from("vc_rtc_access_logs").insert({
      session_id: sessionId,
      user_id: userId,
      action,
      agora_uid: agoraUid || null,
      ip_address: ip,
      user_agent: userAgent,
      reason,
    });
  } catch (e) {
    console.error("[ACCESS_TOKEN] Log error:", e);
  }
}
