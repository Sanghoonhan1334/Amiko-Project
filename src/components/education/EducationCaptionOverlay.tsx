'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Subtitles, Settings, X, Loader2, Wifi, WifiOff,
  ChevronUp, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  CaptionLine,
  EducationCaptionPreferences,
  EducationTranslationPreferences,
  TranslationDisplayMode,
} from '@/hooks/useEducationCaptions'

// ── Language helpers ──────────────────────────────────────────────────────────

/** Human-readable name for a language code, bilingually */
function langLabel(code: string): string {
  const map: Record<string, string> = {
    ko: '한국어',
    es: 'Español',
    en: 'English',
    ja: '日本語',
    zh: '中文',
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
  }
  return map[code] ?? code.toUpperCase()
}

/** Returns a flag-like color class per detected language */
function languageBadgeClass(code: string): string {
  const map: Record<string, string> = {
    ko: 'bg-blue-500/80',
    es: 'bg-red-500/80',
    en: 'bg-green-600/80',
    ja: 'bg-rose-500/80',
    zh: 'bg-amber-500/80',
  }
  return map[code] ?? 'bg-gray-500/80'
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface EducationCaptionOverlayProps {
  /** Active caption lines from useEducationCaptions */
  captions: CaptionLine[]
  /** Whether the SSE stream is connected */
  sseConnected: boolean
  /** Whether the STT task is running server-side */
  sttActive: boolean
  /** Loading state for start/stop requests */
  sttLoading: boolean
  /** Error message from the last start/stop attempt */
  sttError: string | null
  /** Whether captions are globally visible */
  enabled: boolean
  /** Current user preferences */
  preferences: EducationCaptionPreferences
  /** Is the current user the instructor */
  isInstructor: boolean
  /** Phase 3 – translation */
  translationPrefs: EducationTranslationPreferences
  translationConnected: boolean
  onTranslationPrefsChange: (update: Partial<EducationTranslationPreferences>) => void
  /** Callbacks */
  onToggle: (enabled: boolean) => void
  onStartSTT: () => void
  onStopSTT: () => void
  onPreferencesChange: (update: Partial<EducationCaptionPreferences>) => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EducationCaptionOverlay({
  captions,
  sseConnected,
  sttActive,
  sttLoading,
  sttError,
  enabled,
  preferences,
  isInstructor,
  translationPrefs,
  translationConnected,
  onTranslationPrefsChange,
  onToggle,
  onStartSTT,
  onStopSTT,
  onPreferencesChange,
}: EducationCaptionOverlayProps) {
  // Derived: which text to show per line
  const resolveLineText = (line: CaptionLine) => {
    const mode: TranslationDisplayMode = translationPrefs.display_mode
    if (mode === 'translated_only') return line.translated_text ?? line.text
    return line.text // 'none' or 'original_and_translated' always show original first
  }
  const [showSettings, setShowSettings] = useState(false)
  const captionContainerRef = useRef<HTMLDivElement>(null)

  // Scroll captions into view when new ones arrive
  useEffect(() => {
    if (captionContainerRef.current) {
      captionContainerRef.current.scrollTop = captionContainerRef.current.scrollHeight
    }
  }, [captions])

  // Font-size map
  const fontSizeClass: Record<string, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base md:text-lg',
  }

  // Opacity helper
  const bgStyle = {
    backgroundColor: `rgba(0,0,0,${preferences.background_opacity})`,
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col select-none">
      {/* ── Caption lines ── */}
      {enabled && captions.length > 0 && (
        <div
          className={cn(
            'absolute left-0 right-0 px-4 pointer-events-none',
            preferences.position === 'bottom' ? 'bottom-20' : 'top-16'
          )}
        >
          <div
            ref={captionContainerRef}
            className="flex flex-col gap-1 max-h-36 overflow-hidden items-center"
          >
            {captions.map(line => (
              <div
                key={line.id}
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-1.5 transition-all duration-300',
                  fontSizeClass[preferences.font_size] ?? 'text-sm',
                  line.is_partial ? 'opacity-70 italic' : 'opacity-100'
                )}
                style={bgStyle}
              >
                {/* Language badge */}
                <span
                  className={cn(
                    'inline-block text-[10px] font-bold text-white rounded px-1 py-0 mr-1.5 leading-4 align-middle',
                    languageBadgeClass(line.language)
                  )}
                >
                  {langLabel(line.language)}
                </span>
                {/* Original / translated-only text */}
                <span className="text-white leading-relaxed">
                  {resolveLineText(line)}
                  {line.is_partial && <span className="animate-pulse ml-0.5">▌</span>}
                </span>
                {/* Show translated line below when mode is original_and_translated */}
                {translationPrefs.display_mode === 'original_and_translated' &&
                  !line.is_partial &&
                  line.translated_text && (
                    <div className="mt-0.5 flex items-start gap-1">
                      <span
                        className={cn(
                          'inline-block text-[10px] font-bold text-white rounded px-1 py-0 mr-0.5 leading-4 align-middle shrink-0',
                          languageBadgeClass(translationPrefs.target_language)
                        )}
                      >
                        {translationPrefs.target_language.toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          'leading-relaxed',
                          line.translation_error ? 'text-amber-300 text-[11px] italic' : 'text-green-200'
                        )}
                      >
                        {line.translated_text}
                      </span>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Controls bar (pointer-events-auto so it's clickable) ── */}
      <div
        className={cn(
          'absolute right-4 pointer-events-auto flex flex-col items-end gap-2',
          preferences.position === 'bottom' ? 'bottom-20' : 'top-16'
        )}
      >
        {/* Settings panel */}
        {showSettings && (
          <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-4 w-64 shadow-xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-white text-sm font-semibold flex items-center gap-1.5">
                <Subtitles className="w-4 h-4 text-primary" />
                Subtítulos
              </h4>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Cerrar configuración"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle on/off */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">Mostrar subtítulos</span>
              <button
                onClick={() => onToggle(!enabled)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                  enabled ? 'bg-primary' : 'bg-gray-600'
                )}
                role="switch"
                aria-checked={enabled}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                    enabled ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Font size */}
            <div className="space-y-1.5">
              <span className="text-gray-400 text-xs block">Tamaño de fuente</span>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => onPreferencesChange({ font_size: size })}
                    className={cn(
                      'flex-1 rounded-lg px-2 py-1 text-xs transition-colors',
                      preferences.font_size === size
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <span className="text-gray-400 text-xs block">Posición</span>
              <div className="flex gap-1">
                {(['top', 'bottom'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => onPreferencesChange({ position: pos })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors',
                      preferences.position === pos
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    {pos === 'top' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {pos === 'top' ? 'Arriba' : 'Abajo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Background opacity */}
            <div className="space-y-1.5">
              <span className="text-gray-400 text-xs block">
                Opacidad del fondo: {Math.round(preferences.background_opacity * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={preferences.background_opacity}
                onChange={e => onPreferencesChange({ background_opacity: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            {/* ── Translation settings ── */}
            <div className="border-t border-gray-700 pt-3 space-y-3">
              <p className="text-gray-400 text-xs font-medium">Traducción en vivo (DeepSeek)</p>

              {/* Display mode */}
              <div className="space-y-1.5">
                <span className="text-gray-400 text-xs block">Modo</span>
                <div className="flex flex-col gap-1">
                  {(
                    [
                      { value: 'none', label: '🚫 Desactivada' },
                      { value: 'translated_only', label: '💬 Solo traducción' },
                      { value: 'original_and_translated', label: '🔤 Original + traducción' },
                    ] as { value: TranslationDisplayMode; label: string }[]
                  ).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onTranslationPrefsChange({ display_mode: opt.value })}
                      className={cn(
                        'w-full rounded-lg px-3 py-1.5 text-xs text-left transition-colors',
                        translationPrefs.display_mode === opt.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target language */}
              {translationPrefs.display_mode !== 'none' && (
                <div className="space-y-1.5">
                  <span className="text-gray-400 text-xs block">Idioma destino</span>
                  <div className="flex gap-1">
                    {(
                      [
                        { value: 'ko', label: '한국어' },
                        { value: 'es', label: 'ES' },
                        { value: 'en', label: 'EN' },
                      ] as { value: 'ko' | 'es' | 'en'; label: string }[]
                    ).map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => onTranslationPrefsChange({ target_language: lang.value })}
                        className={cn(
                          'flex-1 rounded-lg px-2 py-1 text-xs transition-colors',
                          translationPrefs.target_language === lang.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Translation SSE status */}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    translationConnected ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'
                  )}
                />
                <span className="text-gray-500 text-xs">
                  {translationConnected ? 'Traducción activa' : 'Traducción inactiva'}
                </span>
              </div>
            </div>

            {/* Instructor: STT controls */}
            {isInstructor && (
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <p className="text-gray-400 text-xs font-medium">Transcripción (instructor)</p>

                {sttError && (
                  <p className="text-amber-400 text-xs bg-amber-400/10 rounded px-2 py-1">
                    {sttError}
                  </p>
                )}

                {sttActive ? (
                  <button
                    onClick={onStopSTT}
                    disabled={sttLoading}
                    className="w-full rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {sttLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Detener STT
                  </button>
                ) : (
                  <button
                    onClick={onStartSTT}
                    disabled={sttLoading}
                    className="w-full rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {sttLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Iniciar STT
                  </button>
                )}

                {/* STT status indicator */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      sttActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                    )}
                  />
                  <span className="text-gray-500 text-xs">
                    {sttActive ? 'STT activo' : 'STT inactivo'}
                  </span>
                </div>
              </div>
            )}

            {/* SSE connection status */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex items-center gap-1.5">
                {sseConnected
                  ? <Wifi className="w-3 h-3 text-green-400" />
                  : <WifiOff className="w-3 h-3 text-gray-500" />}
                <span className="text-xs text-gray-500">
                  {sseConnected ? 'Subtítulos conectados' : 'Subtítulos sin conexión'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setShowSettings(prev => !prev)}
          className={cn(
            'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg transition-all',
            enabled
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700/90',
            showSettings && 'ring-2 ring-primary/50'
          )}
          title="Configurar subtítulos"
        >
          {sttLoading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Subtitles className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">CC</span>
          {sttActive && enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}
