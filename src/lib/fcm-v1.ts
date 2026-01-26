/**
 * FCM HTTP v1 API 유틸리티
 * Firebase SDK나 Firebase Admin을 사용하지 않고, 순수 OAuth 2.0 + HTTP v1 API만 사용
 */

import { createSign } from 'crypto'

/**
 * Google Cloud 서비스 계정 정보 인터페이스
 */
interface ServiceAccount {
  project_id: string
  private_key: string
  client_email: string
}

/**
 * OAuth 2.0 Access Token 생성
 * JWT를 사용하여 Google OAuth 2.0 access token을 동적으로 생성
 */
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  // JWT 헤더
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  // JWT 클레임
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1시간 유효
    iat: now
  }

  // JWT 서명 생성
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Claim = Buffer.from(JSON.stringify(claim)).toString('base64url')
  const signatureInput = `${base64Header}.${base64Claim}`

  // RSA-SHA256 서명
  const sign = createSign('RSA-SHA256')
  sign.update(signatureInput)
  sign.end()

  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n')
  const signature = sign.sign(privateKey, 'base64url')

  const jwt = `${signatureInput}.${signature}`

  // OAuth 2.0 토큰 요청
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text()
    throw new Error(`OAuth 2.0 토큰 요청 실패: ${tokenResponse.status} ${errorData}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

/**
 * 서비스 계정 정보 로드
 * 환경변수에서 서비스 계정 정보를 로드하거나 JSON 파일에서 읽음
 */
function loadServiceAccount(): ServiceAccount {
  // 방법 1: 환경변수에서 직접 로드
  if (
    process.env.FCM_PROJECT_ID &&
    process.env.FCM_PRIVATE_KEY &&
    process.env.FCM_CLIENT_EMAIL
  ) {
    return {
      project_id: process.env.FCM_PROJECT_ID,
      private_key: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FCM_CLIENT_EMAIL
    }
  }

  // 방법 2: JSON 파일 경로가 제공된 경우
  if (process.env.FCM_SERVICE_ACCOUNT_JSON_PATH) {
    const fs = require('fs')
    const path = require('path')
    const jsonPath = path.resolve(process.env.FCM_SERVICE_ACCOUNT_JSON_PATH)
    const jsonContent = fs.readFileSync(jsonPath, 'utf8')
    return JSON.parse(jsonContent)
  }

  // 방법 3: JSON 문자열로 제공된 경우
  if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON)
  }

  throw new Error(
    'FCM 서비스 계정 정보가 설정되지 않았습니다. ' +
    '환경변수 FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL 또는 ' +
    'FCM_SERVICE_ACCOUNT_JSON을 설정해주세요.'
  )
}

/**
 * FCM HTTP v1 API로 푸시 알림 발송
 * @param deviceToken FCM 디바이스 토큰
 * @param title 알림 제목
 * @param body 알림 내용
 * @param data 추가 데이터 (선택사항)
 * @returns 발송 결과
 */
export async function sendFCMv1Notification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: string }> {
  try {
    // 서비스 계정 정보 로드
    const serviceAccount = loadServiceAccount()

    // OAuth 2.0 access token 생성
    const accessToken = await getAccessToken(serviceAccount)

    // FCM v1 API 엔드포인트
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    // FCM v1 메시지 페이로드
    const message = {
      message: {
        token: deviceToken,
        notification: {
          title,
          body
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ) : undefined,
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        }
      }
    }

    // FCM v1 API 호출
    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      let errorData: any = await response.text()
      try {
        errorData = JSON.parse(errorData)
      } catch (e) {
        // If parsing fails, keep as string
      }

      console.error('❌ FCM v1 API 호출 실패:', response.status, errorData)

      // Extract FCM error code
      let errorCode = 'UNKNOWN'
      if (typeof errorData === 'object' && errorData?.error?.details) {
        const detail = errorData.error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.firebase.fcm.v1.FcmError')
        if (detail?.errorCode) {
          errorCode = detail.errorCode
        }
      }

      return {
        success: false,
        error: `FCM 발송 실패: ${response.status} ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`,
        errorCode
      }
    }

    const result = await response.json()
    console.log('✅ FCM v1 푸시 알림 발송 성공:', result.name)

    return {
      success: true,
      messageId: result.name
    }

  } catch (error) {
    console.error('❌ FCM v1 푸시 알림 발송 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      errorCode: 'UNKNOWN'
    }
  }
}

/**
 * 여러 디바이스에 배치로 푸시 알림 발송
 * @param deviceTokens FCM 디바이스 토큰 배열
 * @param title 알림 제목
 * @param body 알림 내용
 * @param data 추가 데이터 (선택사항)
 * @returns 발송 결과 배열
 */
export async function sendFCMv1BatchNotifications(
  deviceTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<Array<{ token: string; success: boolean; messageId?: string; error?: string; errorCode?: string }>> {
  const results = await Promise.allSettled(
    deviceTokens.map(token =>
      sendFCMv1Notification(token, title, body, data).then(result => ({
        token,
        ...result
      }))
    )
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        token: deviceTokens[index],
        success: false,
        error: result.reason?.message || '알 수 없는 오류',
        errorCode: 'UNKNOWN'
      }
    }
  })
}

