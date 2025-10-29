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

const statusLabels = {
  pending: '대기중',
  reviewing: '검토중',
  approved: '승인됨',
  rejected: '거절됨',
  completed: '완료됨'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800'
}

const businessFieldLabels = {
  tech: '기술/IT',
  finance: '금융/핀테크',
  ecommerce: '이커머스/소매',
  education: '교육/에듀테크',
  healthcare: '헬스케어/의료',
  media: '미디어/엔터테인먼트',
  logistics: '물류/배송',
  food: '푸드/배달',
  travel: '여행/관광',
  other: '기타'
}

const companySizeLabels = {
  startup: '스타트업 (1-10명)',
  small: '소규모 (11-50명)',
  medium: '중규모 (51-200명)',
  large: '대규모 (200명 이상)',
  enterprise: '대기업 (1000명 이상)'
}

const partnershipTypeLabels = {
  advertising: '광고 협업',
  investment: '투자/펀딩',
  technology: '기술 협업',
  distribution: '유통/판매',
  content: '콘텐츠 협업',
  event: '이벤트 협업',
  other: '기타'
}

const budgetLabels = {
  'under-1m': '100만원 미만',
  '1m-5m': '100만원 - 500만원',
  '5m-10m': '500만원 - 1,000만원',
  '10m-50m': '1,000만원 - 5,000만원',
  'over-50m': '5,000만원 이상',
  'discuss': '협의 후 결정'
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
      
      const response = await fetch(`/api/partnership?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setInquiries(data.data)
      } else {
        setError('제휴 문의를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
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
          'Content-Type': 'application/json'
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
        setError('상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Handshake className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">제휴 문의 관리</h1>
          </div>
          <p className="text-gray-600">제휴 문의를 검토하고 관리하세요.</p>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="상태별 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="reviewing">검토중</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="rejected">거절됨</SelectItem>
              <SelectItem value="completed">완료됨</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
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
                <p className="text-gray-500">제휴 문의가 없습니다.</p>
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
                      <p className="text-gray-600 mt-1">
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
                      <div className="text-sm">
                        <span className="font-medium">사업 분야:</span> {businessFieldLabels[inquiry.business_field as keyof typeof businessFieldLabels]}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">회사 규모:</span> {companySizeLabels[inquiry.company_size as keyof typeof companySizeLabels]}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">제휴 유형:</span> {partnershipTypeLabels[inquiry.partnership_type as keyof typeof partnershipTypeLabels]}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">예산:</span> {budgetLabels[inquiry.budget as keyof typeof budgetLabels]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
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
                        상세보기
                      </Button>
                      {inquiry.attachment_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inquiry.attachment_url && window.open(inquiry.attachment_url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          첨부파일
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
                            검토중
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(inquiry.id, 'approved')}
                            disabled={updating}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(inquiry.id, 'rejected')}
                            disabled={updating}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            거절
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
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(inquiry.id, 'rejected')}
                            disabled={updating}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            거절
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
                          완료
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
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    제휴 문의 상세보기
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInquiry(null)}
                  >
                    닫기
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* 회사 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">회사 정보</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">회사명</label>
                        <p className="text-gray-900">{selectedInquiry.company_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">대표자명</label>
                        <p className="text-gray-900">{selectedInquiry.representative_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">직책</label>
                        <p className="text-gray-900">{selectedInquiry.position}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">이메일</label>
                        <p className="text-gray-900">{selectedInquiry.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">연락처</label>
                        <p className="text-gray-900">{selectedInquiry.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* 사업 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">사업 정보</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">사업 분야</label>
                        <p className="text-gray-900">{businessFieldLabels[selectedInquiry.business_field as keyof typeof businessFieldLabels]}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">회사 규모</label>
                        <p className="text-gray-900">{companySizeLabels[selectedInquiry.company_size as keyof typeof companySizeLabels]}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">제휴 유형</label>
                        <p className="text-gray-900">{partnershipTypeLabels[selectedInquiry.partnership_type as keyof typeof partnershipTypeLabels]}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">예산 범위</label>
                        <p className="text-gray-900">{budgetLabels[selectedInquiry.budget as keyof typeof budgetLabels]}</p>
                      </div>
                    </div>
                  </div>

                  {/* 기대 효과 */}
                  {selectedInquiry.expected_effect && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">기대 효과</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedInquiry.expected_effect}</p>
                    </div>
                  )}

                  {/* 제휴 제안 내용 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">제휴 제안 내용</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>

                  {/* 첨부파일 */}
                  {selectedInquiry.attachment_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">첨부파일</h3>
                      <Button
                        variant="outline"
                        onClick={() => selectedInquiry.attachment_url && window.open(selectedInquiry.attachment_url, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        첨부파일 보기
                      </Button>
                    </div>
                  )}

                  {/* 관리자 메모 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">관리자 메모</h3>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="관리자 메모를 입력하세요..."
                      rows={3}
                    />
                  </div>

                  {/* 상태 업데이트 버튼 */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedInquiry.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateStatus(selectedInquiry.id, 'reviewing')}
                          disabled={updating}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          검토중으로 변경
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateStatus(selectedInquiry.id, 'approved')}
                          disabled={updating}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateStatus(selectedInquiry.id, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          거절
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
                          승인
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateStatus(selectedInquiry.id, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </>
                    )}
                    {selectedInquiry.status === 'approved' && (
                      <Button
                        onClick={() => updateStatus(selectedInquiry.id, 'completed')}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        완료로 변경
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
