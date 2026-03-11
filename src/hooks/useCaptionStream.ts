"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CaptionEvent {
  id?: string;
  speaker_uid?: number;
  speaker_name?: string;
  content: string;
  language: string;
  is_final: boolean;
  confidence?: number;
  sequence_number?: number;
  timestamp_ms: number;
}

interface UseCaptionStreamOptions {
  sessionId: string;
  enabled: boolean;
}

/**
 * Hook that connects to the SSE caption stream and accumulates events.
 * Also loads recent history for late joiners.
 */
export function useCaptionStream({ sessionId, enabled }: UseCaptionStreamOptions) {
  const [captions, setCaptions] = useState<CaptionEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const maxCaptions = 50; // Keep last N captions in memory

  // ── Load history for late joiners ──
  useEffect(() => {
    if (!enabled) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `/api/video/sessions/${sessionId}/captions/history?limit=20&final=true`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.events?.length > 0) {
            setCaptions(data.events);
          }
        }
      } catch {
        // Non-critical
      }
    };

    loadHistory();
  }, [sessionId, enabled]);

  // ── SSE connection ──
  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setConnected(false);
      }
      return;
    }

    const es = new EventSource(`/api/video/sessions/${sessionId}/captions/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          setConnected(true);
          return;
        }

        if (data.type === "caption") {
          const captionEvent: CaptionEvent = {
            id: data.id,
            speaker_uid: data.speaker_uid,
            speaker_name: data.speaker_name,
            content: data.content,
            language: data.language,
            is_final: data.is_final,
            confidence: data.confidence,
            sequence_number: data.sequence_number,
            timestamp_ms: data.timestamp_ms,
          };

          setCaptions((prev) => {
            // If it's a partial update, replace the last partial from the same speaker
            if (!captionEvent.is_final) {
              const lastIdx = prev.findLastIndex(
                (c) => c.speaker_uid === captionEvent.speaker_uid && !c.is_final
              );
              if (lastIdx >= 0) {
                const updated = [...prev];
                updated[lastIdx] = captionEvent;
                return updated.slice(-maxCaptions);
              }
            }

            return [...prev, captionEvent].slice(-maxCaptions);
          });
        }
      } catch {
        // Ignore parse errors (heartbeat comments etc.)
      }
    };

    es.onerror = () => {
      setConnected(false);
      setError("Connection lost");
      // EventSource auto-reconnects
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [sessionId, enabled]);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
  }, []);

  return { captions, connected, error, clearCaptions };
}
