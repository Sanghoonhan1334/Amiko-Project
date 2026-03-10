'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  X, Calendar, Clock, Globe, Type,
  FileText, Loader2, AlertCircle, Video, ChevronRight,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface Slot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  max_participants: number
  is_active: boolean
}

interface CreateMeetModalProps {
  onClose: () => void
  onCreated: () => void
}

export default function CreateMeetModal({ onClose, onCreated }: CreateMeetModalProps) {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [sessionLang, setSessionLang] = useState<'ko' | 'es' | 'mixed'>('mixed')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const dayNamesShort = language === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const dayNamesFull = language === 'ko'
    ? ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  // ── Load available slots ─────────────────────────
  useEffect(() => {
    setLoadingSlots(true)
    fetch('/api/meet/slots')
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [])

  // ── Compute next N dates for a given slot ────────
  const getUpcomingDatesForSlot = (slot: Slot, count: number = 4): Date[] => {
    const dates: Date[] = []
    const now = new Date()

    for (let offset = 0; offset < 60 && dates.length < count; offset++) {
      const candidate = new Date(now)
      candidate.setDate(now.getDate() + offset)

      if (candidate.getDay() !== slot.day_of_week) continue

      // Build the datetime using the slot's start_time
      const [h, m] = slot.start_time.split(':').map(Number)
      const sessionDate = new Date(candidate)
      sessionDate.setHours(h, m, 0, 0)

      // If today and already past the start time, skip
      if (sessionDate <= now) continue

      dates.push(sessionDate)
    }
    return dates
  }

  // ── Upcoming dates for selected slot ─────────────
  const upcomingDates = useMemo(() => {
    if (!selectedSlot) return []
    return getUpcomingDatesForSlot(selectedSlot, 4)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot])

  // ── When user selects a date from slot ───────────
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date.toISOString())
    setScheduledAt(date.toISOString().slice(0, 16))
  }

  // ── Format date for display ──────────────────────
  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTimeRange = (slot: Slot) => {
    return `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`
  }

  // ── Submit handler ───────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t('제목을 입력해주세요.', 'Ingresa un título.'))
      return
    }
    if (!scheduledAt) {
      setError(t('날짜와 시간을 선택해주세요.', 'Selecciona fecha y hora.'))
      return
    }

    const scheduled = new Date(scheduledAt)
    if (scheduled <= new Date()) {
      setError(t('미래 시간을 선택해주세요.', 'Selecciona un horario futuro.'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/meet/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim() || null,
          description: description.trim() || null,
          language: sessionLang,
          scheduled_at: scheduled.toISOString(),
          slot_id: selectedSlot?.id || undefined,
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

  // ── No slots available state ─────────────────────
  const noSlotsAvailable = !loadingSlots && slots.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* ─── Header ─────────────────────────────── */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
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

          {/* ─── Step 1: Select slot ─────────────── */}
          {!loadingSlots && slots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {t('1. 시간대 선택 *', '1. Selecciona un horario *')}
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {t(
                  '관리자가 설정한 이용 가능 시간대입니다.',
                  'Estos son los horarios habilitados por el administrador.'
                )}
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlot(slot)
                      setSelectedDate(null)
                      setScheduledAt('')
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                      selectedSlot?.id === slot.id
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        selectedSlot?.id === slot.id
                          ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {dayNamesShort[slot.day_of_week]}
                      </div>
                      <div>
                        <span className="font-medium">{dayNamesFull[slot.day_of_week]}</span>
                        <span className="ml-2 text-gray-400">{formatTimeRange(slot)}</span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {slot.timezone} · {t(`최대 ${slot.max_participants}명`, `Máx. ${slot.max_participants} personas`)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedSlot?.id === slot.id ? 'rotate-90 text-purple-500' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingSlots && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin mr-2" />
              <span className="text-sm text-gray-400">
                {t('시간대 불러오는 중...', 'Cargando horarios...')}
              </span>
            </div>
          )}

          {/* ─── Step 2: Pick a date ─────────────── */}
          {selectedSlot && upcomingDates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {t('2. 날짜 선택 *', '2. Elige una fecha *')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {upcomingDates.map((date, i) => {
                  const isSelected = selectedDate === date.toISOString()
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectDate(date)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-200'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-semibold">{formatDateLabel(date)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {selectedSlot.start_time.slice(0, 5)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Session details (visible after slot/date selection or when no slots) ── */}
          {(selectedSlot || noSlotsAvailable) && (
            <>
              {/* ─── Title ─────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Type className="w-3.5 h-3.5 inline mr-1" />
                  {t(selectedSlot ? '3. 제목 *' : '제목 *', selectedSlot ? '3. Título *' : 'Título *')}
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
                  rows={3}
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

              {/* ─── Manual date (when no slots exists) ── */}
              {noSlotsAvailable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {t('날짜 및 시간 *', 'Fecha y Hora *')}
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t(
                      '* 시간은 현재 시간대로 표시됩니다.',
                      '* La hora se muestra en tu zona horaria local.'
                    )}
                  </p>
                </div>
              )}

              {/* ─── Info banner ───────────────────── */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">{t('📌 알아두세요', '📌 Ten en cuenta')}</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>{t('각 세션은 30분입니다.', 'Cada sesión dura 30 minutos.')}</li>
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
                  disabled={loading || !title.trim() || !scheduledAt}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl disabled:opacity-50"
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
