'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Clock, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface SMSVerificationProps {
  phoneNumber: string
  onVerify: (code: string) => void
  onResend: () => void
  isLoading?: boolean
}

export default function SMSVerification({ phoneNumber, onVerify, onResend, isLoading = false }: SMSVerificationProps) {
  const { t } = useLanguage()
  const [verificationCode, setVerificationCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5분
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      onVerify(verificationCode)
    }
  }

  const handleResend = () => {
    setTimeLeft(300)
    setCanResend(false)
    setVerificationCode('')
    onResend()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold">{t('auth.smsVerification')}</h3>
        <p className="text-gray-600">
          <strong>{phoneNumber}</strong>로 인증코드를 발송했습니다
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('auth.verificationCode')}</CardTitle>
          <CardDescription className="text-center">
            SMS로 받은 6자리 코드를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="verification-code">{t('auth.verificationCode')}</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder={t('auth.verificationCodePlaceholder')}
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest"
            />
          </div>
          
          {/* 타이머 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {canResend ? '인증코드가 만료되었습니다' : `남은 시간: ${formatTime(timeLeft)}`}
              </span>
            </div>
          </div>
          
          {/* 인증 버튼 */}
          <Button 
            onClick={handleVerify}
            disabled={verificationCode.length !== 6 || isLoading}
            className="w-full"
          >
            {isLoading ? '인증 중...' : t('auth.verificationSuccess')}
          </Button>
          
          {/* 재발송 버튼 */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              인증코드를 받지 못하셨나요?
            </p>
            <Button 
              variant="outline" 
              onClick={handleResend}
              disabled={!canResend || isLoading}
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('auth.resendCode')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 보안 안내 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">SMS 인증 안내</h4>
            <p className="text-sm text-yellow-700">
              • 인증코드는 5분간 유효합니다<br/>
              • 인증코드는 한 번만 사용 가능합니다<br/>
              • 개인정보 보호를 위해 인증코드를 타인과 공유하지 마세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
