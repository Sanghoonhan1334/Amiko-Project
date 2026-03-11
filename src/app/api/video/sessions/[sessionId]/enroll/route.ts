import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/video/sessions/[sessionId]/enroll — Register for a session (creates pending_payment booking)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7));
        user = data.user;
      }
    }
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

    // Cannot enroll in own session
    const hostData = session.host as any;
    const hostUserId = Array.isArray(hostData)
      ? hostData[0]?.user_id
      : hostData?.user_id;
    if (hostUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot enroll in your own session" },
        { status: 400 },
      );
    }

    // Check session is still open for enrollment
    if (session.status === "cancelled") {
      return NextResponse.json(
        { error: "Session is cancelled" },
        { status: 400 },
      );
    }
    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Session has already ended" },
        { status: 400 },
      );
    }

    // Check capacity
    if (session.current_participants >= session.max_participants) {
      return NextResponse.json({ error: "Session is full" }, { status: 400 });
    }

    // Check not already enrolled
    const { data: existing } = await supabase
      .from("vc_bookings")
      .select("id, payment_status, status")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .not("status", "in", '("cancelled","refunded")')
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: "Already enrolled",
          booking: existing,
        },
        { status: 400 },
      );
    }

    // Determine if free session
    const isFree = !session.price_usd || session.price_usd === 0;

    // Create booking record
    const { data: booking, error: insertError } = await supabase
      .from("vc_bookings")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        amount_paid: isFree ? 0 : session.price_usd,
        host_share: 0,
        platform_share: isFree ? 0 : session.price_usd,
        payment_status: isFree ? "paid" : "pending",
        status: isFree ? "confirmed" : "reserved",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[ENROLL] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
    }

    // Create notification for the user who enrolled
    if (isFree && booking) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("vc_notifications").insert({
          user_id: user.id,
          session_id: sessionId,
          type: "session_booked",
          title: "Session Booked",
          message: `You have been enrolled in "${session.title}".`,
        });
        // Notify the host about a new participant
        if (hostUserId) {
          await adminClient.from("vc_notifications").insert({
            user_id: hostUserId,
            session_id: sessionId,
            type: "session_booked",
            title: "New Participant",
            message: `A new participant has enrolled in your session "${session.title}".`,
          });
        }
      } catch (notifErr) {
        console.error("[ENROLL] Notification error:", notifErr);
      }
    }

    return NextResponse.json(
      {
        booking,
        requires_payment: !isFree,
        amount_usd: isFree ? 0 : session.price_usd,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[ENROLL] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
