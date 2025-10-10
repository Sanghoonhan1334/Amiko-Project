'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ScrollToTopButton from '@/components/common/ScrollToTopButton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Handshake,
  Building2,
  Users,
  DollarSign,
  HelpCircle
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'

const Hero = dynamic(() => import('@/components/landing/Hero'), {
  ssr: false,
  loading: () => <div className="min-h-screen body-gradient flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">로딩 중...</p>
    </div>
  </div>
})

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)
  const { t, language } = useLanguage()
  const router = useRouter()
  
  // 문의 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [inquiryFormData, setInquiryFormData] = useState({
    type: '',
    subject: '',
    content: '',
    priority: 'medium'
  })
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false)
  const [inquirySubmitStatus, setInquirySubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [inquiryErrorMessage, setInquiryErrorMessage] = useState('')

  // 제휴 모달 상태
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false)
  const [partnershipFormData, setPartnershipFormData] = useState({
    companyName: '',
    representativeName: '',
    position: '',
    email: '',
    phone: '',
    businessField: '',
    companySize: '',
    partnershipType: '',
    budget: '',
    expectedEffect: '',
    message: '',
    attachments: null as File | null
  })
  const [isPartnershipSubmitting, setIsPartnershipSubmitting] = useState(false)
  const [partnershipSubmitStatus, setPartnershipSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [partnershipErrorMessage, setPartnershipErrorMessage] = useState('')

  useEffect(() => {
    setIsClient(true)
  }, [])


  // 문의 폼 핸들러
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInquirySubmitting(true)
    setInquirySubmitStatus('idle')
    setInquiryErrorMessage('')

    try {
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
          type: inquiryFormData.type,
          subject: inquiryFormData.subject,
          content: inquiryFormData.content,
          priority: inquiryFormData.priority,
          language: 'ko'
        })
      })

      if (response.ok) {
        setInquirySubmitStatus('success')
        setInquiryFormData({ type: '', subject: '', content: '', priority: 'medium' })
        setTimeout(() => {
          setIsInquiryModalOpen(false)
          setInquirySubmitStatus('idle')
        }, 2000)
      } else {
        const errorData = await response.json()
        setInquirySubmitStatus('error')
        setInquiryErrorMessage(errorData.message || '문의 제출에 실패했습니다.')
      }
    } catch (error) {
      setInquirySubmitStatus('error')
      setInquiryErrorMessage(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.')
    } finally {
      setIsInquirySubmitting(false)
    }
  }

  // 제휴 폼 핸들러
  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPartnershipSubmitting(true)
    setPartnershipSubmitStatus('idle')
    setPartnershipErrorMessage('')

    try {
      const formDataToSend = new FormData()
      Object.entries(partnershipFormData).forEach(([key, value]) => {
        if (key === 'attachments' && value) {
          formDataToSend.append('attachments', value)
        } else if (key !== 'attachments') {
          formDataToSend.append(key, value as string)
        }
      })

      const response = await fetch('/api/partnership', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        setPartnershipSubmitStatus('success')
        setPartnershipFormData({
          companyName: '',
          representativeName: '',
          position: '',
          email: '',
          phone: '',
          businessField: '',
          companySize: '',
          partnershipType: '',
          budget: '',
          expectedEffect: '',
          message: '',
          attachments: null
        })
        setTimeout(() => {
          setIsPartnershipModalOpen(false)
          setPartnershipSubmitStatus('idle')
        }, 2000)
      } else {
        const errorData = await response.json()
        setPartnershipSubmitStatus('error')
        setPartnershipErrorMessage(errorData.message || '제휴 제안 제출에 실패했습니다.')
      }
    } catch (error) {
      setPartnershipSubmitStatus('error')
      setPartnershipErrorMessage('네트워크 오류가 발생했습니다.')
    } finally {
      setIsPartnershipSubmitting(false)
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen body-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen body-gradient">
      {/* Hero Section */}
      <Hero />

      {/* 통합 콘텐츠 섹션 */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-4 md:space-y-6">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
            AMIKO에 대해 더 알아보세요
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            아래 섹션을 클릭하여 자세한 정보를 확인하세요
          </p>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          className="w-full space-y-2 md:space-y-4"
          style={{
            '--radix-accordion-content-duration': '300ms',
            '--radix-accordion-content-ease': 'ease-out'
          } as React.CSSProperties}
        >
          {/* 소개 섹션 */}
          <AccordionItem value="about" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Building2 className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-lg font-semibold">소개</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/do4aDyGZmgM"
                    title="AMIKO 소개 영상"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <img src="/1.png" alt="AMIKO" className="w-24 h-24 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">AMIKO는 한국과 라틴아메리카를 연결하는 플랫폼입니다</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <img src="/2.png" alt="Bridge" className="w-24 h-24 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">
                      <span className="text-red-500">AM</span>erica와 <span className="text-blue-500">KO</span>rea를 잇는 다리
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <img src="/3.png" alt="Connect" className="w-24 h-24 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">더 가깝게, 더 쉽게 연결합니다</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 문의 섹션 */}
          <AccordionItem value="contact" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <MessageSquare className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-lg font-semibold">문의</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600">
                  궁금하신 사항이 있으시면 언제든지 문의해주세요. 빠른 시간 내에 답변드리겠습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">이메일</h3>
                    <p className="text-blue-700 text-sm">support@amiko.com</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">운영 시간</h3>
                    <p className="text-green-700 text-sm">평일 9:00 - 18:00 (KST)</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  문의하기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 제휴문의 섹션 */}
          <AccordionItem value="partnership" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Handshake className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-lg font-semibold">제휴문의</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600">
                  AMIKO와 함께 성장할 파트너를 찾고 있습니다. 다양한 형태의 협업을 환영합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">브랜드 확장</h3>
                    <p className="text-xs text-gray-600">더 넓은 시장으로 진출하세요</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">고객 확대</h3>
                    <p className="text-xs text-gray-600">새로운 고객층에 도달하세요</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">매출 증대</h3>
                    <p className="text-xs text-gray-600">함께 성장하는 파트너십</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsPartnershipModalOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Handshake className="mr-2 h-4 w-4" />
                  제휴 제안하기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 섹션 */}
          <AccordionItem value="faq" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <HelpCircle className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-lg font-semibold">자주 묻는 질문</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="border-l-4 border-blue-200 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800 mb-2">Q. AMIKO는 어떤 서비스인가요?</h4>
                  <p className="text-sm text-gray-600">A. AMIKO는 한국과 라틴아메리카를 연결하는 문화 교류 플랫폼입니다. 언어 교환, 커뮤니티, 영상 통화 등 다양한 기능을 제공합니다.</p>
                </div>
                <div className="border-l-4 border-blue-200 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800 mb-2">Q. 포인트는 어떻게 사용하나요?</h4>
                  <p className="text-sm text-gray-600">A. 포인트는 게시글 작성, 댓글 작성, 출석 체크 등의 활동으로 획득할 수 있으며, 영상 통화 예약 시 사용할 수 있습니다.</p>
                </div>
                <div className="border-l-4 border-blue-200 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800 mb-2">Q. 인증은 왜 필요한가요?</h4>
                  <p className="text-sm text-gray-600">A. 안전한 커뮤니티 환경 조성을 위해 본인 인증이 필요합니다. 이메일 또는 휴대폰 인증을 통해 간단하게 완료할 수 있습니다.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 도움말 섹션 */}
          <AccordionItem value="help" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <HelpCircle className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-lg font-semibold">도움말</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">시작하기</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>회원가입 후 프로필을 완성하세요</li>
                    <li>관심사에 맞는 커뮤니티에 참여하세요</li>
                    <li>영상 통화로 실시간 대화를 나누세요</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">영상 통화</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>3일에 한번씩 무료로 통화하세요</li>
                    <li>실시간 번역 기능을 활용하세요</li>
                    <li>예약 관리에서 일정을 확인하세요</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">커뮤니티</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>게시글을 작성하고 포인트를 받으세요</li>
                    <li>댓글로 다른 사용자와 소통하세요</li>
                    <li>좋아요와 공유로 인기 게시물을 만드세요</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* 문의 모달 */}
      <Dialog open={isInquiryModalOpen} onOpenChange={setIsInquiryModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              문의하기
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">문의 유형</label>
              <Select 
                value={inquiryFormData.type} 
                onValueChange={(value) => setInquiryFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="문의 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">버그 리포트</SelectItem>
                  <SelectItem value="feature">기능 제안</SelectItem>
                  <SelectItem value="general">일반 문의</SelectItem>
                  <SelectItem value="payment">결제 문의</SelectItem>
                  <SelectItem value="account">계정 문의</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={inquiryFormData.subject}
                onChange={(e) => setInquiryFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="문의 제목을 입력하세요"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">내용</label>
              <Textarea
                value={inquiryFormData.content}
                onChange={(e) => setInquiryFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="문의 내용을 입력하세요"
                rows={4}
                required
              />
            </div>
            {inquirySubmitStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inquiryErrorMessage}</AlertDescription>
              </Alert>
            )}
            {inquirySubmitStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">문의가 성공적으로 제출되었습니다!</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsInquiryModalOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isInquirySubmitting}>
                {isInquirySubmitting ? '제출 중...' : '제출하기'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 제휴 모달 */}
      <Dialog open={isPartnershipModalOpen} onOpenChange={setIsPartnershipModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-purple-600" />
              제휴 제안하기
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePartnershipSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">회사명</label>
                <Input
                  value={partnershipFormData.companyName}
                  onChange={(e) => setPartnershipFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">대표자명</label>
                <Input
                  value={partnershipFormData.representativeName}
                  onChange={(e) => setPartnershipFormData(prev => ({ ...prev, representativeName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">직책</label>
                <Input
                  value={partnershipFormData.position}
                  onChange={(e) => setPartnershipFormData(prev => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">연락처</label>
                <Input
                  value={partnershipFormData.phone}
                  onChange={(e) => setPartnershipFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">이메일</label>
              <Input
                type="email"
                value={partnershipFormData.email}
                onChange={(e) => setPartnershipFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">제안 내용</label>
              <Textarea
                value={partnershipFormData.message}
                onChange={(e) => setPartnershipFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="제휴 제안 내용을 입력하세요"
                rows={4}
                required
              />
            </div>
            {partnershipSubmitStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{partnershipErrorMessage}</AlertDescription>
              </Alert>
            )}
            {partnershipSubmitStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">제휴 제안이 성공적으로 제출되었습니다!</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPartnershipModalOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isPartnershipSubmitting}>
                {isPartnershipSubmitting ? '제출 중...' : '제출하기'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 맨 위로 이동 버튼 */}
      <ScrollToTopButton />
    </div>
  )
}
