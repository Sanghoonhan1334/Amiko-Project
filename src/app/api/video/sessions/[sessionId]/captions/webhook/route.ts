import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/video/sessions/[sessionId]/captions/webhook
// Receives STT caption events from external provider or internal browser STT
// This endpoint uses a shared secret for auth (not user JWT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    // ── Auth via webhook secret or API key ──
    const authHeader = request.headers.get("authorization");
    const webhookSecret = process.env.CAPTION_WEBHOOK_SECRET || process.env.CRON_SECRET;

    // Allow browser-based STT to post with user JWT too
    let authenticated = false;
    let senderUserId: string | null = null;

    if (authHeader === `Bearer ${webhookSecret}` && webhookSecret) {
      authenticated = true;
    } else if (authHeader?.startsWith("Bearer ")) {
      // Try user JWT auth (for browser-based STT)
      const { createSupabaseClient } = await import("@/lib/supabase");
      const supabase = await createSupabaseClient();
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      if (data.user) {
        authenticated = true;
        senderUserId = data.user.id;
      }
    }

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const admin = createAdminClient();

    // ── Verify session exists and STT is active ──
    const { data: task } = await admin
      .from("vc_stt_tasks")
      .select("id, status")
      .eq("session_id", sessionId)
      .single();

    if (!task || task.status !== "active") {
      return NextResponse.json({ error: "Captions not active for this session" }, { status: 400 });
    }

    // ── Handle single event or batch ──
    const events = Array.isArray(body.events) ? body.events : [body];

    const insertData = events.map((evt: any) => ({
      session_id: sessionId,
      speaker_uid: evt.speaker_uid ?? evt.uid ?? null,
      speaker_user_id: evt.speaker_user_id || senderUserId || null,
      speaker_name: evt.speaker_name || null,
      content: evt.content || evt.text || "",
      language: ["ko", "es", "en", "ja", "zh", "mixed", "unknown"].includes(evt.language)
        ? evt.language
        : "unknown",
      is_final: evt.is_final ?? evt.isFinal ?? false,
      confidence: typeof evt.confidence === "number" ? evt.confidence : null,
      timestamp_ms: evt.timestamp_ms || Date.now(),
    }));

    // Filter out empty content
    const validEvents = insertData.filter((e: any) => e.content.trim().length > 0);

    if (validEvents.length === 0) {
      return NextResponse.json({ message: "No valid events", inserted: 0 });
    }

    const { error: insertError } = await admin
      .from("vc_caption_events")
      .insert(validEvents);

    if (insertError) {
      console.error("[CAPTIONS_WEBHOOK] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to store events" }, { status: 500 });
    }

    return NextResponse.json({ message: "OK", inserted: validEvents.length });
  } catch (err) {
    console.error("[CAPTIONS_WEBHOOK] Exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
