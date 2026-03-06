'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2, AlertCircle } from 'lucide-react'

interface RatingModalProps {
  open: boolean
  onClose: () => void
  sessionId: string
  hostId: string
  onRated: () => void
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function RatingModal({ open, onClose, sessionId, hostId, onRated }: RatingModalProps) {
  const { t } = useLanguage()
  const [knowledge, setKnowledge] = useState(0)
  const [clarity, setClarity] = useState(0)
  const [friendliness, setFriendliness] = useState(0)
  const [usefulness, setUsefulness] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (knowledge === 0 || clarity === 0 || friendliness === 0 || usefulness === 0) {
      setError(t('vcMarketplace.rating.allRequired'))
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/videocall/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          host_id: hostId,
          knowledge_rating: knowledge,
          clarity_rating: clarity,
          friendliness_rating: friendliness,
          usefulness_rating: usefulness,
          comment: comment.trim() || undefined,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('vcMarketplace.rating.error'))
        return
      }
      onRated()
    } catch {
      setError(t('vcMarketplace.rating.error'))
    } finally {
      setLoading(false)
    }
  }

  const avgRating = [knowledge, clarity, friendliness, usefulness].filter(v => v > 0)
  const avg = avgRating.length > 0 ? avgRating.reduce((a, b) => a + b, 0) / avgRating.length : 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Star className="w-5 h-5 text-yellow-500" />
            {t('vcMarketplace.rateSession')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('vcMarketplace.rating.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <StarRating
            value={knowledge}
            onChange={setKnowledge}
            label={t('vcMarketplace.rating.knowledge')}
          />
          <StarRating
            value={clarity}
            onChange={setClarity}
            label={t('vcMarketplace.rating.clarity')}
          />
          <StarRating
            value={friendliness}
            onChange={setFriendliness}
            label={t('vcMarketplace.rating.friendliness')}
          />
          <StarRating
            value={usefulness}
            onChange={setUsefulness}
            label={t('vcMarketplace.rating.usefulness')}
          />

          {avg > 0 && (
            <div className="text-center py-1">
              <span className="text-lg font-bold text-yellow-500">{avg.toFixed(1)}</span>
              <span className="text-xs text-gray-400 ml-1">/ 5.0</span>
            </div>
          )}

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('vcMarketplace.rating.commentPlaceholder')}
            rows={3}
            maxLength={500}
            className="text-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="text-xs">
            {t('vcMarketplace.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t('vcMarketplace.submitting')}</>
            ) : (
              t('vcMarketplace.submitRating')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
