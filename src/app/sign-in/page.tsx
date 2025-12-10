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
import { checkWebAuthnSupport, startBiometricRegistration, startBiometricAuthentication } from '@/lib/webauthnClient'
import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Fingerprint } from 'lucide-react'
import { signInEvents, trackLoginAttempt, trackLoginSuccess, trackCTAClick } from '@/lib/analytics'

export default function SignInPage() {
  const BIOMETRIC_ENABLED = process.env.NEXT_PUBLIC_BIOMETRIC_ENABLED === 'true'
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
  const [canUseBiometric, setCanUseBiometric] = useState(false)
  const [savedUserId, setSavedUserId] = useState<string | null>(null)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  // 로그인 페이지 방문 이벤트
  useEffect(() => {
    signInEvents.visitLogin()
    
    // accountDeleted 쿼리 파라미터 확인
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('accountDeleted') === '1') {
        setShowDeleteSuccess(true)
        // URL에서 쿼리 파라미터 제거 (깔끔한 URL 유지)
        router.replace('/sign-in', { scroll: false })
      }
    }
  }, [router])

  useEffect(() => {
    if (!BIOMETRIC_ENABLED) {
      setIsWebAuthnSupported(false)
      setCanUseBiometric(false)
      return
    }
    // WebAuthn 지원 여부 확인
    const support = checkWebAuthnSupport()
    setIsWebAuthnSupported(support.isSupported)
    
    console.log('[SIGNIN] WebAuthn 지원 여부:', support.isSupported)
    
    // 마지막 로그인 사용자 확인
    const checkLastUser = async () => {
      const lastUserId = localStorage.getItem('amiko_last_user_id')
      console.log('[SIGNIN] localStorage에서 사용자 ID 확인:', lastUserId)
      
      if (lastUserId && support.isSupported) {
        setSavedUserId(lastUserId)
        
        // 해당 사용자의 지문 등록 여부 확인
        try {
          console.log('[SIGNIN] 지문 등록 여부 확인 시작:', lastUserId)
          const biometricCheck = await fetch(`/api/auth/biometric?userId=${lastUserId}`)
          const biometricData = await biometricCheck.json()
          
          console.log('[SIGNIN] 지문 등록 여부 API 응답:', {
            success: biometricData.success,
            dataLength: biometricData.data?.length || 0,
            data: biometricData.data
          })
          
          if (biometricData.success && biometricData.data && biometricData.data.length > 0) {
            console.log('[SIGNIN] 지문 인증 사용 가능 - 버튼 표시')
            setCanUseBiometric(true)
          } else {
            console.log('[SIGNIN] 지문 인증 사용 불가:', {
              success: biometricData.success,
              hasData: !!biometricData.data,
              dataLength: biometricData.data?.length || 0
            })
            setCanUseBiometric(false)
          }
        } catch (error) {
          console.error('[SIGNIN] 지문 확인 실패:', error)
          setCanUseBiometric(false)
        }
      } else {
        console.log('[SIGNIN] 지문 로그인 버튼 표시 조건 불만족:', {
          hasUserId: !!lastUserId,
          isSupported: support.isSupported
        })
      }
    }
    
    checkLastUser()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 로그인 퍼널 이벤트: 이메일 입력
    if (field === 'identifier' && value.length > 0) {
      signInEvents.enterEmail()
      signInEvents.enterLoginEmail()
    }
    
    // 로그인 퍼널 이벤트: 비밀번호 입력
    if (field === 'password' && value.length > 0) {
      signInEvents.enterPassword()
      signInEvents.enterLoginPassword()
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    // 로그인 퍼널 이벤트: 로그인 시작
    signInEvents.startSignIn()
    // 로그인 퍼널 이벤트: 로그인 시도
    signInEvents.loginAttempt()
    // Standardized event
    trackLoginAttempt()
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
        // 로그인 퍼널 이벤트: 로그인 실패
        signInEvents.signInError(result.error || 'SIGN_IN_FAILED', result.error || t('auth.signInFailed'))
        throw new Error(result.error || t('auth.signInFailed'))
      }

      console.log('[SIGNIN] 로그인 성공 응답:', result)
      
      // 로그인 퍼널 이벤트: 로그인 성공
      const userId = result.data?.user?.id || result.user?.id
      const userEmail = result.data?.user?.email || result.user?.email
      signInEvents.signInSuccess(userId, 'email')
      signInEvents.loginSuccess(userId, 'email')
      // Standardized event
      trackLoginSuccess(userId, 'email')
      
      // API 응답 구조: result.data.user.id (이미 위에서 추출됨)
      console.log('[SIGNIN] 추출된 사용자 ID:', userId)
      console.log('[SIGNIN] 추출된 사용자 이메일:', userEmail)
      
      // API가 실제 인증을 수행하므로, 클라이언트에서 추가 인증 시도 필요 없음
      // 세션은 서버에서 쿠키로 설정되었으므로, 클라이언트 세션도 업데이트하기 위해 signIn 호출
      // 전화번호로 로그인한 경우 백엔드에서 찾은 이메일을 사용해야 함
      const emailForSignIn = userEmail || formData.identifier
      console.log('[SIGNIN] 클라이언트 세션 업데이트 시도:', {
        원본_identifier: formData.identifier,
        사용할_이메일: emailForSignIn,
        전화번호_로그인: !formData.identifier.includes('@')
      })
      
      await signIn(emailForSignIn, formData.password).catch(err => {
        // 이미 서버에서 인증되었으므로, 클라이언트 인증 실패는 무시
        console.log('[SIGNIN] 클라이언트 세션 업데이트 시도 (이미 서버에서 인증됨):', err)
      })
      
      // 마지막 로그인 사용자 ID 저장
      if (userId) {
        console.log('[SIGNIN] localStorage에 사용자 ID 저장:', userId)
        localStorage.setItem('amiko_last_user_id', userId)
        setSavedUserId(userId) // 즉시 상태 업데이트
      } else {
        console.error('[SIGNIN] 사용자 ID를 찾을 수 없음:', result)
      }
      
      // 지문 인증 지원하고, 아직 등록하지 않은 경우 모달 표시
      if (isWebAuthnSupported && userId) {
        // 지문 등록 여부 확인
        const biometricCheck = await fetch(`/api/auth/biometric?userId=${userId}`)
        const biometricData = await biometricCheck.json()
        
        console.log('[SIGNIN] 로그인 후 지문 확인:', {
          success: biometricData.success,
          dataLength: biometricData.data?.length || 0,
          data: biometricData.data
        })
        
        if (biometricData.success && biometricData.data && biometricData.data.length > 0) {
          // 이미 등록된 지문이 있으면 즉시 사용 가능으로 설정
          console.log('[SIGNIN] 이미 등록된 지문 있음 - canUseBiometric=true')
          setCanUseBiometric(true)
        } else if (biometricData.success && (!biometricData.data || biometricData.data.length === 0)) {
          // 등록된 지문이 없으면 모달 표시
          console.log('[SIGNIN] 등록된 지문 없음 - 모달 표시')
          setLoggedInUserId(userId)
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
        console.log('[SIGNIN] 지문 등록 성공 - 상태 업데이트')
        
        // 지문 등록 성공 시 즉시 상태 업데이트
        setSavedUserId(loggedInUserId)
        setCanUseBiometric(true)
        
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

  const handleBiometricQuickLogin = async () => {
    if (!savedUserId) return
    
    setIsLoading(true)
    try {
      console.log('[BIOMETRIC_LOGIN] 지문 로그인 시작:', { userId: savedUserId })
      
      // 실제 WebAuthn 인증 플로우 시작
      const result = await startBiometricAuthentication(savedUserId)
      
      if (!result.success) {
        throw new Error(result.error || '인증 실패')
      }
      
      console.log('[BIOMETRIC_LOGIN] 지문 인증 성공:', result.data)
      
      // 인증 성공 후 서버에서 세션 생성
      // 사용자 정보를 가져와서 세션 생성
      const sessionResponse = await fetch('/api/auth/biometric/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: savedUserId,
          credentialId: result.data?.id
        })
      })
      
      const sessionResult = await sessionResponse.json()
      
      if (!sessionResponse.ok || !sessionResult.success) {
        throw new Error(sessionResult.error || '세션 생성 실패')
      }
      
      console.log('[BIOMETRIC_LOGIN] 세션 생성 성공:', sessionResult)
      
      // AuthContext 업데이트를 위해 signIn 호출 (비밀번호 없이)
      // 서버에서 이미 세션이 생성되었으므로, 클라이언트 상태만 업데이트
      try {
        await signIn(savedUserId, '').catch(() => {
          // 이미 서버에서 세션이 생성되었으므로 실패는 무시
          console.log('[BIOMETRIC_LOGIN] 클라이언트 세션 업데이트 시도 (서버 세션 이미 생성됨)')
        })
      } catch (err) {
        // 무시 - 서버 세션이 이미 있음
      }
      
      // 로그인 성공 후 메인으로 이동
      router.push('/main')
      
    } catch (error) {
      console.error('[BIOMETRIC_LOGIN] 지문 로그인 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : ''
      
      // 사용자 친화적인 에러 메시지
      if (errorMessage.includes('cancel') || errorMessage.includes('abort') || errorMessage.includes('취소')) {
        // 사용자가 취소한 경우 - 조용히 실패
        console.log('[BIOMETRIC_LOGIN] 사용자가 인증 취소')
      } else if (errorMessage.includes('등록된 인증기가 없습니다') || errorMessage.includes('No hay autenticadores')) {
        // 등록된 인증기가 없는 경우
        setCanUseBiometric(false)
        localStorage.removeItem('amiko_last_user_id')
        alert(language === 'ko' 
          ? '등록된 지문 인증이 없습니다. 일반 로그인을 이용해주세요.'
          : 'No hay autenticación de huella registrada. Use el inicio de sesión normal.')
      } else {
        // 기타 오류
        alert(language === 'ko' 
          ? '지문 인증에 실패했습니다. 일반 로그인을 이용해주세요.'
          : 'Error en autenticación de huella. Use el inicio de sesión normal.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-3 sm:p-4 pt-32 sm:pt-44">
      <div className="flex justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* 계정 삭제 완료 메시지 */}
        {showDeleteSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {language === 'ko' ? '계정이 성공적으로 삭제되었습니다.' : 'La cuenta se ha eliminado correctamente.'}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {language === 'ko' 
                    ? '이메일과 비밀번호로 다시 가입하실 수 있습니다.' 
                    : 'Puede registrarse nuevamente con su correo electrónico y contraseña.'}
                </p>
              </div>
              <button
                onClick={() => setShowDeleteSuccess(false)}
                className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      <Card className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
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
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                {t('auth.loginIdInfo')}
              </p>
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

          {/* 지문 빠른 로그인 */}
          {/* 디버깅: 조건 확인 */}
          {BIOMETRIC_ENABLED && process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded space-y-1">
              <div>디버그 정보:</div>
              <div>• canUseBiometric: {String(canUseBiometric)}</div>
              <div>• savedUserId: {savedUserId || 'null'}</div>
              <div>• localStorage: {typeof window !== 'undefined' ? localStorage.getItem('amiko_last_user_id') || '없음' : 'N/A'}</div>
              <div>• isWebAuthnSupported: {String(isWebAuthnSupported)}</div>
              <div className="text-red-600 mt-2">
                {!savedUserId && '⚠️ 로그인을 하면 savedUserId가 설정됩니다.'}
              </div>
            </div>
          )}
          {BIOMETRIC_ENABLED && canUseBiometric && savedUserId && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 dark:bg-gray-800 px-2 text-slate-500 dark:text-gray-400">
                    {language === 'ko' ? '또는' : 'o'}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBiometricQuickLogin}
                variant="outline"
                className="w-full border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 py-3"
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  <span className="font-medium">
                    {language === 'ko' ? '지문으로 빠르게 로그인' : 'Inicio rápido con huella'}
                  </span>
                </div>
              </Button>
            </>
          )}

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
              <a 
                href="/sign-up" 
                onClick={() => trackCTAClick('signin_to_signup_link', window.location.href)}
                className="text-slate-900 dark:text-gray-100 hover:text-slate-700 dark:hover:text-gray-300 font-medium"
              >
                {t('auth.signUp')}
              </a>
            </p>
          </div>

        </CardContent>
      </Card>
      </div>

      {/* 지문 등록 제안 모달 (기능 플래그) */}
      {BIOMETRIC_ENABLED && (
      <Dialog open={showBiometricSetupModal} onOpenChange={setShowBiometricSetupModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
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
      )}
      </div>
    </div>
  )
}
