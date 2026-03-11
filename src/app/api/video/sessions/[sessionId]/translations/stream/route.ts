import { NextRequest } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

// Required for SSE on Vercel
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/video/sessions/[sessionId]/translations/stream
// SSE endpoint that streams translation events in real time
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const supabase = await createSupabaseClient();

  // ── Auth ──
  let user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      user = data.user;
    }
  }
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Verify session exists ──
  const { data: session } = await supabase
    .from("vc_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  // ── Set up SSE stream ──
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let subscription: any = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", sessionId })}\n\n`
        )
      );

      // Heartbeat every 15s
      heartbeatInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          closed = true;
        }
      }, 15000);

      // Subscribe to Supabase Realtime for new translation events
      const admin = createAdminClient();
      subscription = admin
        .channel(`vc-translations:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "vc_translation_events",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (closed) return;
            try {
              const event = payload.new;
              const sseData = {
                type: "translation",
                id: event.id,
                caption_event_id: event.caption_event_id,
                source_language: event.source_language,
                target_language: event.target_language,
                original_content: event.original_content,
                translated_content: event.translated_content,
                translation_engine: event.translation_engine,
                is_final: event.is_final,
                speaker_uid: event.speaker_uid,
                speaker_name: event.speaker_name,
                sequence_number: event.sequence_number,
                timestamp_ms: event.timestamp_ms,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`)
              );
            } catch {
              closed = true;
            }
          }
        )
        .subscribe();
    },
    cancel() {
      closed = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (subscription) {
        const admin = createAdminClient();
        admin.removeChannel(subscription);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
