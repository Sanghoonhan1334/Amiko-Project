'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface InquiryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InquiryModal({ isOpen, onClose }: InquiryModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    content: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const inquiryTypes = [
    { 
      value: 'bug', 
      label: t('inquiry.inquiryTypes.bug'), 
      description: t('inquiry.inquiryTypeDescriptions.bug') 
    },
    { 
      value: 'feature', 
      label: t('inquiry.inquiryTypes.feature'), 
      description: t('inquiry.inquiryTypeDescriptions.feature') 
    },
    { 
      value: 'general', 
      label: t('inquiry.inquiryTypes.general'), 
      description: t('inquiry.inquiryTypeDescriptions.general') 
    },
    { 
      value: 'payment', 
      label: t('inquiry.inquiryTypes.payment'), 
      description: t('inquiry.inquiryTypeDescriptions.payment') 
    },
    { 
      value: 'account', 
      label: t('inquiry.inquiryTypes.account'), 
      description: t('inquiry.inquiryTypeDescriptions.account') 
    },
    { 
      value: 'other', 
      label: t('inquiry.inquiryTypes.other'), 
      description: t('inquiry.inquiryTypeDescriptions.other') 
    }
  ]

  const priorityLevels = [
    { value: 'low', label: t('inquiry.priorities.low'), color: 'text-green-600' },
    { value: 'medium', label: t('inquiry.priorities.medium'), color: 'text-yellow-600' },
    { value: 'high', label: t('inquiry.priorities.high'), color: 'text-orange-600' },
    { value: 'urgent', label: t('inquiry.priorities.urgent'), color: 'text-red-600' }
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
        setErrorMessage(errorData.message || '문의 제출에 실패했습니다.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-xs max-h-[90vh] overflow-y-auto bg-white mx-1">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-3 h-3 text-green-600" />
            {t('inquiry.submit')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 문의 유형 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('inquiry.inquiryType')}</label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-xs h-8">
                <SelectValue placeholder={t('inquiry.selectInquiryType')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {inquiryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium text-xs">{type.label}</div>
                      <div className="text-[10px] text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('inquiry.priority')}</label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger className="border border-gray-400 focus:border-gray-600 focus:ring-1 focus:ring-gray-200 text-xs h-8">
                <SelectValue placeholder={t('inquiry.selectPriority')} />
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
