'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

type Report = {
  id: string
  reporter_id: string
  reported_user_id: string
  context_type?: string | null
  context_id?: string | null
  reason?: string | null
  details?: string | null
  status: string
  created_at: string
  reviewed_at?: string | null
  resolution_notes?: string | null
  reporter?: {
    id: string
    name: string
    email?: string
  } | null
  reportedUser?: {
    id: string
    name: string
    email?: string
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: '처리 대기',
  reviewing: '검토 중',
  resolved: '조치 완료',
  dismissed: '기각됨'
}

const REASON_LABELS: Record<string, { ko: string; es: string }> = {
  spam: { ko: '스팸 / 광고', es: 'Spam / Publicidad' },
  harassment: { ko: '혐오 / 괴롭힘', es: 'Acoso / Ofensas' },
  inappropriate: { ko: '부적절한 콘텐츠', es: 'Contenido inapropiado' },
  other: { ko: '기타', es: 'Otro' }
}

export default function AdminReportsPage() {
  const { token } = useAuth()
  const { language } = useLanguage()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewing' | 'resolved' | 'dismissed'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('관리자 권한이 필요합니다.')
      setLoading(false)
      return
    }

    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/reports?status=${statusFilter}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || '신고 목록을 불러오지 못했습니다.')
        }

        const data = await response.json()
        setReports(data.reports || [])
      } catch (err) {
        console.error('[AdminReportsPage] fetch error:', err)
        setError('신고 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [statusFilter, token])

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports
    const term = searchTerm.toLowerCase()
    return reports.filter((report) => {
      const reporter = report.reporter?.name?.toLowerCase() || ''
      const reported = report.reportedUser?.name?.toLowerCase() || ''
      const details = report.details?.toLowerCase() || ''
      const reason = report.reason?.toLowerCase() || ''
      return (
        reporter.includes(term) ||
        reported.includes(term) ||
        details.includes(term) ||
        reason.includes(term) ||
        report.id.toLowerCase().includes(term)
      )
    })
  }, [reports, searchTerm])

  const handleUpdateStatus = async (reportId: string, nextStatus: 'resolved' | 'dismissed') => {
    if (!token) {
      setError('관리자 권한이 필요합니다.')
      return
    }

    try {
      setUpdatingReportId(reportId)
      const response = await fetch('/api/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId,
          status: nextStatus,
          resolutionNotes: ''
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || '상태 업데이트에 실패했습니다.')
      }

      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status: nextStatus, reviewed_at: new Date().toISOString() } : report
        )
      )
    } catch (err) {
      console.error('[AdminReportsPage] update error:', err)
      setError('상태를 변경하는 중 문제가 발생했습니다.')
    } finally {
      setUpdatingReportId(null)
    }
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  if (!token) {
    return (
      <div className="py-16 text-center text-gray-600">
        <p>관리자 권한이 있는 계정으로 로그인해주세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
          <p className="text-gray-600 text-sm">사용자 간 신고를 검토하고 조치할 수 있습니다.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <Input
            placeholder="신고 ID, 사용자 이름으로 검색..."
            className="w-full md:w-64"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="flex gap-2 text-sm">
            {(['pending', 'reviewing', 'resolved', 'dismissed'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {STATUS_LABELS[statusFilter]} ({filteredReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 border-2 border-b-transparent border-gray-400 rounded-full animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">해당 상태의 신고가 없습니다.</p>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="border-blue-300 text-blue-600">
                        {reasonOptions.find((item) => item.key === report.reason)?.label ||
                          REASON_LABELS[report.reason || 'other']?.[language === 'ko' ? 'ko' : 'es'] ||
                          '신고'}
                      </Badge>
                      <Badge variant="outline">{STATUS_LABELS[report.status] || report.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      신고자:{' '}
                      <span className="font-semibold">
                        {report.reporter?.name || report.reporter_id || '익명'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">
                      신고 대상:{' '}
                      <span className="font-semibold">
                        {report.reportedUser?.name || report.reported_user_id || '알 수 없음'}
                      </span>
                    </p>
                    {report.details && (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{report.details}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <p>신고일: {formatDateTime(report.created_at)}</p>
                    {report.reviewed_at && <p>처리일: {formatDateTime(report.reviewed_at)}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  {report.status !== 'dismissed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingReportId === report.id}
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                    >
                      {updatingReportId === report.id && statusFilter === 'dismissed'
                        ? '처리 중...'
                        : '기각'}
                    </Button>
                  )}
                  {report.status !== 'resolved' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updatingReportId === report.id}
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                    >
                      {updatingReportId === report.id && statusFilter === 'resolved'
                        ? '처리 중...'
                        : '조치 완료'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

