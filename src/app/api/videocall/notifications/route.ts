import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

async function getUser(request: NextRequest) {
  const supabase = await createSupabaseClient();
  let user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      user = data.user;
    }
  }
  return { supabase, user };
}

// GET /api/videocall/notifications — List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const { data: notifications, error } = await supabase
      .from("vc_notifications")
      .select(
        `
        id, type, title, message, is_read, created_at,
        session:vc_sessions (id, title, scheduled_at, status)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[VC_NOTIFICATIONS] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Count unread
    const { count } = await supabase
      .from("vc_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: count || 0,
    });
  } catch (err) {
    console.error("[VC_NOTIFICATIONS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/videocall/notifications — Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { mark_all, notification_ids } = body;

    if (mark_all) {
      const { error } = await supabase
        .from("vc_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("[VC_NOTIFICATIONS] Mark all read error:", error);
        return NextResponse.json(
          { error: "Failed to update" },
          { status: 500 },
        );
      }
    } else if (Array.isArray(notification_ids) && notification_ids.length > 0) {
      const { error } = await supabase
        .from("vc_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .in("id", notification_ids);

      if (error) {
        console.error("[VC_NOTIFICATIONS] Mark read error:", error);
        return NextResponse.json(
          { error: "Failed to update" },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Provide mark_all or notification_ids" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[VC_NOTIFICATIONS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
