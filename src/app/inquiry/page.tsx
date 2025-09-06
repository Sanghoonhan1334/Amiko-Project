'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InquiryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    content: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const inquiryTypes = [
    { value: 'bug', label: '버그 신고', description: '앱이나 웹사이트에서 발견한 오류를 신고해주세요' },
    { value: 'feature', label: '기능 제안', description: '새로운 기능이나 개선사항을 제안해주세요' },
    { value: 'general', label: '일반 문의', description: '기타 궁금한 사항이나 도움이 필요한 내용' },
    { value: 'payment', label: '결제 문의', description: '결제 관련 문제나 환불 문의' },
    { value: 'account', label: '계정 문의', description: '로그인, 회원가입, 계정 관련 문제' },
    { value: 'other', label: '기타', description: '위 카테고리에 해당하지 않는 문의' }
  ]

  const priorityLevels = [
    { value: 'low', label: '낮음', color: 'text-gray-600' },
    { value: 'medium', label: '보통', color: 'text-blue-600' },
    { value: 'high', label: '높음', color: 'text-orange-600' },
    { value: 'urgent', label: '긴급', color: 'text-red-600' }
  ]

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

      // 2초 후 모달 닫기
      setTimeout(() => {
        setIsInquiryModalOpen(false)
        setSubmitStatus('idle')
      }, 2000)

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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
        {/* 헤더 */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="container-custom max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">문의하기</h1>
                  <p className="text-gray-600">불편사항이나 개선사항을 알려주세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 성공 메시지 */}
        <div className="container-custom max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-green-800">문의가 성공적으로 제출되었습니다!</h3>
                  <p className="text-green-600 mt-2">
                    빠른 시일 내에 답변드리겠습니다. 감사합니다.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => setSubmitStatus('idle')}
                    variant="outline"
                  >
                    새 문의 작성
                  </Button>
                  <Button 
                    onClick={() => router.push('/main?tab=community')}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    커뮤니티로 이동
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      {/* Hero 섹션 */}
      <section className="pt-32 pb-20 md:pt-36 md:pb-28 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          {/* 상단 라벨 */}
          <div className="inline-flex items-center gap-2 bg-green-100/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-green-200/30">
            <span className="text-green-700 font-medium text-sm">💬 문의하기</span>
          </div>
          
          {/* 메인 타이틀 */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            불편사항을<br />
            알려주세요
          </h1>
          
          {/* 서브 텍스트 */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
            사용 중 불편한 점이나 개선사항이 있다면 언제든지 문의해주세요. 
            빠른 시일 내에 답변드리겠습니다.
          </p>
          
          {/* CTA 버튼 */}
          <div className="flex justify-center items-center">
            <Button
              onClick={() => setIsInquiryModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-xl"
            >
              문의하기
            </Button>
          </div>
        </div>
      </section>

      {/* 문의 유형 섹션 */}
      <section className="bg-white py-16" id="inquiry-types">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">문의 유형</h2>
            <p className="text-xl text-gray-600">어떤 종류의 문의든 편하게 남겨주세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 버그 신고 */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🐛</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">버그 신고</h3>
                <p className="text-gray-600 text-sm">
                  앱이나 웹사이트에서 발견한 오류를 신고해주세요
                </p>
              </div>
            </div>

            {/* 기능 제안 */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">기능 제안</h3>
                <p className="text-gray-600 text-sm">
                  새로운 기능이나 개선사항을 제안해주세요
                </p>
              </div>
            </div>

            {/* 일반 문의 */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">일반 문의</h3>
                <p className="text-gray-600 text-sm">
                  기타 궁금한 사항이나 도움이 필요한 내용
                </p>
              </div>
            </div>

            {/* 결제 문의 */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">결제 문의</h3>
                <p className="text-gray-600 text-sm">
                  결제 관련 문제나 환불 문의
                </p>
              </div>
            </div>

            {/* 계정 문의 */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">계정 문의</h3>
                <p className="text-gray-600 text-sm">
                  로그인, 회원가입, 계정 관련 문제
                </p>
              </div>
            </div>

            {/* 기타 */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">❓</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">기타</h3>
                <p className="text-gray-600 text-sm">
                  위 카테고리에 해당하지 않는 문의
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 문의 모달 */}
      <Dialog open={isInquiryModalOpen} onOpenChange={setIsInquiryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              문의하기
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 문의 유형 선택 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">문의 유형</label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200">
                  <SelectValue placeholder="문의 유형을 선택해주세요" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {inquiryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 우선순위 선택 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">우선순위</label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200">
                  <SelectValue placeholder="우선순위를 선택해주세요" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
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
                className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
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
                className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
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

            {/* 성공 메시지 */}
            {submitStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  문의가 성공적으로 제출되었습니다. 빠른 시일 내에 답변드리겠습니다.
                </AlertDescription>
              </Alert>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsInquiryModalOpen(false)}
              >
                취소
              </Button>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
