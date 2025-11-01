'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useLanguage } from '@/context/LanguageContext'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    hasNumber: false,
    hasSpecial: false,
    noRepeated: false
  })

  // Supabase 클라이언트 생성
  const supabase = createSupabaseBrowserClient()

  // Supabase 비밀번호 재설정 세션 처리
  useEffect(() => {
    const handlePasswordReset = async () => {
      // URL 해시 파라미터 확인
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      console.log('🔍 URL 해시 파라미터:', {
        hasHash: !!window.location.hash,
        hash: window.location.hash,
        accessToken: accessToken ? '있음' : '없음',
        type
      })

      // 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('📝 현재 세션:', {
        hasSession: !!session,
        sessionError: sessionError?.message
      })

      if (!session && accessToken && type === 'recovery') {
        console.log('🔄 세션 설정 시도 중...')
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || ''
        })
        
        if (error) {
          console.error('❌ 세션 설정 실패:', error)
        } else {
          console.log('✅ 세션 설정 성공')
        }
      }
    }
    
    handlePasswordReset()
  }, [])

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noRepeated: !/(.)\1{2,}/.test(password)
    }
    setPasswordChecks(checks)
  }

  const isPasswordValid = Object.values(passwordChecks).every(check => check)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        alert(t('auth.resetPassword.passwordMismatch'))
        return
      }

      if (!isPasswordValid) {
        alert(t('auth.resetPassword.passwordRequirements'))
        return
      }

      // Supabase는 자동으로 세션을 설정하므로 직접 updateUser 호출
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw new Error(error.message || t('auth.resetPassword.resetFailed'))
      }

      console.log('✅ 비밀번호 재설정 성공:', data)
      setIsSuccess(true)
      
      // 성공 후 2초 뒤에 로그인 페이지로 자동 이동
      setTimeout(() => {
        router.push('/sign-in')
      }, 2000)
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      alert(error instanceof Error ? error.message : t('auth.resetPassword.resetError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-44">
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white border shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                {t('auth.resetPassword.passwordChanged')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('auth.resetPassword.loginWithNewPassword')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={() => router.push('/sign-in')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
{t('auth.resetPassword.login')}
              </Button>
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
              {t('auth.resetPassword.setNewPassword')}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t('auth.resetPassword.enterNewPassword')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t('auth.resetPassword.newPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      validatePassword(e.target.value)
                    }}
                    className={`border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                      password && !isPasswordValid ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                    }`}
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 비밀번호 강도 표시 */}
                {password && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-red-500'}`}></div>
{t('auth.resetPassword.minLength')}
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.hasNumber ? 'bg-green-500' : 'bg-red-500'}`}></div>
{t('auth.resetPassword.hasNumber')}
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.hasSpecial ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.hasSpecial ? 'bg-green-500' : 'bg-red-500'}`}></div>
{t('auth.resetPassword.hasSpecial')}
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.noRepeated ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.noRepeated ? 'bg-green-500' : 'bg-red-500'}`}></div>
{t('auth.resetPassword.noRepeated')}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  {t('auth.resetPassword.confirmPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                      confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                    }`}
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">{t('auth.resetPassword.passwordMismatch')}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
                disabled={isLoading || !password || !confirmPassword || !isPasswordValid || password !== confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('auth.resetPassword.resetting')}
                  </div>
                ) : (
                  t('auth.resetPassword.resetPassword')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 p-4 pt-44">
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white border shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Cargando...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
