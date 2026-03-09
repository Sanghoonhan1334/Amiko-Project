'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Web Speech API types ──────────────────────────────
// These are available in the browser but not in TypeScript by default
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

// ── Caption event to send ─────────────────────────────
export interface CaptionEvent {
  content: string
  language: 'ko' | 'es'
  is_final: boolean
  speaker_uid: number
  timestamp_ms: number
}

// ── Hook: useSpeechToText ─────────────────────────────
export function useSpeechToText(options: {
  language: 'ko' | 'es'
  speakerUid: number
  enabled: boolean
  onCaption: (event: CaptionEvent) => void
  onError?: (error: string) => void
}) {
  const { language, speakerUid, enabled, onCaption, onError } = options
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const enabledRef = useRef(enabled)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const restartCountRef = useRef(0)
  const MAX_RESTARTS = 10

  // Track enabled state in ref for use in callbacks
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  // Check browser support
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  // Map language to BCP-47 lang code
  const getLangCode = useCallback((lang: 'ko' | 'es') => {
    return lang === 'ko' ? 'ko-KR' : 'es-419' // es-419 = Latin American Spanish
  }, [])

  // Start recognition
  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition not supported in this browser')
      return
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = getLangCode(language)
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Reset restart counter on successful speech recognition
        restartCountRef.current = 0
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript.trim()

          if (transcript) {
            onCaption({
              content: transcript,
              language,
              is_final: result.isFinal,
              speaker_uid: speakerUid,
              timestamp_ms: Date.now(),
            })
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'no-speech' and 'aborted' are expected — don't propagate as errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return
        }
        console.warn('[STT Error]', event.error, event.message)
        onError?.(event.error)
      }

      recognition.onend = () => {
        setIsListening(false)
        // Auto-restart if still enabled (browser may stop recognition after silence)
        // Use exponential backoff and max retry limit to prevent infinite loops
        if (enabledRef.current && restartCountRef.current < MAX_RESTARTS) {
          restartCountRef.current++
          const delay = Math.min(300 * Math.pow(1.5, restartCountRef.current - 1), 5000)
          restartTimeoutRef.current = setTimeout(() => {
            if (enabledRef.current) {
              startListening()
            }
          }, delay)
        } else if (restartCountRef.current >= MAX_RESTARTS) {
          console.warn('[STT] Max restarts reached, stopping automatic restart')
          onError?.('Speech recognition stopped after too many restarts')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: any) {
      console.error('[STT Start Error]', err)
      onError?.(err.message || 'Failed to start speech recognition')
    }
  }, [isSupported, language, speakerUid, onCaption, onError, getLangCode])

  // Stop recognition
  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Auto start/stop based on enabled prop
  useEffect(() => {
    if (enabled && isSupported) {
      startListening()
    } else {
      stopListening()
    }

    return () => {
      stopListening()
    }
  }, [enabled, isSupported]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update language on an active recognition
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      // Must restart to change language
      stopListening()
      if (enabled) {
        const timeout = setTimeout(() => startListening(), 200)
        return () => clearTimeout(timeout)
      }
    }
  }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  }
}
