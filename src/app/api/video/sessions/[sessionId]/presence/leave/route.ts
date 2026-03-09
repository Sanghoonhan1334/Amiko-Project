import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// POST /api/video/sessions/[sessionId]/presence/leave
// Records that user left the live session
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

    // Log leave
    await supabase.from("vc_rtc_access_logs").insert({
      session_id: sessionId,
      user_id: user.id,
      action: "leave",
      ip_address: ip,
      user_agent: userAgent,
    });

    // Update booking left_at
    await supabase
      .from("vc_bookings")
      .update({ left_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      left_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[PRESENCE_LEAVE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
