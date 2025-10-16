'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Clock, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface EmailVerificationProps {
  email: string
  onVerify: (code: string) => void
  onResend: () => void
  isLoading?: boolean
  initialTimeLeft?: number // 초기 남은 시간 (이미 발송된 경우)
}

export default function EmailVerification({ email, onVerify, onResend, isLoading = false, initialTimeLeft }: EmailVerificationProps) {
  const { t } = useLanguage()
  const [verificationCode, setVerificationCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5분
  const [canResend, setCanResend] = useState(true) // 항상 재발송 가능
  const [codeSent, setCodeSent] = useState(false) // 코드 발송 여부
  const [isWaitingForCode, setIsWaitingForCode] = useState(false) // 코드 입력 대기 상태

  // 컴포넌트가 처음 마운트될 때는 코드 미발송 상태
  useEffect(() => {
    if (email) {
      console.log('[EmailVerification] 이메일 인증 페이지 로드:', email)
      setCodeSent(false)
      setIsWaitingForCode(false)
    }
  }, [email])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
    // 타이머가 끝나도 canResend는 항상 true로 유지
  }, [timeLeft])

  const handleSendCode = async () => {
    try {
      setIsWaitingForCode(true)
      setTimeLeft(300) // 5분 타이머 시작
      await onResend()
      setCodeSent(true)
    } catch (error) {
      console.error('코드 발송 실패:', error)
      // 에러는 상위 컴포넌트에서 처리됨
    }
  }

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      onVerify(verificationCode)
    }
  }

  const handleResend = () => {
    setTimeLeft(300) // 5분으로 리셋
    setVerificationCode('')
    setIsWaitingForCode(true) // 재발송 시 다시 대기 상태로
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
          {codeSent ? (
            <>
              <strong>{email}</strong>{t('auth.emailSentDescription')}
            </>
          ) : (
            <>
              <strong>{email}</strong>{t('auth.emailSendDescription')}
            </>
          )}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('auth.verificationCode')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.emailCodeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {codeSent && (
            <div>
              <Label htmlFor="verification-code" className="text-base font-semibold text-gray-700">
                {t('auth.verificationCode')}
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setVerificationCode(value)
                  // 6자리 입력 시 대기 상태 해제
                  if (value.length === 6) {
                    setIsWaitingForCode(false)
                  }
                }}
                className="text-center text-2xl font-bold tracking-widest border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-4 h-14"
                autoComplete="one-time-code"
              />
              {verificationCode.length === 6 && (
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('auth.codeComplete')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* 타이머 - 코드 발송 후에만 표시 */}
          {codeSent && (
            <div className="text-center">
              <div className={`flex items-center justify-center gap-2 text-base font-medium px-4 py-2 rounded-lg ${
                timeLeft > 60 ? 'bg-green-50 text-green-700' : 
                timeLeft > 30 ? 'bg-yellow-50 text-yellow-700' : 
                timeLeft > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
              }`}>
                <Clock className="w-5 h-5" />
                <span>
                  {timeLeft > 0 ? `${t('auth.timeLeft')} ${formatTime(timeLeft)}` : t('auth.codeExpired')}
                </span>
              </div>
            </div>
          )}
          
          {/* 메인 버튼 - 상태별로 다르게 표시 */}
          {!codeSent ? (
            // 1단계: 코드 보내기 버튼
            <Button 
              onClick={handleSendCode}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.sending')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {t('auth.sendVerificationCode')}
                </div>
              )}
            </Button>
          ) : isWaitingForCode ? (
            // 2단계: 코드 입력 대기 (회색 비활성화)
            <Button 
              disabled={true}
              className="w-full bg-gray-400 text-white font-semibold py-3 text-lg"
              size="lg"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('auth.codeInputPrompt')}
              </div>
            </Button>
          ) : (
            // 3단계: 인증하기 버튼 (6자리 입력 후 활성화)
            <Button 
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.verifying')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  인증하기
                </div>
              )}
            </Button>
          )}
          
          {/* 재발송 버튼 - 코드 발송 후에만 표시 */}
          {codeSent && (
            <div className="text-center border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">
                {t('auth.didntReceiveCode')}
              </p>
              <Button 
                variant="outline" 
                onClick={handleResend}
                disabled={isLoading}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('auth.resendCode')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 이메일 확인 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">{t('auth.emailGuideTitle')}</h4>
            <p className="text-sm text-blue-700">
              • {t('auth.emailGuideSpam')}<br/>
              • {t('auth.emailGuideResend')}<br/>
              • {t('auth.emailGuideServices')}
            </p>
          </div>
        </div>
      </div>
      
    </div>
  )
}
