// =====================================================
// WebAuthn 서버 유틸리티
// Description: 지문 인증 서버 측 처리
// Date: 2025-01-17
// =====================================================

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
  type AuthenticatorDevice,
  type CredentialDeviceType
} from '@simplewebauthn/server'
import { supabaseServer } from '@/lib/supabaseServer'

// RP (Relying Party) 설정
const rpName = 'Amiko'
const rpID = process.env.NODE_ENV === 'production' ? 'amiko.com' : 'localhost'
const origin = process.env.NODE_ENV === 'production' ? 'https://amiko.com' : 'http://localhost:3000'

// 사용자 등록 옵션 생성
export async function generateUserRegistrationOptions(userId: string, userName: string, userDisplayName: string) {
  try {
    // 기존 등록된 인증기 조회
    const { data: existingCredentials, error: fetchError } = await supabaseServer
      .from('biometric_credentials')
      .select('credential_id, public_key, counter, device_name, device_type')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (fetchError) {
      console.error('[WEBAUTHN] 기존 인증기 조회 실패:', fetchError)
      throw new Error('기존 인증기 조회에 실패했습니다.')
    }

    // 기존 인증기를 AuthenticatorDevice 형식으로 변환
    const existingDevices: AuthenticatorDevice[] = existingCredentials?.map(cred => ({
      credentialID: Buffer.from(cred.credential_id, 'base64url'),
      credentialPublicKey: Buffer.from(cred.public_key, 'base64url'),
      counter: cred.counter,
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      deviceType: cred.device_type as CredentialDeviceType,
      backedUp: false,
      backupEligible: false
    })) || []

    const options: GenerateRegistrationOptionsOpts = {
      rpName,
      rpID,
      userID: Buffer.from(userId),
      userName,
      userDisplayName,
      attestationType: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      excludeCredentials: existingDevices.map(device => ({
        id: device.credentialID,
        type: 'public-key' as const,
        transports: device.transports
      })),
      timeout: 60000,
      challengeSize: 32
    }

    const registrationOptions = await generateRegistrationOptions(options)

    return {
      success: true,
      data: registrationOptions
    }

  } catch (error) {
    console.error('[WEBAUTHN] 등록 옵션 생성 실패:', error)
    return {
      success: false,
      error: '등록 옵션 생성에 실패했습니다.'
    }
  }
}

// 사용자 등록 응답 검증
export async function verifyUserRegistrationResponse(userId: string, response: any, expectedChallenge: string) {
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true
    })

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

      // 인증기 정보를 데이터베이스에 저장
      const { data: savedCredential, error: saveError } = await supabaseServer
        .from('biometric_credentials')
        .insert({
          user_id: userId,
          credential_id: Buffer.from(credentialID).toString('base64url'),
          public_key: Buffer.from(credentialPublicKey).toString('base64url'),
          counter: counter,
          device_name: 'Current Device',
          device_type: 'fingerprint',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) {
        console.error('[WEBAUTHN] 인증기 저장 실패:', saveError)
        throw new Error('인증기 저장에 실패했습니다.')
      }

      return {
        success: true,
        data: {
          verified: true,
          credentialId: Buffer.from(credentialID).toString('base64url'),
          counter: counter
        }
      }
    }

    return {
      success: false,
      error: '인증기 등록 검증에 실패했습니다.'
    }

  } catch (error) {
    console.error('[WEBAUTHN] 등록 검증 실패:', error)
    return {
      success: false,
      error: '등록 검증에 실패했습니다.'
    }
  }
}

// 사용자 인증 옵션 생성
export async function generateUserAuthenticationOptions(userId: string) {
  try {
    // 사용자의 등록된 인증기 조회
    const { data: userCredentials, error: fetchError } = await supabaseServer
      .from('biometric_credentials')
      .select('credential_id, public_key, counter, device_name, device_type')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (fetchError) {
      console.error('[WEBAUTHN] 사용자 인증기 조회 실패:', fetchError)
      throw new Error('사용자 인증기 조회에 실패했습니다.')
    }

    if (!userCredentials || userCredentials.length === 0) {
      return {
        success: false,
        error: '등록된 인증기가 없습니다.'
      }
    }

    // 인증기 정보를 AuthenticatorDevice 형식으로 변환
    const userDevices: AuthenticatorDevice[] = userCredentials.map(cred => ({
      credentialID: Buffer.from(cred.credential_id, 'base64url'),
      credentialPublicKey: Buffer.from(cred.public_key, 'base64url'),
      counter: cred.counter,
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      deviceType: cred.device_type as CredentialDeviceType,
      backedUp: false,
      backupEligible: false
    }))

    const options: GenerateAuthenticationOptionsOpts = {
      rpID,
      allowCredentials: userDevices.map(device => ({
        id: device.credentialID,
        type: 'public-key' as const,
        transports: device.transports
      })),
      userVerification: 'required',
      timeout: 60000,
      challengeSize: 32
    }

    const authenticationOptions = await generateAuthenticationOptions(options)

    return {
      success: true,
      data: authenticationOptions
    }

  } catch (error) {
    console.error('[WEBAUTHN] 인증 옵션 생성 실패:', error)
    return {
      success: false,
      error: '인증 옵션 생성에 실패했습니다.'
    }
  }
}

// 사용자 인증 응답 검증
export async function verifyUserAuthenticationResponse(userId: string, response: any, expectedChallenge: string) {
  try {
    // 사용자의 등록된 인증기 조회
    const { data: userCredentials, error: fetchError } = await supabaseServer
      .from('biometric_credentials')
      .select('credential_id, public_key, counter, device_name, device_type')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (fetchError) {
      console.error('[WEBAUTHN] 사용자 인증기 조회 실패:', fetchError)
      throw new Error('사용자 인증기 조회에 실패했습니다.')
    }

    if (!userCredentials || userCredentials.length === 0) {
      return {
        success: false,
        error: '등록된 인증기가 없습니다.'
      }
    }

    // 인증기 정보를 AuthenticatorDevice 형식으로 변환
    const userDevices: AuthenticatorDevice[] = userCredentials.map(cred => ({
      credentialID: Buffer.from(cred.credential_id, 'base64url'),
      credentialPublicKey: Buffer.from(cred.public_key, 'base64url'),
      counter: cred.counter,
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      deviceType: cred.device_type as CredentialDeviceType,
      backedUp: false,
      backupEligible: false
    }))

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: userDevices.find(device => 
        Buffer.from(device.credentialID).toString('base64url') === response.id
      ),
      requireUserVerification: true
    })

    if (verification.verified && verification.authenticationInfo) {
      const { newCounter } = verification.authenticationInfo
      const credentialId = Buffer.from(response.id).toString('base64url')

      // 카운터 업데이트
      await supabaseServer
        .from('biometric_credentials')
        .update({
          counter: newCounter,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('credential_id', credentialId)

      return {
        success: true,
        data: {
          verified: true,
          credentialId: credentialId,
          counter: newCounter
        }
      }
    }

    return {
      success: false,
      error: '인증 검증에 실패했습니다.'
    }

  } catch (error) {
    console.error('[WEBAUTHN] 인증 검증 실패:', error)
    return {
      success: false,
      error: '인증 검증에 실패했습니다.'
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
  return {
    isSupported: typeof window !== 'undefined' && !!window.PublicKeyCredential,
    features: {
      platformAuthenticator: typeof window !== 'undefined' && 
        !!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable,
      conditionalMediation: typeof window !== 'undefined' && 
        !!window.PublicKeyCredential?.isConditionalMediationAvailable,
      largeBlob: typeof window !== 'undefined' && 
        !!window.PublicKeyCredential?.isLargeBlobSupported
    }
  }
}
