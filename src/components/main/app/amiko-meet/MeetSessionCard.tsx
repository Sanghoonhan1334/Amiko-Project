'use client'

import { Card } from '@/components/ui/card'
import {
  Video, Calendar, Clock, Users, Globe,
  ChevronRight, User,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

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

interface MeetSessionCardProps {
  session: MeetSession
  isLive?: boolean
  onClick: () => void
  formatDate: (iso: string) => string
  formatTime: (iso: string) => string
}

export default function MeetSessionCard({
  session,
  isLive = false,
  onClick,
  formatDate,
  formatTime,
}: MeetSessionCardProps) {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const langLabel: Record<string, string> = {
    ko: '🇰🇷 한국어',
    es: '🇪🇸 Español',
    mixed: language === 'ko' ? '🌐 혼합' : '🌐 Mixto',
  }

  const isFull = session.current_participants >= session.max_participants

  return (
    <Card
      onClick={onClick}
      className={`relative cursor-pointer group transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 overflow-hidden ${
        isLive
          ? 'border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800'
          : 'hover:border-purple-300 dark:hover:border-purple-600'
      }`}
    >
      {/* Live indicator stripe */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
      )}

      <div className="p-4 md:p-5">
        {/* ─── Top row: host + status ───────────── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {session.host_avatar ? (
              <img
                src={session.host_avatar}
                alt=""
                className="w-8 h-8 rounded-full object-cover border-2 border-purple-200 dark:border-purple-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7BC4C4] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                {session.host_name}
              </p>
              <p className="text-[10px] text-gray-400">
                {t('호스트', 'Anfitrión')}
              </p>
            </div>
          </div>

          {isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          ) : isFull ? (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-semibold">
              {t('마감', 'Lleno')}
            </span>
          ) : null}
        </div>

        {/* ─── Title ───────────────────────────── */}
        <h3 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-[#5BA8A8] dark:group-hover:text-[#7BC4C4] transition-colors">
          {session.title}
        </h3>

        {session.topic && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
            {session.topic}
          </p>
        )}

        {/* ─── Meta row ────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(session.scheduled_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(session.scheduled_at)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {session.current_participants}/{session.max_participants}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {langLabel[session.language] || session.language}
          </span>
        </div>
      </div>

      {/* ─── Arrow indicator ───────────────────── */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 group-hover:text-[#7BC4C4] transition-colors">
        <ChevronRight className="w-5 h-5" />
      </div>
    </Card>
  )
}
