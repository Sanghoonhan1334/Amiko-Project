"use client";

import { useEffect, useRef } from "react";

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
 * Shows the last few caption events, fading older ones out.
 * Partials render in italic; finals render solid.
 */
export default function CaptionOverlay({
  captions,
  position = "bottom",
  fontSize = "medium",
  visible,
  currentUid,
}: CaptionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest caption
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [captions]);

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
        className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-h-36 overflow-y-auto space-y-1"
      >
        {displayCaptions.map((caption, idx) => {
          const isLatest = idx === displayCaptions.length - 1;
          const isOwn = caption.speaker_uid === currentUid;
          const opacity = isLatest ? "opacity-100" : idx === displayCaptions.length - 2 ? "opacity-80" : "opacity-50";
          const langColor = LANG_COLORS[caption.language] || LANG_COLORS.unknown;

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

              {/* Speaker + text */}
              <div className={`${FONT_SIZES[fontSize]} min-w-0`}>
                {caption.speaker_name && (
                  <span className={`font-medium mr-1 ${isOwn ? "text-purple-400" : "text-cyan-400"}`}>
                    {caption.speaker_name}:
                  </span>
                )}
                <span
                  className={`text-white ${
                    caption.is_final ? "font-normal" : "italic text-white/70"
                  }`}
                >
                  {caption.content}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
