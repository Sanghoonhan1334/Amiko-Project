'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Flag, Loader2, AlertCircle } from 'lucide-react'

interface ReportModalProps {
  open: boolean
  onClose: () => void
  reportedUserId: string
  sessionId: string
  onReported: () => void
}

export default function ReportModal({ open, onClose, reportedUserId, sessionId, onReported }: ReportModalProps) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reasons = [
    'inappropriate_content',
    'harassment',
    'spam',
    'fraud',
    'hate_speech',
    'violence',
    'misinformation',
    'other',
  ]

  const handleSubmit = async () => {
    if (!reason) {
      setError(t('vcMarketplace.reportForm.selectReason'))
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/videocall/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          session_id: sessionId,
          reason,
          description: description.trim() || undefined,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('vcMarketplace.reportForm.error'))
        return
      }
      onReported()
    } catch {
      setError(t('vcMarketplace.reportForm.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flag className="w-5 h-5 text-red-500" />
            {t('vcMarketplace.report')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('vcMarketplace.reportForm.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {t('vcMarketplace.reportForm.reason')} *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t('vcMarketplace.reportForm.selectReason')} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {t(`vcMarketplace.reportReasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {t('vcMarketplace.reportForm.description')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('vcMarketplace.reportForm.descriptionPlaceholder')}
              rows={3}
              maxLength={500}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="text-xs">
            {t('vcMarketplace.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white text-xs"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t('vcMarketplace.submitting')}</>
            ) : (
              t('vcMarketplace.submitReport')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
