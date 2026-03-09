'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Subtitles, Settings, X,
  ChevronUp, ChevronDown, Loader2,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

// ── Types ─────────────────────────────────────────────
export interface CaptionLine {
  id: string
  speaker_name: string
  speaker_user_id: string
  content: string
  language: string
  is_final: boolean
  sequence_number: number
  timestamp_ms: number
  // Phase 3: optional translation fields
  translated_content?: string
  translated_language?: string
  translation_error?: boolean
}

interface CaptionPreferences {
  captions_enabled: boolean
  font_size: 'small' | 'medium' | 'large'
  position: 'top' | 'bottom'
  speaking_language: 'ko' | 'es'
}

export type TranslationDisplayMode = 'none' | 'translated_only' | 'original_and_translated'

interface TranslationPreferences {
  display_mode: TranslationDisplayMode
  target_language: 'ko' | 'es'
  auto_translate: boolean
}

interface CaptionOverlayProps {
  sessionId: string
  authToken: string
  speakerUid: number
  enabled: boolean
  onToggle: (enabled: boolean) => void
  preferences: CaptionPreferences
  onPreferencesChange: (prefs: Partial<CaptionPreferences>) => void
  translationPrefs?: TranslationPreferences
  onTranslationPrefsChange?: (prefs: Partial<TranslationPreferences>) => void
}

// ── Component ─────────────────────────────────────────
export default function CaptionOverlay({
  sessionId,
  authToken,
  speakerUid,
  enabled,
  onToggle,
  preferences,
  onPreferencesChange,
  translationPrefs,
  onTranslationPrefsChange,
}: CaptionOverlayProps) {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [captions, setCaptions] = useState<CaptionLine[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const captionTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Phase 3: translation defaults
  const displayMode = translationPrefs?.display_mode ?? 'original_and_translated'
  const targetLanguage = translationPrefs?.target_language ?? 'es'

  // Font size map
  const fontSizeClass: Record<string, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base md:text-lg',
  }

  // ── Connect to SSE stream ───────────────────────────
  useEffect(() => {
    if (!enabled || !authToken) {
      // Disconnect if disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setSseConnected(false)
      }
      return
    }

    // SSE doesn't natively support Authorization headers.
    // We use a polling fallback approach with fetch.
    let cancelled = false
    let lastSequence = 0
    const abortController = new AbortController()
    let retryCount = 0
    const MAX_RETRIES = 20

    const connectSSE = async () => {
      if (cancelled || retryCount >= MAX_RETRIES) return
      try {
        const response = await fetch(
          `/api/meet/sessions/${sessionId}/captions/stream?last_sequence=${lastSequence}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'text/event-stream',
            },
            signal: abortController.signal,
          }
        )

        if (!response.ok || !response.body) {
          console.error('[Caption SSE] Failed to connect:', response.status)
          setSseConnected(false)
          // Retry with exponential backoff
          if (!cancelled && retryCount < MAX_RETRIES) {
            retryCount++
            const delay = Math.min(3000 * Math.pow(1.5, retryCount - 1), 30000)
            setTimeout(connectSSE, delay)
          }
          return
        }

        setSseConnected(true)
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!cancelled) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process SSE events in buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete last line

          let currentEvent = ''
          let currentData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6).trim()
            } else if (line === '' && currentEvent && currentData) {
              // Process complete event
              handleSSEEvent(currentEvent, currentData)
              currentEvent = ''
              currentData = ''
            } else if (line.startsWith(':')) {
              // Comment/keepalive, ignore
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || cancelled) return
        console.warn('[Caption SSE] Connection error:', err.message)
        setSseConnected(false)
        // Retry with exponential backoff
        if (!cancelled && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = Math.min(3000 * Math.pow(1.5, retryCount - 1), 30000)
          setTimeout(connectSSE, delay)
        }
      }
    }

    const handleSSEEvent = (eventType: string, data: string) => {
      if (eventType === 'caption_partial' || eventType === 'caption_final') {
        try {
          const caption = JSON.parse(data) as CaptionLine
          lastSequence = Math.max(lastSequence, caption.sequence_number)

          setCaptions(prev => {
            // For partial events from same speaker, replace the last partial
            if (!caption.is_final) {
              const existingIdx = prev.findIndex(
                c => !c.is_final && c.speaker_user_id === caption.speaker_user_id
              )
              if (existingIdx >= 0) {
                const updated = [...prev]
                updated[existingIdx] = caption
                return updated
              }
              return [...prev.slice(-10), caption] // Keep last 10 + new
            }

            // For final events, remove the partial from same speaker and add final
            const filtered = prev.filter(
              c => !((!c.is_final) && c.speaker_user_id === caption.speaker_user_id)
            )
            const result = [...filtered, caption].slice(-15) // Keep last 15

            // Auto-remove final captions after 8 seconds
            const timeoutId = setTimeout(() => {
              setCaptions(current =>
                current.filter(c => c.id !== caption.id)
              )
            }, 8000)

            captionTimeoutRef.current.set(caption.id, timeoutId)
            return result
          })
        } catch {
          // Invalid JSON, ignore
        }
      } else if (eventType === 'session_ended') {
        setSseConnected(false)
      }
    }

    connectSSE()

    return () => {
      cancelled = true
      abortController.abort()
      setSseConnected(false)
      // Clear all auto-remove timeouts
      captionTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
      captionTimeoutRef.current.clear()
    }
  }, [enabled, authToken, sessionId])

  // ── Phase 3: Connect to translations SSE stream ─────
  useEffect(() => {
    if (!enabled || !authToken || displayMode === 'none') return

    let cancelled = false
    let lastTransSeq = 0
    const abortCtrl = new AbortController()
    let retryCount = 0
    const MAX_RETRIES = 20

    const connectTranslationSSE = async () => {
      if (cancelled || retryCount >= MAX_RETRIES) return
      try {
        const res = await fetch(
          `/api/meet/sessions/${sessionId}/translations/stream?last_sequence=${lastTransSeq}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'text/event-stream',
            },
            signal: abortCtrl.signal,
          }
        )

        if (!res.ok || !res.body) {
          if (!cancelled && retryCount < MAX_RETRIES) {
            retryCount++
            setTimeout(connectTranslationSSE, Math.min(3000 * Math.pow(1.5, retryCount - 1), 30000))
          }
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (!cancelled) {
          const { value, done } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })

          const lines = buf.split('\n')
          buf = lines.pop() || ''

          let curEvent = ''
          let curData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) curEvent = line.slice(7).trim()
            else if (line.startsWith('data: ')) curData = line.slice(6).trim()
            else if (line === '' && curEvent && curData) {
              if (curEvent === 'translation_final' || curEvent === 'translation_partial') {
                try {
                  const tEvt = JSON.parse(curData)
                  lastTransSeq = Math.max(lastTransSeq, tEvt.sequence_number ?? 0)

                  // Merge translation into existing caption
                  setCaptions(prev =>
                    prev.map(c =>
                      c.id === tEvt.caption_event_id
                        ? {
                            ...c,
                            translated_content: tEvt.translated_content,
                            translated_language: tEvt.translated_language,
                            translation_error: !!tEvt.translation_error,
                          }
                        : c
                    )
                  )
                } catch { /* ignore bad JSON */ }
              }
              curEvent = ''
              curData = ''
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || cancelled) return
        if (!cancelled && retryCount < MAX_RETRIES) {
          retryCount++
          setTimeout(connectTranslationSSE, Math.min(3000 * Math.pow(1.5, retryCount - 1), 30000))
        }
      }
    }

    connectTranslationSSE()

    return () => {
      cancelled = true
      abortCtrl.abort()
    }
  }, [enabled, authToken, sessionId, displayMode])

  // ── Clear captions when disabled ────────────────────
  useEffect(() => {
    if (!enabled) {
      setCaptions([])
    }
  }, [enabled])

  // ── Visible captions (deduplicated) ─────────────────
  const visibleCaptions = captions.filter(c => c.content.trim().length > 0)

  // ── Render ──────────────────────────────────────────
  if (!enabled && !showSettings) return null

  const positionClass = preferences.position === 'top'
    ? 'top-14 md:top-16'
    : 'bottom-16 md:bottom-20'

  return (
    <>
      {/* ─── Caption display ───────────────────── */}
      {enabled && visibleCaptions.length > 0 && (
        <div className={`absolute left-0 right-0 ${positionClass} z-20 pointer-events-none px-2 md:px-4`}>
          <div className="max-w-2xl mx-auto space-y-1">
            {visibleCaptions.slice(-4).map(caption => (
              <div
                key={`${caption.id}-${caption.is_final}`}
                className={`flex items-start gap-1.5 px-3 py-1.5 rounded-lg transition-opacity duration-300 ${
                  caption.is_final
                    ? 'bg-black/70 backdrop-blur-sm'
                    : 'bg-black/40 backdrop-blur-sm opacity-70'
                }`}
              >
                {/* Language flag */}
                <span className="text-[10px] mt-0.5 flex-shrink-0">
                  {caption.language === 'ko' ? '🇰🇷' : '🇪🇸'}
                </span>

                <div className="min-w-0 flex-1">
                  {/* Speaker name */}
                  <span className={`text-purple-300 font-medium ${
                    preferences.font_size === 'large' ? 'text-xs' : 'text-[10px]'
                  }`}>
                    {caption.speaker_name}
                  </span>

                  {/* Original caption text — show when mode is 'none' or 'original_and_translated' */}
                  {displayMode !== 'translated_only' && (
                    <p className={`text-white leading-snug ${fontSizeClass[preferences.font_size]} ${
                      !caption.is_final ? 'italic opacity-80' : ''
                    }`}>
                      {caption.content}
                    </p>
                  )}

                  {/* Translated text — show when mode is 'translated_only' or 'original_and_translated' */}
                  {displayMode !== 'none' && caption.translated_content && !caption.translation_error && (
                    <p className={`leading-snug ${fontSizeClass[preferences.font_size]} ${
                      displayMode === 'original_and_translated'
                        ? 'text-blue-300 mt-0.5'
                        : 'text-white'
                    } ${!caption.is_final ? 'italic opacity-80' : ''}`}>
                      <span className="text-[10px] mr-1">
                        {caption.translated_language === 'ko' ? '🇰🇷' : '🇪🇸'}
                      </span>
                      {caption.translated_content}
                    </p>
                  )}

                  {/* Fallback: if translation failed AND mode is translated_only, still show original */}
                  {displayMode === 'translated_only' && caption.translation_error && (
                    <p className={`text-yellow-300/80 leading-snug ${fontSizeClass[preferences.font_size]} ${
                      !caption.is_final ? 'italic opacity-80' : ''
                    }`}>
                      {caption.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Settings panel ────────────────────── */}
      {showSettings && (
        <div className="absolute bottom-20 md:bottom-24 right-2 md:right-4 z-30 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 p-3 w-56 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-200">
              {t('자막 설정', 'Configuración')}
            </span>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between py-1.5 border-b border-gray-700">
            <span className="text-xs text-gray-300">{t('자막 보기', 'Ver subtítulos')}</span>
            <button
              onClick={() => onToggle(!enabled)}
              className={`w-9 h-5 rounded-full transition-colors ${
                enabled ? 'bg-purple-500' : 'bg-gray-600'
              } relative`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Font size */}
          <div className="py-1.5 border-b border-gray-700">
            <span className="text-xs text-gray-300 block mb-1.5">{t('글자 크기', 'Tamaño')}</span>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => onPreferencesChange({ font_size: size })}
                  className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                    preferences.font_size === size
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="py-1.5 border-b border-gray-700">
            <span className="text-xs text-gray-300 block mb-1.5">{t('위치', 'Posición')}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onPreferencesChange({ position: 'top' })}
                className={`flex-1 py-1 rounded text-[10px] font-medium flex items-center justify-center gap-0.5 transition-colors ${
                  preferences.position === 'top'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <ChevronUp className="w-3 h-3" />
                {t('위', 'Arriba')}
              </button>
              <button
                onClick={() => onPreferencesChange({ position: 'bottom' })}
                className={`flex-1 py-1 rounded text-[10px] font-medium flex items-center justify-center gap-0.5 transition-colors ${
                  preferences.position === 'bottom'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <ChevronDown className="w-3 h-3" />
                {t('아래', 'Abajo')}
              </button>
            </div>
          </div>

          {/* Speaking language */}
          <div className="py-1.5 border-b border-gray-700">
            <span className="text-xs text-gray-300 block mb-1.5">{t('내 언어', 'Mi idioma')}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onPreferencesChange({ speaking_language: 'ko' })}
                className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                  preferences.speaking_language === 'ko'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                🇰🇷 한국어
              </button>
              <button
                onClick={() => onPreferencesChange({ speaking_language: 'es' })}
                className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                  preferences.speaking_language === 'es'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                🇪🇸 Español
              </button>
            </div>
          </div>

          {/* ── Phase 3: Translation settings ──────── */}
          {onTranslationPrefsChange && (
            <>
              {/* Translation display mode */}
              <div className="py-1.5 border-b border-gray-700">
                <span className="text-xs text-gray-300 block mb-1.5">
                  {t('번역 모드', 'Modo traducción')}
                </span>
                <div className="flex flex-col gap-1">
                  {([
                    { value: 'none', ko: '번역 없음', es: 'Sin traducción' },
                    { value: 'translated_only', ko: '번역만', es: 'Solo traducido' },
                    { value: 'original_and_translated', ko: '원문+번역', es: 'Original + Traducido' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onTranslationPrefsChange({ display_mode: opt.value })}
                      className={`py-1 px-2 rounded text-[10px] font-medium text-left transition-colors ${
                        displayMode === opt.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {t(opt.ko, opt.es)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target language — what the user wants to READ */}
              <div className="py-1.5">
                <span className="text-xs text-gray-300 block mb-1.5">
                  {t('번역 언어', 'Traducir a')}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onTranslationPrefsChange({ target_language: 'ko' })}
                    className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                      targetLanguage === 'ko'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    🇰🇷 한국어
                  </button>
                  <button
                    onClick={() => onTranslationPrefsChange({ target_language: 'es' })}
                    className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                      targetLanguage === 'es'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    🇪🇸 Español
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Connection status */}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${
              sseConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {sseConnected
              ? t('실시간 연결됨', 'Conectado en vivo')
              : t('연결 중...', 'Conectando...')
            }
          </div>
        </div>
      )}

      {/* ─── Caption toggle button (in controls bar) ── */}
      {/* This is rendered separately by the parent */}
    </>
  )
}

// ── Separate button component for the controls bar ────
export function CaptionToggleButton({
  enabled,
  onToggle,
  onSettingsClick,
}: {
  enabled: boolean
  onToggle: () => void
  onSettingsClick: () => void
}) {
  return (
    <div className="relative flex items-center">
      <button
        onClick={onToggle}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
          enabled
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
        title={enabled ? 'Disable captions' : 'Enable captions'}
      >
        {enabled ? <Subtitles className="w-5 h-5" /> : <Subtitles className="w-5 h-5 opacity-50" />}
      </button>
      <button
        onClick={onSettingsClick}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
      >
        <Settings className="w-3 h-3 text-gray-300" />
      </button>
    </div>
  )
}
