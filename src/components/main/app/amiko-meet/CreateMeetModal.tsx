'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  X, Calendar, Clock, Globe, Type,
  FileText, Loader2, AlertCircle, Video,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

const SESSION_DURATION = 20 // minutes

interface Slot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  max_participants: number
  is_active: boolean
}

interface TimeBlock {
  date: Date    // UTC Date — when this 20-min block starts
  slotId: string
  blockTime: string // original time in slot tz, e.g. "09:00"
}

interface CreateMeetModalProps {
  onClose: () => void
  onCreated: () => void
}

// ── Convert "YYYY-MM-DD HH:MM in tz" → UTC Date ──
function tzToDate(dateStr: string, timeStr: string, tz: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const refMs = Date.UTC(year, month - 1, day, hour, minute, 0)
  const refDate = new Date(refMs)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(refDate)
  const pY = parseInt(parts.find(p => p.type === 'year')!.value)
  const pM = parseInt(parts.find(p => p.type === 'month')!.value)
  const pD = parseInt(parts.find(p => p.type === 'day')!.value)
  let pH = parseInt(parts.find(p => p.type === 'hour')!.value)
  if (pH === 24) pH = 0
  const pMin = parseInt(parts.find(p => p.type === 'minute')!.value)
  const displayMs = Date.UTC(pY, pM - 1, pD, pH, pMin, 0)
  return new Date(refMs - (displayMs - refMs))
}

// ── Generate 20-min blocks for the next N weeks ───
function getUpcomingBlocks(slot: Slot, maxBlocks: number = 18): TimeBlock[] {
  const tz = slot.timezone
  const now = new Date()

  // Generate block start-times within the slot window
  const [sH, sM] = slot.start_time.split(':').map(Number)
  const [eH, eM] = slot.end_time.split(':').map(Number)
  const startMin = sH * 60 + sM
  const endMin = eH * 60 + eM
  const blockTimes: string[] = []
  for (let m = startMin; m + SESSION_DURATION <= endMin; m += SESSION_DURATION) {
    const h = Math.floor(m / 60)
    const min = m % 60
    blockTimes.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }

  const result: TimeBlock[] = []
  const seenDates = new Set<string>()
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  for (let off = 0; off < 35 && result.length < maxBlocks; off++) {
    const probe = new Date(now.getTime() + off * 86_400_000)
    const dateStr = probe.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
    if (seenDates.has(dateStr)) continue
    seenDates.add(dateStr)

    const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(probe)
    if (dayMap[wd] !== slot.day_of_week) continue

    for (const bt of blockTimes) {
      const blockDate = tzToDate(dateStr, bt, tz)
      if (blockDate <= now) continue
      result.push({ date: blockDate, slotId: slot.id, blockTime: bt })
      if (result.length >= maxBlocks) break
    }
  }
  return result
}

export default function CreateMeetModal({ onClose, onCreated }: CreateMeetModalProps) {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)
  const locale = language === 'ko' ? 'ko-KR' : 'es-ES'

  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [sessionLang, setSessionLang] = useState<'ko' | 'es' | 'mixed'>('mixed')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null)

  // ── Load available slots ─────────────────────────
  useEffect(() => {
    setLoadingSlots(true)
    fetch('/api/meet/slots')
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [])

  // ── Generate all time blocks grouped by local date ─
  const blocksByDate = useMemo(() => {
    const all: TimeBlock[] = []
    for (const slot of slots) {
      all.push(...getUpcomingBlocks(slot, 18))
    }
    all.sort((a, b) => a.date.getTime() - b.date.getTime())

    const groups: { dateLabel: string; blocks: TimeBlock[] }[] = []
    const seen = new Map<string, number>()
    for (const block of all) {
      const key = block.date.toLocaleDateString(locale, {
        weekday: 'long', month: 'short', day: 'numeric',
      })
      if (!seen.has(key)) {
        seen.set(key, groups.length)
        groups.push({ dateLabel: key, blocks: [] })
      }
      groups[seen.get(key)!].blocks.push(block)
    }
    return groups
  }, [slots, locale])

  const noSlotsAvailable = !loadingSlots && slots.length === 0

  // ── Submit handler ───────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t('제목을 입력해주세요.', 'Ingresa un título.'))
      return
    }
    if (!selectedBlock && !noSlotsAvailable) {
      setError(t('시간을 선택해주세요.', 'Selecciona un bloque horario.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get fresh access token to avoid "Invalid token"
      const supabase = createSupabaseBrowserClient()
      const { data: { session: freshSession } } = await supabase.auth.getSession()
      if (!freshSession?.access_token) {
        setError(t('로그인이 필요합니다.', 'Debes iniciar sesión.'))
        setLoading(false)
        return
      }

      const scheduled = selectedBlock ? selectedBlock.date : new Date()
      if (scheduled <= new Date()) {
        setError(t('미래 시간을 선택해주세요.', 'Selecciona un horario futuro.'))
        setLoading(false)
        return
      }

      const res = await fetch('/api/meet/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim() || null,
          description: description.trim() || null,
          language: sessionLang,
          scheduled_at: scheduled.toISOString(),
          slot_id: selectedBlock?.slotId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('세션 생성 실패', 'Error al crear sesión'))
        return
      }

      onCreated()
    } catch (err: any) {
      setError(err.message || t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* ─── Header ─────────────────────────────── */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7BC4C4] flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {t('새 세션 만들기', 'Crear nueva sesión')}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {/* ─── No slots warning ────────────────── */}
          {noSlotsAvailable && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {t(
                '현재 이용 가능한 시간대가 없습니다. 나중에 다시 확인해주세요.',
                'No hay horarios disponibles en este momento. Vuelve a intentar más tarde.'
              )}
            </div>
          )}

          {/* ─── Loading ─────────────────────────── */}
          {loadingSlots && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#7BC4C4] animate-spin mr-2" />
              <span className="text-sm text-gray-400">
                {t('시간대 불러오는 중...', 'Cargando horarios...')}
              </span>
            </div>
          )}

          {/* ─── Step 1: Pick a time block ────────── */}
          {!loadingSlots && blocksByDate.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {t('1. 시간 선택 *', '1. Elige un horario *')}
              </label>
              <p className="text-xs text-gray-400 mb-3">
                {t(
                  '아래 시간은 현재 시간대 기준입니다. (20분 세션)',
                  'Los horarios se muestran en tu zona horaria local. (sesiones de 20 min)'
                )}
              </p>
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {blocksByDate.map(group => (
                  <div key={group.dateLabel}>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 capitalize">
                      📅 {group.dateLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.blocks.map((block, i) => {
                        const isSel = selectedBlock?.date.getTime() === block.date.getTime()
                        const timeLabel = block.date.toLocaleTimeString(locale, {
                          hour: '2-digit', minute: '2-digit', hour12: false,
                        })
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedBlock(block)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              isSel
                                ? 'border-purple-400 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            {timeLabel}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Session details ─────────────────── */}
          {(selectedBlock || noSlotsAvailable) && (
            <>
              {/* ─── Title ─────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Type className="w-3.5 h-3.5 inline mr-1" />
                  {t(selectedBlock ? '2. 제목 *' : '제목 *', selectedBlock ? '2. Título *' : 'Título *')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder={t('예: 한국어 프리 토킹', 'Ej: Charla libre en coreano')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                />
              </div>

              {/* ─── Topic ─────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  {t('주제 (선택)', 'Tema (opcional)')}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  placeholder={t('예: K-드라마, 음악, 문화 교류', 'Ej: K-drama, música, intercambio cultural')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                />
              </div>

              {/* ─── Description ───────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('설명 (선택)', 'Descripción (opcional)')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={2}
                  placeholder={t('세션에 대한 자세한 설명...', 'Describe tu sesión...')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none resize-none"
                />
              </div>

              {/* ─── Language ──────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />
                  {t('언어', 'Idioma')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'ko' as const, label: '🇰🇷 한국어' },
                    { key: 'es' as const, label: '🇪🇸 Español' },
                    { key: 'mixed' as const, label: t('🌐 혼합', '🌐 Mixto') },
                  ].map(lang => (
                    <button
                      key={lang.key}
                      onClick={() => setSessionLang(lang.key)}
                      className={`px-3 py-2 rounded-xl border text-xs md:text-sm font-medium transition-all ${
                        sessionLang === lang.key
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Info banner ───────────────────── */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">{t('📌 알아두세요', '📌 Ten en cuenta')}</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>{t('각 세션은 20분입니다.', 'Cada sesión dura 20 minutos.')}</li>
                  <li>{t('월 2회 무료 세션을 이용할 수 있습니다.', 'Tienes 2 sesiones gratis por mes.')}</li>
                  <li>{t('세션은 예정 시간에 자동으로 시작합니다.', 'La sesión comenzará automáticamente a la hora programada.')}</li>
                </ul>
              </div>

              {/* ─── Error ─────────────────────────── */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ─── Submit ────────────────────────── */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl dark:border-gray-600 dark:text-gray-300"
                >
                  {t('취소', 'Cancelar')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !title.trim() || (!selectedBlock && !noSlotsAvailable)}
                  className="flex-1 bg-[#7BC4C4] hover:bg-[#5BA8A8] text-white rounded-xl disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('세션 만들기', 'Crear sesión')
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
