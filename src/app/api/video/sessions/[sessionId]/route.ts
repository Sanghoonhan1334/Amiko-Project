import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/video/sessions/[sessionId] — Get session detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("vc_sessions")
      .select(
        `
        *,
        host:vc_host_profiles!vc_sessions_host_id_fkey (
          id, user_id, display_name, country, languages, cultural_interests,
          bio, avatar_url, avg_rating, total_sessions, total_reviews, status
        ),
        bookings:vc_bookings (
          id, user_id, payment_status, status, created_at
        ),
        ratings:vc_ratings (
          id, user_id, knowledge_rating, clarity_rating, friendliness_rating,
          usefulness_rating, overall_rating, comment, created_at
        )
      `,
      )
      .eq("id", sessionId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session: data });
  } catch (err) {
    console.error("[VIDEO_SESSION_DETAIL] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
