'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Fingerprint, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { startBiometricRegistration, startBiometricAuthentication } from '@/lib/webauthnClient'

interface BiometricAuthProps {
  userId?: string
  userName?: string
  userDisplayName?: string
  onEnable: () => void
  onSkip: () => void
  onLogin?: () => void
  mode?: 'setup' | 'login' | 'suggestion'
}

export default function BiometricAuth({ 
  userId, 
  userName, 
  userDisplayName, 
  onEnable, 
  onSkip, 
  onLogin, 
  mode = 'suggestion' 
}: BiometricAuthProps) {
  const { t } = useLanguage()
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // WebAuthn 지원 여부 확인
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setIsSupported(available)
        } catch (error) {
          console.log('WebAuthn not supported:', error)
          setIsSupported(false)
        }
      }
    }
    
    checkSupport()
  }, [])

  const handleBiometricSetup = async () => {
    if (!isSupported) return
    
    if (!userId || !userName || !userDisplayName) {
      setError('사용자 정보가 필요합니다. 로그인 후 다시 시도해주세요.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // 실제 WebAuthn 등록 플로우 사용
      const result = await startBiometricRegistration(userId, userName, userDisplayName)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onEnable()
        }, 1000)
      } else {
        throw new Error(result.error || '등록 실패')
      }
    } catch (error: any) {
      console.error('[BIOMETRIC_AUTH] 등록 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // 오류 타입별 메시지 설정
      if (errorMessage.includes('cancel') || errorMessage.includes('abort') || errorMessage.includes('취소')) {
        // 사용자가 취소한 경우 - 조용히 실패
        console.log('[BIOMETRIC_AUTH] 사용자가 등록 취소')
      } else if (errorMessage.includes('NotAllowedError') || errorMessage.includes('거부')) {
        setError('지문 인증이 거부되었습니다. 브라우저 설정에서 지문 인증을 허용해주세요.')
      } else if (errorMessage.includes('TimeoutError') || errorMessage.includes('시간')) {
        setError('지문 인증 시간이 초과되었습니다. 다시 시도해주세요.')
      } else if (errorMessage.includes('NotSupportedError') || errorMessage.includes('지원하지 않습니다')) {
        setError('이 디바이스는 지문 인증을 지원하지 않습니다.')
      } else if (errorMessage.includes('SecurityError') || errorMessage.includes('보안')) {
        setError('보안 오류가 발생했습니다. HTTPS 환경에서만 사용 가능합니다.')
      } else {
        setError(errorMessage || '지문 인증 설정에 실패했습니다. 나중에 설정하거나 건너뛸 수 있습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    if (!isSupported || !userId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 실제 WebAuthn 인증 플로우 사용
      const result = await startBiometricAuthentication(userId)
      
      if (result.success) {
        // 성공 시 콜백 호출
        if (onLogin) {
          onLogin()
        }
      } else {
        throw new Error(result.error || '인증 실패')
      }
    } catch (error: any) {
      console.error('[BIOMETRIC_AUTH] 로그인 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('cancel') || errorMessage.includes('abort') || errorMessage.includes('취소')) {
        // 사용자가 취소한 경우 - 조용히 실패
        console.log('[BIOMETRIC_AUTH] 사용자가 인증 취소')
      } else {
        setError(errorMessage || '지문 인증에 실패했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-700">{t('auth.biometricLogin')}</h3>
              <p className="text-sm text-gray-500">{t('auth.biometricNotSupported')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mode === 'login') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Fingerprint className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold">{t('auth.biometricLogin')}</h3>
          <p className="text-gray-600">등록된 지문을 스캔해주세요</p>
        </div>
        
        <Button 
          onClick={handleBiometricLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Fingerprint className="w-5 h-5 mr-2" />
          {isLoading ? '인증 중...' : '지문 인증하기'}
        </Button>
      </div>
    )
  }

  if (mode === 'setup') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Fingerprint className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold">{t('auth.biometricSetup')}</h3>
          <p className="text-gray-600">
            매번 비밀번호를 입력하지 않고도 안전하게 로그인할 수 있습니다
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">안전한 인증</h4>
              <p className="text-sm text-green-700">{t('auth.biometricSafe')}</p>
            </div>
          </div>
        </div>
        
        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">설정 실패</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 성공 메시지 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">설정 완료</h4>
                <p className="text-sm text-green-700">지문 인증이 성공적으로 설정되었습니다!</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            {t('auth.biometricSkip')}
          </Button>
          <Button 
            onClick={handleBiometricSetup} 
            disabled={isLoading || success}
            className="flex-1"
          >
            {isLoading ? '설정 중...' : success ? '설정 완료' : t('auth.biometricEnable')}
          </Button>
        </div>
      </div>
    )
  }

  // suggestion mode (기본)
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">빠른 로그인 설정</h3>
            <p className="text-sm text-gray-600">
              {t('auth.biometricExplanation')}
            </p>
            
            {/* 오류 메시지 */}
            {error && (
              <div className="mt-2 text-xs text-red-600">
                {error}
              </div>
            )}
            
            {/* 성공 메시지 */}
            {success && (
              <div className="mt-2 text-xs text-green-600">
                지문 인증이 설정되었습니다!
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onSkip}>
              나중에
            </Button>
            <Button 
              size="sm" 
              onClick={handleBiometricSetup} 
              disabled={isLoading || success}
            >
              {isLoading ? '설정 중...' : success ? '설정 완료' : '설정하기'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
