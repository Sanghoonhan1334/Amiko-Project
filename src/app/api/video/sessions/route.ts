import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/video/sessions — List sessions with timezone-aware display
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "upcoming";
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const level = searchParams.get("level");
    const hostId = searchParams.get("hostId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const sort = searchParams.get("sort") || "upcoming";

    let query = supabase.from("vc_sessions").select(`
      *,
      host:vc_host_profiles!vc_sessions_host_id_fkey (
        id, user_id, display_name, country, languages, cultural_interests,
        bio, avatar_url, avg_rating, total_sessions, total_reviews, status
      )
    `);

    if (status === "upcoming") {
      query = query
        .in("status", ["scheduled"])
        .gte("scheduled_at", new Date().toISOString());
    } else if (status === "live") {
      query = query.eq("status", "live");
    } else if (status !== "all") {
      query = query.eq("status", status);
    }

    if (category && category !== "all") query = query.eq("category", category);
    if (language) query = query.eq("language", language);
    if (level) query = query.eq("level", level);
    if (hostId) query = query.eq("host_id", hostId);

    if (sort === "popular") {
      query = query.order("current_participants", { ascending: false });
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("scheduled_at", { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      console.error("[VIDEO_SESSIONS] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    // All scheduled_at values are stored in UTC — frontend converts to viewer's local timezone
    return NextResponse.json({
      sessions: data || [],
      count: data?.length || 0,
      _timezone_note:
        "All scheduled_at values are UTC. Convert to viewer timezone on frontend.",
    });
  } catch (err) {
    console.error("[VIDEO_SESSIONS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/video/sessions — Host creates a new session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const body = await request.json();

    const {
      title,
      topic,
      description,
      category,
      language,
      level,
      scheduled_at,
      price_usd,
      max_participants,
      tags,
      slot_id,
    } = body;

    if (!title?.trim() || !topic?.trim() || !scheduled_at) {
      return NextResponse.json(
        { error: "title, topic, and scheduled_at are required" },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get or create host profile
    let { data: hostProfile } = await supabase
      .from("vc_host_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!hostProfile) {
      const adminClient = createAdminClient();
      const { data: userProfile } = await adminClient
        .from("users")
        .select("full_name, country, avatar_url")
        .eq("id", user.id)
        .single();

      const { data: newHost, error: createError } = await supabase
        .from("vc_host_profiles")
        .insert({
          user_id: user.id,
          display_name:
            userProfile?.full_name || user.email?.split("@")[0] || "Host",
          country: userProfile?.country || null,
          avatar_url: userProfile?.avatar_url || null,
          languages: [],
          cultural_interests: [],
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create host profile" },
          { status: 500 },
        );
      }
      hostProfile = newHost;
    }

    // Check host suspension
    if (hostProfile.status === "suspended" && hostProfile.suspension_until) {
      if (new Date(hostProfile.suspension_until) > new Date()) {
        return NextResponse.json(
          {
            error: "Host is suspended",
            suspension_until: hostProfile.suspension_until,
          },
          { status: 403 },
        );
      }
    }

    // If slot_id provided, validate against schedule config
    let slotPrice = price_usd ?? 5.0;
    if (slot_id) {
      const { data: slot } = await supabase
        .from("vc_schedule_config")
        .select("*")
        .eq("id", slot_id)
        .eq("is_active", true)
        .single();

      if (!slot) {
        return NextResponse.json(
          { error: "Invalid or inactive slot" },
          { status: 400 },
        );
      }

      // Validate day of week matches
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate.getUTCDay() !== slot.day_of_week) {
        // Allow if the local day matches (timezone conversion)
        console.warn(
          "[VIDEO_SESSIONS] Day mismatch — might be timezone offset",
        );
      }

      slotPrice = slot.price_usd;
    }

    // Generate unique Agora channel name
    const channelName = `amiko_vc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const { data: session, error: insertError } = await supabase
      .from("vc_sessions")
      .insert({
        host_id: hostProfile.id,
        title: title.trim(),
        topic: topic.trim(),
        description: description?.trim() || "",
        category: category || "general",
        language: language || "es",
        level: level || "basic",
        scheduled_at, // Must be UTC ISO string
        duration_minutes: 30,
        price_usd: slotPrice,
        max_participants: max_participants || 10,
        agora_channel: channelName,
        tags: tags || [],
      })
      .select(
        `
        *,
        host:vc_host_profiles!vc_sessions_host_id_fkey (
          id, user_id, display_name, country, languages, avatar_url,
          avg_rating, total_sessions, total_reviews, status
        )
      `,
      )
      .single();

    if (insertError) {
      console.error("[VIDEO_SESSIONS] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("[VIDEO_SESSIONS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
