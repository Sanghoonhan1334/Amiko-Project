'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageSquare, Send, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/lib/translations'

interface InquiryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InquiryModal({ isOpen, onClose }: InquiryModalProps) {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    content: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // 직접 translations에서 가져오기 (t() 함수가 nested 객체를 제대로 반환하지 않음)
  const inquiryTypesData = translations[language].inquiry.inquiryTypes
  const inquiryTypeDescData = translations[language].inquiry.inquiryTypeDescriptions
  const prioritiesData = translations[language].inquiry.priorities
  
  const inquiryTypes = Object.entries(inquiryTypesData).map(([value, label]) => ({
    value,
    label: label as string,
    description: inquiryTypeDescData[value as keyof typeof inquiryTypeDescData] as string
  }))

  const priorityLevels = [
    { value: 'low', label: prioritiesData.low, color: 'text-green-600' },
    { value: 'medium', label: prioritiesData.medium, color: 'text-yellow-600' },
    { value: 'high', label: prioritiesData.high, color: 'text-orange-600' },
    { value: 'urgent', label: prioritiesData.urgent, color: 'text-red-600' }
  ]

  const selectedType = inquiryTypes.find(type => type.value === formData.type)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (submitStatus === 'error') {
      setSubmitStatus('idle')
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const storedUser = localStorage.getItem('amiko_user')
      if (!storedUser) {
        throw new Error(t('inquiry.loginRequired'))
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

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ type: '', subject: '', content: '', priority: 'medium' })
        setTimeout(() => {
          onClose()
          setSubmitStatus('idle')
        }, 2000)
      } else {
        const errorData = await response.json()
        setSubmitStatus('error')
        setErrorMessage(errorData.message || t('inquiry.submitFailed'))
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : t('inquiry.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
        className="w-[95vw] max-w-xs max-h-[85vh] bg-white mx-1 flex flex-col shadow-2xl rounded-lg"
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
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-3 h-3 text-green-600" />
            {t('inquiry.submit')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto flex-1">
          {/* 문의 유형 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('inquiry.inquiryType')}</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-xs h-8 rounded-md px-3 bg-white text-gray-900"
              style={{ color: 'rgb(17 24 39)' }}
              required
            >
              <option value="">{t('inquiry.selectInquiryType')}</option>
              {inquiryTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 우선순위 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('inquiry.priority')}</label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-xs h-8 rounded-md px-3 bg-white text-gray-900"
              style={{ color: 'rgb(17 24 39)' }}
              required
            >
              {priorityLevels.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('inquiry.subject')}</label>
            <Input
              placeholder={t('inquiry.subjectPlaceholder')}
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-xs h-8"
              required
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('inquiry.message')}</label>
            <Textarea
              placeholder={t('inquiry.messagePlaceholder')}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-xs"
              rows={3}
              required
            />
            {selectedType && (
              <p className="text-[10px] text-gray-500">
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
          {(submitStatus as string) === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t('inquiry.submitSuccessMessage')}
              </AlertDescription>
            </Alert>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 justify-end pt-1">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="text-xs px-3 py-1"
            >
              {t('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.type || !formData.subject || !formData.content} className="text-xs px-3 py-1">
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  {t('inquiry.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  {t('inquiry.submitInquiry')}
                </>
              )}
            </Button>
          </div>

          {/* WhatsApp 문의 섹션 */}
          <div className="border-t border-gray-200 pt-3 mt-2">
            <p className="text-[10px] text-gray-600 text-center mb-2">
              {t('inquiry.orContactWhatsApp')}
            </p>
            <a
              href="https://wa.me/51908632674?text=Hola%2C%20tengo%20una%20consulta%20sobre%20AMIKO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {t('inquiry.contactWhatsApp')}
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
