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
  MessageCircle, Users, Send, GraduationCap, ArrowLeft, X, Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JoinData {
  channelName: string
  token: string
  appId: string
  isInstructor: boolean
  allowRecording: boolean
  session: {
    id: string
    title: string
    session_number: number
    course_id: string
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

  const [joinData, setJoinData] = useState<JoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

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

  // Join the class session
  useEffect(() => {
    if (!user?.id || !sessionId) return

    const joinSession = async () => {
      try {
        const res = await fetch('/api/education/session/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, user_id: user.id })
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Cannot join class')
          setLoading(false)
          return
        }

        setJoinData(data)
        setLoading(false)
      } catch (err) {
        setError('Failed to join class')
        setLoading(false)
      }
    }

    joinSession()
  }, [sessionId, user?.id])

  // Initialize Agora
  const initAgora = useCallback(async () => {
    if (!joinData) return

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

      // Join channel
      const uid = await client.join(
        joinData.appId,
        joinData.channelName,
        joinData.token,
        null
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
      setJoined(true)
    } catch (err) {
      console.error('Agora error:', err)
      setError('Failed to connect to video call')
    }
  }, [joinData])

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

  // Leave call
  const leaveClass = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <p className="text-white/60 text-sm">{te('education.liveClass.connecting')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto px-4 space-y-4">
          <GraduationCap className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <p className="text-lg font-medium text-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {te('education.form.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  if (!joined && joinData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {te('education.session.classNumber', { number: joinData.session.session_number })}
            </h2>
            {joinData.session.title && (
              <p className="text-white/60 text-sm mt-1">{joinData.session.title}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {joinData.isInstructor ? te('education.course.instructor') : te('education.course.enrolled')}
          </Badge>
          <Button size="lg" onClick={initAgora} className="px-8">
            <Video className="w-5 h-5 mr-2" />
            {joinData.isInstructor ? te('education.session.startClass') : te('education.session.joinClass')}
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
          <Badge variant="secondary" className="text-xs gap-1">
            <Users className="w-3 h-3" />
            {participantCount}
          </Badge>
        </div>
      </div>

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
            title={recording ? 'Detener grabación' : te('education.session.recording')}
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
