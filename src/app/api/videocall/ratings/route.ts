import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// POST: Submit a rating for a session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const body = await request.json();
    const {
      session_id,
      knowledge_rating,
      clarity_rating,
      friendliness_rating,
      usefulness_rating,
      comment,
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 },
      );
    }

    // Get session and verify participation
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("id, host_id, status")
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify user participated
    const { data: booking } = await supabase
      .from("vc_bookings")
      .select("id")
      .eq("session_id", session_id)
      .eq("user_id", user.id)
      .in("status", ["joined", "completed"])
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Must participate to rate" },
        { status: 403 },
      );
    }

    // Calculate overall
    const ratings = [
      knowledge_rating,
      clarity_rating,
      friendliness_rating,
      usefulness_rating,
    ].filter((r) => r != null);
    const overall =
      ratings.length > 0
        ? parseFloat(
            (
              ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length
            ).toFixed(2),
          )
        : null;

    const { data: rating, error } = await supabase
      .from("vc_ratings")
      .insert({
        session_id,
        user_id: user.id,
        host_id: session.host_id,
        knowledge_rating: knowledge_rating || null,
        clarity_rating: clarity_rating || null,
        friendliness_rating: friendliness_rating || null,
        usefulness_rating: usefulness_rating || null,
        overall_rating: overall,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already rated this session" },
          { status: 400 },
        );
      }
      console.error("[VC_RATINGS] Insert error:", error);
      return NextResponse.json({ error: "Rating failed" }, { status: 500 });
    }

    return NextResponse.json({ rating }, { status: 201 });
  } catch (err) {
    console.error("[VC_RATINGS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET: Get ratings for a host or session
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get("hostId");
    const sessionId = searchParams.get("sessionId");

    let query = supabase.from("vc_ratings").select("*");

    if (hostId) query = query.eq("host_id", hostId);
    if (sessionId) query = query.eq("session_id", sessionId);

    query = query.order("created_at", { ascending: false }).limit(50);

    const { data, error } = await query;
    if (error) {
      console.error("[VC_RATINGS] Get error:", error);
      return NextResponse.json(
        { error: "Failed to fetch ratings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ratings: data || [] });
  } catch (err) {
    console.error("[VC_RATINGS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
