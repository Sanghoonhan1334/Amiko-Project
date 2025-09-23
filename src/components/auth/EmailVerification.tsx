'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Clock, RefreshCw, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface EmailVerificationProps {
  email: string
  onVerify: (code: string) => void
  onResend: () => void
  isLoading?: boolean
}

export default function EmailVerification({ email, onVerify, onResend, isLoading = false }: EmailVerificationProps) {
  const { t } = useLanguage()
  const [verificationCode, setVerificationCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10분
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
    setTimeLeft(600)
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
        <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold">{t('auth.emailVerification')}</h3>
        <p className="text-gray-600">
          <strong>{email}</strong>로 인증코드를 발송했습니다
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('auth.verificationCode')}</CardTitle>
          <CardDescription className="text-center">
            이메일로 받은 6자리 코드를 입력해주세요
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
      
      {/* 이메일 확인 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">이메일 확인 안내</h4>
            <p className="text-sm text-blue-700">
              • 스팸 폴더도 확인해보세요<br/>
              • 이메일이 도착하지 않으면 재발송 버튼을 눌러주세요<br/>
              • Gmail, Outlook 등 모든 이메일 서비스에서 확인 가능합니다
            </p>
          </div>
        </div>
      </div>
      
      {/* 이메일 앱 열기 */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => window.open(`mailto:${email}`, '_blank')}
          className="text-blue-600 hover:text-blue-700"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          이메일 앱에서 확인하기
        </Button>
      </div>
    </div>
  )
}
