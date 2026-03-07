import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Get host profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const hostId = searchParams.get("hostId");

    let query = supabase.from("vc_host_profiles").select("*");

    if (hostId) {
      query = query.eq("id", hostId);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else {
      return NextResponse.json(
        { error: "userId or hostId required" },
        { status: 400 },
      );
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("[VC_HOST_PROFILE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Create or update host profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const body = await request.json();
    const { display_name, country, languages, cultural_interests, bio } = body;

    // Check if profile exists
    const { data: existing } = await supabase
      .from("vc_host_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    // Get user avatar
    const adminClient = createAdminClient();
    const { data: userProfile } = await adminClient
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("vc_host_profiles")
        .update({
          display_name: display_name || undefined,
          country: country || undefined,
          languages: languages || undefined,
          cultural_interests: cultural_interests || undefined,
          bio: bio || undefined,
          avatar_url: userProfile?.avatar_url || undefined,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("[VC_HOST_PROFILE] Update error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
      return NextResponse.json({ profile: data });
    } else {
      const { data, error } = await supabase
        .from("vc_host_profiles")
        .insert({
          user_id: user.id,
          display_name: display_name || user.email?.split("@")[0] || "Host",
          country: country || null,
          languages: languages || [],
          cultural_interests: cultural_interests || [],
          bio: bio || null,
          avatar_url: userProfile?.avatar_url || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[VC_HOST_PROFILE] Insert error:", error);
        return NextResponse.json({ error: "Create failed" }, { status: 500 });
      }
      return NextResponse.json({ profile: data }, { status: 201 });
    }
  } catch (err) {
    console.error("[VC_HOST_PROFILE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
