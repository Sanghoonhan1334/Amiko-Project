'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  CreditCard, 
  User, 
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface InquiryFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

const inquiryTypes = [
  { value: 'bug', label: '버그 신고', icon: Bug, description: '앱이나 웹사이트에서 발견한 오류를 신고해주세요' },
  { value: 'feature', label: '기능 제안', icon: Lightbulb, description: '새로운 기능이나 개선사항을 제안해주세요' },
  { value: 'general', label: '일반 문의', icon: MessageSquare, description: '기타 궁금한 사항이나 도움이 필요한 내용' },
  { value: 'payment', label: '결제 문의', icon: CreditCard, description: '결제 관련 문제나 환불 문의' },
  { value: 'account', label: '계정 문의', icon: User, description: '로그인, 회원가입, 계정 관련 문제' },
  { value: 'other', label: '기타', icon: HelpCircle, description: '위 카테고리에 해당하지 않는 문의' }
]

const priorityLevels = [
  { value: 'low', label: '낮음', color: 'text-gray-600' },
  { value: 'medium', label: '보통', color: 'text-blue-600' },
  { value: 'high', label: '높음', color: 'text-orange-600' },
  { value: 'urgent', label: '긴급', color: 'text-red-600' }
]

export default function InquiryForm({ onSuccess, onCancel, className }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    content: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // 사용자 ID 가져오기 (로컬 스토리지에서)
      const storedUser = localStorage.getItem('amiko_user')
      if (!storedUser) {
        throw new Error('로그인이 필요합니다.')
      }

      const user = JSON.parse(storedUser)

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: formData.type,
          subject: formData.subject,
          content: formData.content,
          priority: formData.priority,
          language: 'ko'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '문의 제출에 실패했습니다.')
      }

      setSubmitStatus('success')
      
      // 폼 초기화
      setFormData({
        type: '',
        subject: '',
        content: '',
        priority: 'medium'
      })

      // 성공 콜백 호출
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }

    } catch (error) {
      console.error('문의 제출 오류:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '문의 제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = inquiryTypes.find(type => type.value === formData.type)

  if (submitStatus === 'success') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-green-800">문의가 성공적으로 제출되었습니다!</h3>
              <p className="text-green-600 mt-2">
                빠른 시일 내에 답변드리겠습니다. 감사합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          문의하기
        </CardTitle>
        <CardDescription>
          궁금한 점이나 불편사항을 알려주세요. 최대한 빠르게 답변드리겠습니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 문의 유형 선택 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">문의 유형</label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="문의 유형을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {inquiryTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 선택 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">우선순위</label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="우선순위를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <span className={priority.color}>{priority.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">제목</label>
            <Input
              placeholder="문의 제목을 입력해주세요"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              required
            />
          </div>

          {/* 내용 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">내용</label>
            <Textarea
              placeholder="문의 내용을 자세히 입력해주세요"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              required
            />
            {selectedType && (
              <p className="text-xs text-gray-500">
                💡 {selectedType.description}
              </p>
            )}
          </div>

          {/* 에러 메시지 */}
          {submitStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !formData.type || !formData.subject || !formData.content}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  제출 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  문의 제출
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
