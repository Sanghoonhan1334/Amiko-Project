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
        throw new Error(t('auth.sessionUpdateFailed'))
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


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 pt-32 sm:pt-44">
      <div className="flex justify-center">
      <Card className="w-full max-w-md bg-white border shadow-lg">
        <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900">
            {t('auth.signIn')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-slate-600">
            {t('auth.signInDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-slate-700">
                {t('auth.emailOrPhone')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder={t('auth.emailOrPhonePlaceholder')}
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  className="border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pr-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
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

          {/* 소셜 로그인 */}

          {/* 추가 링크 */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-6 text-sm">
              <a href="/forgot-password" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                {t('auth.forgotPassword')}
              </a>
              <span className="text-slate-400">•</span>
              <a href="/help" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                {t('footer.help')}
              </a>
            </div>
            
            <p className="text-sm text-slate-600">
              {t('auth.noAccount')}{' '}
              <a href="/sign-up" className="text-slate-900 hover:text-slate-700 font-medium">
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
