'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Globe, CalendarDays, Award, Shield, Loader2 } from 'lucide-react'

interface HostProfileModalProps {
  open: boolean
  onClose: () => void
  hostProfile: any
}

function getHostBadge(totalSessions: number) {
  if (totalSessions >= 50) return { label: 'expert', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Award }
  if (totalSessions >= 10) return { label: 'verified', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Shield }
  return { label: 'new', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Star }
}

export default function HostProfileModal({ open, onClose, hostProfile }: HostProfileModalProps) {
  const { t } = useLanguage()
  const [ratings, setRatings] = useState<any[]>([])
  const [loadingRatings, setLoadingRatings] = useState(false)

  useEffect(() => {
    if (!open || !hostProfile?.id) return
    setLoadingRatings(true)
    fetch(`/api/videocall/ratings?hostId=${hostProfile.id}`)
      .then(r => r.json())
      .then(d => setRatings(d.ratings || []))
      .catch(() => {})
      .finally(() => setLoadingRatings(false))
  }, [open, hostProfile?.id])

  const badge = getHostBadge(hostProfile?.total_sessions || 0)
  const BadgeIcon = badge.icon

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{t('vcMarketplace.hostProfile')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center mx-auto overflow-hidden">
              {hostProfile?.avatar_url ? (
                <img src={hostProfile.avatar_url} alt={hostProfile.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-white font-bold">
                  {hostProfile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base mt-2 text-gray-800 dark:text-gray-100">
              {hostProfile?.display_name}
            </h3>

            <Badge variant="secondary" className={`text-xs mt-1 ${badge.color}`}>
              <BadgeIcon className="w-3 h-3 mr-1" />
              {t(`vcMarketplace.hostBadge.${badge.label}`)}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {hostProfile?.total_sessions || 0}
              </p>
              <p className="text-[10px] text-gray-500">{t('vcMarketplace.sessions')}</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
              <p className="text-lg font-bold text-yellow-500">
                {hostProfile?.avg_rating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-[10px] text-gray-500">{t('vcMarketplace.rating.title')}</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {hostProfile?.total_reviews || 0}
              </p>
              <p className="text-[10px] text-gray-500">{t('vcMarketplace.reviews')}</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-xs">
            {hostProfile?.country && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{hostProfile.country}</span>
              </div>
            )}
            {hostProfile?.languages && hostProfile.languages.length > 0 && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span>{hostProfile.languages.join(', ')}</span>
              </div>
            )}
            {hostProfile?.bio && (
              <p className="text-gray-500 dark:text-gray-400 pt-1">{hostProfile.bio}</p>
            )}
          </div>

          {/* Specialties */}
          {hostProfile?.specialties && hostProfile.specialties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('vcMarketplace.specialties')}
              </p>
              <div className="flex flex-wrap gap-1">
                {hostProfile.specialties.map((s: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('vcMarketplace.reviews')} ({ratings.length})
            </p>
            {loadingRatings ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              </div>
            ) : ratings.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                {t('vcMarketplace.noReviews')}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ratings.map(r => (
                  <div key={r.id} className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{r.overall_rating?.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 mb-1">
                      <span>{t('vcMarketplace.rating.knowledge')}: {r.knowledge_rating}/5</span>
                      <span>{t('vcMarketplace.rating.clarity')}: {r.clarity_rating}/5</span>
                      <span>{t('vcMarketplace.rating.friendliness')}: {r.friendliness_rating}/5</span>
                      <span>{t('vcMarketplace.rating.usefulness')}: {r.usefulness_rating}/5</span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
