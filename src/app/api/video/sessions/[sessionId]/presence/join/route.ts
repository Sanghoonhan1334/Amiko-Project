import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// POST /api/video/sessions/[sessionId]/presence/join
// Records that user joined the live session
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

    // Parse device info from body (optional)
    let deviceInfo = {};
    try {
      const body = await request.json();
      deviceInfo = body.device_info || {};
    } catch {
      // No body is fine
    }

    // Log join
    await supabase.from("vc_rtc_access_logs").insert({
      session_id: sessionId,
      user_id: user.id,
      action: "join",
      ip_address: ip,
      user_agent: userAgent,
      device_info: deviceInfo,
    });

    // Update booking joined_at
    await supabase
      .from("vc_bookings")
      .update({ status: "joined", joined_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .eq("payment_status", "paid");

    return NextResponse.json({
      success: true,
      joined_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[PRESENCE_JOIN] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
