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
}

interface CaptionPreferences {
  captions_enabled: boolean
  font_size: 'small' | 'medium' | 'large'
  position: 'top' | 'bottom'
  speaking_language: 'ko' | 'es'
}

interface CaptionOverlayProps {
  sessionId: string
  authToken: string
  speakerUid: number
  enabled: boolean
  onToggle: (enabled: boolean) => void
  preferences: CaptionPreferences
  onPreferencesChange: (prefs: Partial<CaptionPreferences>) => void
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
}: CaptionOverlayProps) {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [captions, setCaptions] = useState<CaptionLine[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const captionTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

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

                  {/* Caption text */}
                  <p className={`text-white leading-snug ${fontSizeClass[preferences.font_size]} ${
                    !caption.is_final ? 'italic opacity-80' : ''
                  }`}>
                    {caption.content}
                  </p>
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
          <div className="py-1.5">
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
