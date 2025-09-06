'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Send,
  User,
  Calendar,
  Filter
} from 'lucide-react'

interface Inquiry {
  id: string
  type: string
  subject: string
  content: string
  priority: string
  status: string
  language: string
  response_count: number
  created_at: string
  updated_at: string
  users: {
    email: string
    name: string
  }
}

interface Response {
  id: string
  content: string
  responder_type: string
  created_at: string
  users: {
    email: string
    name: string
  }
}

const statusConfig = {
  pending: { label: '대기중', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  in_progress: { label: '처리중', icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  resolved: { label: '해결됨', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' },
  closed: { label: '종료됨', icon: XCircle, color: 'bg-gray-100 text-gray-700 border-gray-300' }
}

const priorityConfig = {
  low: { label: '낮음', color: 'text-gray-600' },
  medium: { label: '보통', color: 'text-blue-600' },
  high: { label: '높음', color: 'text-orange-600' },
  urgent: { label: '긴급', color: 'text-red-600' }
}

const typeConfig = {
  bug: { label: '버그 신고', color: 'bg-red-100 text-red-700 border-red-300' },
  feature: { label: '기능 제안', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  general: { label: '일반 문의', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  payment: { label: '결제 문의', color: 'bg-green-100 text-green-700 border-green-300' },
  account: { label: '계정 문의', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  other: { label: '기타', color: 'bg-gray-100 text-gray-700 border-gray-300' }
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [responseText, setResponseText] = useState('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const response = await fetch(`/api/inquiries?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '문의 목록을 가져올 수 없습니다.')
      }

      setInquiries(result.inquiries || [])
    } catch (error) {
      console.error('문의 목록 조회 오류:', error)
      setError(error instanceof Error ? error.message : '문의 목록을 가져올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchResponses = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/responses`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '답변을 가져올 수 없습니다.')
      }

      setResponses(result.responses || [])
    } catch (error) {
      console.error('답변 조회 오류:', error)
    }
  }

  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('상태 업데이트에 실패했습니다.')
      }

      // 목록 새로고침
      fetchInquiries()
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status })
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      alert('상태 업데이트에 실패했습니다.')
    }
  }

  const submitResponse = async () => {
    if (!selectedInquiry || !responseText.trim()) return

    try {
      setIsSubmittingResponse(true)
      
      // 관리자 ID (실제로는 인증된 관리자 ID를 사용해야 함)
      const adminId = 'admin-user-id'

      const response = await fetch(`/api/inquiries/${selectedInquiry.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responderId: adminId,
          responderType: 'admin',
          content: responseText,
          isInternal: false
        })
      })

      if (!response.ok) {
        throw new Error('답변 제출에 실패했습니다.')
      }

      setResponseText('')
      fetchResponses(selectedInquiry.id)
      alert('답변이 성공적으로 제출되었습니다.')
    } catch (error) {
      console.error('답변 제출 오류:', error)
      alert('답변 제출에 실패했습니다.')
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter, typeFilter])

  useEffect(() => {
    if (selectedInquiry) {
      fetchResponses(selectedInquiry.id)
    }
  }, [selectedInquiry])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  const getPriorityConfig = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
  }

  const getTypeConfig = (type: string) => {
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.general
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">문의 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">문의 관리</h1>
          <p className="text-gray-600">사용자 문의를 확인하고 답변하세요</p>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">필터:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="in_progress">처리중</SelectItem>
                  <SelectItem value="resolved">해결됨</SelectItem>
                  <SelectItem value="closed">종료됨</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="bug">버그 신고</SelectItem>
                  <SelectItem value="feature">기능 제안</SelectItem>
                  <SelectItem value="general">일반 문의</SelectItem>
                  <SelectItem value="payment">결제 문의</SelectItem>
                  <SelectItem value="account">계정 문의</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 문의 목록 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">문의 목록 ({inquiries.length}개)</h2>
            {inquiries.map((inquiry) => {
              const statusInfo = getStatusConfig(inquiry.status)
              const priorityInfo = getPriorityConfig(inquiry.priority)
              const typeInfo = getTypeConfig(inquiry.type)
              const StatusIcon = statusInfo.icon

              return (
                <Card 
                  key={inquiry.id} 
                  className={`cursor-pointer transition-all ${
                    selectedInquiry?.id === inquiry.id 
                      ? 'ring-2 ring-brand-500 bg-brand-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{inquiry.subject}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {inquiry.content}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {inquiry.users.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(inquiry.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={priorityInfo.color}>
                            {priorityInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {inquiry.response_count}개
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 문의 상세 및 답변 */}
          <div className="space-y-4">
            {selectedInquiry ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      문의 상세
                      <div className="flex gap-2">
                        <Select 
                          value={selectedInquiry.status} 
                          onValueChange={(status) => updateInquiryStatus(selectedInquiry.id, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">대기중</SelectItem>
                            <SelectItem value="in_progress">처리중</SelectItem>
                            <SelectItem value="resolved">해결됨</SelectItem>
                            <SelectItem value="closed">종료됨</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">제목</h4>
                        <p className="text-gray-700">{selectedInquiry.subject}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">내용</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedInquiry.content}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">작성자</h4>
                        <p className="text-gray-700">{selectedInquiry.users.name} ({selectedInquiry.users.email})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 답변 목록 */}
                <Card>
                  <CardHeader>
                    <CardTitle>답변 목록</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <div key={response.id} className="border-l-4 border-brand-500 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {response.responder_type === 'admin' ? '관리자' : '사용자'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(response.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{response.content}</p>
                        </div>
                      ))}
                      {responses.length === 0 && (
                        <p className="text-gray-500 text-center py-4">아직 답변이 없습니다.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 답변 작성 */}
                <Card>
                  <CardHeader>
                    <CardTitle>답변 작성</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="답변을 입력하세요..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={4}
                      />
                      <Button 
                        onClick={submitResponse}
                        disabled={!responseText.trim() || isSubmittingResponse}
                        className="w-full"
                      >
                        {isSubmittingResponse ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            답변 제출 중...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            답변 제출
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">문의를 선택하세요</h3>
                    <p className="text-gray-600">왼쪽에서 문의를 선택하면 상세 내용과 답변을 확인할 수 있습니다.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
