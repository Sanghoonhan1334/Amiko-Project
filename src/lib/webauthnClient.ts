// =====================================================
// WebAuthn 클라이언트 유틸리티
// Description: 지문 인증 클라이언트 측 처리
// Date: 2025-01-17
// =====================================================

import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON
} from '@simplewebauthn/browser'

// 지문 인증 등록 시작
export async function startBiometricRegistration(
  userId: string,
  userName: string,
  userDisplayName: string
): Promise<{
  success: boolean
  data?: RegistrationResponseJSON
  error?: string
}> {
  try {
    // 서버에서 등록 옵션 가져오기
    const response = await fetch('/api/auth/biometric/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, userDisplayName })
    })

    const result = await response.json()
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || '등록 옵션 생성에 실패했습니다.'
      }
    }

    // WebAuthn 등록 시작
    const registrationResponse = await startRegistration(result.data)

    // 서버에서 등록 응답 검증
    const verifyResponse = await fetch('/api/auth/biometric/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        response: registrationResponse,
        expectedChallenge: result.data.challenge
      })
    })

    const verifyResult = await verifyResponse.json()

    if (verifyResult.success) {
      return {
        success: true,
        data: registrationResponse
      }
    } else {
      return {
        success: false,
        error: verifyResult.error || '등록 검증에 실패했습니다.'
      }
    }

  } catch (error) {
    console.error('[WEBAUTHN_CLIENT] 등록 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '지문 인증 등록에 실패했습니다.'
    }
  }
}

// 지문 인증 시작
export async function startBiometricAuthentication(
  userId: string
): Promise<{
  success: boolean
  data?: AuthenticationResponseJSON
  error?: string
}> {
  try {
    // 서버에서 인증 옵션 가져오기
    const response = await fetch('/api/auth/biometric/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    const result = await response.json()
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || '인증 옵션 생성에 실패했습니다.'
      }
    }

    // WebAuthn 인증 시작
    const authenticationResponse = await startAuthentication(result.data)

    // 서버에서 인증 응답 검증
    const verifyResponse = await fetch('/api/auth/biometric/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        response: authenticationResponse,
        expectedChallenge: result.data.challenge
      })
    })

    const verifyResult = await verifyResponse.json()

    if (verifyResult.success) {
      return {
        success: true,
        data: authenticationResponse
      }
    } else {
      return {
        success: false,
        error: verifyResult.error || '인증 검증에 실패했습니다.'
      }
    }

  } catch (error) {
    console.error('[WEBAUTHN_CLIENT] 인증 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '지문 인증에 실패했습니다.'
    }
  }
}

// WebAuthn 지원 여부 확인
export function checkWebAuthnSupport(): {
  isSupported: boolean
  features: {
    platformAuthenticator: boolean
    conditionalMediation: boolean
    largeBlob: boolean
  }
} {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      features: {
        platformAuthenticator: false,
        conditionalMediation: false,
        largeBlob: false
      }
    }
  }

  return {
    isSupported: !!window.PublicKeyCredential,
    features: {
      platformAuthenticator: !!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable,
      conditionalMediation: !!window.PublicKeyCredential?.isConditionalMediationAvailable,
      largeBlob: !!window.PublicKeyCredential?.isLargeBlobSupported
    }
  }
}

// 플랫폼 인증기 사용 가능 여부 확인
export async function checkPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false
    }

    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (error) {
    console.error('[WEBAUTHN_CLIENT] 플랫폼 인증기 확인 실패:', error)
    return false
  }
}

// 조건부 매개체 사용 가능 여부 확인
export async function checkConditionalMediationAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false
    }

    return await window.PublicKeyCredential.isConditionalMediationAvailable()
  } catch (error) {
    console.error('[WEBAUTHN_CLIENT] 조건부 매개체 확인 실패:', error)
    return false
  }
}

// 지문 인증 상태 확인
export async function getBiometricAuthStatus(userId: string): Promise<{
  success: boolean
  data?: {
    hasCredentials: boolean
    credentials: Array<{
      id: string
      deviceName: string
      deviceType: string
      lastUsedAt: string
      counter: number
    }>
  }
  error?: string
}> {
  try {
    const response = await fetch(`/api/auth/biometric?userId=${userId}`)
    const result = await response.json()

    if (result.success) {
      return {
        success: true,
        data: {
          hasCredentials: result.data.length > 0,
          credentials: result.data
        }
      }
    } else {
      return {
        success: false,
        error: result.error || '지문 인증 상태 확인에 실패했습니다.'
      }
    }
  } catch (error) {
    console.error('[WEBAUTHN_CLIENT] 상태 확인 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '지문 인증 상태 확인에 실패했습니다.'
    }
  }
}

// 지문 인증 삭제
export async function deleteBiometricCredential(userId: string, credentialId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(`/api/auth/biometric?userId=${userId}&credentialId=${credentialId}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (result.success) {
      return { success: true }
    } else {
      return {
        success: false,
        error: result.error || '지문 인증 삭제에 실패했습니다.'
      }
    }
  } catch (error) {
    console.error('[WEBAUTHN_CLIENT] 삭제 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '지문 인증 삭제에 실패했습니다.'
    }
  }
}
