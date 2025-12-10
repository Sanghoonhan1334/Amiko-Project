'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle, Phone } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { countries } from '@/constants/countries'

type TabType = 'email' | 'phone'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('email')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nationality, setNationality] = useState('KR')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (activeTab === 'email') {
        // 이메일로 비밀번호 찾기
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email,
            language: t('common.language') === 'Español' ? 'es' : 'ko'
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || t('auth.forgotPassword.requestFailed'))
        }

        setIsEmailSent(true)
      } else {
        // 전화번호로 비밀번호 찾기 - SMS 인증코드 발송
        const response = await fetch('/api/auth/forgot-password-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phoneNumber: phoneNumber,
            nationality: nationality,
            language: t('common.language') === 'Español' ? 'es' : 'ko'
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'SMS 발송에 실패했습니다.')
        }

        setIsCodeSent(true)
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      alert(error instanceof Error ? error.message : t('auth.forgotPassword.resetError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)

    try {
      const response = await fetch('/api/auth/forgot-password-phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber,
          code: verificationCode,
          nationality: nationality
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '인증코드가 올바르지 않습니다.')
      }

      // 인증 성공 시 비밀번호 재설정 페이지로 이동
      if (result.resetToken) {
        router.push(`/reset-password?token=${result.resetToken}`)
      } else {
        throw new Error('비밀번호 재설정 토큰을 받지 못했습니다.')
      }
    } catch (error) {
      console.error('인증코드 확인 오류:', error)
      alert(error instanceof Error ? error.message : '인증코드 확인에 실패했습니다.')
    } finally {
      setIsVerifying(false)
    }
  }

  // SMS 인증코드 입력 화면
  if (isCodeSent) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-44">
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white border shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                인증코드 입력
              </CardTitle>
              <CardDescription className="text-slate-600">
                {phoneNumber}로 전송된 인증코드를 입력해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                    인증코드
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="6자리 인증코드"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium"
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      확인 중...
                    </div>
                  ) : (
                    '확인'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsCodeSent(false)
                    setVerificationCode('')
                  }}
                >
                  다시 보내기
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 이메일 발송 완료 화면
  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-44">
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white border shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                {t('auth.forgotPassword.checkEmail')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('auth.forgotPassword.emailSent', { email })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-slate-600">
                  {t('auth.forgotPassword.checkSpam')}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setIsEmailSent(false)
                      setEmail('')
                    }}
                    variant="outline"
                    className="w-full"
                  >
{t('auth.forgotPassword.tryAgain')}
                  </Button>
                  <Button
                    onClick={() => router.push('/sign-in')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
{t('auth.forgotPassword.backToLogin')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            {/* 탭 선택 */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('email')
                  setPhoneNumber('')
                  setVerificationCode('')
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'email'
                    ? 'border-b-2 border-slate-900 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Mail className="inline-block w-4 h-4 mr-2" />
                이메일
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('phone')
                  setEmail('')
                  setVerificationCode('')
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'phone'
                    ? 'border-b-2 border-slate-900 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Phone className="inline-block w-4 h-4 mr-2" />
                전화번호
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'email' ? (
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
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-sm font-medium text-slate-700">
                      국가
                    </Label>
                    <select
                      id="nationality"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.phoneCode} {t(`auth.countries.${country.code}`) || country.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">
                      전화번호
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder={
                          countries.find(c => c.code === nationality)?.isKorean 
                            ? '010-1234-5678' 
                            : `${countries.find(c => c.code === nationality)?.phoneCode || '+1'} 123456789`
                        }
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                        style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem' }}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {countries.find(c => c.code === nationality)?.isKorean 
                        ? '하이픈(-) 없이 입력해도 됩니다' 
                        : '국가 코드를 포함한 전화번호를 입력하세요'}
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
                disabled={isLoading || (activeTab === 'email' ? !email : !phoneNumber)}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {activeTab === 'email' ? t('auth.forgotPassword.sending') : 'SMS 발송 중...'}
                  </div>
                ) : (
                  activeTab === 'email' ? t('auth.forgotPassword.sendResetLink') : 'SMS 인증코드 보내기'
                )}
              </Button>
            </form>

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
