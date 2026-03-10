'use client'

import { useEffect, useState, useCallback } from 'react'

type ReportStatus = 'pending' | 'reviewing' | 'actioned' | 'dismissed'
type ReportSeverity = 'low' | 'medium' | 'high' | 'critical'
type ReportType = 'user_behavior' | 'message_content' | 'technical' | 'other'

interface ModerationReport {
  id: string
  session_id: string
  course_id: string
  reporter_id: string
  reported_user_id: string | null
  report_type: ReportType
  severity: ReportSeverity
  description: string
  evidence: Record<string, unknown> | null
  status: ReportStatus
  admin_notes: string | null
  actioned_by: string | null
  actioned_at: string | null
  created_at: string
  session?: { id: string; scheduled_at: string }
  course?: { id: string; title: string }
}

interface Stats {
  total: number
  pending: number
  reviewing: number
  actioned: number
  dismissed: number
  critical: number
  high: number
}

const SEVERITY_COLORS: Record<ReportSeverity, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-purple-100 text-purple-700',
  actioned: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

const TYPE_LABELS: Record<ReportType, string> = {
  user_behavior: 'Conducta',
  message_content: 'Contenido',
  technical: 'Técnico',
  other: 'Otro',
}

export default function EducationModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  // Action modal
  const [selected, setSelected] = useState<ModerationReport | null>(null)
  const [actionStatus, setActionStatus] = useState<ReportStatus | ''>('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (filterStatus) qs.set('status', filterStatus)
    if (filterSeverity) qs.set('severity', filterSeverity)

    try {
      const res = await fetch(`/api/admin/education/moderation/reports?${qs}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setReports(data.reports)
      setTotal(data.total)
      setStats(data.stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterSeverity])

  useEffect(() => { fetchReports() }, [fetchReports])

  const openAction = (r: ModerationReport) => {
    setSelected(r)
    setActionStatus(r.status)
    setAdminNotes(r.admin_notes || '')
  }

  const handleSave = async () => {
    if (!selected || !actionStatus) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/education/moderation/reports/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionStatus, admin_notes: adminNotes }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setSelected(null)
      fetchReports()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Moderación — Educación</h1>
      <p className="text-sm text-gray-500 mb-6">Revisión de reportes enviados durante clases en vivo</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-gray-50' },
            { label: 'Pendientes', value: stats.pending, cls: 'bg-blue-50 text-blue-700' },
            { label: 'Revisando', value: stats.reviewing, cls: 'bg-purple-50 text-purple-700' },
            { label: 'Accionados', value: stats.actioned, cls: 'bg-green-50 text-green-700' },
            { label: 'Descartados', value: stats.dismissed, cls: 'bg-gray-50 text-gray-500' },
            { label: 'Críticos', value: stats.critical, cls: 'bg-red-50 text-red-700' },
            { label: 'Altos', value: stats.high, cls: 'bg-orange-50 text-orange-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 text-center ${s.cls}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={e => { setPage(1); setFilterStatus(e.target.value) }}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="reviewing">Revisando</option>
          <option value="actioned">Accionado</option>
          <option value="dismissed">Descartado</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => { setPage(1); setFilterSeverity(e.target.value) }}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">Toda severidad</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <button
          onClick={() => { setPage(1); fetchReports() }}
          className="border rounded px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100"
        >
          Actualizar
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400 italic">No hay reportes con los filtros seleccionados.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Curso', 'Tipo', 'Severidad', 'Estado', 'Descripción', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(r.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{r.course?.title || r.course_id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">{TYPE_LABELS[r.report_type]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[r.severity]}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={r.description}>
                      {r.description}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openAction(r)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1 border rounded disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        </>
      )}

      {/* Action Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold mb-1">Revisar Reporte</h2>
            <p className="text-xs text-gray-400 mb-4">ID: {selected.id.slice(0, 12)}…</p>

            <div className="space-y-2 mb-4 text-sm">
              <div><span className="font-medium">Tipo:</span> {TYPE_LABELS[selected.report_type]}</div>
              <div><span className="font-medium">Severidad:</span>{' '}
                <span className={`px-2 py-0.5 rounded text-xs ${SEVERITY_COLORS[selected.severity]}`}>{selected.severity}</span>
              </div>
              <div>
                <span className="font-medium">Descripción:</span>
                <p className="mt-1 p-2 bg-gray-50 rounded text-gray-700">{selected.description}</p>
              </div>
              {selected.evidence && (
                <div>
                  <span className="font-medium">Evidencia:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">{JSON.stringify(selected.evidence, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Cambiar estado</label>
                <select
                  value={actionStatus}
                  onChange={e => setActionStatus(e.target.value as ReportStatus)}
                  className="border rounded px-3 py-1.5 text-sm w-full"
                >
                  <option value="pending">Pendiente</option>
                  <option value="reviewing">Revisando</option>
                  <option value="actioned">Accionado</option>
                  <option value="dismissed">Descartado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas de moderación</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Descripción de la acción tomada…"
                  className="border rounded px-3 py-2 text-sm w-full resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded text-sm">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
