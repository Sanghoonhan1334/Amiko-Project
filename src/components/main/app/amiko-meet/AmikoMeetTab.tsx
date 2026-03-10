'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Video, Plus, Calendar, Clock, Users, Globe, ChevronRight,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import CreateMeetModal from './CreateMeetModal'
import MeetSessionCard from './MeetSessionCard'
import MeetSessionDetail from './MeetSessionDetail'

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

export default function AmikoMeetTab() {
  const { language } = useLanguage()
  const { user, token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [sessions, setSessions] = useState<MeetSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedSession, setSelectedSession] = useState<MeetSession | null>(null)
  const [monthlyUsage, setMonthlyUsage] = useState({ used: 0, max: 2 })

  // ── Load sessions ───────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/meet/sessions')
      if (!res.ok) throw new Error('Failed to load sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Check monthly usage ────────────────────────────
  const checkUsage = useCallback(async () => {
    if (!token) return
    try {
      // Fetch any session to check monthly stats via enrollment check
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const res = await fetch('/api/meet/sessions?status=all&limit=100')
      if (!res.ok) return
      // We'll get exact usage from enrollment attempts
    } catch {
      // non-critical
    }
  }, [token])

  useEffect(() => {
    loadSessions()
    checkUsage()
  }, [loadSessions, checkUsage])

  // ── Helpers ─────────────────────────────────────────
  const formatLocalDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatLocalTime = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled')
  const liveSessions = sessions.filter(s => s.status === 'live')

  // ── Session detail view ─────────────────────────────
  if (selectedSession) {
    return (
      <MeetSessionDetail
        session={selectedSession}
        onBack={() => {
          setSelectedSession(null)
          loadSessions()
        }}
      />
    )
  }

  // ── Main listing view ──────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* ─── Header Banner ─────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-10">
          <Video className="w-full h-full" />
        </div>
        <div className="relative z-10">
          <h1 className="text-xl md:text-3xl font-bold mb-2">
            AMIKO Meet
          </h1>
          <p className="text-sm md:text-base opacity-90 max-w-lg">
            {t(
              '무료 화상 통화로 전 세계 친구들을 만나보세요! 매월 2회, 각 30분씩 무료로 화상 통화를 즐길 수 있습니다.',
              '¡Conoce amigos de todo el mundo con videollamadas gratuitas! 2 sesiones gratis al mes, 30 minutos cada una.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs md:text-sm">
              <Calendar className="w-3.5 h-3.5" />
              {t('월 2회 무료', '2 gratis/mes')}
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs md:text-sm">
              <Clock className="w-3.5 h-3.5" />
              {t('30분 세션', '30 min/sesión')}
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs md:text-sm">
              <Globe className="w-3.5 h-3.5" />
              {t('🇰🇷 한국어 ↔ 🇪🇸 español', '🇰🇷 Coreano ↔ 🇪🇸 Español')}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action bar ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
            {t('예정된 세션', 'Sesiones disponibles')}
          </h2>
          <button onClick={loadSessions} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {user && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs md:text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('세션 만들기', 'Crear sesión')}
          </Button>
        )}
      </div>

      {/* ─── Live sessions ─────────────────────────── */}
      {liveSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {t('실시간 진행 중', 'En vivo ahora')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {liveSessions.map(session => (
              <MeetSessionCard
                key={session.id}
                session={session}
                isLive
                onClick={() => setSelectedSession(session)}
                formatDate={formatLocalDate}
                formatTime={formatLocalTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Upcoming sessions ─────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center dark:bg-gray-800 dark:border-gray-700">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={loadSessions}>
            {t('다시 시도', 'Reintentar')}
          </Button>
        </Card>
      ) : upcomingSessions.length === 0 ? (
        <Card className="p-8 md:p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('예정된 세션이 없습니다', 'No hay sesiones programadas')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            {t(
              '첫 번째 무료 화상 세션을 만들어 보세요!',
              '¡Crea tu primera sesión de videollamada gratuita!'
            )}
          </p>
          {user && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t('세션 만들기', 'Crear sesión')}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {upcomingSessions.map(session => (
            <MeetSessionCard
              key={session.id}
              session={session}
              onClick={() => setSelectedSession(session)}
              formatDate={formatLocalDate}
              formatTime={formatLocalTime}
            />
          ))}
        </div>
      )}

      {/* ─── Not logged in CTA ─────────────────────── */}
      {!user && (
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            {t(
              '로그인하면 무료 화상 세션에 참여할 수 있습니다.',
              'Inicia sesión para unirte a las videollamadas gratuitas.'
            )}
          </p>
          <Button
            onClick={() => window.location.href = '/sign-in'}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            {t('로그인', 'Iniciar sesión')}
          </Button>
        </Card>
      )}

      {/* ─── Create session modal ──────────────────── */}
      {showCreate && (
        <CreateMeetModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadSessions()
            toast.success(t('세션이 생성되었습니다!', '¡Sesión creada!'))
          }}
        />
      )}
    </div>
  )
}
