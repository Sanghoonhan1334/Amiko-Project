import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET: List bookings for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const asHost = searchParams.get("asHost") === "true";

    let query;

    if (asHost) {
      // Get bookings for sessions I host
      query = supabase
        .from("vc_bookings")
        .select(
          `
          *,
          session:vc_sessions!vc_bookings_session_id_fkey (
            id, title, topic, scheduled_at, status, duration_minutes, price_usd
          )
        `,
        )
        .in(
          "session_id",
          supabase
            .from("vc_sessions")
            .select("id")
            .in(
              "host_id",
              supabase
                .from("vc_host_profiles")
                .select("id")
                .eq("user_id", user.id),
            ),
        );
    } else {
      query = supabase
        .from("vc_bookings")
        .select(
          `
          *,
          session:vc_sessions!vc_bookings_session_id_fkey (
            id, title, topic, scheduled_at, status, duration_minutes, price_usd, agora_channel,
            host:vc_host_profiles!vc_sessions_host_id_fkey (
              id, display_name, country, avatar_url, avg_rating
            )
          )
        `,
        )
        .eq("user_id", user.id);
    }

    if (status) query = query.eq("status", status);
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("[VC_BOOKINGS] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (err) {
    console.error("[VC_BOOKINGS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Create a booking (after payment)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const body = await request.json();
    const { session_id, paypal_order_id, amount_paid, payment_method } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 },
      );
    }

    // Get session
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("*, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Can't book own session
    if (session.host?.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot book your own session" },
        { status: 400 },
      );
    }

    // Check capacity
    if (session.current_participants >= session.max_participants) {
      return NextResponse.json({ error: "Session is full" }, { status: 400 });
    }

    // Check not already booked
    const { data: existing } = await supabase
      .from("vc_bookings")
      .select("id")
      .eq("session_id", session_id)
      .eq("user_id", user.id)
      .not("status", "in", '("cancelled","refunded")')
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already booked" }, { status: 400 });
    }

    // Determine if this is a free booking
    const isFreeSession =
      session.price_usd === 0 ||
      session.price_usd === null ||
      payment_method === "free";

    // Calculate commission split (70% host, 30% platform)
    const totalAmount = isFreeSession ? 0 : amount_paid || session.price_usd;
    const hostShare = parseFloat((totalAmount * 0.7).toFixed(2));
    const platformShare = parseFloat((totalAmount * 0.3).toFixed(2));

    const { data: booking, error } = await supabase
      .from("vc_bookings")
      .insert({
        session_id,
        user_id: user.id,
        paypal_order_id: paypal_order_id || null,
        amount_paid: totalAmount,
        host_share: hostShare,
        platform_share: platformShare,
        payment_status: isFreeSession || paypal_order_id ? "paid" : "pending",
        status: isFreeSession || paypal_order_id ? "confirmed" : "reserved",
      })
      .select()
      .single();

    if (error) {
      console.error("[VC_BOOKINGS] Insert error:", error);
      return NextResponse.json({ error: "Booking failed" }, { status: 500 });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("[VC_BOOKINGS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
