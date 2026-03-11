"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface TranslationEvent {
  id?: string;
  caption_event_id?: string;
  source_language: string;
  target_language: string;
  original_content: string;
  translated_content: string;
  translation_engine?: string;
  is_final: boolean;
  speaker_uid?: number;
  speaker_name?: string;
  sequence_number?: number;
  timestamp_ms: number;
  error_message?: string | null;
}

export type TranslationDisplayMode =
  | "original_only"
  | "translated_only"
  | "original_and_translated";

export interface TranslationPreferences {
  display_mode: TranslationDisplayMode;
  target_language: "ko" | "es" | "en";
  auto_detect_source: boolean;
}

interface UseTranslationStreamOptions {
  sessionId: string;
  enabled: boolean;
  targetLanguage?: string;
}

/**
 * Hook that connects to the SSE translation stream and accumulates events.
 * Mirrors the pattern of useCaptionStream but for translated content.
 */
export function useTranslationStream({
  sessionId,
  enabled,
  targetLanguage,
}: UseTranslationStreamOptions) {
  const [translations, setTranslations] = useState<TranslationEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const maxTranslations = 50;

  // ── Load translation history for late joiners ──
  useEffect(() => {
    if (!enabled) return;

    const loadHistory = async () => {
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (targetLanguage) params.set("target", targetLanguage);

        const res = await fetch(
          `/api/video/sessions/${sessionId}/translations/history?${params}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.events?.length > 0) {
            setTranslations(data.events);
          }
        }
      } catch {
        // Non-critical — history is nice-to-have
      }
    };

    loadHistory();
  }, [sessionId, enabled, targetLanguage]);

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

    const url = `/api/video/sessions/${sessionId}/translations/stream`;
    const es = new EventSource(url);
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

        if (data.type === "translation") {
          const translationEvent: TranslationEvent = {
            id: data.id,
            caption_event_id: data.caption_event_id,
            source_language: data.source_language,
            target_language: data.target_language,
            original_content: data.original_content,
            translated_content: data.translated_content,
            translation_engine: data.translation_engine,
            is_final: data.is_final,
            speaker_uid: data.speaker_uid,
            speaker_name: data.speaker_name,
            sequence_number: data.sequence_number,
            timestamp_ms: data.timestamp_ms,
            error_message: data.error_message,
          };

          // Filter by target language if specified
          if (
            targetLanguage &&
            translationEvent.target_language !== targetLanguage
          ) {
            return;
          }

          setTranslations((prev) => {
            return [...prev, translationEvent].slice(-maxTranslations);
          });
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    es.onerror = () => {
      setConnected(false);
      setError("Translation stream connection lost");
      // EventSource auto-reconnects
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [sessionId, enabled, targetLanguage]);

  const clearTranslations = useCallback(() => {
    setTranslations([]);
  }, []);

  return { translations, connected, error, clearTranslations };
}

/**
 * Hook to manage translation preferences (display mode + target language).
 * Loads from API on mount, provides setter that persists to API.
 */
export function useTranslationPreferences() {
  const [preferences, setPreferences] = useState<TranslationPreferences>({
    display_mode: "original_and_translated",
    target_language: "ko",
    auto_detect_source: true,
  });
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users/me/translation-preferences?module=vc");
        if (res.ok) {
          const data = await res.json();
          setPreferences({
            display_mode: data.display_mode || "original_and_translated",
            target_language: data.target_language || "ko",
            auto_detect_source: data.auto_detect_source ?? true,
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<TranslationPreferences>) => {
      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);

      try {
        await fetch("/api/users/me/translation-preferences?module=vc", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch {
        // Revert on failure
        setPreferences(preferences);
      }
    },
    [preferences]
  );

  return { preferences, updatePreferences, loading };
}
