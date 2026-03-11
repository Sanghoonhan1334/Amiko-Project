"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptionPreferences {
  captions_enabled: boolean;
  font_size: "small" | "medium" | "large";
  position: "top" | "bottom";
  speaking_language: "ko" | "es" | "en";
}

interface CaptionSettingsProps {
  visible: boolean;
  onClose: () => void;
  preferences: CaptionPreferences;
  onUpdate: (prefs: Partial<CaptionPreferences>) => void;
}

/**
 * Settings panel for caption preferences (font size, position, language).
 * Shown as a popover/modal from the caption toggle button.
 */
export default function CaptionSettings({
  visible,
  onClose,
  preferences,
  onUpdate,
}: CaptionSettingsProps) {
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div className="absolute bottom-24 right-4 z-40 bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 w-72 shadow-2xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white text-sm font-medium">
          {t("vcMarketplace.captions.settings")}
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between py-2 border-b border-gray-700">
        <span className="text-gray-300 text-xs">
          {t("vcMarketplace.captions.showSubtitles")}
        </span>
        <button
          onClick={() => onUpdate({ captions_enabled: !preferences.captions_enabled })}
          className={`w-10 h-5 rounded-full transition-colors ${
            preferences.captions_enabled ? "bg-purple-500" : "bg-gray-600"
          } relative`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              preferences.captions_enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Speaking Language */}
      <div className="py-2 border-b border-gray-700">
        <span className="text-gray-300 text-xs block mb-1.5">
          {t("vcMarketplace.captions.yourLanguage")}
        </span>
        <div className="flex gap-1.5">
          {(["es", "ko", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => onUpdate({ speaking_language: lang })}
              className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                preferences.speaking_language === lang
                  ? "bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {lang === "es" ? "Español" : lang === "ko" ? "한국어" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="py-2 border-b border-gray-700">
        <span className="text-gray-300 text-xs block mb-1.5">
          {t("vcMarketplace.captions.fontSize")}
        </span>
        <div className="flex gap-1.5">
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              onClick={() => onUpdate({ font_size: size })}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                preferences.font_size === size
                  ? "bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {size === "small" ? "A" : size === "medium" ? "A+" : "A++"}
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="py-2">
        <span className="text-gray-300 text-xs block mb-1.5">
          {t("vcMarketplace.captions.position")}
        </span>
        <div className="flex gap-1.5">
          {(["bottom", "top"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onUpdate({ position: pos })}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                preferences.position === pos
                  ? "bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {pos === "bottom"
                ? t("vcMarketplace.captions.bottom")
                : t("vcMarketplace.captions.top")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
