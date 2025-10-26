'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, 
  User, 
  Lock, 
  Eye, 
  EyeOff
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import BiometricLogin from '@/components/auth/BiometricLogin'
import { checkWebAuthnSupport } from '@/lib/webauthnClient'
import { useEffect } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false)
  const [showBiometricLogin, setShowBiometricLogin] = useState(false)

  useEffect(() => {
    // WebAuthn 지원 여부 확인
    const support = checkWebAuthnSupport()
    setIsWebAuthnSupported(support.isSupported)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 실제 로그인 API 호출
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('auth.signInFailed'))
      }

      console.log('로그인 성공:', result)
      
      // AuthContext의 signIn 함수 사용하여 세션 업데이트
      const { error: signInError } = await signIn(formData.identifier, formData.password)
      
      if (signInError) {
        // 구체적인 오류 메시지 표시
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다. 회원가입을 먼저 진행해주세요.')
        } else {
          throw new Error(t('auth.sessionUpdateFailed'))
        }
      }
      
      // 로그인 성공 후 메인 앱으로 이동
      router.push('/main')
      
    } catch (error) {
      console.error('로그인 오류:', error)
      
      // 사용자에게 더 친화적인 메시지 표시
      const errorMessage = error instanceof Error ? error.message : t('auth.signInError')
      
      if (errorMessage.includes('이메일 또는 비밀번호가 올바르지 않습니다')) {
        alert(t('auth.credentialsCheckMessage'))
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }


  const handleBiometricLoginSuccess = (user: any) => {
    console.log('지문 인증 로그인 성공:', user)
    // 지문 인증으로 로그인 성공 시 메인 앱으로 이동
    router.push('/main')
  }

  const handleBiometricLoginError = (error: string) => {
    console.error('지문 인증 로그인 실패:', error)
    alert(error)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-3 sm:p-4 pt-32 sm:pt-44">
      <div className="flex justify-center">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
        <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-gray-100">
            {t('auth.signIn')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
            {t('auth.signInDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.emailOrPhone')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder={t('auth.emailOrPhonePlaceholder')}
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  className="border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pr-10 border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 dark:bg-gray-700 hover:bg-slate-800 dark:hover:bg-gray-600 text-white py-3 text-lg font-medium transition-colors"
              disabled={isLoading || !formData.identifier || !formData.password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.signingIn')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{t('auth.signIn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* 지문 인증 로그인 */}
          {isWebAuthnSupported && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 dark:bg-gray-800 px-2 text-slate-500 dark:text-gray-400">{t('auth.or')}</span>
                </div>
              </div>
              
              <BiometricLogin
                userId="temp-user-id" // 실제로는 사용자 ID 사용
                onSuccess={handleBiometricLoginSuccess}
                onError={handleBiometricLoginError}
              />
            </div>
          )}

          {/* 소셜 로그인 */}

          {/* 추가 링크 */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-6 text-sm">
              <a href="/forgot-password" className="text-slate-900 dark:text-gray-100 hover:text-slate-700 dark:hover:text-gray-300 font-medium transition-colors">
                {t('auth.forgotPassword.title')}
              </a>
              <span className="text-slate-400 dark:text-gray-500">•</span>
              <a href="/help" className="text-slate-900 dark:text-gray-100 hover:text-slate-700 dark:hover:text-gray-300 font-medium transition-colors">
                {t('footer.help')}
              </a>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <a href="/sign-up" className="text-slate-900 dark:text-gray-100 hover:text-slate-700 dark:hover:text-gray-300 font-medium">
                {t('auth.signUp')}
              </a>
            </p>
          </div>

        </CardContent>
      </Card>
      </div>
    </div>
  )
}
