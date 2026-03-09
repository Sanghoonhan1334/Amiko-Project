import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { createSupabaseClient } from "@/lib/supabase";

// POST /api/agora/test-room
// Returns a short-lived Agora token for ad-hoc test calls (no booking required).
export async function POST(request: NextRequest) {
  try {
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

    const { channelName } = await request.json();

    if (
      !channelName ||
      typeof channelName !== "string" ||
      channelName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "channelName is required" },
        { status: 400 },
      );
    }

    // Sanitize channel name: only alphanumeric + hyphens/underscores
    const sanitized = channelName.trim().replace(/[^a-zA-Z0-9\-_]/g, "");
    if (sanitized.length === 0) {
      return NextResponse.json(
        { error: "Invalid channel name" },
        { status: 400 },
      );
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: "Agora credentials not configured" },
        { status: 500 },
      );
    }

    // Numeric uid derived from user id
    const uid = Math.abs(
      user.id.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0),
    );

    // Test tokens expire in 1 hour
    const expirationTimeInSeconds = 3600;
    const privilegeExpiredTs =
      Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      sanitized,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      0,
    );

    return NextResponse.json({
      token,
      appId,
      uid,
      channel: sanitized,
    });
  } catch (error) {
    console.error("Test room token error:", error);
    return NextResponse.json(
      { error: "Failed to create test room" },
      { status: 500 },
    );
  }
}
