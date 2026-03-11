"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CaptionEvent {
  speaker_uid?: number;
  speaker_name?: string;
  content: string;
  language: string;
  is_final: boolean;
  timestamp_ms: number;
}

interface UseBrowserSTTOptions {
  sessionId: string;
  uid: number;
  enabled: boolean;
  speakingLanguage?: string;
  onCaption?: (event: CaptionEvent) => void;
}

/**
 * Browser-based Speech-to-Text using the Web Speech API (SpeechRecognition).
 * Sends recognized speech to the captions webhook so all participants see it.
 * Falls back gracefully — if the browser doesn't support it, nothing happens.
 */
export function useBrowserSTT({
  sessionId,
  uid,
  enabled,
  speakingLanguage = "es",
  onCaption,
}: UseBrowserSTTOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const langMap: Record<string, string> = {
    es: "es-ES",
    ko: "ko-KR",
    en: "en-US",
  };

  const sendToWebhook = useCallback(
    async (content: string, isFinal: boolean, lang: string) => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Try to get auth token from Supabase session
        try {
          const { createSupabaseBrowserClient } = await import("@/lib/supabase-client");
          const supabase = createSupabaseBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }
        } catch {
          // Continue without auth — webhook may still accept based on other auth
        }

        await fetch(`/api/video/sessions/${sessionId}/captions/webhook`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            speaker_uid: uid,
            content,
            language: lang,
            is_final: isFinal,
            timestamp_ms: Date.now(),
          }),
        });
      } catch (err) {
        // Silent fail — captions are non-critical
        console.warn("[STT] Failed to send caption:", err);
      }
    },
    [sessionId, uid]
  );

  const start = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langMap[speakingLanguage] || "es-ES";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      if (!enabledRef.current) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        if (!transcript) continue;

        const isFinal = result.isFinal;
        const confidence = result[0].confidence;

        // Detect language from result (basic heuristic)
        const detectedLang = detectLanguage(transcript);

        const captionEvent: CaptionEvent = {
          speaker_uid: uid,
          content: transcript,
          language: detectedLang,
          is_final: isFinal,
          timestamp_ms: Date.now(),
        };

        // Notify local overlay immediately
        onCaption?.(captionEvent);

        // Only send final results to webhook to avoid flooding
        if (isFinal) {
          sendToWebhook(transcript, true, detectedLang);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[STT] Recognition error:", event.error);
      // Auto-restart on non-fatal errors
      if (event.error === "no-speech" || event.error === "aborted") {
        setTimeout(() => {
          if (enabledRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled
      if (enabledRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }, 500);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("[STT] Failed to start recognition:", err);
    }
  }, [isSupported, speakingLanguage, uid, onCaption, sendToWebhook]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && isSupported) {
      start();
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [enabled, isSupported, start, stop]);

  return { isListening, isSupported, start, stop };
}

/**
 * Simple language detection heuristic based on character ranges.
 * Korean (Hangul) → 'ko', Latin with Spanish chars → 'es', else 'unknown'
 */
function detectLanguage(text: string): string {
  const hangulRegex = /[\u3131-\u3163\uac00-\ud7a3]/;
  const latinRegex = /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/;

  const hangulCount = (text.match(new RegExp(hangulRegex.source, "g")) || []).length;
  const latinCount = (text.match(new RegExp(latinRegex.source, "g")) || []).length;

  if (hangulCount > latinCount) return "ko";
  if (latinCount > hangulCount) return "es";
  if (hangulCount > 0 && latinCount > 0) return "mixed";
  return "unknown";
}
