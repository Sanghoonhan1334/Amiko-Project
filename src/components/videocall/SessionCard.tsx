'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Star, Users, Clock, Globe, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface SessionCardProps {
  session: {
    id: string
    host_id: string
    title: string
    topic: string
    description: string
    category: string
    language: string
    level: string
    scheduled_at: string
    duration_minutes: number
    price_usd: number
    max_participants: number
    current_participants: number
    status: string
    tags: string[]
    host: {
      id: string
      user_id: string
      display_name: string
      country: string
      languages: string[]
      avatar_url: string
      avg_rating: number
      total_sessions: number
      total_reviews: number
      status: string
    }
  }
  onClick: () => void
}

function getLocalTime(utcDateStr: string) {
  const d = new Date(utcDateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getLocalDate(utcDateStr: string) {
  const d = new Date(utcDateStr)
  const now = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(now.getDate() + 1)

  if (d.toDateString() === now.toDateString()) return 'today'
  if (d.toDateString() === tomorrow.toDateString()) return 'tomorrow'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'live': return 'bg-red-500 text-white'
    case 'upcoming': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'full': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'completed': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getCategoryEmoji(category: string) {
  const emojis: Record<string, string> = {
    general: '💬',
    language: '🗣️',
    food: '🍜',
    travel: '✈️',
    music: '🎵',
    fashion: '👗',
    technology: '💻',
    sports: '⚽',
    movies: '🎬',
    history: '📜',
    art: '🎨',
    business: '💼',
  }
  return emojis[category] || '💬'
}

function getLevelBadge(level: string) {
  switch (level) {
    case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'advanced': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function SessionCard({ session, onClick }: SessionCardProps) {
  const { t } = useLanguage()
  const host = session.host
  const dateLabel = getLocalDate(session.scheduled_at)
  const timeLabel = getLocalTime(session.scheduled_at)
  const spotsLeft = session.max_participants - session.current_participants
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0
  const isFull = spotsLeft <= 0

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200 group"
    >
      {/* Top section: Status + Category */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{getCategoryEmoji(session.category)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t(`vcMarketplace.categories.${session.category}`)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${getLevelBadge(session.level)}`}
          >
            {t(`vcMarketplace.levels.${session.level}`)}
          </Badge>
          {session.status === 'live' ? (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 animate-pulse">
              ● LIVE
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${getStatusColor(session.status)}`}
            >
              {t(`vcMarketplace.status.${session.status}`)}
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="px-3 pb-2">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {session.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
          {session.topic}
        </p>
      </div>

      {/* Host info */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {host?.avatar_url ? (
            <img
              src={host.avatar_url}
              alt={host.display_name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-xs text-white font-bold">
              {host?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
            {host?.display_name || t('vcMarketplace.unknownHost')}
          </p>
          <div className="flex items-center gap-1">
            {host?.country && (
              <span className="text-[10px] text-gray-400">{host.country}</span>
            )}
            {host?.avg_rating > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                <Star className="w-2.5 h-2.5 fill-yellow-400" />
                {host.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: Date, Time, Price, Spots */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>
              {dateLabel === 'today' ? t('vcMarketplace.today') :
               dateLabel === 'tomorrow' ? t('vcMarketplace.tomorrow') :
               dateLabel} {timeLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <Users className="w-3 h-3" />
            <span className={isAlmostFull ? 'text-orange-500 font-medium' : isFull ? 'text-red-500 font-medium' : ''}>
              {session.current_participants}/{session.max_participants}
            </span>
          </div>
        </div>
        <div className="text-right">
          {session.price_usd > 0 ? (
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              ${session.price_usd.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {t('vcMarketplace.free')}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <div className="px-3 pb-2 pt-1 flex gap-1 flex-wrap">
          {session.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
