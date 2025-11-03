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
import { checkWebAuthnSupport, startBiometricRegistration } from '@/lib/webauthnClient'
import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Fingerprint } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { t, language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false)
  const [showBiometricSetupModal, setShowBiometricSetupModal] = useState(false)
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)

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
      
      // API가 실제 인증을 수행하므로, 클라이언트에서 추가 인증 시도 필요 없음
      // 세션은 서버에서 쿠키로 설정되었으므로, 클라이언트 세션도 업데이트하기 위해 signIn 호출 (에러 무시)
      await signIn(formData.identifier, formData.password).catch(err => {
        // 이미 서버에서 인증되었으므로, 클라이언트 인증 실패는 무시
        console.log('[SIGNIN] 클라이언트 세션 업데이트 시도 (이미 서버에서 인증됨)')
      })
      
      // 지문 인증 지원하고, 아직 등록하지 않은 경우 모달 표시
      if (isWebAuthnSupported && result.user?.id) {
        // 지문 등록 여부 확인
        const biometricCheck = await fetch(`/api/auth/biometric?userId=${result.user.id}`)
        const biometricData = await biometricCheck.json()
        
        if (biometricData.success && (!biometricData.data || biometricData.data.length === 0)) {
          // 등록된 지문이 없으면 모달 표시
          setLoggedInUserId(result.user.id)
          setShowBiometricSetupModal(true)
          return // 모달이 닫힐 때까지 대기
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


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleBiometricSetup = async () => {
    if (!loggedInUserId) return
    
    setIsLoading(true)
    try {
      const result = await startBiometricRegistration(
        loggedInUserId,
        formData.identifier,
        formData.identifier
      )
      
      if (result.success) {
        alert(language === 'ko' ? '지문 인증이 등록되었습니다!' : '¡Autenticación de huella digital registrada!')
        setShowBiometricSetupModal(false)
        router.push('/main')
      } else {
        throw new Error(result.error || '등록 실패')
      }
    } catch (error) {
      console.error('지문 등록 오류:', error)
      alert(language === 'ko' 
        ? '지문 등록에 실패했습니다. 나중에 마이페이지에서 다시 시도해주세요.' 
        : 'Error al registrar huella digital. Inténtelo más tarde en Mi Perfil.')
      setShowBiometricSetupModal(false)
      router.push('/main')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipBiometric = () => {
    setShowBiometricSetupModal(false)
    router.push('/main')
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

      {/* 지문 등록 제안 모달 */}
      <Dialog open={showBiometricSetupModal} onOpenChange={setShowBiometricSetupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {language === 'ko' ? '🔒 지문으로 빠르게 로그인하세요!' : '🔒 ¡Inicia sesión rápido con huella!'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm">
                {language === 'ko' 
                  ? '다음부터 지문으로 간편하게 로그인할 수 있습니다. 안전하고 빠릅니다!'
                  : '¡Puedes iniciar sesión fácilmente con tu huella la próxima vez. Es seguro y rápido!'}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* 장점 설명 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg">⚡</span>
                <div className="text-sm text-green-800">
                  <p className="font-medium">
                    {language === 'ko' ? '빠른 로그인' : 'Inicio rápido'}
                  </p>
                  <p className="text-green-600">
                    {language === 'ko' ? '비밀번호 입력 없이 1초 만에' : 'En 1 segundo sin contraseña'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg">🔐</span>
                <div className="text-sm text-green-800">
                  <p className="font-medium">
                    {language === 'ko' ? '안전한 보안' : 'Seguridad garantizada'}
                  </p>
                  <p className="text-green-600">
                    {language === 'ko' ? '지문 정보는 기기에만 저장됩니다' : 'Los datos se guardan solo en tu dispositivo'}
                  </p>
                </div>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleBiometricSetup}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{language === 'ko' ? '등록 중...' : 'Registrando...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    <span>{language === 'ko' ? '지금 등록하기' : 'Registrar ahora'}</span>
                  </div>
                )}
              </Button>
              
              <Button
                onClick={handleSkipBiometric}
                variant="outline"
                className="w-full"
              >
                {language === 'ko' ? '나중에 하기' : 'Más tarde'}
              </Button>
            </div>

            {/* 작은 안내 */}
            <p className="text-xs text-center text-gray-500">
              {language === 'ko' 
                ? '마이페이지 > 보안 설정에서 언제든지 등록할 수 있습니다.'
                : 'Puedes registrar en cualquier momento en Mi Perfil > Seguridad.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
