'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ShieldAlert, Flag, AlertTriangle, AlertCircle, CheckCircle,
  Loader2, RefreshCw, Eye, X, ChevronDown, Filter,
  UserX, Clock, TrendingUp, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

interface Report {
  id: string
  session_id: string
  reporter_user_id: string
  reporter_name: string | null
  reported_user_id: string | null
  reported_user_name: string | null
  reason: string
  description: string | null
  severity: string
  status: string
  resolved_by: string | null
  resolution_notes: string | null
  action_taken: string | null
  created_at: string
  updated_at: string
}

interface ModerationFlag {
  id: string
  session_id: string
  flagged_user_id: string | null
  flagged_user_name: string | null
  flagged_content: string
  content_language: string | null
  detection_rule: string
  detection_type: string
  severity: string
  confidence: number
  status: string
  review_notes: string | null
  created_at: string
}

interface Stats {
  reports: {
    total: number; pending: number; reviewing: number;
    resolved: number; dismissed: number; high_risk: number;
    warning: number; informative: number
  }
  flags: {
    total: number; active: number; reviewed: number;
    false_positive: number; confirmed: number; high_risk: number;
    warning: number; informative: number
  }
  repeat_offenders: Array<{
    user_id: string; user_name: string;
    report_count: number; flag_count: number; total: number
  }>
  affected_sessions: number
  recent: { reports_7d: number; flags_7d: number }
}

export default function AdminModerationPage() {
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

  const loadStats = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/moderation/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch {}
  }, [token])

  const loadReports = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterSeverity) params.set('severity', filterSeverity)

      const res = await fetch(`/api/admin/moderation/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch {} finally { setLoading(false) }
  }, [token, filterStatus, filterSeverity])

  const loadFlags = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterSeverity) params.set('severity', filterSeverity)

      const res = await fetch(`/api/admin/moderation/flags?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFlags(data.flags || [])
      }
    } catch {} finally { setLoading(false) }
  }, [token, filterStatus, filterSeverity])

  useEffect(() => {
    loadStats()
    if (activeTab === 'reports') loadReports()
    else if (activeTab === 'flags') loadFlags()
    else setLoading(false)
  }, [activeTab, loadStats, loadReports, loadFlags])

  const handleReportAction = async (reportId: string, status: string, actionTaken?: string) => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/moderation/reports', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reportId,
          status,
          action_taken: actionTaken || 'none',
          resolution_notes: actionNotes || null,
        }),
      })
      if (res.ok) {
        toast.success(t('보고서 처리 완료', 'Reporte procesado'))
        setSelectedReport(null)
        setActionNotes('')
        loadReports()
        loadStats()
      }
    } catch {
      toast.error(t('처리 실패', 'Error al procesar'))
    } finally { setSaving(false) }
  }

  const handleFlagAction = async (flagId: string, status: string) => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/moderation/flags', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: flagId,
          status,
          review_notes: actionNotes || null,
        }),
      })
      if (res.ok) {
        toast.success(t('플래그 처리 완료', 'Flag procesado'))
        setSelectedFlag(null)
        setActionNotes('')
        loadFlags()
        loadStats()
      }
    } catch {
      toast.error(t('처리 실패', 'Error al procesar'))
    } finally { setSaving(false) }
  }

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'high_risk': return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="w-3 h-3" />
          {t('고위험', 'Alto riesgo')}
        </span>
      )
      case 'warning': return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          <AlertCircle className="w-3 h-3" />
          {t('경고', 'Advertencia')}
        </span>
      )
      default: return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {t('정보', 'Informativo')}
        </span>
      )
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{t('대기중', 'Pendiente')}</span>
      case 'reviewing': return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{t('검토중', 'Revisando')}</span>
      case 'resolved': return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{t('해결됨', 'Resuelto')}</span>
      case 'dismissed': return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">{t('무시됨', 'Descartado')}</span>
      case 'active': return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{t('활성', 'Activo')}</span>
      case 'reviewed': return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{t('검토됨', 'Revisado')}</span>
      case 'false_positive': return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">{t('오탐', 'Falso positivo')}</span>
      case 'confirmed': return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{t('확인됨', 'Confirmado')}</span>
      default: return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">{status}</span>
    }
  }

  const reasonLabel = (reason: string) => {
    const labels: Record<string, { ko: string; es: string }> = {
      harassment: { ko: '괴롭힘', es: 'Acoso' },
      insults: { ko: '모욕', es: 'Insultos' },
      spam: { ko: '스팸', es: 'Spam' },
      offensive_content: { ko: '불쾌한 콘텐츠', es: 'Contenido ofensivo' },
      other: { ko: '기타', es: 'Otro' },
    }
    const l = labels[reason]
    return l ? (language === 'ko' ? l.ko : l.es) : reason
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('콘텐츠 관리 패널', 'Panel de Moderación')}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadStats(); if (activeTab === 'reports') loadReports(); else if (activeTab === 'flags') loadFlags() }}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('새로고침', 'Refrescar')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
        {(['overview', 'reports', 'flags'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilterStatus(''); setFilterSeverity('') }}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'overview' && t('개요', 'Resumen')}
            {tab === 'reports' && t('신고', 'Reportes')}
            {tab === 'flags' && t('자동 플래그', 'Flags automáticos')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('대기 신고', 'Reportes pendientes')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.reports.pending}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-red-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('활성 플래그', 'Flags activos')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.flags.active}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('고위험', 'Alto riesgo')}</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.reports.high_risk + stats.flags.high_risk}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('최근 7일', 'Últimos 7 días')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recent.reports_7d + stats.recent.flags_7d}</p>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 dark:bg-gray-700/50">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                {t('신고 요약', 'Resumen de reportes')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t('총 신고', 'Total reportes')}</span><strong>{stats.reports.total}</strong></div>
                <div className="flex justify-between"><span className="text-orange-500">{t('대기중', 'Pendientes')}</span><strong>{stats.reports.pending}</strong></div>
                <div className="flex justify-between"><span className="text-blue-500">{t('검토중', 'Revisando')}</span><strong>{stats.reports.reviewing}</strong></div>
                <div className="flex justify-between"><span className="text-green-500">{t('해결됨', 'Resueltos')}</span><strong>{stats.reports.resolved}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">{t('무시됨', 'Descartados')}</span><strong>{stats.reports.dismissed}</strong></div>
              </div>
            </Card>
            <Card className="p-4 dark:bg-gray-700/50">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                {t('자동 플래그 요약', 'Resumen de flags')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t('총 플래그', 'Total flags')}</span><strong>{stats.flags.total}</strong></div>
                <div className="flex justify-between"><span className="text-red-500">{t('활성', 'Activos')}</span><strong>{stats.flags.active}</strong></div>
                <div className="flex justify-between"><span className="text-green-500">{t('검토됨', 'Revisados')}</span><strong>{stats.flags.reviewed}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">{t('오탐', 'Falsos positivos')}</span><strong>{stats.flags.false_positive}</strong></div>
                <div className="flex justify-between"><span className="text-red-600">{t('확인됨', 'Confirmados')}</span><strong>{stats.flags.confirmed}</strong></div>
              </div>
            </Card>
          </div>

          {/* Repeat Offenders */}
          {stats.repeat_offenders.length > 0 && (
            <Card className="p-4 dark:bg-gray-700/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <UserX className="w-4 h-4 text-red-500" />
                {t('반복 위반 사용자', 'Usuarios reincidentes')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      <th className="text-left py-2 px-2">{t('사용자', 'Usuario')}</th>
                      <th className="text-center py-2 px-2">{t('신고', 'Reportes')}</th>
                      <th className="text-center py-2 px-2">{t('플래그', 'Flags')}</th>
                      <th className="text-center py-2 px-2">{t('총계', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.repeat_offenders.map(o => (
                      <tr key={o.user_id} className="border-b dark:border-gray-700">
                        <td className="py-2 px-2 font-medium">{o.user_name}</td>
                        <td className="py-2 px-2 text-center">{o.report_count}</td>
                        <td className="py-2 px-2 text-center">{o.flag_count}</td>
                        <td className="py-2 px-2 text-center font-bold text-red-600">{o.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="text-center text-sm text-gray-400 dark:text-gray-500">
            {t(`${stats.affected_sessions}개 세션에 영향`, `${stats.affected_sessions} sesiones afectadas`)}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 상태', 'Todos los estados')}</option>
              <option value="pending">{t('대기중', 'Pendiente')}</option>
              <option value="reviewing">{t('검토중', 'Revisando')}</option>
              <option value="resolved">{t('해결됨', 'Resuelto')}</option>
              <option value="dismissed">{t('무시됨', 'Descartado')}</option>
            </select>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 심각도', 'Toda severidad')}</option>
              <option value="high_risk">{t('고위험', 'Alto riesgo')}</option>
              <option value="warning">{t('경고', 'Advertencia')}</option>
              <option value="informative">{t('정보', 'Informativo')}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-700/50">
              <CheckCircle className="w-12 h-12 mx-auto text-green-300 dark:text-green-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('신고가 없습니다', 'No hay reportes')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {reports.map(report => (
                <Card
                  key={report.id}
                  className="p-4 dark:bg-gray-700/50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {severityBadge(report.severity)}
                        {statusBadge(report.status)}
                        <span className="text-sm font-medium">{reasonLabel(report.reason)}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('신고자', 'Reportado por')}: {report.reporter_name || 'Unknown'}
                        {report.reported_user_name && (
                          <> → {report.reported_user_name}</>
                        )}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">{report.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-CO')}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flags Tab */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 상태', 'Todos los estados')}</option>
              <option value="active">{t('활성', 'Activo')}</option>
              <option value="reviewed">{t('검토됨', 'Revisado')}</option>
              <option value="false_positive">{t('오탐', 'Falso positivo')}</option>
              <option value="confirmed">{t('확인됨', 'Confirmado')}</option>
            </select>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm p-2"
            >
              <option value="">{t('모든 심각도', 'Toda severidad')}</option>
              <option value="high_risk">{t('고위험', 'Alto riesgo')}</option>
              <option value="warning">{t('경고', 'Advertencia')}</option>
              <option value="informative">{t('정보', 'Informativo')}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : flags.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-700/50">
              <CheckCircle className="w-12 h-12 mx-auto text-green-300 dark:text-green-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('플래그가 없습니다', 'No hay flags')}</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {flags.map(flag => (
                <Card
                  key={flag.id}
                  className="p-4 dark:bg-gray-700/50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedFlag(flag)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {severityBadge(flag.severity)}
                        {statusBadge(flag.status)}
                        <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                          {flag.detection_type} / {flag.detection_rule}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                        &ldquo;{flag.flagged_content.substring(0, 100)}{flag.flagged_content.length > 100 ? '...' : ''}&rdquo;
                      </p>
                      {flag.flagged_user_name && (
                        <p className="text-xs text-gray-400 mt-1">
                          {t('사용자', 'Usuario')}: {flag.flagged_user_name}
                          {flag.content_language && ` (${flag.content_language.toUpperCase()})`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                      <span className="font-mono">{Math.round(flag.confidence * 100)}%</span>
                      <Clock className="w-3 h-3" />
                      {new Date(flag.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-CO')}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('신고 상세', 'Detalle del reporte')}</h3>
              <button onClick={() => { setSelectedReport(null); setActionNotes('') }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-2">{severityBadge(selectedReport.severity)} {statusBadge(selectedReport.status)}</div>
              <div><strong>{t('사유', 'Razón')}:</strong> {reasonLabel(selectedReport.reason)}</div>
              <div><strong>{t('신고자', 'Reportado por')}:</strong> {selectedReport.reporter_name}</div>
              {selectedReport.reported_user_name && (
                <div><strong>{t('대상 사용자', 'Usuario reportado')}:</strong> {selectedReport.reported_user_name}</div>
              )}
              {selectedReport.description && (
                <div>
                  <strong>{t('설명', 'Descripción')}:</strong>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded">{selectedReport.description}</p>
                </div>
              )}
              <div><strong>{t('세션 ID', 'ID de sesión')}:</strong> <span className="font-mono text-xs">{selectedReport.session_id}</span></div>
              <div><strong>{t('날짜', 'Fecha')}:</strong> {new Date(selectedReport.created_at).toLocaleString(language === 'ko' ? 'ko-KR' : 'es-CO')}</div>

              {selectedReport.status === 'pending' || selectedReport.status === 'reviewing' ? (
                <>
                  <hr className="dark:border-gray-600" />
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('조치 메모', 'Notas de resolución')}</label>
                    <textarea
                      value={actionNotes}
                      onChange={e => setActionNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm"
                      placeholder={t('처리 내용을 기록하세요...', 'Describe la acción tomada...')}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReportAction(selectedReport.id, 'reviewing')}
                      disabled={saving}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('검토 시작', 'Iniciar revisión')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-yellow-600 border-yellow-300"
                      onClick={() => handleReportAction(selectedReport.id, 'resolved', 'warning_sent')}
                      disabled={saving}
                    >
                      {t('경고 발송', 'Enviar advertencia')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300"
                      onClick={() => handleReportAction(selectedReport.id, 'resolved', 'user_muted')}
                      disabled={saving}
                    >
                      {t('사용자 음소거', 'Silenciar usuario')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReportAction(selectedReport.id, 'dismissed')}
                      disabled={saving}
                    >
                      {t('무시', 'Descartar')}
                    </Button>
                  </div>
                </>
              ) : (
                selectedReport.resolution_notes && (
                  <div>
                    <strong>{t('해결 메모', 'Notas')}:</strong>
                    <p className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">{selectedReport.resolution_notes}</p>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Flag Detail Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('플래그 상세', 'Detalle del flag')}</h3>
              <button onClick={() => { setSelectedFlag(null); setActionNotes('') }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-2">{severityBadge(selectedFlag.severity)} {statusBadge(selectedFlag.status)}</div>
              <div>
                <strong>{t('감지 내용', 'Contenido flaggeado')}:</strong>
                <p className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded font-mono text-xs break-all">{selectedFlag.flagged_content}</p>
              </div>
              <div><strong>{t('규칙', 'Regla')}:</strong> {selectedFlag.detection_rule} ({selectedFlag.detection_type})</div>
              <div><strong>{t('신뢰도', 'Confianza')}:</strong> {Math.round(selectedFlag.confidence * 100)}%</div>
              {selectedFlag.flagged_user_name && (
                <div><strong>{t('사용자', 'Usuario')}:</strong> {selectedFlag.flagged_user_name}</div>
              )}
              <div><strong>{t('세션 ID', 'ID sesión')}:</strong> <span className="font-mono text-xs">{selectedFlag.session_id}</span></div>

              {selectedFlag.status === 'active' && (
                <>
                  <hr className="dark:border-gray-600" />
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('검토 메모', 'Notas de revisión')}</label>
                    <textarea
                      value={actionNotes}
                      onChange={e => setActionNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300"
                      onClick={() => handleFlagAction(selectedFlag.id, 'confirmed')}
                      disabled={saving}
                    >
                      {t('위반 확인', 'Confirmar violación')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFlagAction(selectedFlag.id, 'reviewed')}
                      disabled={saving}
                    >
                      {t('검토 완료', 'Marcar revisado')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-500"
                      onClick={() => handleFlagAction(selectedFlag.id, 'false_positive')}
                      disabled={saving}
                    >
                      {t('오탐 처리', 'Falso positivo')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
