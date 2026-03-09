'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff,
  MessageCircle, Users, Send, GraduationCap, ArrowLeft, X, Circle,
  Clock, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionAccessStatus, SessionAccessToken, SessionTimerState } from '@/types/education'

// Agora token data used once the user is inside the class
interface JoinData {
  channelName: string
  token: string
  uid: number
  appId: string
  isInstructor: boolean
  allowRecording: boolean
  session: {
    id: string
    title: string | null
    session_number: number
    course_id: string
    duration_minutes: number
  }
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: Date
}

export default function LiveClassPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { te } = useEducationTranslation()

  // Pre-room: access status
  const [accessStatus, setAccessStatus] = useState<SessionAccessStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState('')

  // In-room state (after token obtained)
  const [joinData, setJoinData] = useState<JoinData | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joined, setJoined] = useState(false)

  // Countdown for "too early" state
  const [countdown, setCountdown] = useState<number | null>(null)

  // Timer (backend-controlled class duration)
  const [timerData, setTimerData] = useState<SessionTimerState | null>(null)

  // Media states
  const [audioMuted, setAudioMuted] = useState(false)
  const [videoMuted, setVideoMuted] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [recording, setRecording] = useState(false)

  // Chat
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [participantCount, setParticipantCount] = useState(1)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Agora refs
  const clientRef = useRef<ReturnType<typeof import('agora-rtc-sdk-ng').default.createClient> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localTracksRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const screenTrackRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideosRef = useRef<HTMLDivElement>(null)

  // ────────────────────────────────────────────────────────────────────────
  // STEP 1 — Check access status on mount (no Agora yet, just metadata)
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !sessionId) return

    const checkAccess = async () => {
      setStatusLoading(true)
      setStatusError('')
      try {
        const res = await fetch(`/api/education/sessions/${sessionId}/access-status`, {
          headers: { 'Content-Type': 'application/json' }
        })
        const data: SessionAccessStatus = await res.json()

        if (!res.ok) {
          setStatusError((data as { error?: string }).error || te('education.liveClass.connecting'))
          setStatusLoading(false)
          return
        }

        setAccessStatus(data)

        // If too early, start countdown from window_opens_at
        if (data.reason === 'too_early' && data.window_opens_at) {
          const opensAt = new Date(data.window_opens_at).getTime()
          setCountdown(Math.max(0, Math.floor((opensAt - Date.now()) / 1000)))
        }
      } catch {
        setStatusError(te('education.liveClass.connecting'))
      } finally {
        setStatusLoading(false)
      }
    }

    checkAccess()
  }, [user?.id, sessionId])

  // Countdown ticker for "too early" state
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(tick)
          // Re-check access when countdown expires
          if (user?.id && sessionId) {
            fetch(`/api/education/sessions/${sessionId}/access-status`)
              .then(r => r.json())
              .then((d: SessionAccessStatus) => setAccessStatus(d))
              .catch(() => null)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [countdown, user?.id, sessionId])

  // ────────────────────────────────────────────────────────────────────────
  // STEP 2 — Obtain Agora token (called when user clicks "Join Class")
  // ────────────────────────────────────────────────────────────────────────
  const fetchAccessToken = useCallback(async (): Promise<JoinData | null> => {
    if (!user?.id || !sessionId) return null
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch(`/api/education/sessions/${sessionId}/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data: SessionAccessToken = await res.json()

      if (!res.ok) {
        const errMsg = (data as { error?: string }).error || te('education.liveClass.connecting')
        setJoinError(errMsg)
        setJoining(false)
        return null
      }

      return {
        channelName: data.channel,
        token: data.token,
        uid: data.uid,
        appId: data.app_id,
        isInstructor: data.is_instructor,
        allowRecording: data.allow_recording,
        session: {
          id: data.session.id,
          title: accessStatus?.title ?? null,
          session_number: data.session.session_number,
          course_id: accessStatus?.course_id ?? '',
          duration_minutes: data.session.duration_minutes
        }
      }
    } catch {
      setJoinError(te('education.liveClass.connecting'))
      setJoining(false)
      return null
    }
  }, [user?.id, sessionId, accessStatus, te])

  // ────────────────────────────────────────────────────────────────────────
  // STEP 3 — Initialize Agora RTC and register presence
  // Called with the JoinData received from /access-token
  // ────────────────────────────────────────────────────────────────────────
  const initAgora = useCallback(async (data: JoinData) => {
    setJoinData(data)

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Listen for remote user events
      client.on('user-published', async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType)

        if (mediaType === 'video') {
          const remoteVideoContainer = document.createElement('div')
          remoteVideoContainer.id = `remote-video-${remoteUser.uid}`
          remoteVideoContainer.className = 'relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden'
          remoteVideosRef.current?.appendChild(remoteVideoContainer)
          remoteUser.videoTrack?.play(remoteVideoContainer)
        }

        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play()
        }

        setParticipantCount(prev => prev + 1)
      })

      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'video') {
          const el = document.getElementById(`remote-video-${remoteUser.uid}`)
          el?.remove()
        }
      })

      client.on('user-left', (remoteUser) => {
        const el = document.getElementById(`remote-video-${remoteUser.uid}`)
        el?.remove()
        setParticipantCount(prev => Math.max(1, prev - 1))
      })

      // Join channel with the deterministic UID from the token server
      await client.join(
        data.appId,
        data.channelName,
        data.token,
        data.uid
      )

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      localTracksRef.current = [audioTrack, videoTrack]

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current)
      }

      // Publish
      await client.publish([audioTrack, videoTrack])

      // Register presence (non-blocking — don't fail the call if this fails)
      fetch(`/api/education/sessions/${data.session.id}/presence/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('[Education] presence/join failed:', err))

      setJoined(true)
      setJoining(false)
    } catch (err) {
      console.error('Agora error:', err)
      setJoinError(te('education.liveClass.connecting'))
      setJoining(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, te])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localTracksRef.current.forEach(track => {
        track.stop()
        track.close()
      })
      clientRef.current?.leave()
    }
  }, [])

  // ────────────────────────────────────────────────────────────────────────
  // TIMER — poll backend for session duration state (backend is source of truth)
  // ────────────────────────────────────────────────────────────────────────
  const autoClosedRef = useRef(false)
  useEffect(() => {
    if (!joined || !sessionId) return

    const fetchTimer = async () => {
      try {
        const res = await fetch(`/api/education/sessions/${sessionId}/timer`)
        if (res.ok) {
          const data: SessionTimerState = await res.json()
          setTimerData(data)
          // Auto-leave when backend confirms session has ended and we haven't left yet
          if (data.warnings.ended && data.status !== 'live' && !autoClosedRef.current) {
            autoClosedRef.current = true
            // Clean up Agora tracks
            localTracksRef.current.forEach(track => { track.stop(); track.close() })
            await clientRef.current?.leave()
            // Register departure
            fetch(`/api/education/sessions/${sessionId}/presence/leave`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).catch(() => null)
            // Navigate back to the course page
            setTimeout(() => {
              router.push(joinData?.session.course_id ? `/education/course/${joinData.session.course_id}` : '/education')
            }, 800)
          }
        }
      } catch {
        // Non-fatal — timer is informational
      }
    }

    fetchTimer()
    const interval = setInterval(fetchTimer, 30_000)
    return () => clearInterval(interval)
  }, [joined, sessionId, router, joinData])

  // Toggle audio
  const toggleAudio = async () => {
    const audioTrack = localTracksRef.current[0]
    if (audioTrack) {
      await audioTrack.setEnabled(!audioMuted ? false : true)
      setAudioMuted(!audioMuted)
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    const videoTrack = localTracksRef.current[1]
    if (videoTrack) {
      await videoTrack.setEnabled(!videoMuted ? false : true)
      setVideoMuted(!videoMuted)
    }
  }

  // Leave call — stores presence/leave on the backend
  const leaveClass = async () => {
    // Notify backend of departure (attendance calculation)
    if (joinData?.session.id) {
      fetch(`/api/education/sessions/${joinData.session.id}/presence/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('[Education] presence/leave failed:', err))
    }
    // If instructor, stop recording first
    if (recording && joinData?.isInstructor) {
      await toggleRecording()
    }
    // Clean up screen sharing
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current.close()
      screenTrackRef.current = null
    }
    localTracksRef.current.forEach(track => {
      track.stop()
      track.close()
    })
    await clientRef.current?.leave()
    router.push(`/education/course/${joinData?.session.course_id || ''}`)
  }

  // End class (instructor only) - marks session as completed
  const endClassSession = async () => {
    if (!joinData?.isInstructor || !user?.id) return
    if (!confirm('¿Estás seguro de que deseas terminar la clase?')) return

    try {
      const res = await fetch('/api/education/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id
        })
      })

      if (res.ok) {
        // Send system message to chat
        await fetch('/api/education/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: user.id,
            message: '📢 La clase ha terminado. ¡Gracias por participar!',
            message_type: 'system'
          })
        })
      }
    } catch (err) {
      console.error('End class error:', err)
    }

    // Leave the call
    await leaveClass()
  }

  // Toggle recording (instructor only)
  const toggleRecording = async () => {
    if (!joinData?.isInstructor || !joinData?.allowRecording) return
    try {
      const action = recording ? 'stop' : 'start'
      const res = await fetch('/api/education/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          session_id: sessionId,
          channel_name: joinData.channelName,
          token: joinData.token,
          uid: 999999 // recording bot UID
        })
      })
      const data = await res.json()
      if (res.ok) {
        setRecording(data.recording_active)
      }
    } catch (err) {
      console.error('Recording error:', err)
    }
  }

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!clientRef.current) return

    try {
      if (screenSharing) {
        // Stop screen sharing
        if (screenTrackRef.current) {
          await clientRef.current.unpublish(screenTrackRef.current)
          screenTrackRef.current.stop()
          screenTrackRef.current.close()
          screenTrackRef.current = null
        }

        // Re-publish camera video
        const videoTrack = localTracksRef.current[1]
        if (videoTrack) {
          await clientRef.current.publish(videoTrack)
          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current)
          }
        }
        setScreenSharing(false)
      } else {
        // Start screen sharing
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          {
            encoderConfig: '1080p_1',
          },
          'disable' // Don't capture screen audio
        )

        // Handle when user clicks "Stop sharing" in browser UI
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack
        track.on('track-ended', async () => {
          await clientRef.current?.unpublish(track)
          track.stop()
          track.close()
          screenTrackRef.current = null

          // Re-publish camera
          const videoTrack = localTracksRef.current[1]
          if (videoTrack) {
            await clientRef.current?.publish(videoTrack)
            if (localVideoRef.current) {
              videoTrack.play(localVideoRef.current)
            }
          }
          setScreenSharing(false)
        })

        // Unpublish camera video and publish screen instead
        const videoTrack = localTracksRef.current[1]
        if (videoTrack) {
          await clientRef.current.unpublish(videoTrack)
        }

        await clientRef.current.publish(track)
        screenTrackRef.current = track

        // Show screen share in local video element
        if (localVideoRef.current) {
          track.play(localVideoRef.current)
        }

        setScreenSharing(true)
      }
    } catch (err) {
      console.error('Screen share error:', err)
      setScreenSharing(false)
    }
  }

  // Send chat message (persisted to DB)
  const sendMessage = async () => {
    if (!chatInput.trim() || !user?.id) return
    const messageText = chatInput
    setChatInput('')

    // Optimistic UI update
    const tempId = Date.now().toString()
    setChatMessages(prev => [...prev, {
      id: tempId,
      userId: user.id,
      userName: user.email?.split('@')[0] || 'User',
      message: messageText,
      timestamp: new Date()
    }])
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    // Persist to database
    try {
      await fetch('/api/education/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id,
          message: messageText,
          message_type: 'text'
        })
      })
    } catch (err) {
      console.error('Failed to persist chat message:', err)
    }
  }

  // Load persisted chat messages and poll for new ones
  useEffect(() => {
    if (!joined || !sessionId) return

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/education/chat?sessionId=${sessionId}`)
        const data = await res.json()
        if (data.messages) {
          setChatMessages(data.messages.map((m: { id: string; user_id: string; user_name: string; message: string; created_at: string }) => ({
            id: m.id,
            userId: m.user_id,
            userName: m.user_name,
            message: m.message,
            timestamp: new Date(m.created_at)
          })))
        }
      } catch (err) {
        console.error('Failed to load chat messages:', err)
      }
    }

    loadMessages()

    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const lastMsg = chatMessages[chatMessages.length - 1]
        const after = lastMsg ? new Date(lastMsg.timestamp).toISOString() : undefined
        const url = after
          ? `/api/education/chat?sessionId=${sessionId}&after=${after}`
          : `/api/education/chat?sessionId=${sessionId}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.messages?.length > 0) {
          const newMsgs = data.messages
            .filter((m: { user_id: string }) => m.user_id !== user?.id) // Don't duplicate own messages
            .map((m: { id: string; user_id: string; user_name: string; message: string; created_at: string }) => ({
              id: m.id,
              userId: m.user_id,
              userName: m.user_name,
              message: m.message,
              timestamp: new Date(m.created_at)
            }))
          if (newMsgs.length > 0) {
            setChatMessages(prev => [...prev, ...newMsgs])
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }
        }
      } catch {
        // Silently fail polling
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, sessionId])

  // ── Join handler — fetch token then init Agora ──────────────────────────
  const handleJoinClass = useCallback(async () => {
    const tokenData = await fetchAccessToken()
    if (tokenData) {
      await initAgora(tokenData)
    }
  }, [fetchAccessToken, initAgora])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
    if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
    return `${s}s`
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Loading access-status check
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <p className="text-white/60 text-sm">{te('education.liveClass.connecting')}</p>
        </div>
      </div>
    )
  }

  // 2. Hard error (not enrolled, network error)
  if (statusError || (accessStatus && !accessStatus.is_enrolled)) {
    const message = statusError || te('education.liveClass.connecting')
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto px-4 space-y-4">
          <GraduationCap className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <p className="text-lg font-medium text-foreground">{message}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {te('education.form.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  // 3. Pre-room waiting area (not yet joined Agora)
  if (!joined && accessStatus) {
    const canEnter = accessStatus.can_enter
    const isTooEarly = accessStatus.reason === 'too_early'
    const isInstructor = accessStatus.viewer_role === 'instructor'

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              {te('education.session.classNumber', { number: accessStatus.session_number })}
            </h2>
            {accessStatus.title && (
              <p className="text-white/60 text-sm mt-1">{accessStatus.title}</p>
            )}
          </div>

          <Badge variant="secondary" className="text-xs">
            {isInstructor ? te('education.course.instructor') : te('education.course.enrolled')}
          </Badge>

          {/* Too early — countdown */}
          {isTooEarly && countdown !== null && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-6 py-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{te('education.session.minutesBefore', { minutes: Math.ceil((countdown ?? 0) / 60) })}</span>
              </div>
              <p className="text-3xl font-mono font-bold text-white">{formatCountdown(countdown ?? 0)}</p>
              <p className="text-white/50 text-xs">
                {new Date(accessStatus.window_opens_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Session ended / unavailable */}
          {(accessStatus.reason === 'session_ended' || accessStatus.reason === 'session_unavailable' || accessStatus.reason === 'window_closed') && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{te('education.liveClass.classEnded')}</span>
            </div>
          )}

          {/* Join error */}
          {joinError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          {/* Join button */}
          {canEnter && (
            <Button
              size="lg"
              onClick={handleJoinClass}
              disabled={joining}
              className="px-8 w-full"
            >
              <Video className="w-5 h-5 mr-2" />
              {joining
                ? te('education.liveClass.connecting')
                : isInstructor
                  ? te('education.session.startClass')
                  : te('education.session.joinClass')}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white/40 hover:text-white/80">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {te('education.form.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-medium">
            {te('education.liveClass.title')} — {te('education.session.classNumber', { number: joinData?.session.session_number || 0 })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Backend-driven timer */}
          {timerData && timerData.remaining_seconds > 0 && (
            <Badge
              variant={timerData.warnings.closing_5min ? 'destructive' : 'secondary'}
              className={cn('text-xs font-mono gap-1', timerData.warnings.closing_5min && 'animate-pulse')}
            >
              <Clock className="w-3 h-3" />
              {formatTimer(timerData.remaining_seconds)}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs gap-1">
            <Users className="w-3 h-3" />
            {participantCount}
          </Badge>
        </div>
      </div>

      {/* Close-warning banner */}
      {timerData?.warnings.closing_10min && !timerData.warnings.ended && (
        <div className={cn(
          'flex items-center justify-center gap-2 py-1.5 text-sm font-medium',
          timerData.warnings.closing_1min
            ? 'bg-red-600 text-white'
            : timerData.warnings.closing_5min
              ? 'bg-amber-600 text-white'
              : 'bg-amber-500/20 text-amber-300'
        )}>
          <Clock className="w-4 h-4" />
          {timerData.warnings.closing_1min
            ? te('education.liveClass.closingIn1min')
            : timerData.warnings.closing_5min
              ? te('education.liveClass.closingIn5min')
              : te('education.liveClass.closingIn10min')}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-auto">
            {/* Local video */}
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
              <div
                ref={localVideoRef}
                className="w-full h-full"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-0.5 text-white text-xs">
                {joinData?.isInstructor ? '🎓 ' : ''}
                {user?.email?.split('@')[0] || 'You'}
              </div>
              {videoMuted && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>

            {/* Remote videos container */}
            <div ref={remoteVideosRef} className="contents" />
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900/50">
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <h4 className="text-white text-sm font-medium">{te('education.liveClass.chat')}</h4>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={cn(
                  'text-sm',
                  msg.userId === user?.id ? 'text-right' : ''
                )}>
                  <span className="text-primary text-xs font-medium">{msg.userName}</span>
                  <p className={cn(
                    'mt-0.5 px-3 py-1.5 rounded-lg inline-block max-w-[90%] text-left',
                    msg.userId === user?.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-white'
                  )}>
                    {msg.message}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={te('education.liveClass.sendMessage')}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <Button size="icon" onClick={sendMessage} className="flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900/50">
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <h4 className="text-white text-sm font-medium">{te('education.liveClass.participants')} ({participantCount})</h4>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Current user (self) */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {(user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    {user?.email?.split('@')[0] || 'You'}
                    {joinData?.isInstructor && <span className="ml-1 text-xs text-purple-400">🎓</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {joinData?.isInstructor ? te('education.instructor.title') : te('education.student.title')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {audioMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-green-400" />}
                  {videoMuted ? <VideoOff className="w-3 h-3 text-red-400" /> : <Video className="w-3 h-3 text-green-400" />}
                </div>
              </div>

              {/* Remote participants */}
              {participantCount > 1 && Array.from({ length: participantCount - 1 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/30">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium">
                    P{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{te('education.liveClass.participants')} {i + 2}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-gray-900/80 border-t border-gray-800">
        <Button
          variant={audioMuted ? 'destructive' : 'secondary'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleAudio}
          title={audioMuted ? te('education.liveClass.unmuteAudio') : te('education.liveClass.muteAudio')}
        >
          {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          variant={videoMuted ? 'destructive' : 'secondary'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleVideo}
          title={videoMuted ? te('education.liveClass.unmuteVideo') : te('education.liveClass.muteVideo')}
        >
          {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>

        {/* Recording button - instructor only */}
        {joinData?.isInstructor && joinData?.allowRecording && (
          <Button
            variant={recording ? 'destructive' : 'secondary'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={toggleRecording}
            title={recording ? te('education.stopRecording') : te('education.session.recording')}
          >
            <Circle className={cn('w-5 h-5', recording && 'fill-current animate-pulse')} />
          </Button>
        )}

        {/* Screen Share button */}
        <Button
          variant={screenSharing ? 'default' : 'secondary'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleScreenShare}
          title={screenSharing ? te('education.liveClass.stopSharing') : te('education.liveClass.shareScreen')}
        >
          {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        {/* End Class button (instructor) or Leave button (student) */}
        {joinData?.isInstructor ? (
          <Button
            variant="destructive"
            className="rounded-full h-14 px-6 gap-2"
            onClick={endClassSession}
            title={te('education.session.endClass')}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-sm font-medium">{te('education.session.endClass')}</span>
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={leaveClass}
            title={te('education.liveClass.leaveClass')}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        )}

        <Button
          variant={showChat ? 'default' : 'secondary'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => { setShowChat(!showChat); setShowParticipants(false) }}
          title={te('education.liveClass.chat')}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        <Button
          variant={showParticipants ? 'default' : 'secondary'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => { setShowParticipants(!showParticipants); setShowChat(false) }}
          title={te('education.liveClass.participants')}
        >
          <Users className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
