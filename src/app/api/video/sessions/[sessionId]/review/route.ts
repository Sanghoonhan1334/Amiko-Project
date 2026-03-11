import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_RATINGS = [1, 2, 3, 4, 5];

/**
 * POST /api/video/sessions/[sessionId]/review
 * Submit a session review (one per user per session).
 * Also triggers host reputation recalculation via DB trigger.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      usefulness_rating,
      clarity_rating,
      experience_rating,
      host_quality_rating,
      comment,
    } = body;

    // Validate ratings
    const ratings = { usefulness_rating, clarity_rating, experience_rating, host_quality_rating };
    for (const [key, val] of Object.entries(ratings)) {
      if (!VALID_RATINGS.includes(val as number)) {
        return NextResponse.json(
          { error: `Invalid ${key}: must be 1-5` },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();

    // Get session with host info
    const { data: session } = await admin
      .from("vc_sessions")
      .select("id, host_id, status")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get host user_id from host profile
    const { data: hostProfile } = await admin
      .from("vc_host_profiles")
      .select("id, user_id")
      .eq("id", session.host_id)
      .single();

    if (!hostProfile) {
      return NextResponse.json({ error: "Host profile not found" }, { status: 404 });
    }

    // Prevent self-review
    if (user.id === hostProfile.user_id) {
      return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });
    }

    // Check for existing review (DB unique constraint also enforces this)
    const { data: existingReview } = await admin
      .from("vc_session_reviews")
      .select("id")
      .eq("session_id", sessionId)
      .eq("reviewer_user_id", user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this session" },
        { status: 409 }
      );
    }

    // Calculate overall rating
    const overall = (
      (usefulness_rating + clarity_rating + experience_rating + host_quality_rating) / 4
    ).toFixed(2);

    // Determine if this is a host review (will be used for reputation)
    const isHostReview = user.id !== hostProfile.user_id;

    // Insert review — DB trigger will recalculate reputation
    const { data: review, error } = await admin
      .from("vc_session_reviews")
      .insert({
        session_id: sessionId,
        reviewer_user_id: user.id,
        reviewed_user_id: hostProfile.user_id,
        usefulness_rating,
        clarity_rating,
        experience_rating,
        host_quality_rating,
        overall_rating: parseFloat(overall),
        comment: comment?.trim() || null,
        is_host_review: isHostReview,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this session" },
          { status: 409 }
        );
      }
      console.error("[Review] Insert error:", error);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    // Also insert into the legacy vc_ratings table for backward compatibility
    try {
      await admin
        .from("vc_ratings")
        .upsert(
          {
            session_id: sessionId,
            user_id: user.id,
            host_id: session.host_id,
            knowledge_rating: host_quality_rating,
            clarity_rating,
            friendliness_rating: experience_rating,
            usefulness_rating,
            overall_rating: parseFloat(overall),
            comment: comment?.trim() || null,
          },
          { onConflict: "session_id,user_id" }
        );
    } catch (legacyErr) {
      console.error("[Review] Legacy vc_ratings sync failed:", legacyErr);
    }

    // Fetch updated host reputation
    const { data: updatedHost } = await admin
      .from("vc_host_profiles")
      .select("avg_rating, total_reviews, reputation_score, reputation_tier, total_sessions_completed")
      .eq("id", session.host_id)
      .single();

    return NextResponse.json(
      {
        review,
        host_reputation: updatedHost || null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Review] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/video/sessions/[sessionId]/review
 * Get reviews for this session.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: reviews, error } = await admin
      .from("vc_session_reviews")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    // Check if current user already reviewed
    const userReview = reviews?.find((r) => r.reviewer_user_id === user.id);

    return NextResponse.json({
      reviews: reviews || [],
      user_has_reviewed: !!userReview,
      user_review: userReview || null,
    });
  } catch (err) {
    console.error("[Review] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
