'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Calendar
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

interface InquiryListProps {
  userId?: string
  className?: string
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

export default function InquiryList({ userId, className }: InquiryListProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      
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

  useEffect(() => {
    fetchInquiries()
  }, [userId])

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
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">문의 목록을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchInquiries} variant="outline">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (inquiries.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">문의 내역이 없습니다</h3>
            <p className="text-gray-600">아직 제출한 문의가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {inquiries.map((inquiry) => {
          const statusInfo = getStatusConfig(inquiry.status)
          const priorityInfo = getPriorityConfig(inquiry.priority)
          const typeInfo = getTypeConfig(inquiry.type)
          const StatusIcon = statusInfo.icon

          return (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
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
                      <Calendar className="w-4 h-4" />
                      {formatDate(inquiry.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      답변 {inquiry.response_count}개
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={priorityInfo.color}>
                        우선순위: {priorityInfo.label}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    자세히 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
