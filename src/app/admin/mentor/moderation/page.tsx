'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ShieldAlert, Flag, AlertTriangle, AlertCircle, CheckCircle,
  Loader2, RefreshCw, Eye, X, ChevronDown, Filter,
  UserX, Clock, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

interface Report {
  id: string
  session_id: string
  reporter_user_id: string
  reported_user_id: string | null
  reason: string
  description: string | null
  severity: string
  status: string
  action_taken: string | null
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

interface ModerationFlag {
  id: string
  session_id: string
  flagged_user_id: string | null
  flagged_content: string
  caption_event_id: string | null
  detection_rule: string
  detection_type: string
  severity: string
  confidence: number
  source_language: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
}

interface Stats {
  reports: { pending: number; reviewing: number; resolved: number; high_risk_active: number }
  flags: { active: number; high_risk_active: number; confirmed: number }
  repeat_offenders: Array<{ user_id: string; report_count: number }>
}

const SEVERITY_COLORS: Record<string, string> = {
  informative: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high_risk: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/20 text-orange-400',
  reviewing: 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
  active: 'bg-red-500/20 text-red-400',
  reviewed: 'bg-blue-500/20 text-blue-400',
  false_positive: 'bg-gray-500/20 text-gray-400',
  confirmed: 'bg-red-500/20 text-red-400',
}

const REASON_LABELS: Record<string, { ko: string; es: string }> = {
  harassment: { ko: '괴롭힘', es: 'Acoso' },
  insults: { ko: '욕설', es: 'Insultos' },
  spam: { ko: '스팸', es: 'Spam' },
  offensive_content: { ko: '불쾌한 콘텐츠', es: 'Contenido ofensivo' },
  inappropriate_behavior: { ko: '부적절한 행동', es: 'Comportamiento inapropiado' },
  other: { ko: '기타', es: 'Otro' },
}

export default function MentorModerationPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'flags'>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [flags, setFlags] = useState<ModerationFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Data loading ──
  const loadStats = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/video/moderation/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {}
  }, [token])

  const loadReports = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterSeverity) params.set('severity', filterSeverity)
      const res = await fetch(`/api/admin/video/moderation/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch {}
    setLoading(false)
  }, [token, filterStatus, filterSeverity])

  const loadFlags = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterSeverity) params.set('severity', filterSeverity)
      const res = await fetch(`/api/admin/video/moderation/flags?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFlags(data.flags || [])
      }
    } catch {}
    setLoading(false)
  }, [token, filterStatus, filterSeverity])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (activeTab === 'reports') loadReports()
    else if (activeTab === 'flags') loadFlags()
  }, [activeTab, loadReports, loadFlags])

  const refreshAll = () => {
    loadStats()
    if (activeTab === 'reports') loadReports()
    else if (activeTab === 'flags') loadFlags()
  }

  // ── Report actions ──
  const updateReport = async (id: string, status: string, action_taken?: string) => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/video/moderation/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status, action_taken, resolution_notes: actionNotes || undefined }),
      })
      if (res.ok) {
        toast.success(t('업데이트 완료', 'Actualizado correctamente'))
        setSelectedReport(null)
        setActionNotes('')
        loadReports()
        loadStats()
      } else {
        toast.error(t('업데이트 실패', 'Error al actualizar'))
      }
    } catch {
      toast.error(t('오류 발생', 'Error'))
    }
    setSaving(false)
  }

  // ── Flag actions ──
  const updateFlag = async (id: string, status: string) => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/video/moderation/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status, review_notes: actionNotes || undefined }),
      })
      if (res.ok) {
        toast.success(t('업데이트 완료', 'Actualizado correctamente'))
        setSelectedFlag(null)
        setActionNotes('')
        loadFlags()
        loadStats()
      } else {
        toast.error(t('업데이트 실패', 'Error al actualizar'))
      }
    } catch {
      toast.error(t('오류 발생', 'Error'))
    }
    setSaving(false)
  }

  // ── Render: Overview tab ──
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{t('대기 중 신고', 'Reportes pendientes')}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.reports.pending ?? '—'}</p>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">{t('고위험', 'Alto riesgo')}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.reports.high_risk_active ?? '—'}</p>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Flag className="w-4 h-4" />
            <span className="text-xs font-medium">{t('활성 플래그', 'Flags activos')}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.flags.active ?? '—'}</p>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{t('해결됨', 'Resueltos')}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.reports.resolved ?? '—'}</p>
        </Card>
      </div>

      {/* Repeat offenders */}
      {stats?.repeat_offenders && stats.repeat_offenders.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-400" />
            {t('재범 사용자', 'Usuarios reincidentes')}
          </h3>
          <div className="space-y-2">
            {stats.repeat_offenders.map((offender) => (
              <div key={offender.user_id} className="flex items-center justify-between bg-gray-700/50 rounded px-3 py-2">
                <span className="text-gray-300 text-sm font-mono truncate max-w-[200px]">
                  {offender.user_id.substring(0, 8)}...
                </span>
                <span className="text-red-400 text-sm font-medium">
                  {offender.report_count} {t('건', 'reportes')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )

  // ── Render: Reports tab ──
  const renderReports = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-600"
        >
          <option value="">{t('모든 상태', 'Todos los estados')}</option>
          <option value="pending">{t('대기 중', 'Pendiente')}</option>
          <option value="reviewing">{t('검토 중', 'En revisión')}</option>
          <option value="resolved">{t('해결됨', 'Resuelto')}</option>
          <option value="dismissed">{t('기각됨', 'Descartado')}</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-600"
        >
          <option value="">{t('모든 심각도', 'Todas las severidades')}</option>
          <option value="informative">{t('정보', 'Informativo')}</option>
          <option value="warning">{t('경고', 'Advertencia')}</option>
          <option value="high_risk">{t('고위험', 'Alto riesgo')}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('신고가 없습니다', 'No hay reportes')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-gray-800 border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => { setSelectedReport(report); setActionNotes('') }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[report.severity] || ''}`}>
                      {report.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status] || ''}`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {REASON_LABELS[report.reason]?.[language === 'ko' ? 'ko' : 'es'] || report.reason}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">{report.description}</p>
                  )}
                  <p className="text-gray-500 text-xs">
                    {t('세션', 'Sesión')}: {report.session_id.substring(0, 8)}... · {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Report detail modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">{t('신고 상세', 'Detalle del reporte')}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-xs ${SEVERITY_COLORS[selectedReport.severity]}`}>
                  {selectedReport.severity}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedReport.status]}`}>
                  {selectedReport.status}
                </span>
              </div>

              <div>
                <span className="text-gray-400">{t('사유', 'Razón')}:</span>{' '}
                <span className="text-white">
                  {REASON_LABELS[selectedReport.reason]?.[language === 'ko' ? 'ko' : 'es'] || selectedReport.reason}
                </span>
              </div>

              {selectedReport.description && (
                <div>
                  <span className="text-gray-400">{t('설명', 'Descripción')}:</span>
                  <p className="text-gray-200 mt-1">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <span className="text-gray-400">{t('세션 ID', 'ID Sesión')}:</span>{' '}
                <span className="text-gray-300 font-mono text-xs">{selectedReport.session_id}</span>
              </div>
              <div>
                <span className="text-gray-400">{t('신고자', 'Reportador')}:</span>{' '}
                <span className="text-gray-300 font-mono text-xs">{selectedReport.reporter_user_id}</span>
              </div>
              {selectedReport.reported_user_id && (
                <div>
                  <span className="text-gray-400">{t('신고 대상', 'Reportado')}:</span>{' '}
                  <span className="text-gray-300 font-mono text-xs">{selectedReport.reported_user_id}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">{t('날짜', 'Fecha')}:</span>{' '}
                <span className="text-gray-300">{new Date(selectedReport.created_at).toLocaleString()}</span>
              </div>

              {/* Resolution notes input */}
              <div className="pt-2 border-t border-gray-700">
                <label className="text-gray-400 text-xs block mb-1">
                  {t('조치 메모', 'Notas de resolución')}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 resize-none"
                  rows={2}
                  placeholder={t('메모를 입력하세요...', 'Escriba notas...')}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedReport.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReport(selectedReport.id, 'reviewing')}
                      disabled={saving}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {t('검토 시작', 'Iniciar revisión')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReport(selectedReport.id, 'dismissed')}
                      disabled={saving}
                      className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
                    >
                      {t('기각', 'Descartar')}
                    </Button>
                  </>
                )}
                {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReport(selectedReport.id, 'resolved', 'warning_sent')}
                      disabled={saving}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      {t('경고 발송', 'Enviar advertencia')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReport(selectedReport.id, 'resolved', 'user_banned')}
                      disabled={saving}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      {t('사용자 차단', 'Banear usuario')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Render: Flags tab ──
  const renderFlags = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-600"
        >
          <option value="">{t('모든 상태', 'Todos los estados')}</option>
          <option value="active">{t('활성', 'Activo')}</option>
          <option value="reviewed">{t('검토됨', 'Revisado')}</option>
          <option value="false_positive">{t('오탐지', 'Falso positivo')}</option>
          <option value="confirmed">{t('확인됨', 'Confirmado')}</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 border border-gray-600"
        >
          <option value="">{t('모든 심각도', 'Todas las severidades')}</option>
          <option value="informative">{t('정보', 'Informativo')}</option>
          <option value="warning">{t('경고', 'Advertencia')}</option>
          <option value="high_risk">{t('고위험', 'Alto riesgo')}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('플래그가 없습니다', 'No hay flags')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card
              key={flag.id}
              className="bg-gray-800 border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => { setSelectedFlag(flag); setActionNotes('') }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[flag.severity] || ''}`}>
                      {flag.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[flag.status] || ''}`}>
                      {flag.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      [{flag.detection_type}] {flag.detection_rule}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    &ldquo;{flag.flagged_content}&rdquo;
                  </p>
                  <p className="text-gray-500 text-xs">
                    {flag.source_language && `[${flag.source_language}] `}
                    {t('신뢰도', 'Confianza')}: {Math.round(flag.confidence * 100)}%
                    · {new Date(flag.created_at).toLocaleString()}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Flag detail modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">{t('플래그 상세', 'Detalle del flag')}</h3>
              <button onClick={() => setSelectedFlag(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-xs ${SEVERITY_COLORS[selectedFlag.severity]}`}>
                  {selectedFlag.severity}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedFlag.status]}`}>
                  {selectedFlag.status}
                </span>
              </div>

              <div>
                <span className="text-gray-400">{t('감지 규칙', 'Regla de detección')}:</span>{' '}
                <span className="text-white font-mono text-xs">{selectedFlag.detection_rule}</span>
              </div>
              <div>
                <span className="text-gray-400">{t('감지 유형', 'Tipo de detección')}:</span>{' '}
                <span className="text-gray-300">{selectedFlag.detection_type}</span>
              </div>
              <div>
                <span className="text-gray-400">{t('신뢰도', 'Confianza')}:</span>{' '}
                <span className="text-white">{Math.round(selectedFlag.confidence * 100)}%</span>
              </div>

              <div className="bg-gray-700/50 rounded p-3">
                <span className="text-gray-400 text-xs block mb-1">{t('감지된 내용', 'Contenido detectado')}:</span>
                <p className="text-gray-200">&ldquo;{selectedFlag.flagged_content}&rdquo;</p>
              </div>

              <div>
                <span className="text-gray-400">{t('세션 ID', 'ID Sesión')}:</span>{' '}
                <span className="text-gray-300 font-mono text-xs">{selectedFlag.session_id}</span>
              </div>
              {selectedFlag.source_language && (
                <div>
                  <span className="text-gray-400">{t('언어', 'Idioma')}:</span>{' '}
                  <span className="text-gray-300">{selectedFlag.source_language}</span>
                </div>
              )}

              {/* Review notes */}
              <div className="pt-2 border-t border-gray-700">
                <label className="text-gray-400 text-xs block mb-1">
                  {t('검토 메모', 'Notas de revisión')}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-gray-700 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 resize-none"
                  rows={2}
                  placeholder={t('메모를 입력하세요...', 'Escriba notas...')}
                />
              </div>

              {/* Action buttons */}
              {selectedFlag.status === 'active' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFlag(selectedFlag.id, 'confirmed')}
                    disabled={saving}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    {t('확인', 'Confirmar')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFlag(selectedFlag.id, 'false_positive')}
                    disabled={saving}
                    className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10"
                  >
                    {t('오탐지', 'Falso positivo')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFlag(selectedFlag.id, 'reviewed')}
                    disabled={saving}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    {t('검토 완료', 'Marcar revisado')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Main render ──
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-400" />
            {t('멘토 모더레이션', 'Moderación Mentor')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('멘토 화상 세션의 신고 및 자동 플래그 관리', 'Gestión de reportes y flags automáticos en sesiones mentor')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('새로고침', 'Actualizar')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
        {([
          { key: 'overview' as const, label: t('개요', 'Resumen'), icon: MessageSquare },
          { key: 'reports' as const, label: t('신고', 'Reportes'), icon: AlertCircle },
          { key: 'flags' as const, label: t('플래그', 'Flags'), icon: Flag },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setFilterStatus(''); setFilterSeverity('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'reports' && stats?.reports.pending ? (
              <span className="bg-orange-500 text-white text-[10px] px-1.5 rounded-full">
                {stats.reports.pending}
              </span>
            ) : null}
            {key === 'flags' && stats?.flags.active ? (
              <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                {stats.flags.active}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'flags' && renderFlags()}
    </div>
  )
}
