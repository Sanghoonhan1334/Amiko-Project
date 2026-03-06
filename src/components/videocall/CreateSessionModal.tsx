'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { CalendarDays, Clock, DollarSign, Users, Tag, Loader2, AlertCircle } from 'lucide-react'

interface CreateSessionModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  hostProfile?: any
}

export default function CreateSessionModal({ open, onClose, onCreated, hostProfile }: CreateSessionModalProps) {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [language, setLanguage] = useState('ko')
  const [level, setLevel] = useState('beginner')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [priceUsd, setPriceUsd] = useState('5.00')
  const [maxParticipants, setMaxParticipants] = useState('10')
  const [tagsInput, setTagsInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([])

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setScheduledDate(tomorrow.toISOString().split('T')[0])
  }, [])

  // Fetch available schedule slots
  useEffect(() => {
    fetch('/api/videocall/schedule')
      .then(r => r.json())
      .then(d => setScheduleSlots(d.schedules || []))
      .catch(() => {})
  }, [])

  const addTag = () => {
    const tag = tagsInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag])
      setTagsInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('vcMarketplace.createForm.errorTitle')); return }
    if (!topic.trim()) { setError(t('vcMarketplace.createForm.errorTopic')); return }
    if (!scheduledDate) { setError(t('vcMarketplace.createForm.errorDate')); return }
    if (!scheduledTime) { setError(t('vcMarketplace.createForm.errorTime')); return }

    const price = parseFloat(priceUsd)
    if (isNaN(price) || price < 0) { setError(t('vcMarketplace.createForm.errorPrice')); return }

    const maxP = parseInt(maxParticipants)
    if (isNaN(maxP) || maxP < 2 || maxP > 20) { setError(t('vcMarketplace.createForm.errorParticipants')); return }

    try {
      setLoading(true)
      setError('')

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const res = await fetch('/api/videocall/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim(),
          description: description.trim(),
          category,
          language,
          level,
          scheduled_at: scheduledAt,
          price_usd: price,
          max_participants: maxP,
          tags,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('vcMarketplace.createForm.errorGeneral'))
        return
      }

      onCreated()
    } catch (err) {
      setError(t('vcMarketplace.createForm.errorGeneral'))
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'general', 'language', 'food', 'travel', 'music',
    'fashion', 'technology', 'sports', 'movies', 'history', 'art', 'business'
  ]

  // Available time slots from schedule config (filter by selected weekday)
  const getAvailableSlots = () => {
    if (!scheduledDate || scheduleSlots.length === 0) return []
    const dayOfWeek = new Date(scheduledDate + 'T00:00:00').getDay()
    return scheduleSlots.filter(s => s.day_of_week === dayOfWeek)
  }

  const availableSlots = getAvailableSlots()

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            {t('vcMarketplace.createSession')}
          </DialogTitle>
          <DialogDescription>
            {t('vcMarketplace.createForm.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {t('vcMarketplace.createForm.title')} *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('vcMarketplace.createForm.titlePlaceholder')}
              maxLength={100}
            />
          </div>

          {/* Topic */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {t('vcMarketplace.createForm.topic')} *
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('vcMarketplace.createForm.topicPlaceholder')}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {t('vcMarketplace.createForm.description')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('vcMarketplace.createForm.descriptionPlaceholder')}
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Category + Language row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                {t('vcMarketplace.createForm.category')}
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {t(`vcMarketplace.categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                {t('vcMarketplace.createForm.language')}
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko" className="text-xs">한국어</SelectItem>
                  <SelectItem value="es" className="text-xs">Español</SelectItem>
                  <SelectItem value="en" className="text-xs">English</SelectItem>
                  <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              {t('vcMarketplace.createForm.level')}
            </label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner" className="text-xs">
                  {t('vcMarketplace.levels.beginner')}
                </SelectItem>
                <SelectItem value="intermediate" className="text-xs">
                  {t('vcMarketplace.levels.intermediate')}
                </SelectItem>
                <SelectItem value="advanced" className="text-xs">
                  {t('vcMarketplace.levels.advanced')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                {t('vcMarketplace.createForm.date')} *
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                {t('vcMarketplace.createForm.time')} *
              </label>
              {availableSlots.length > 0 ? (
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t('vcMarketplace.createForm.selectTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot, i) => (
                      <SelectItem key={i} value={slot.start_time} className="text-xs">
                        {slot.start_time} - {slot.end_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9 text-xs"
                />
              )}
            </div>
          </div>

          {/* Price + Max Participants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1 block">
                <DollarSign className="w-3 h-3" />
                {t('vcMarketplace.createForm.price')} (USD)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.50"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                {t('vcMarketplace.createForm.commissionNote')}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1 block">
                <Users className="w-3 h-3" />
                {t('vcMarketplace.createForm.maxParticipants')}
              </label>
              <Input
                type="number"
                min="2"
                max="20"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1 block">
              <Tag className="w-3 h-3" />
              {t('vcMarketplace.createForm.tags')}
            </label>
            <div className="flex gap-2">
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder={t('vcMarketplace.createForm.tagsPlaceholder')}
                className="h-8 text-xs"
                maxLength={30}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addTag}
                className="h-8 text-xs"
              >
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="text-xs">
            {t('vcMarketplace.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t('vcMarketplace.creating')}</>
            ) : (
              t('vcMarketplace.createSession')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
