'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Handshake, Building2, User, Mail, Phone, Calendar, FileText, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface PartnershipInquiry {
  id: string
  company_name: string
  representative_name: string
  position: string
  email: string
  phone: string
  business_field: string
  company_size: string
  partnership_type: string
  budget: string
  expected_effect: string
  message: string
  attachment_url: string | null
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

export default function PartnershipAdminPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  const statusLabels = {
    pending: t('대기중', 'Pendiente'),
    reviewing: t('검토중', 'En revisión'),
    approved: t('승인됨', 'Aprobado'),
    rejected: t('거절됨', 'Rechazado'),
    completed: t('완료됨', 'Completado')
  }

  const businessFieldLabels: Record<string, string> = {
    tech: t('기술/IT', 'IT/Software'),
    finance: t('금융/핀테크', 'Finanzas/Fintech'),
    ecommerce: t('이커머스/소매', 'E-commerce/Retail'),
    education: t('교육/에듀테크', 'Educación/Edtech'),
    healthcare: t('헬스케어/의료', 'Salud/Medicina'),
    media: t('미디어/엔터테인먼트', 'Medios/Entretenimiento'),
    logistics: t('물류/배송', 'Logística/Envíos'),
    food: t('푸드/배달', 'Alimentos/Delivery'),
    travel: t('여행/관광', 'Viajes/Turismo'),
    other: t('기타', 'Otros')
  }

  const companySizeLabels: Record<string, string> = {
    startup: t('스타트업 (1-10명)', 'Startup (1-10 personas)'),
    small: t('소규모 (11-50명)', 'Pequeña (11-50 personas)'),
    medium: t('중규모 (51-200명)', 'Mediana (51-200 personas)'),
    large: t('대규모 (200명 이상)', 'Grande (más de 200)'),
    enterprise: t('대기업 (1000명 이상)', 'Corporación (más de 1000)')
  }

  const partnershipTypeLabels: Record<string, string> = {
    advertising: t('광고 협업', 'Colaboración Publicitaria'),
    investment: t('투자/펀딩', 'Inversión/Financiación'),
    technology: t('기술 협업', 'Colaboración Tecnológica'),
    distribution: t('유통/판매', 'Distribución/Ventas'),
    content: t('콘텐츠 협업', 'Alianza de Contenido'),
    event: t('이벤트 협업', 'Colaboración de Eventos'),
    other: t('기타', 'Otros')
  }

  const budgetLabels: Record<string, string> = {
    'under-1m': t('100만원 미만', 'Menos de ₩1M'),
    '1m-5m': t('100만원 - 500만원', '₩1M - ₩5M'),
    '5m-10m': t('500만원 - 1,000만원', '₩5M - ₩10M'),
    '10m-50m': t('1,000만원 - 5,000만원', '₩10M - ₩50M'),
    'over-50m': t('5,000만원 이상', 'Más de ₩50M'),
    'discuss': t('협의 후 결정', 'Por definir')
  }

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/partnership?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setInquiries(data.data)
      } else {
        setError(t('제휴 문의를 불러오는데 실패했습니다.', 'Error al cargar las solicitudes de asociación.'))
      }
    } catch (error) {
      setError(t('네트워크 오류가 발생했습니다.', 'Error de red.'))
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/partnership/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes
        })
      })

      if (response.ok) {
        await fetchInquiries()
        setSelectedInquiry(null)
        setAdminNotes('')
      } else {
        setError(t('상태 업데이트에 실패했습니다.', 'Error al actualizar el estado.'))
      }
    } catch (error) {
      setError(t('네트워크 오류가 발생했습니다.', 'Error de red.'))
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Handshake className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('제휴 문의 관리', 'Gestión de Solicitudes de Asociación')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('제휴 문의를 검토하고 관리하세요.', 'Revise y gestione las solicitudes de asociación.')}</p>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('상태별 필터', 'Filtrar por estado')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('전체', 'Todos')}</SelectItem>
              <SelectItem value="pending">{t('대기중', 'Pendiente')}</SelectItem>
              <SelectItem value="reviewing">{t('검토중', 'En revisión')}</SelectItem>
              <SelectItem value="approved">{t('승인됨', 'Aprobado')}</SelectItem>
              <SelectItem value="rejected">{t('거절됨', 'Rechazado')}</SelectItem>
              <SelectItem value="completed">{t('완료됨', 'Completado')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 문의 목록 */}
        <div className="grid gap-6">
          {inquiries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t('제휴 문의가 없습니다.', 'No hay solicitudes de asociación.')}</p>
              </CardContent>
            </Card>
          ) : (
            inquiries.map((inquiry) => (
              <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        {inquiry.company_name}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {inquiry.representative_name} ({inquiry.position})
                      </p>
                    </div>
                    <Badge className={statusColors[inquiry.status]}>
                      {statusLabels[inquiry.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{inquiry.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{inquiry.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{formatDate(inquiry.created_at)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm dark:text-gray-300">
                        <span className="font-medium">{t('사업 분야:', 'Sector:')}</span> {businessFieldLabels[inquiry.business_field as keyof typeof businessFieldLabels]}
                      </div>
                      <div className="text-sm dark:text-gray-300">
                        <span className="font-medium">{t('회사 규모:', 'Tamaño de Empresa:')}</span> {companySizeLabels[inquiry.company_size as keyof typeof companySizeLabels]}
                      </div>
                      <div className="text-sm dark:text-gray-300">
                        <span className="font-medium">{t('제휴 유형:', 'Tipo de Asociación:')}</span> {partnershipTypeLabels[inquiry.partnership_type as keyof typeof partnershipTypeLabels]}
                      </div>
                      <div className="text-sm dark:text-gray-300">
                        <span className="font-medium">{t('예산:', 'Presupuesto:')}</span> {budgetLabels[inquiry.budget as keyof typeof budgetLabels]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {inquiry.message}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('상세보기', 'Ver detalles')}
                      </Button>
                      {inquiry.attachment_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inquiry.attachment_url && window.open(inquiry.attachment_url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {t('첨부파일', 'Adjunto')}
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {inquiry.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(inquiry.id, 'reviewing')}
                            disabled={updating}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            {t('검토중', 'En revisión')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(inquiry.id, 'approved')}
                            disabled={updating}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('승인', 'Aprobar')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(inquiry.id, 'rejected')}
                            disabled={updating}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('거절', 'Rechazar')}
                          </Button>
                        </>
                      )}
                      {inquiry.status === 'reviewing' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(inquiry.id, 'approved')}
                            disabled={updating}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('승인', 'Aprobar')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(inquiry.id, 'rejected')}
                            disabled={updating}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('거절', 'Rechazar')}
                          </Button>
                        </>
                      )}
                      {inquiry.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(inquiry.id, 'completed')}
                          disabled={updating}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('완료', 'Completar')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 상세보기 모달 */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('제휴 문의 상세보기', 'Detalles de Solicitud de Asociación')}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInquiry(null)}
                  >
                    {t('닫기', 'Cerrar')}
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* 회사 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('회사 정보', 'Información de Empresa')}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('회사명', 'Nombre de Empresa')}</label>
                        <p className="text-gray-900 dark:text-white">{selectedInquiry.company_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('대표자명', 'Representante')}</label>
                        <p className="text-gray-900 dark:text-white">{selectedInquiry.representative_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('직책', 'Cargo')}</label>
                        <p className="text-gray-900 dark:text-white">{selectedInquiry.position}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('이메일', 'Email')}</label>
                        <p className="text-gray-900 dark:text-white">{selectedInquiry.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('연락처', 'Teléfono')}</label>
                        <p className="text-gray-900 dark:text-white">{selectedInquiry.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* 사업 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('사업 정보', 'Información del Negocio')}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('사업 분야', 'Sector')}</label>
                        <p className="text-gray-900 dark:text-white">{businessFieldLabels[selectedInquiry.business_field as keyof typeof businessFieldLabels]}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('회사 규모', 'Tamaño de Empresa')}</label>
                        <p className="text-gray-900 dark:text-white">{companySizeLabels[selectedInquiry.company_size as keyof typeof companySizeLabels]}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('제휴 유형', 'Tipo de Asociación')}</label>
                        <p className="text-gray-900 dark:text-white">{partnershipTypeLabels[selectedInquiry.partnership_type as keyof typeof partnershipTypeLabels]}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('예산 범위', 'Rango de Presupuesto')}</label>
                        <p className="text-gray-900 dark:text-white">{budgetLabels[selectedInquiry.budget as keyof typeof budgetLabels]}</p>
                      </div>
                    </div>
                  </div>

                  {/* 기대 효과 */}
                  {selectedInquiry.expected_effect && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('기대 효과', 'Efecto Esperado')}</h3>
                      <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{selectedInquiry.expected_effect}</p>
                    </div>
                  )}

                  {/* 제휴 제안 내용 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('제휴 제안 내용', 'Contenido de la Propuesta')}</h3>
                    <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>

                  {/* 첨부파일 */}
                  {selectedInquiry.attachment_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('첨부파일', 'Archivo Adjunto')}</h3>
                      <Button
                        variant="outline"
                        onClick={() => selectedInquiry.attachment_url && window.open(selectedInquiry.attachment_url, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t('첨부파일 보기', 'Ver adjunto')}
                      </Button>
                    </div>
                  )}

                  {/* 관리자 메모 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('관리자 메모', 'Notas del Administrador')}</h3>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={t('관리자 메모를 입력하세요...', 'Escriba notas del administrador...')}
                      rows={3}
                    />
                  </div>

                  {/* 상태 업데이트 버튼 */}
                  <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                    {selectedInquiry.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateStatus(selectedInquiry.id, 'reviewing')}
                          disabled={updating}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {t('검토중으로 변경', 'Cambiar a En revisión')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateStatus(selectedInquiry.id, 'approved')}
                          disabled={updating}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('승인', 'Aprobar')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateStatus(selectedInquiry.id, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('거절', 'Rechazar')}
                        </Button>
                      </>
                    )}
                    {selectedInquiry.status === 'reviewing' && (
                      <>
                        <Button
                          onClick={() => updateStatus(selectedInquiry.id, 'approved')}
                          disabled={updating}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('승인', 'Aprobar')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateStatus(selectedInquiry.id, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('거절', 'Rechazar')}
                        </Button>
                      </>
                    )}
                    {selectedInquiry.status === 'approved' && (
                      <Button
                        onClick={() => updateStatus(selectedInquiry.id, 'completed')}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t('완료로 변경', 'Marcar como completado')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
