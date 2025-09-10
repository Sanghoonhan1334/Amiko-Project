'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Handshake, Send, CheckCircle, AlertCircle, Building2, Users, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function PartnershipPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const businessFields = [
    { value: 'tech', label: '기술/IT', description: '소프트웨어, 하드웨어, AI, 블록체인 등' },
    { value: 'finance', label: '금융/핀테크', description: '은행, 보험, 투자, 결제 서비스 등' },
    { value: 'ecommerce', label: '이커머스/소매', description: '온라인 쇼핑몰, 마켓플레이스 등' },
    { value: 'education', label: '교육/에듀테크', description: '온라인 교육, 학습 플랫폼 등' },
    { value: 'healthcare', label: '헬스케어/의료', description: '의료 서비스, 건강 관리 등' },
    { value: 'media', label: '미디어/엔터테인먼트', description: '콘텐츠 제작, 스트리밍 등' },
    { value: 'logistics', label: '물류/배송', description: '택배, 물류 관리 등' },
    { value: 'food', label: '푸드/배달', description: '음식점, 배달 서비스 등' },
    { value: 'travel', label: '여행/관광', description: '여행 예약, 관광 서비스 등' },
    { value: 'other', label: '기타', description: '위 카테고리에 해당하지 않는 분야' }
  ]

  const companySizes = [
    { value: 'startup', label: '스타트업 (1-10명)', description: '초기 단계 스타트업' },
    { value: 'small', label: '소규모 (11-50명)', description: '소규모 기업' },
    { value: 'medium', label: '중규모 (51-200명)', description: '중규모 기업' },
    { value: 'large', label: '대규모 (200명 이상)', description: '대기업' },
    { value: 'enterprise', label: '대기업 (1000명 이상)', description: '대기업' }
  ]

  const partnershipTypes = [
    { value: 'advertising', label: '광고 협업', description: '상호 광고, 마케팅 협업' },
    { value: 'investment', label: '투자/펀딩', description: '투자 유치, 펀딩 제안' },
    { value: 'technology', label: '기술 협업', description: '기술 파트너십, API 연동' },
    { value: 'distribution', label: '유통/판매', description: '제품 유통, 판매 협업' },
    { value: 'content', label: '콘텐츠 협업', description: '콘텐츠 제작, 공동 마케팅' },
    { value: 'event', label: '이벤트 협업', description: '공동 이벤트, 세미나' },
    { value: 'other', label: '기타', description: '위 카테고리에 해당하지 않는 협업' }
  ]

  const budgetRanges = [
    { value: 'under-1m', label: '100만원 미만', description: '소규모 협업' },
    { value: '1m-5m', label: '100만원 - 500만원', description: '중소규모 협업' },
    { value: '5m-10m', label: '500만원 - 1,000만원', description: '중규모 협업' },
    { value: '10m-50m', label: '1,000만원 - 5,000만원', description: '대규모 협업' },
    { value: 'over-50m', label: '5,000만원 이상', description: '대형 협업' },
    { value: 'discuss', label: '협의 후 결정', description: '예산 협의 필요' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      attachments: file
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
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
        setSubmitStatus('success')
        setFormData({
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
          setSubmitStatus('idle')
        }, 2000)
      } else {
        const errorData = await response.json()
        setSubmitStatus('error')
        setErrorMessage(errorData.message || '제휴 문의 제출 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Handshake className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('partnership.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              {t('partnership.subtitle')}
            </p>
            <Button 
              onClick={() => setIsPartnershipModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Handshake className="mr-2 h-5 w-5" />
              {t('partnership.submit')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('partnership.benefitsTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('partnership.benefitsSubtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="p-4 bg-blue-500 rounded-2xl w-fit mx-auto mb-6">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('partnership.benefits.brandExpansion.title')}</h3>
              <p className="text-gray-600">
                {t('partnership.benefits.brandExpansion.description')}
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="p-4 bg-purple-500 rounded-2xl w-fit mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('partnership.benefits.customerExpansion.title')}</h3>
              <p className="text-gray-600">
                {t('partnership.benefits.customerExpansion.description')}
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="p-4 bg-green-500 rounded-2xl w-fit mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('partnership.benefits.revenueIncrease.title')}</h3>
              <p className="text-gray-600">
                {t('partnership.benefits.revenueIncrease.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Modal */}
      <Dialog open={isPartnershipModalOpen} onOpenChange={setIsPartnershipModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900 mb-6">
              <Handshake className="h-8 w-8 inline mr-2 text-blue-500" />
              제휴 문의
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 회사 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                회사 정보
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사명 *
                  </label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="회사명을 입력해주세요"
                    className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대표자명 *
                  </label>
                  <Input
                    value={formData.representativeName}
                    onChange={(e) => handleInputChange('representativeName', e.target.value)}
                    placeholder="대표자명을 입력해주세요"
                    className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    직책 *
                  </label>
                  <Input
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="직책을 입력해주세요"
                    className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="이메일을 입력해주세요"
                    className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 *
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="연락처를 입력해주세요"
                    className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 사업 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                사업 정보
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업 분야 *
                  </label>
                  <Select value={formData.businessField} onValueChange={(value) => handleInputChange('businessField', value)}>
                    <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200">
                      <SelectValue placeholder="사업 분야를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          <div>
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-gray-500">{field.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사 규모 *
                  </label>
                  <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                    <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200">
                      <SelectValue placeholder="회사 규모를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          <div>
                            <div className="font-medium">{size.label}</div>
                            <div className="text-sm text-gray-500">{size.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 제휴 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                제휴 정보
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제휴 유형 *
                  </label>
                  <Select value={formData.partnershipType} onValueChange={(value) => handleInputChange('partnershipType', value)}>
                    <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200">
                      <SelectValue placeholder="제휴 유형을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnershipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예산 범위 *
                  </label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                    <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200">
                      <SelectValue placeholder="예산 범위를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          <div>
                            <div className="font-medium">{range.label}</div>
                            <div className="text-sm text-gray-500">{range.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기대 효과
                </label>
                <Textarea
                  value={formData.expectedEffect}
                  onChange={(e) => handleInputChange('expectedEffect', e.target.value)}
                  placeholder="제휴를 통해 기대하는 효과나 목표를 자세히 설명해주세요"
                  rows={3}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                />
              </div>
            </div>

            {/* 상세 내용 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                상세 내용
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제휴 제안 내용 *
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="구체적인 제휴 제안 내용을 자세히 작성해주세요"
                  rows={5}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  첨부파일 (선택사항)
                </label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200"
                />
                <p className="text-sm text-gray-500 mt-1">
                  회사 소개서, 제안서 등을 첨부해주세요 (PDF, DOC, PPT, 이미지 파일)
                </p>
              </div>
            </div>

            {/* 오류 메시지 */}
            {submitStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* 성공 메시지 */}
            {(submitStatus as string) === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  제휴 문의가 성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.
                </AlertDescription>
              </Alert>
            )}

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPartnershipModalOpen(false)}
                className="px-6"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    제출 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    제휴 문의 제출
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
