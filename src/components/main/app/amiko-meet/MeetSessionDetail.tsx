'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft, Calendar, Clock, Users, Globe,
  Video, User, Loader2, AlertCircle,
  UserPlus, UserMinus, ChevronRight,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

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

const MeetVideoRoom = dynamic<MeetVideoRoomProps>(() => import('./MeetVideoRoom'), { ssr: false })

interface MeetSession {
  id: string
  title: string
  topic: string | null
  description: string | null
  language: string
  scheduled_at: string
  duration_minutes: number
  max_participants: number
  current_participants: number
  status: string
  host_id: string
  host_name: string
  host_avatar: string | null
  agora_channel: string
}

interface Participant {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  status: string
  role: string
}

interface MeetSessionDetailProps {
  session: MeetSession
  onBack: () => void
}

export default function MeetSessionDetail({ session, onBack }: MeetSessionDetailProps) {
  const { language } = useLanguage()
  const { user, token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [detail, setDetail] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [joining, setJoining] = useState(false)
  const [inRoom, setInRoom] = useState(false)
  const [roomData, setRoomData] = useState<{
    token: string
    channel: string
    uid: number
    appId: string
  } | null>(null)
  const [accessStatus, setAccessStatus] = useState<{
    canJoin: boolean
    canJoinNow: boolean
    reason: string
    role: string
    monthlyUsage: { used: number; max: number }
  } | null>(null)

  // ── Fetch session detail ────────────────────────
  const loadDetail = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`/api/meet/sessions/${session.id}`, { headers })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setDetail(data.session)
      setParticipants(data.participants || [])

      if (user) {
        const me = (data.participants || []).find(
          (p: Participant) => p.user_id === user.id && p.status !== 'cancelled'
        )
        setIsEnrolled(!!me)
        setIsHost(data.session?.host_id === user.id)
      }
    } catch {
      // Use stub data from props
    } finally {
      setLoading(false)
    }
  }, [session.id, token, user])

  // ── Check access status ─────────────────────────
  const checkAccess = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/meet/sessions/${session.id}/access-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAccessStatus(data)
      }
    } catch {
      // non-critical
    }
  }, [session.id, token])

  useEffect(() => {
    loadDetail()
    checkAccess()
  }, [loadDetail, checkAccess])

  // ── Enroll / Cancel ─────────────────────────────
  const handleEnroll = async () => {
    if (!token) return
    setEnrolling(true)
    try {
      const res = await fetch(`/api/meet/sessions/${session.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t('등록 실패', 'Error al inscribirse'))
        return
      }
      setIsEnrolled(true)
      toast.success(t('등록 완료!', '¡Inscripción exitosa!'))
      loadDetail()
      checkAccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEnrolling(false)
    }
  }

  const handleCancelEnroll = async () => {
    if (!token) return
    setEnrolling(true)
    try {
      const res = await fetch(`/api/meet/sessions/${session.id}/enroll`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('취소 실패', 'Error al cancelar'))
        return
      }
      setIsEnrolled(false)
      toast.success(t('등록 취소됨', 'Inscripción cancelada'))
      loadDetail()
      checkAccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEnrolling(false)
    }
  }

  // ── Join video room ─────────────────────────────
  const handleJoinRoom = async () => {
    if (!token) return
    setJoining(true)
    try {
      const res = await fetch(`/api/meet/sessions/${session.id}/access-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t('입장 실패', 'Error al entrar'))
        return
      }
      setRoomData({
        token: data.token,
        channel: data.channel,
        uid: data.uid,
        appId: data.appId,
      })
      setInRoom(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setJoining(false)
    }
  }

  // ── Helpers ─────────────────────────────────────
  const formatLocalDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const langLabel: Record<string, string> = {
    ko: '🇰🇷 한국어',
    es: '🇪🇸 Español',
    mixed: language === 'ko' ? '🌐 혼합' : '🌐 Mixto',
  }

  const activeSession = detail || session
  const sessionStatus = activeSession.status
  const now = new Date()
  const scheduledTime = new Date(activeSession.scheduled_at)
  const canJoinNow = accessStatus?.canJoinNow || false

  // ── Video room view ─────────────────────────────
  if (inRoom && roomData) {
    return (
      <MeetVideoRoom
        channel={roomData.channel}
        token={roomData.token}
        uid={roomData.uid}
        appId={roomData.appId}
        sessionId={session.id}
        title={activeSession.title}
        durationMinutes={activeSession.duration_minutes}
        onLeave={() => {
          setInRoom(false)
          setRoomData(null)
          loadDetail()
          checkAccess()
        }}
      />
    )
  }

  // ── Loading state ───────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  // ── Main detail view ────────────────────────────
  return (
    <div className="w-full space-y-4">
      {/* ─── Back nav ──────────────────────────── */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('뒤로', 'Volver')}
      </button>

      {/* ─── Session info card ─────────────────── */}
      <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {/* Status bar */}
        <div className={`h-1.5 ${
          sessionStatus === 'live'
            ? 'bg-gradient-to-r from-red-500 to-orange-500'
            : sessionStatus === 'completed'
            ? 'bg-gray-300 dark:bg-gray-600'
            : 'bg-gradient-to-r from-purple-500 to-indigo-500'
        }`} />

        <div className="p-4 md:p-6 space-y-4">
          {/* Title + status */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                {activeSession.title}
              </h1>
              {activeSession.topic && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {activeSession.topic}
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              sessionStatus === 'live'
                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                : sessionStatus === 'completed'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
            }`}>
              {sessionStatus === 'live'
                ? '🔴 LIVE'
                : sessionStatus === 'completed'
                ? t('종료됨', 'Finalizada')
                : t('예정됨', 'Programada')}
            </span>
          </div>

          {/* Description */}
          {activeSession.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {activeSession.description}
            </p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-purple-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('일정', 'Fecha')}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {formatLocalDateTime(activeSession.scheduled_at)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <Clock className="w-4 h-4 text-indigo-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('시간', 'Duración')}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {activeSession.duration_minutes} min
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <Users className="w-4 h-4 text-blue-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('참가자', 'Participantes')}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {activeSession.current_participants}/{activeSession.max_participants}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <Globe className="w-4 h-4 text-green-500 mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('언어', 'Idioma')}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {langLabel[activeSession.language] || activeSession.language}
              </p>
            </div>
          </div>

          {/* Host info */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
            {activeSession.host_avatar ? (
              <img src={activeSession.host_avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-purple-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {activeSession.host_name}
              </p>
              <p className="text-xs text-gray-400">
                {t('세션 호스트', 'Anfitrión de la sesión')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Action buttons ────────────────────── */}
      {user && sessionStatus !== 'completed' && sessionStatus !== 'cancelled' && (
        <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700 space-y-4">
          {/* Monthly usage indicator */}
          {accessStatus && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Video className="w-3.5 h-3.5" />
              {t('이번 달 무료 세션:', 'Sesiones gratis este mes:')}
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {accessStatus.monthlyUsage.used}/{accessStatus.monthlyUsage.max}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {/* Enroll / Cancel button */}
            {!isHost && (
              isEnrolled ? (
                <Button
                  onClick={handleCancelEnroll}
                  disabled={enrolling}
                  variant="outline"
                  className="rounded-xl border-red-300 text-red-500 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {enrolling ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <UserMinus className="w-4 h-4 mr-1.5" />
                  )}
                  {t('등록 취소', 'Cancelar inscripción')}
                </Button>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling || activeSession.current_participants >= activeSession.max_participants}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                >
                  {enrolling ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1.5" />
                  )}
                  {t('세션 참가', 'Unirse a la sesión')}
                </Button>
              )
            )}

            {/* Join room button */}
            {(isEnrolled || isHost) && canJoinNow && (
              <Button
                onClick={handleJoinRoom}
                disabled={joining}
                className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white animate-pulse"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Video className="w-4 h-4 mr-1.5" />
                )}
                {t('입장하기', 'Entrar a la sala')}
              </Button>
            )}

            {/* Waiting message */}
            {(isEnrolled || isHost) && !canJoinNow && sessionStatus === 'scheduled' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                <Clock className="w-3.5 h-3.5" />
                {t(
                  '세션 시작 5분 전부터 입장 가능합니다.',
                  'Podrás entrar 5 minutos antes del inicio.'
                )}
              </div>
            )}

            {/* Session full message */}
            {!isHost && !isEnrolled && activeSession.current_participants >= activeSession.max_participants && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                <Users className="w-3.5 h-3.5" />
                {t(
                  '이 세션은 참가자가 가득 찼습니다.',
                  'La videollamada alcanzó el número de participantes completos.'
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ─── Participants list ─────────────────── */}
      {participants.length > 0 && (
        <Card className="p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {t('참가자', 'Participantes')} ({participants.filter(p => p.status !== 'cancelled').length})
          </h3>
          <div className="space-y-2">
            {participants
              .filter(p => p.status !== 'cancelled')
              .map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1.5">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-300 to-indigo-400 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {p.display_name}
                  </span>
                  {p.role === 'host' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                      {t('호스트', 'Anfitrión')}
                    </span>
                  )}
                  {p.status === 'joined' && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* ─── Not logged in ─────────────────────── */}
      {!user && (
        <Card className="p-4 text-center bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {t(
              '로그인하면 세션에 참여할 수 있습니다.',
              'Inicia sesión para participar.'
            )}
          </p>
          <Button
            onClick={() => window.location.href = '/sign-in'}
            className="bg-purple-500 hover:bg-purple-600 text-white text-sm"
          >
            {t('로그인', 'Iniciar sesión')}
          </Button>
        </Card>
      )}

      {/* ─── Session ended ─────────────────────── */}
      {sessionStatus === 'completed' && (
        <Card className="p-4 text-center dark:bg-gray-800 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('이 세션은 종료되었습니다.', 'Esta sesión ha finalizado.')}
          </p>
        </Card>
      )}
    </div>
  )
}
