"use client";

import { useEffect, useRef, useMemo } from "react";
import type { TranslationEvent, TranslationDisplayMode } from "@/hooks/useTranslationStream";

interface CaptionEvent {
  id?: string;
  speaker_uid?: number;
  speaker_name?: string;
  content: string;
  language: string;
  is_final: boolean;
  timestamp_ms: number;
}

interface CaptionOverlayProps {
  captions: CaptionEvent[];
  translations?: TranslationEvent[];
  displayMode?: TranslationDisplayMode;
  position?: "top" | "bottom";
  fontSize?: "small" | "medium" | "large";
  visible: boolean;
  currentUid?: number;
}

const FONT_SIZES = {
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
};

const TRANSLATION_FONT_SIZES = {
  small: "text-[10px]",
  medium: "text-xs",
  large: "text-sm",
};

const LANG_COLORS: Record<string, string> = {
  ko: "text-blue-300",
  es: "text-yellow-300",
  en: "text-green-300",
  mixed: "text-purple-300",
  unknown: "text-gray-300",
};

const LANG_LABELS: Record<string, string> = {
  ko: "한국어",
  es: "ES",
  en: "EN",
  mixed: "Mix",
  unknown: "?",
};

/**
 * Overlay that shows live captions during a video call.
 * Phase 3: Also shows translations based on user display mode:
 *  - original_only: only the original caption
 *  - translated_only: only the translated text
 *  - original_and_translated: original + translation below
 */
export default function CaptionOverlay({
  captions,
  translations = [],
  displayMode = "original_and_translated",
  position = "bottom",
  fontSize = "medium",
  visible,
  currentUid,
}: CaptionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a lookup: caption_event_id → latest translation
  const translationMap = useMemo(() => {
    const map = new Map<string, TranslationEvent>();
    for (const t of translations) {
      if (t.caption_event_id) {
        // Later entries overwrite earlier, keeping most recent
        map.set(t.caption_event_id, t);
      }
    }
    return map;
  }, [translations]);

  // Auto-scroll to latest caption
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions, translations]);

  if (!visible || captions.length === 0) return null;

  // Show only last 5 captions for display
  const displayCaptions = captions.slice(-5);

  const positionClass = position === "top"
    ? "top-16 left-1/2 -translate-x-1/2"
    : "bottom-24 left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute ${positionClass} z-30 w-[90%] max-w-2xl pointer-events-none`}
    >
      <div
        ref={containerRef}
        className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-h-44 overflow-y-auto space-y-1"
      >
        {displayCaptions.map((caption, idx) => {
          const isLatest = idx === displayCaptions.length - 1;
          const isOwn = caption.speaker_uid === currentUid;
          const opacity = isLatest ? "opacity-100" : idx === displayCaptions.length - 2 ? "opacity-80" : "opacity-50";
          const langColor = LANG_COLORS[caption.language] || LANG_COLORS.unknown;

          // Find the translation for this caption (if final)
          const translation = caption.id ? translationMap.get(caption.id) : undefined;
          const hasTranslation = !!translation && translation.translation_engine !== "fallback";

          return (
            <div
              key={caption.id || `cap-${caption.timestamp_ms}-${idx}`}
              className={`flex items-start gap-2 ${opacity} transition-opacity duration-300`}
            >
              {/* Language badge */}
              <span
                className={`flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 ${langColor}`}
              >
                {LANG_LABELS[caption.language] || caption.language}
              </span>

              {/* Speaker + text (original and/or translated) */}
              <div className={`${FONT_SIZES[fontSize]} min-w-0 flex-1`}>
                {caption.speaker_name && (
                  <span className={`font-medium mr-1 ${isOwn ? "text-purple-400" : "text-cyan-400"}`}>
                    {caption.speaker_name}:
                  </span>
                )}

                {/* translated_only mode: show translated if available, else original */}
                {displayMode === "translated_only" && (
                  <span
                    className={`text-white ${
                      caption.is_final ? "font-normal" : "italic text-white/70"
                    }`}
                  >
                    {hasTranslation ? translation!.translated_content : caption.content}
                  </span>
                )}

                {/* original_only mode: always show original */}
                {displayMode === "original_only" && (
                  <span
                    className={`text-white ${
                      caption.is_final ? "font-normal" : "italic text-white/70"
                    }`}
                  >
                    {caption.content}
                  </span>
                )}

                {/* original_and_translated mode: original line + translated below */}
                {displayMode === "original_and_translated" && (
                  <>
                    <span
                      className={`text-white ${
                        caption.is_final ? "font-normal" : "italic text-white/70"
                      }`}
                    >
                      {caption.content}
                    </span>
                    {hasTranslation && (
                      <div className={`${TRANSLATION_FONT_SIZES[fontSize]} mt-0.5`}>
                        <span
                          className={`flex-shrink-0 text-[9px] font-mono px-1 py-0.5 rounded bg-white/5 mr-1.5 ${
                            LANG_COLORS[translation!.target_language] || "text-gray-400"
                          }`}
                        >
                          {LANG_LABELS[translation!.target_language] || translation!.target_language}
                        </span>
                        <span className="text-white/80">
                          {translation!.translated_content}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
