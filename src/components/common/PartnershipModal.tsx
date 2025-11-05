'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Handshake, Send, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/lib/translations'

interface PartnershipModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    companyName: '',
    representativeName: '',
    email: '',
    phone: '',
    partnershipType: '',
    message: '',
    attachments: null as File | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // t() 함수가 nested 객체를 제대로 반환하지 않아서 직접 가져오기
  const partnershipTypesData = translations[language].partnership.partnershipTypes
  
  const partnershipTypes = Object.entries(partnershipTypesData).map(([value, data]: [string, any]) => ({
    value,
    label: data.label,
    description: data.description
  }))

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
          email: '',
          phone: '',
          partnershipType: '',
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
        <DialogContent 
        className="w-[98vw] max-w-sm max-h-[90vh] bg-white mx-1 flex flex-col shadow-2xl rounded-lg"
        onInteractOutside={(e) => {
          // Select 드롭다운 클릭 시 Dialog가 닫히지 않도록 방지
          const target = e.target as HTMLElement
          if (target.closest('[data-radix-select-content]') || 
              target.closest('[data-radix-select-viewport]') ||
              target.closest('[data-radix-select-item]')) {
            e.preventDefault()
            console.log('🛡️ [DIALOG] Select 외부 클릭 차단됨')
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-center text-gray-900 mb-2 whitespace-normal leading-tight">
            <Handshake className="h-4 w-4 inline mr-1 text-blue-500" />
            {t('partnership.partnershipInquiry')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-2 overflow-y-auto flex-1">
          {/* 기본 정보 (간소화) */}
          <div className="space-y-1">
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
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                  {t('partnership.partnershipType')} *
                </label>
                <select
                  value={formData.partnershipType}
                  onChange={(e) => handleInputChange('partnershipType', e.target.value)}
                  className="w-full border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-[10px] h-8 rounded-md px-3 bg-white text-gray-900"
                  style={{ color: 'rgb(17 24 39)' }}
                  required
                >
                  <option value="">{t('partnership.partnershipTypePlaceholder')}</option>
                  {partnershipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 제안 내용 */}
          <div className="space-y-1">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 whitespace-normal leading-tight">
                {t('partnership.proposalContent')} *
              </label>
              <Textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder={t('partnership.proposalContentPlaceholder')}
                rows={4}
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

          {/* WhatsApp 제휴 문의 섹션 */}
          <div className="border-t border-gray-200 pt-3 mt-2">
            <p className="text-[10px] text-gray-600 text-center mb-2">
              {t('partnership.orContactWhatsApp')}
            </p>
            <a
              href="https://wa.me/51908632674?text=Hola%2C%20me%20interesa%20una%20asociaci%C3%B3n%20con%20AMIKO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {t('partnership.contactWhatsApp')}
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
