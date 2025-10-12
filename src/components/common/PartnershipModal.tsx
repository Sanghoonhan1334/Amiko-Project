'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Handshake, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface PartnershipModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
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
  const [errorMessage, setErrorMessage] = useState('')

  const businessFields = [
    { value: 'tech', label: '기술/IT', description: '소프트웨어, 하드웨어, AI 등' },
    { value: 'finance', label: '금융/핀테크', description: '은행, 보험, 투자 등' },
    { value: 'ecommerce', label: '이커머스/소매', description: '온라인 쇼핑몰, 오프라인 매장' },
    { value: 'education', label: '교육/에듀테크', description: '온라인 교육, 학습 플랫폼' },
    { value: 'healthcare', label: '헬스케어/바이오', description: '의료, 제약, 건강 관리' },
    { value: 'media', label: '미디어/엔터테인먼트', description: '콘텐츠 제작, 스트리밍' },
    { value: 'travel', label: '여행/관광', description: '항공, 호텔, 여행 서비스' },
    { value: 'food', label: '푸드/배달', description: '음식점, 배달 서비스' },
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
          onClose()
          setSubmitStatus('idle')
        }, 2000)
      } else {
        const errorData = await response.json()
        setSubmitStatus('error')
        setErrorMessage(errorData.message || t('partnership.submitError'))
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(t('partnership.networkError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-sm max-h-[95vh] overflow-y-auto bg-white mx-1">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-center text-gray-900 mb-2 whitespace-normal leading-tight">
            <Handshake className="h-4 w-4 inline mr-1 text-blue-500" />
            {t('partnership.partnershipInquiry')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* 회사 정보 */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-900 border-b pb-1 whitespace-normal leading-tight">
              {t('partnership.companyInfo')}
            </h3>
            <div className="grid grid-cols-1 gap-1">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.companyName')} *
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder={t('partnership.companyNamePlaceholder')}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.representativeName')} *
                </label>
                <Input
                  value={formData.representativeName}
                  onChange={(e) => handleInputChange('representativeName', e.target.value)}
                  placeholder={t('partnership.representativeNamePlaceholder')}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.position')} *
                </label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder={t('partnership.positionPlaceholder')}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.email')} *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('partnership.emailPlaceholder')}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.phone')} *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('partnership.phonePlaceholder')}
                  className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8"
                  required
                />
              </div>
            </div>
          </div>

          {/* 사업 정보 */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-900 border-b pb-1 whitespace-normal leading-tight">
              {t('partnership.businessInfo')}
            </h3>
            <div className="grid grid-cols-1 gap-1">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.businessField')} *
                </label>
                <Select value={formData.businessField} onValueChange={(value) => handleInputChange('businessField', value)}>
                  <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8">
                    <SelectValue placeholder={t('partnership.businessFieldPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        <div>
                          <div className="font-medium text-[10px]">{field.label}</div>
                          <div className="text-[9px] text-gray-500">{field.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.companySize')} *
                </label>
                <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                  <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8">
                    <SelectValue placeholder={t('partnership.companySizePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        <div>
                          <div className="font-medium text-[10px]">{size.label}</div>
                          <div className="text-[9px] text-gray-500">{size.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.partnershipType')} *
                </label>
                <Select value={formData.partnershipType} onValueChange={(value) => handleInputChange('partnershipType', value)}>
                  <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8">
                    <SelectValue placeholder={t('partnership.partnershipTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {partnershipTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium text-[10px]">{type.label}</div>
                          <div className="text-[9px] text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.budget')} *
                </label>
                <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                  <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8">
                    <SelectValue placeholder={t('partnership.budgetPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        <div>
                          <div className="font-medium text-[10px]">{range.label}</div>
                          <div className="text-[9px] text-gray-500">{range.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                {t('partnership.expectedEffect')}
              </label>
              <Textarea
                value={formData.expectedEffect}
                onChange={(e) => handleInputChange('expectedEffect', e.target.value)}
                placeholder={t('partnership.expectedEffectPlaceholder')}
                rows={2}
                className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px]"
              />
            </div>
          </div>

          {/* 상세 내용 */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-900 border-b pb-1 whitespace-normal leading-tight">
              {t('partnership.details')}
            </h3>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                {t('partnership.proposalContent')} *
              </label>
              <Textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder={t('partnership.proposalContentPlaceholder')}
                rows={3}
                className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                {t('partnership.attachments')}
              </label>
              <div className="relative">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border border-gray-400 rounded-md p-2 bg-white hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-600 truncate flex-1 mr-2">
                      {formData.attachments ? formData.attachments.name : t('partnership.noFileSelected')}
                    </span>
                    <button className="text-[9px] text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                      {t('partnership.selectFile')}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 whitespace-normal leading-tight">
                {t('partnership.attachmentsDescription')}
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
                {t('partnership.submitSuccess')}
              </AlertDescription>
            </Alert>
          )}

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-3 text-[10px] whitespace-normal"
            >
              {t('partnership.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-3 text-[10px] whitespace-normal text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  {t('partnership.submitting')}
                </>
              ) : (
                <>
                  <Send className="mr-1 h-3 w-3" />
                  {t('partnership.submitProposal')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
