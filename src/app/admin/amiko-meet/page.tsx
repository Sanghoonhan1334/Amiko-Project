'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Video, Plus, Calendar, Clock, Trash2, Save,
  Loader2, AlertCircle, RefreshCw, Users, Edit2,
  ChevronDown, ChevronUp, Eye, X,
} from 'lucide-react'
import { toast } from 'sonner'

interface Slot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  is_active: boolean
  created_at: string
}

interface Session {
  id: string
  title: string
  topic: string | null
  language: string
  scheduled_at: string
  duration_minutes: number
  max_participants: number
  current_participants: number
  status: string
  host_name: string
}

const DAY_NAMES_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function AdminAmikoMeetPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [activeTab, setActiveTab] = useState<'slots' | 'sessions'>('slots')
  const [slots, setSlots] = useState<Slot[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSlot, setShowAddSlot] = useState(false)

  // ── New slot form state ─────────────────────────
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('21:00')
  const [newTz, setNewTz] = useState('Asia/Seoul')
  const [saving, setSaving] = useState(false)

  const dayNames = language === 'ko' ? DAY_NAMES_KO : DAY_NAMES_ES

  // ── Fetch slots ─────────────────────────────────
  const loadSlots = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/meet/slots', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots || [])
      }
    } catch {}
  }, [token])

  // ── Fetch sessions ──────────────────────────────
  const loadSessions = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/meet/sessions?status=all&limit=50')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch {}
  }, [token])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([loadSlots(), loadSessions()])
      setLoading(false)
    }
    load()
  }, [loadSlots, loadSessions])

  // ── Add new slot ────────────────────────────────
  const handleAddSlot = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/meet/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day_of_week: newDay,
          start_time: newStart,
          end_time: newEnd,
          timezone: newTz,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Error')
        return
      }
      toast.success(t('시간대가 추가되었습니다.', 'Horario agregado.'))
      setShowAddSlot(false)
      loadSlots()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle slot active ──────────────────────────
  const toggleSlotActive = async (slot: Slot) => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/meet/slots', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: slot.id, is_active: !slot.is_active }),
      })
      if (res.ok) {
        toast.success(t('상태가 변경되었습니다.', 'Estado actualizado.'))
        loadSlots()
      }
    } catch {}
  }

  // ── Delete slot ─────────────────────────────────
  const deleteSlot = async (id: string) => {
    if (!token) return
    if (!confirm(t('삭제하시겠습니까?', '¿Eliminar este horario?'))) return
    try {
      const res = await fetch(`/api/admin/meet/slots?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success(t('삭제되었습니다.', 'Eliminado.'))
        loadSlots()
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            AMIKO Meet
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('무료 화상 세션 관리', 'Gestión de sesiones gratuitas')}
          </p>
        </div>
      </div>

      {/* ─── Tab switch ────────────────────────── */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'slots'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          {t('시간대 관리', 'Horarios')}
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Video className="w-4 h-4 inline mr-1.5" />
          {t('세션 모니터링', 'Sesiones')}
        </button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/*  SLOTS TAB                                 */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('등록된 시간대', 'Horarios registrados')} ({slots.length})
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={loadSlots} className="text-gray-400 hover:text-gray-600">
                <RefreshCw className="w-4 h-4" />
              </button>
              <Button
                onClick={() => setShowAddSlot(!showAddSlot)}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('추가', 'Agregar')}
              </Button>
            </div>
          </div>

          {/* Add slot form */}
          {showAddSlot && (
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('새 시간대 추가', 'Agregar nuevo horario')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('요일', 'Día')}</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  >
                    {dayNames.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('시작', 'Inicio')}</label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('종료', 'Fin')}</label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('시간대', 'Zona horaria')}</label>
                  <select
                    value={newTz}
                    onChange={(e) => setNewTz(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="Asia/Seoul">Asia/Seoul (KST) ⭐</option>
                    <option value="America/Bogota">America/Bogota (COT)</option>
                    <option value="America/Caracas">America/Caracas (VET)</option>
                    <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                    <option value="America/Lima">America/Lima (PET)</option>
                    <option value="America/Buenos_Aires">America/Buenos_Aires (ART)</option>
                    <option value="America/Santiago">America/Santiago (CLT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Europe/Madrid">Europe/Madrid (CET)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <p className="text-xs text-gray-400 flex-1 self-center">
                  {t(
                    '20분 블록이 자동 생성됩니다. (예: 9:00~11:00 → 9:00, 9:20, 9:40...)',
                    'Se generan bloques de 20 min automáticamente. (Ej: 9:00–11:00 → 9:00, 9:20, 9:40...)'
                  )}
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowAddSlot(false)} className="rounded-lg text-xs">
                  {t('취소', 'Cancelar')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddSlot}
                  disabled={saving}
                  className="rounded-lg text-xs bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  {t('저장', 'Guardar')}
                </Button>
              </div>
            </Card>
          )}

          {/* Slot list */}
          {slots.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('등록된 시간대가 없습니다.', 'No hay horarios registrados.')}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {slots.map(slot => (
                <Card key={slot.id} className={`p-3 md:p-4 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between ${!slot.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      slot.is_active
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {dayNames[slot.day_of_week]?.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {dayNames[slot.day_of_week]} · {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-gray-400">{slot.timezone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSlotActive(slot)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        slot.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {slot.is_active ? t('활성', 'Activo') : t('비활성', 'Inactivo')}
                    </button>
                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/*  SESSIONS TAB                              */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('전체 세션', 'Todas las sesiones')} ({sessions.length})
            </h2>
            <button onClick={loadSessions} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('세션이 없습니다.', 'No hay sesiones.')}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => {
                const statusColors: Record<string, string> = {
                  scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  live: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  completed: 'bg-gray-100 dark:bg-gray-700 text-gray-500',
                  cancelled: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
                }
                const dt = new Date(session.scheduled_at)
                return (
                  <Card key={session.id} className="p-3 md:p-4 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[session.status] || statusColors.scheduled}`}>
                            {session.status === 'live' ? '🔴 LIVE' : session.status.toUpperCase()}
                          </span>
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                            {session.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dt.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dt.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.current_participants}/{session.max_participants}
                          </span>
                          <span className="text-gray-400">
                            {t('호스트:', 'Host:')} {session.host_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
