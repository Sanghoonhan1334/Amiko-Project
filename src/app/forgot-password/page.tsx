'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5분
  const [canResend, setCanResend] = useState(false)

  // 타이머 관리
  useEffect(() => {
    if (timeLeft > 0 && step === 'verify') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && step === 'verify') {
      setCanResend(true)
    }
  }, [timeLeft, step])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 이메일 입력 후 인증번호 발송
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 이메일로 인증번호 발송
      const response = await fetch('/api/verify/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
          channel: 'email',
          target: email,
          purpose: 'passwordReset'
          })
        })

        const result = await response.json()

      if (!response.ok || !result.ok) {
          throw new Error(result.error || t('auth.forgotPassword.requestFailed'))
        }

      setStep('verify')
      setTimeLeft(300)
      setCanResend(false)
    } catch (error) {
      console.error('인증번호 발송 오류:', error)
      alert(error instanceof Error ? error.message : t('auth.forgotPassword.resetError'))
    } finally {
      setIsLoading(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      alert(t('auth.verificationCodeRequired'))
      return
    }

    setIsLoading(true)

    try {
      // 인증번호 확인
      const response = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: 'email',
          target: email,
          code: verificationCode
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error === 'INVALID_CODE' ? t('auth.invalidVerificationCode') : result.error || t('auth.verificationFailed'))
      }

      // 인증 성공 → 비밀번호 재설정 토큰 생성
      const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      
      // 비밀번호 재설정 페이지로 이동
      router.push(`/reset-password?token=${resetToken}`)
    } catch (error) {
      console.error('인증번호 확인 오류:', error)
      alert(error instanceof Error ? error.message : t('auth.verificationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 재발송
  const handleResend = async () => {
    setTimeLeft(300)
    setVerificationCode('')
    setCanResend(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: 'email',
          target: email,
          purpose: 'passwordReset'
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || t('auth.forgotPassword.requestFailed'))
      }
    } catch (error) {
      console.error('인증번호 재발송 오류:', error)
      alert(error instanceof Error ? error.message : t('auth.forgotPassword.resetError'))
    } finally {
      setIsLoading(false)
  }
  }


  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-44">
      <div className="flex justify-center">
        <Card className="w-full max-w-md bg-white border shadow-lg">
          <CardHeader className="text-center space-y-4 pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {t('auth.forgotPassword.title')}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t('auth.forgotPassword.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    {t('auth.forgotPassword.emailAddress')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem' }}
                      required
                    />
                  </div>
                </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
                disabled={isLoading || !email}
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
            </form>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600">
                    <strong>{email}</strong> {t('auth.emailSentDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code" className="text-sm font-medium text-slate-700">
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
                    }}
                    className="text-center text-2xl font-bold tracking-widest border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-4 h-14"
                    autoComplete="one-time-code"
                  />
                </div>

                {/* 타이머 */}
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

                <Button
                  onClick={handleVerifyCode}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('auth.verifying')}
                    </div>
                  ) : (
                    t('auth.verifyButton')
                  )}
                </Button>

                {/* 재발송 버튼 */}
                <div className="text-center border-t pt-4">
                  <p className="text-sm text-slate-600 mb-3">
                    {t('auth.didntReceiveCode')}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleResend}
                    disabled={isLoading || !canResend}
                    className={`border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 ${
                      !canResend ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {canResend ? t('auth.resendCode') : `${t('auth.resendCode')} (${formatTime(timeLeft)})`}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-6 text-sm">
                <a href="/help" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                  {t('footer.help')}
                </a>
                <span className="text-slate-400">•</span>
                <a href="/faq" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                  {t('footer.faq')}
                </a>
                <span className="text-slate-400">•</span>
                <a href="/contact" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                  {t('footer.contact')}
                </a>
              </div>
              <p className="text-sm text-slate-600">
                {t('auth.forgotPassword.rememberAccount')}{' '}
                <a href="/sign-in" className="text-slate-900 hover:text-slate-700 font-medium">
                  {t('auth.forgotPassword.login')}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
