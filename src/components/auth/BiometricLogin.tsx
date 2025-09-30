'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Fingerprint, Smartphone, Mail, Phone } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { startBiometricAuthentication, checkWebAuthnSupport, getBiometricAuthStatus } from '@/lib/webauthnClient'

interface BiometricLoginProps {
  userId: string
  onSuccess: (user: any) => void
  onError: (error: string) => void
}

export default function BiometricLogin({ userId, onSuccess, onError }: BiometricLoginProps) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [credentials, setCredentials] = useState<any[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // WebAuthn 지원 여부 확인
    const support = checkWebAuthnSupport()
    setIsSupported(support.isSupported)

    if (support.isSupported && userId) {
      // 지문 인증 상태 확인
      checkBiometricStatus()
    }
  }, [userId])

  const checkBiometricStatus = async () => {
    try {
      const result = await getBiometricAuthStatus(userId)
      if (result.success) {
        setHasCredentials(result.data?.hasCredentials || false)
        setCredentials(result.data?.credentials || [])
      }
    } catch (error) {
      console.error('지문 인증 상태 확인 실패:', error)
    }
  }

  const handleBiometricLogin = async () => {
    setIsLoading(true)
    try {
      const result = await startBiometricAuthentication(userId)
      
      if (result.success) {
        // 로그인 성공 처리
        onSuccess({
          id: userId,
          authMethod: 'biometric',
          credentialId: result.data?.id
        })
      } else {
        onError(result.error || '지문 인증에 실패했습니다.')
      }
    } catch (error) {
      console.error('지문 인증 로그인 실패:', error)
      onError('지문 인증 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // WebAuthn을 지원하지 않는 경우
  if (!isSupported) {
    return null // 아무것도 표시하지 않음
  }

  // 지문 인증이 설정되지 않은 경우
  if (!hasCredentials) {
    return null // 아무것도 표시하지 않음
  }

  // 축소된 상태 (작은 버튼)
  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        variant="outline"
        className="w-full border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-2"
      >
        <Fingerprint className="w-4 h-4" />
        <span>지문으로 빠른 로그인</span>
      </Button>
    )
  }

  // 확장된 상태 (전체 카드)
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Fingerprint className="w-8 h-8 text-green-600" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
        <CardTitle className="text-lg font-semibold text-green-900 mt-4">
          {t('auth.biometricLogin')}
        </CardTitle>
        <CardDescription className="text-sm text-green-700">
          등록된 지문으로 빠르게 로그인하세요
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 등록된 인증기 목록 */}
        {credentials.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-800">등록된 인증기:</h4>
            {credentials.map((cred, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                <Smartphone className="w-4 h-4" />
                <span>{cred.deviceName}</span>
                <span className="text-green-500">•</span>
                <span>마지막 사용: {new Date(cred.lastUsedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* 지문 인증 버튼 */}
        <Button
          onClick={handleBiometricLogin}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>인증 중...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              <span>지문으로 로그인</span>
            </div>
          )}
        </Button>

        {/* 보안 안내 */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-green-600 text-xs">🔒</span>
            </div>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">보안 안내</p>
              <p>지문 정보는 디바이스에만 저장되며 서버로 전송되지 않습니다.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
