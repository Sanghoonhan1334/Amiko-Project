import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/video/sessions/[sessionId]/chat — Load chat history
export async function GET(
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

    // Verify access: must be host or paid participant
    const { data: session } = await supabase
      .from("vc_sessions")
      .select("id, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const hostArr = session.host as any;
    const hostUserId = Array.isArray(hostArr)
      ? hostArr[0]?.user_id
      : hostArr?.user_id;
    const isHost = hostUserId === user.id;
    if (!isHost) {
      const { data: booking } = await supabase
        .from("vc_bookings")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .not("status", "in", '("cancelled","refunded")')
        .single();

      if (!booking) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const before = searchParams.get("before"); // cursor for pagination

    let query = supabase
      .from("vc_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[CHAT] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch chat" },
        { status: 500 },
      );
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error("[CHAT] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/video/sessions/[sessionId]/chat — Send a message
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

    const body = await request.json();
    const { message, message_type = "text" } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 chars)" },
        { status: 400 },
      );
    }

    // Verify access
    const { data: session } = await supabase
      .from("vc_sessions")
      .select(
        "id, status, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)",
      )
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only allow chat in live or scheduled sessions
    if (session.status !== "live" && session.status !== "scheduled") {
      return NextResponse.json(
        { error: "Chat is closed for this session" },
        { status: 400 },
      );
    }

    const hostArr2 = session.host as any;
    const hostUserId2 = Array.isArray(hostArr2)
      ? hostArr2[0]?.user_id
      : hostArr2?.user_id;
    const isHost = hostUserId2 === user.id;
    if (!isHost) {
      const { data: booking } = await supabase
        .from("vc_bookings")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .not("status", "in", '("cancelled","refunded")')
        .single();

      if (!booking) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { data: chatMessage, error } = await supabase
      .from("vc_chat_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message: message.trim(),
        message_type,
      })
      .select()
      .single();

    if (error) {
      console.error("[CHAT] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: chatMessage }, { status: 201 });
  } catch (err) {
    console.error("[CHAT] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
