'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import { Button } from '@/components/ui/button'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageCircle, Clock, Users, Send, X, User,
  AlertTriangle, Loader2,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import CaptionOverlay, { CaptionToggleButton } from './CaptionOverlay'
import { useSpeechToText, CaptionEvent } from './useSpeechToText'

interface MeetVideoRoomProps {
  channel: string
  token: string
  uid: number
  appId: string
  sessionId: string
  title: string
  durationMinutes?: number
  onLeave: () => void
}

interface ChatMessage {
  id: string
  user_name: string
  content: string
  created_at: string
}

export default function MeetVideoRoom({
  channel,
  token,
  uid,
  appId,
  sessionId,
  title,
  durationMinutes = 20,
  onLeave,
}: MeetVideoRoomProps) {
  const { language } = useLanguage()
  const { token: authToken } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatPollRef = useRef<NodeJS.Timeout | null>(null)

  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [hasMic, setHasMic] = useState(true)
  const [hasCamera, setHasCamera] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const [warning, setWarning] = useState<string | null>(null)

  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [sendingChat, setSendingChat] = useState(false)

  // ── Caption / STT state ─────────────────────────
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [showCaptionSettings, setShowCaptionSettings] = useState(false)
  const [captionPrefs, setCaptionPrefs] = useState<{
    captions_enabled: boolean
    font_size: 'small' | 'medium' | 'large'
    position: 'top' | 'bottom'
    speaking_language: 'ko' | 'es'
  }>({
    captions_enabled: true,
    font_size: 'medium',
    position: 'bottom',
    speaking_language: language === 'ko' ? 'ko' : 'es',
  })

  // ── Phase 3: Translation preferences ────────────
  const [translationPrefs, setTranslationPrefs] = useState<{
    display_mode: 'none' | 'translated_only' | 'original_and_translated'
    target_language: 'ko' | 'es'
    auto_translate: boolean
  }>({
    display_mode: 'original_and_translated',
    target_language: language === 'ko' ? 'es' : 'ko', // read the OTHER language
    auto_translate: true,
  })

  // ── Timer polling from server ───────────────────
  const pollTimer = useCallback(async () => {
    if (!authToken) return
    try {
      const res = await fetch(`/api/meet/sessions/${sessionId}/timer`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (mountedRef.current) {
        setTimeLeft(Math.max(0, data.remaining_seconds))
        if (data.is_expired && mountedRef.current) {
          handleLeave()
        }
        // Show warnings
        if (data.warnings) {
          if (data.warnings.one_minute) setWarning(t('1분 남았습니다!', '¡Queda 1 minuto!'))
          else if (data.warnings.two_minutes) setWarning(t('2분 남았습니다!', '¡Quedan 2 minutos!'))
          else if (data.warnings.five_minutes) setWarning(t('5분 남았습니다.', 'Quedan 5 minutos.'))
          else setWarning(null)
        }
      }
    } catch {
      // Non-critical
    }
  }, [authToken, sessionId])

  // ── Chat polling ────────────────────────────────
  const lastChatRef = useRef<string | null>(null)

  const pollChat = useCallback(async () => {
    if (!authToken) return
    try {
      const url = lastChatRef.current
        ? `/api/meet/sessions/${sessionId}/chat?after=${encodeURIComponent(lastChatRef.current)}`
        : `/api/meet/sessions/${sessionId}/chat`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const msgs: ChatMessage[] = data.messages || []
      if (msgs.length > 0 && mountedRef.current) {
        if (lastChatRef.current) {
          // Append new messages
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = msgs.filter(m => !existingIds.has(m.id))
            if (newMsgs.length > 0 && !showChat) {
              setUnreadCount(c => c + newMsgs.length)
            }
            return [...prev, ...newMsgs]
          })
        } else {
          setChatMessages(msgs)
        }
        lastChatRef.current = msgs[msgs.length - 1].created_at
      }
    } catch {
      // Non-critical
    }
  }, [authToken, sessionId, showChat])

  // ── Speech-to-text: send each caption event to backend ──
  const handleCaptionEvent = useCallback(async (event: CaptionEvent) => {
    if (!authToken) return
    try {
      await fetch(`/api/meet/sessions/${sessionId}/captions/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: event.content,
          language: event.language,
          is_final: event.is_final,
          speaker_uid: event.speaker_uid,
          timestamp_ms: event.timestamp_ms,
        }),
      })
    } catch {
      // Non-critical: don't break the call
    }
  }, [authToken, sessionId])

  const { isListening: sttListening, isSupported: sttSupported } = useSpeechToText({
    language: captionPrefs.speaking_language,
    speakerUid: uid,
    enabled: captionsEnabled && connected && isAudioOn,
    onCaption: handleCaptionEvent,
  })

  // ── Load caption preferences & start STT task on connect ──
  useEffect(() => {
    if (!connected || !authToken) return

    // Load caption preferences
    fetch('/api/users/me/caption-preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences && mountedRef.current) {
          setCaptionPrefs(prev => ({ ...prev, ...data.preferences }))
          setCaptionsEnabled(data.preferences.captions_enabled ?? true)
        }
      })
      .catch(() => {})

    // Load translation preferences
    fetch('/api/users/me/translation-preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences && mountedRef.current) {
          setTranslationPrefs(prev => ({ ...prev, ...data.preferences }))
        }
      })
      .catch(() => {})

    // Start captions task for the session
    fetch(`/api/meet/sessions/${sessionId}/captions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }).catch(() => {})
  }, [connected, authToken, sessionId])

  // ── Save caption prefs when they change ─────────
  const updateCaptionPrefs = useCallback((patch: Partial<typeof captionPrefs>) => {
    setCaptionPrefs(prev => ({ ...prev, ...patch }))
    if (authToken) {
      fetch('/api/users/me/caption-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(patch),
      }).catch(() => {})
    }
  }, [authToken])

  const toggleCaptions = useCallback((val: boolean) => {
    setCaptionsEnabled(val)
    updateCaptionPrefs({ captions_enabled: val })
  }, [updateCaptionPrefs])

  // ── Phase 3: Save translation prefs ─────────────
  const updateTranslationPrefs = useCallback((patch: Partial<typeof translationPrefs>) => {
    setTranslationPrefs(prev => ({ ...prev, ...patch }))
    if (authToken) {
      fetch('/api/users/me/translation-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(patch),
      }).catch(() => {})
    }
  }, [authToken])

  // ── Initialize Agora & join ─────────────────────
  useEffect(() => {
    mountedRef.current = true
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    const init = async () => {
      try {
        client.on('user-joined', (user) => {
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev
            return [...prev, user]
          })
        })

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType)
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? user : u))
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? user : u))
          }
        })

        client.on('user-left', (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        })

        await client.join(appId, channel, token, uid)
        if (!mountedRef.current) return

        // Create audio track
        let audioTrack: IMicrophoneAudioTrack | null = null
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
          if (!mountedRef.current) { audioTrack.close(); return }
        } catch {
          if (mountedRef.current) setHasMic(false)
        }

        // Create video track
        let videoTrack: ICameraVideoTrack | null = null
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack()
          if (!mountedRef.current) { videoTrack?.close(); audioTrack?.close(); return }
        } catch {
          if (mountedRef.current) setHasCamera(false)
        }

        if (!mountedRef.current) {
          audioTrack?.close()
          videoTrack?.close()
          return
        }

        if (audioTrack) setLocalAudioTrack(audioTrack)
        if (videoTrack) setLocalVideoTrack(videoTrack)

        const tracks = [audioTrack, videoTrack].filter(Boolean) as any[]
        if (tracks.length > 0) await client.publish(tracks)
        if (!mountedRef.current) return

        if (videoTrack && localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        setConnected(true)

        // Report join
        fetch(`/api/meet/sessions/${sessionId}/presence/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            device_info: {
              platform: navigator.platform,
              language: navigator.language,
              screen: `${screen.width}x${screen.height}`,
            },
          }),
        }).catch(() => {})
      } catch (err: any) {
        if (err?.code === 'OPERATION_ABORTED') return
        if (mountedRef.current) setError(err.message || 'Connection failed')
      }
    }

    init()

    // Start timer polling (every 15 seconds)
    timerRef.current = setInterval(pollTimer, 15000)
    pollTimer()

    // Start chat polling (every 3 seconds)
    chatPollRef.current = setInterval(pollChat, 3000)
    pollChat()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (chatPollRef.current) clearInterval(chatPollRef.current)

      const cleanup = async () => {
        try {
          const c = clientRef.current
          if (c) {
            const localTracks = c.localTracks || []
            for (const track of localTracks) {
              track.stop()
              track.close()
            }
            await c.leave()
          }
        } catch {}
      }
      cleanup()
    }
  }, [appId, channel, token, uid, sessionId, authToken])

  // ── Play local video when ref/track changes ─────
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current && isVideoOn) {
      localVideoTrack.play(localVideoRef.current)
    }
  }, [localVideoTrack, isVideoOn])

  // ── Scroll chat to bottom ───────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── Toggle audio/video ──────────────────────────
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioOn)
      setIsAudioOn(!isAudioOn)
    }
  }

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoOn)
      setIsVideoOn(!isVideoOn)
    }
  }

  // ── Leave room ─────────────────────────────────
  const handleLeave = async () => {
    mountedRef.current = false
    if (timerRef.current) clearInterval(timerRef.current)
    if (chatPollRef.current) clearInterval(chatPollRef.current)

    try {
      // Note: Do NOT call /captions/stop here — other participants
      // are still in the session. Captions task stays active until
      // the session ends or the session is completed by the timer.

      // Report leave
      await fetch(`/api/meet/sessions/${sessionId}/presence/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }).catch(() => {})

      const c = clientRef.current
      if (c) {
        const tracks = c.localTracks || []
        for (const track of tracks) {
          track.stop()
          track.close()
        }
        await c.leave()
      }
    } catch {}

    onLeave()
  }

  // ── Send chat message ───────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || !authToken || sendingChat) return
    setSendingChat(true)
    try {
      const res = await fetch(`/api/meet/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: chatInput.trim() }),
      })
      if (res.ok) {
        setChatInput('')
        pollChat() // Immediately fetch new messages
      }
    } catch {}
    setSendingChat(false)
  }

  // ── Format time remaining ──────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const timerColor = timeLeft <= 60 ? 'text-red-500' : timeLeft <= 120 ? 'text-orange-500' : timeLeft <= 300 ? 'text-yellow-500' : 'text-white'

  // ── Render remote user video ────────────────────
  const RemoteVideo = ({ user }: { user: IAgoraRTCRemoteUser }) => {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
      if (user.videoTrack && ref.current) {
        user.videoTrack.play(ref.current)
      }
      return () => {
        user.videoTrack?.stop()
      }
    }, [user.videoTrack])

    return (
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
        <div
          ref={ref}
          className="w-full h-full"
          style={{ minHeight: '120px' }}
        />
        {!user.videoTrack && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-7 h-7 text-gray-400" />
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-[10px] text-white">
          {t('참가자', 'Participante')} {String(user.uid).slice(-4)}
        </div>
      </div>
    )
  }

  // ── Error view ──────────────────────────────────
  if (error) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{error}</p>
        <Button onClick={onLeave} variant="outline" className="rounded-xl">
          {t('돌아가기', 'Volver')}
        </Button>
      </div>
    )
  }

  // ── Loading state ───────────────────────────────
  if (!connected) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('연결 중...', 'Conectando...')}
        </p>
      </div>
    )
  }

  // ── Main room view ──────────────────────────────
  return (
    <div className="w-full space-y-0 -mt-4">
      {/* ─── Top bar ───────────────────────────── */}
      <div className="bg-gray-900 rounded-t-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white truncate max-w-[200px]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-300">
            <Users className="w-3.5 h-3.5" />
            {1 + remoteUsers.length}
          </div>
          <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timerColor}`}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* ─── Warning banner ────────────────────── */}
      {warning && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 font-medium animate-pulse">
          ⏰ {warning}
        </div>
      )}

      {/* ─── Video grid (with caption overlay) ─── */}
      <div className="relative bg-gray-900 p-2 md:p-4">
        {/* Caption overlay */}
        <CaptionOverlay
          sessionId={sessionId}
          authToken={authToken || ''}
          speakerUid={uid}
          enabled={captionsEnabled}
          onToggle={toggleCaptions}
          preferences={captionPrefs}
          onPreferencesChange={updateCaptionPrefs}
          translationPrefs={translationPrefs}
          onTranslationPrefsChange={updateTranslationPrefs}
        />
        {showCaptionSettings && (
          <div className="absolute inset-0 z-40" onClick={() => setShowCaptionSettings(false)} />
        )}
        <div className={`grid gap-2 md:gap-3 ${
          remoteUsers.length === 0
            ? 'grid-cols-1'
            : remoteUsers.length <= 1
            ? 'grid-cols-1 md:grid-cols-2'
            : remoteUsers.length <= 3
            ? 'grid-cols-2'
            : 'grid-cols-2 md:grid-cols-3'
        }`}>
          {/* Local video */}
          <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
            <div
              ref={localVideoRef}
              className="w-full h-full"
              style={{ minHeight: '120px' }}
            />
            {(!isVideoOn || !hasCamera) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-[10px] text-white">
              {t('나', 'Yo')}
            </div>
            {!isAudioOn && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Remote videos */}
          {remoteUsers.map(user => (
            <RemoteVideo key={user.uid} user={user} />
          ))}
        </div>
      </div>

      {/* ─── Chat panel (overlay) ──────────────── */}
      {showChat && (
        <div className="bg-gray-900 border-t border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
            <span className="text-xs font-medium text-gray-300">
              {t('채팅', 'Chat')}
            </span>
            <button onClick={() => { setShowChat(false); setUnreadCount(0) }}>
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
          <div className="h-32 md:h-48 overflow-y-auto px-4 py-2 space-y-1.5">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                {t('메시지가 없습니다.', 'Sin mensajes aún.')}
              </p>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className="text-xs">
                  <span className="font-semibold text-purple-400">{msg.user_name}</span>
                  <span className="text-gray-400 ml-1.5">{msg.content}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder={t('메시지 입력...', 'Escribe un mensaje...')}
              maxLength={300}
              className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || sendingChat}
              className="text-purple-400 hover:text-purple-300 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Controls bar ──────────────────────── */}
      <div className="bg-gray-900 rounded-b-2xl px-4 py-3 flex items-center justify-center gap-3 md:gap-4">
        <button
          onClick={toggleAudio}
          disabled={!hasMic}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
            !isAudioOn || !hasMic
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isAudioOn && hasMic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          disabled={!hasCamera}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
            !isVideoOn || !hasCamera
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isVideoOn && hasCamera ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Caption toggle */}
        {sttSupported && (
          <CaptionToggleButton
            enabled={captionsEnabled}
            onToggle={() => toggleCaptions(!captionsEnabled)}
            onSettingsClick={() => setShowCaptionSettings(prev => !prev)}
          />
        )}

        <button
          onClick={() => { setShowChat(!showChat); if (!showChat) setUnreadCount(0) }}
          className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={handleLeave}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
