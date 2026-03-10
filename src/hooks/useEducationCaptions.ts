'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EducationCaptionEvent {
  id: string
  speaker_uid: number
  speaker_user_id: string | null
  source_language: string
  text: string
  is_partial: boolean
  sequence_number: number
  timestamp_ms: number
}

export interface CaptionLine {
  id: string
  speaker_uid: number
  speaker_user_id: string | null
  source_language: string
  text: string
  is_partial: boolean
  sequence_number: number
  /** ISO 639-1 code detected/reported by Agora */
  language: string
  // Phase 3 – translation fields (populated after DeepSeek translates the final)
  translated_text?: string
  translated_language?: string
  translation_error?: string
}

export interface EducationCaptionPreferences {
  captions_enabled: boolean
  font_size: 'small' | 'medium' | 'large'
  position: 'top' | 'bottom'
  background_opacity: number
}

// ── Translation types ──────────────────────────────────────────────────────────

export type TranslationDisplayMode = 'none' | 'translated_only' | 'original_and_translated'

export interface EducationTranslationPreferences {
  display_mode: TranslationDisplayMode
  target_language: 'ko' | 'es' | 'en'
  auto_translate: boolean
}

const DEFAULT_TRANSLATION_PREFS: EducationTranslationPreferences = {
  display_mode: 'original_and_translated',
  target_language: 'es',
  auto_translate: true,
}

const DEFAULT_PREFS: EducationCaptionPreferences = {
  captions_enabled: true,
  font_size: 'medium',
  position: 'bottom',
  background_opacity: 0.7,
}

// ── SSE helper ────────────────────────────────────────────────────────────────

/**
 * Async generator that yields {event, data} tuples from a text/event-stream
 * response body. Stops when the stream is done or abort fires.
 */
async function* readSSEStream(
  body: ReadableStream<Uint8Array>,
  cancelled: () => boolean
): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (!cancelled()) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      let currentEvent = ''
      let currentData = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          currentData = line.slice(6).trim()
        } else if (line === '' && currentEvent && currentData) {
          yield { event: currentEvent, data: currentData }
          currentEvent = ''
          currentData = ''
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * useEducationCaptions
 *
 * Manages the full lifecycle of real-time STT captions for an education session:
 *  - Connects to the SSE caption stream when enabled
 *  - Maintains the list of active caption lines (partials replaced by finals)
 *  - Exposes start/stop controls for the instructor
 *  - Loads and persists user caption preferences
 *
 * @param sessionId   Education session UUID
 * @param authToken   JWT Bearer token for API auth
 * @param isInstructor Whether the current user is the instructor (can start/stop STT)
 * @param enabled      External toggle – pass false to disconnect SSE without changing prefs
 */
export function useEducationCaptions(
  sessionId: string | null,
  authToken: string | null,
  isInstructor: boolean,
  enabled: boolean
) {
  const [captions, setCaptions] = useState<CaptionLine[]>([])
  const [sseConnected, setSseConnected] = useState(false)
  const [sttActive, setSttActive] = useState(false)
  const [sttLoading, setSttLoading] = useState(false)
  const [sttError, setSttError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<EducationCaptionPreferences>(DEFAULT_PREFS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // Phase 3 – translation state
  const [translationConnected, setTranslationConnected] = useState(false)
  const [translationPrefs, setTranslationPrefs] = useState<EducationTranslationPreferences>(DEFAULT_TRANSLATION_PREFS)

  // Internal refs to avoid stale closures
  const cancelledRef = useRef(false)
  const abortCtrlRef = useRef<AbortController | null>(null)
  const translationAbortRef = useRef<AbortController | null>(null)
  const captionTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastSequenceRef = useRef(0)
  const lastTranslationSeqRef = useRef(0)
  const retryCountRef = useRef(0)
  const translationRetryRef = useRef(0)
  const MAX_RETRIES = 20

  // ── Load preferences on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!authToken) return

    fetch('/api/education/caption-preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences) {
          setPreferences(prev => ({ ...prev, ...data.preferences }))
        }
        setPrefsLoaded(true)
      })
      .catch(() => setPrefsLoaded(true))
  }, [authToken])

  // ── Load translation preferences on mount ─────────────────────────────
  useEffect(() => {
    if (!authToken) return

    fetch('/api/education/translation-preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences) {
          setTranslationPrefs(prev => ({ ...prev, ...data.preferences }))
        }
      })
      .catch(() => { /* non-fatal */ })
  }, [authToken])

  // ── SSE connection ─────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (!sessionId || !authToken || cancelledRef.current) return
    if (retryCountRef.current >= MAX_RETRIES) {
      console.warn('[Education Captions] Max SSE retries reached')
      return
    }

    const ctrl = new AbortController()
    abortCtrlRef.current = ctrl

    const url = `/api/education/sessions/${sessionId}/captions/stream?last_sequence=${lastSequenceRef.current}`

    fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'text/event-stream',
      },
      signal: ctrl.signal,
    })
      .then(async response => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE connect failed: ${response.status}`)
        }

        setSseConnected(true)
        retryCountRef.current = 0

        for await (const { event, data } of readSSEStream(response.body, () => cancelledRef.current)) {
          handleSSEEvent(event, data)
        }
      })
      .catch(err => {
        if (err.name === 'AbortError' || cancelledRef.current) return
        console.warn('[Education Captions] SSE error:', err.message)
        setSseConnected(false)

        // Retry with capped exponential backoff
        if (!cancelledRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++
          const delay = Math.min(3000 * Math.pow(1.5, retryCountRef.current - 1), 30_000)
          setTimeout(connectSSE, delay)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, authToken])

  // ── Translation SSE connection ─────────────────────────────────────────
  const connectTranslationSSE = useCallback((prefs: EducationTranslationPreferences) => {
    if (!sessionId || !authToken || cancelledRef.current) return
    if (prefs.display_mode === 'none' || !prefs.auto_translate) return
    if (translationRetryRef.current >= MAX_RETRIES) {
      console.warn('[Education Translations] Max SSE retries reached')
      return
    }

    const ctrl = new AbortController()
    translationAbortRef.current = ctrl

    const url = `/api/education/sessions/${sessionId}/translations/stream?last_sequence=${lastTranslationSeqRef.current}`

    fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'text/event-stream',
      },
      signal: ctrl.signal,
    })
      .then(async response => {
        if (!response.ok || !response.body) {
          throw new Error(`Translation SSE connect failed: ${response.status}`)
        }

        setTranslationConnected(true)
        translationRetryRef.current = 0

        for await (const { event, data } of readSSEStream(response.body, () => cancelledRef.current)) {
          if (event === 'translation_final') {
            try {
              const evt = JSON.parse(data)
              lastTranslationSeqRef.current = Math.max(lastTranslationSeqRef.current, evt.sequence_number ?? 0)
              // Merge translation into matching caption line
              setCaptions(prev =>
                prev.map(c =>
                  c.id === evt.caption_event_id
                    ? {
                        ...c,
                        translated_text: evt.translated_text ?? c.translated_text,
                        translated_language: evt.target_language ?? c.translated_language,
                        translation_error: evt.translation_error,
                      }
                    : c
                )
              )
            } catch {
              // ignore bad JSON
            }
          } else if (event === 'session_ended') {
            setTranslationConnected(false)
          }
        }
      })
      .catch(err => {
        if (err.name === 'AbortError' || cancelledRef.current) return
        console.warn('[Education Translations] SSE error:', err.message)
        setTranslationConnected(false)

        if (!cancelledRef.current && translationRetryRef.current < MAX_RETRIES) {
          translationRetryRef.current++
          const delay = Math.min(3000 * Math.pow(1.5, translationRetryRef.current - 1), 30_000)
          setTimeout(() => connectTranslationSSE(prefs), delay)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, authToken])

  // Process individual SSE events
  const handleSSEEvent = useCallback((eventType: string, rawData: string) => {
    if (eventType === 'caption_partial' || eventType === 'caption_final') {
      try {
        const evt = JSON.parse(rawData) as EducationCaptionEvent
        lastSequenceRef.current = Math.max(lastSequenceRef.current, evt.sequence_number)

        const line: CaptionLine = {
          id: evt.id,
          speaker_uid: evt.speaker_uid,
          speaker_user_id: evt.speaker_user_id,
          source_language: evt.source_language,
          text: evt.text,
          is_partial: evt.is_partial,
          sequence_number: evt.sequence_number,
          language: evt.source_language,
        }

        setCaptions(prev => {
          if (line.is_partial) {
            // Replace existing partial from same speaker, or append
            const existingIdx = prev.findIndex(
              c => c.is_partial && c.speaker_uid === line.speaker_uid
            )
            if (existingIdx >= 0) {
              const updated = [...prev]
              updated[existingIdx] = line
              return updated
            }
            return [...prev.slice(-10), line]
          }

          // Final: remove partial from same speaker, append final
          const filtered = prev.filter(
            c => !(c.is_partial && c.speaker_uid === line.speaker_uid)
          )
          const result = [...filtered, line].slice(-15) // keep last 15 finals

          // Auto-remove final captions after 8 seconds
          const timer = setTimeout(() => {
            setCaptions(current => current.filter(c => c.id !== line.id))
            captionTimersRef.current.delete(line.id)
          }, 8000)
          captionTimersRef.current.set(line.id, timer)

          return result
        })
      } catch {
        // Invalid JSON – ignore
      }
    } else if (eventType === 'session_ended') {
      setSseConnected(false)
    }
  }, [])

  // ── Start/stop SSE when enabled changes ───────────────────────────────
  useEffect(() => {
    if (!enabled || !sessionId || !authToken) {
      // Disconnect SSE
      cancelledRef.current = true
      abortCtrlRef.current?.abort()
      translationAbortRef.current?.abort()
      setSseConnected(false)
      setTranslationConnected(false)
      return
    }

    // Connect captions SSE
    cancelledRef.current = false
    retryCountRef.current = 0
    translationRetryRef.current = 0
    connectSSE()
    connectTranslationSSE(translationPrefs)

    return () => {
      cancelledRef.current = true
      abortCtrlRef.current?.abort()
      translationAbortRef.current?.abort()
      setSseConnected(false)
      setTranslationConnected(false)
      captionTimersRef.current.forEach(t => clearTimeout(t))
      captionTimersRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId, authToken, connectSSE, connectTranslationSSE])

  // ── Reconnect translation SSE when prefs change ───────────────────────
  useEffect(() => {
    if (!enabled || !sessionId || !authToken) return

    // Abort old translation stream and reconnect with new prefs
    translationAbortRef.current?.abort()
    setTranslationConnected(false)
    translationRetryRef.current = 0

    if (translationPrefs.display_mode !== 'none' && translationPrefs.auto_translate) {
      connectTranslationSSE(translationPrefs)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationPrefs.display_mode, translationPrefs.auto_translate, translationPrefs.target_language])

  // ── Instructor: start STT ─────────────────────────────────────────────
  const startSTT = useCallback(async (languages?: string[]) => {
    if (!isInstructor || !sessionId || !authToken) return
    setSttLoading(true)
    setSttError(null)
    try {
      const res = await fetch(`/api/education/sessions/${sessionId}/captions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(languages?.length ? { languages } : {}),
      })

      const data = await res.json()

      if (!res.ok && res.status !== 502) {
        // 502 = STT failed but class continues — not a fatal error
        setSttError(data.error || 'Failed to start captions')
      } else {
        setSttActive(data.status === 'active' || data.fallback === true)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setSttError(`Network error: ${message}`)
    } finally {
      setSttLoading(false)
    }
  }, [isInstructor, sessionId, authToken])

  // ── Instructor: stop STT ──────────────────────────────────────────────
  const stopSTT = useCallback(async () => {
    if (!isInstructor || !sessionId || !authToken) return
    setSttLoading(true)
    setSttError(null)
    try {
      const res = await fetch(`/api/education/sessions/${sessionId}/captions/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setSttActive(false)
      } else {
        setSttError(data.error || 'Failed to stop captions')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setSttError(`Network error: ${message}`)
    } finally {
      setSttLoading(false)
    }
  }, [isInstructor, sessionId, authToken])

  // ── Update preferences (local + remote) ──────────────────────────────
  const updatePreferences = useCallback(async (update: Partial<EducationCaptionPreferences>) => {
    setPreferences(prev => ({ ...prev, ...update }))

    if (!authToken) return
    try {
      await fetch('/api/education/caption-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(update),
      })
    } catch {
      // Non-fatal: local state already updated
    }
  }, [authToken])

  // ── Update translation preferences (local + remote) ──────────────────
  const updateTranslationPreferences = useCallback(async (update: Partial<EducationTranslationPreferences>) => {
    setTranslationPrefs(prev => ({ ...prev, ...update }))

    if (!authToken) return
    try {
      await fetch('/api/education/translation-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(update),
      })
    } catch {
      // Non-fatal: local state already updated
    }
  }, [authToken])

  // ── Clear captions ────────────────────────────────────────────────────
  const clearCaptions = useCallback(() => {
    captionTimersRef.current.forEach(t => clearTimeout(t))
    captionTimersRef.current.clear()
    setCaptions([])
  }, [])

  return {
    // Caption lines to render
    captions,
    // SSE connection state
    sseConnected,
    // STT task state (instructor-relevant)
    sttActive,
    sttLoading,
    sttError,
    // User preferences
    preferences,
    prefsLoaded,
    // Actions
    startSTT,
    stopSTT,
    updatePreferences,
    clearCaptions,
    // Phase 3 – translation
    translationConnected,
    translationPrefs,
    updateTranslationPreferences,
  }
}
