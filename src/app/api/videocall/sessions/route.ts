import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: List sessions (marketplace)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "scheduled";
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const level = searchParams.get("level");
    const hostId = searchParams.get("hostId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sort = searchParams.get("sort") || "upcoming"; // upcoming, popular, newest

    let query = supabase.from("vc_sessions").select(`
        *,
        host:vc_host_profiles!vc_sessions_host_id_fkey (
          id, user_id, display_name, country, languages, cultural_interests,
          bio, avatar_url, avg_rating, total_sessions, total_reviews, status
        )
      `);

    // Filter by status
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

    // Sorting
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
      console.error("[VC_SESSIONS] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessions: data || [],
      count: data?.length || 0,
    });
  } catch (err) {
    console.error("[VC_SESSIONS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Create a new session (host creates)
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
      duration_minutes,
      price_usd,
      max_participants,
      tags,
    } = body;

    console.log("[VC_SESSIONS] POST body:", {
      title,
      topic,
      category,
      language,
      level,
      scheduled_at,
    });

    if (!title || !topic || !scheduled_at) {
      return NextResponse.json(
        { error: "title, topic, and scheduled_at are required" },
        { status: 400 },
      );
    }

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("[VC_SESSIONS] Auth result:", {
      userId: user?.id,
      authError: authError?.message,
    });
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get or create host profile
    let { data: hostProfile, error: hostError } = await supabase
      .from("vc_host_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    console.log("[VC_SESSIONS] Host profile lookup:", {
      found: !!hostProfile,
      error: hostError?.message,
      code: hostError?.code,
    });

    if (!hostProfile) {
      // Auto-create host profile
      const adminClient = createAdminClient();
      const { data: userProfile, error: userErr } = await adminClient
        .from("users")
        .select("full_name, country, avatar_url")
        .eq("id", user.id)
        .single();

      console.log("[VC_SESSIONS] User profile lookup:", {
        found: !!userProfile,
        error: userErr?.message,
      });

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

      console.log("[VC_SESSIONS] Host profile creation:", {
        created: !!newHost,
        error: createError?.message,
        code: createError?.code,
      });

      if (createError) {
        console.error(
          "[VC_SESSIONS] Host profile creation error:",
          createError,
        );
        return NextResponse.json(
          { error: "Failed to create host profile: " + createError.message },
          { status: 500 },
        );
      }
      hostProfile = newHost;
    }

    // Check host suspension
    if (hostProfile.status === "suspended" && hostProfile.suspension_until) {
      const suspensionEnd = new Date(hostProfile.suspension_until);
      if (suspensionEnd > new Date()) {
        return NextResponse.json(
          {
            error: "Host is suspended",
            suspension_until: hostProfile.suspension_until,
          },
          { status: 403 },
        );
      }
    }

    // Generate unique channel name
    const channelName = `amiko_vc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const insertPayload = {
      host_id: hostProfile.id,
      title,
      topic,
      description: description || "",
      category: category || "general",
      language: language || "es",
      level: level || "basic",
      scheduled_at,
      duration_minutes: duration_minutes || 30,
      price_usd: price_usd ?? 5.0,
      max_participants: max_participants || 10,
      agora_channel: channelName,
      tags: tags || [],
    };
    console.log("[VC_SESSIONS] Insert payload:", insertPayload);

    const { data: session, error: insertError } = await supabase
      .from("vc_sessions")
      .insert(insertPayload)
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
      console.error("[VC_SESSIONS] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create session: " + insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    console.error("[VC_SESSIONS] Exception:", err?.message || err, err?.stack);
    return NextResponse.json(
      { error: "Internal server error: " + (err?.message || String(err)) },
      { status: 500 },
    );
  }
}
