"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GlossaryMatch {
  term: string;
  translation: string;
  description?: string;
  category: string;
  rule: string;
}

interface GlossaryTooltipProps {
  /** Matches found in the last translated caption */
  matches: GlossaryMatch[];
  /** Position: bottom-right corner above controls */
  position?: "bottom-right" | "top-right";
}

/**
 * Floating panel that shows cultural glossary matches
 * detected in the current caption/translation.
 * Displayed inside the VideoRoom during active sessions.
 */
export default function GlossaryTooltip({
  matches,
  position = "bottom-right",
}: GlossaryTooltipProps) {
  const { language } = useLanguage();
  const ko = language === "ko";
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show tooltip when new matches arrive, auto-hide after 8s if not expanded
  useEffect(() => {
    if (matches.length === 0) {
      setVisible(false);
      return;
    }
    setDismissed(false);
    setVisible(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!expanded) {
      timeoutRef.current = setTimeout(() => setVisible(false), 8000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [matches, expanded]);

  if (!visible || dismissed || matches.length === 0) return null;

  const categoryColors: Record<string, string> = {
    food: "bg-orange-500/20 text-orange-300",
    honorific: "bg-yellow-500/20 text-yellow-300",
    name: "bg-blue-500/20 text-blue-300",
    expression: "bg-green-500/20 text-green-300",
    cultural: "bg-purple-500/20 text-purple-300",
    music: "bg-pink-500/20 text-pink-300",
    fashion: "bg-cyan-500/20 text-cyan-300",
    place: "bg-red-500/20 text-red-300",
    general: "bg-gray-500/20 text-gray-300",
  };

  const ruleLabels: Record<string, string> = ko
    ? {
        translate: "번역",
        no_translate: "원문 유지",
        preserve: "보존",
        transliterate: "음역",
        annotate: "주석",
      }
    : {
        translate: "Traducir",
        no_translate: "No traducir",
        preserve: "Preservar",
        transliterate: "Transliterar",
        annotate: "Anotar",
      };

  const positionClass =
    position === "top-right"
      ? "top-14 right-4"
      : "bottom-24 right-4";

  return (
    <div
      className={`absolute ${positionClass} z-10 max-w-xs animate-in slide-in-from-right-5 duration-300`}
    >
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700/50 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className="text-white text-xs font-medium flex-1 text-left">
            {ko ? "문화 용어" : "Términos Culturales"}
            <span className="ml-1 text-gray-400">({matches.length})</span>
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="text-gray-500 hover:text-gray-300 ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </button>

        {/* Compact view - show first match inline */}
        {!expanded && matches.length > 0 && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white font-medium">{matches[0].term}</span>
              <span className="text-gray-500">→</span>
              <span className="text-gray-300">{matches[0].translation}</span>
            </div>
          </div>
        )}

        {/* Expanded list */}
        {expanded && (
          <div className="max-h-48 overflow-y-auto border-t border-gray-700">
            {matches.map((match, i) => (
              <div
                key={`${match.term}-${i}`}
                className="px-3 py-2 border-b border-gray-700/50 last:border-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-xs font-semibold">
                    {match.term}
                  </span>
                  <span className="text-gray-500 text-xs">→</span>
                  <span className="text-gray-300 text-xs">
                    {match.translation}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    className={`text-[9px] px-1.5 py-0 ${
                      categoryColors[match.category] || categoryColors.general
                    }`}
                  >
                    {match.category}
                  </Badge>
                  <span className="text-gray-500 text-[9px]">
                    {ruleLabels[match.rule] || match.rule}
                  </span>
                </div>
                {match.description && (
                  <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                    {match.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
