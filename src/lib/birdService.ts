// =====================================================
// Bird (MessageBird) SMS 발송 서비스
// Description: Chile 등 특정 국가를 위한 Bird API 연동
// Date: 2025-01-25
// =====================================================

interface BirdSMSResponse {
  id?: string
  status?: string
  error?: {
    code: number
    description: string
  }
}

interface BirdSMSError {
  errors: Array<{
    code: number
    description: string
    parameter?: string
  }>
}

/**
 * Bird API로 SMS 발송
 * @param to 수신자 전화번호 (E.164 형식, 예: +56912345678)
 * @param message 발송할 메시지
 * @returns 발송 성공 여부
 */
export async function sendBirdSMS(to: string, message: string): Promise<boolean> {
  try {
    const apiKey = process.env.BIRD_API_KEY
    const senderId = process.env.BIRD_SENDER_ID || 'AMIKO'

    if (!apiKey) {
      console.error('[BIRD_SMS] ❌ BIRD_API_KEY가 설정되지 않았습니다.')
      return false
    }

    console.log(`[BIRD_SMS] ========================================`)
    console.log(`[BIRD_SMS] 🚀 발송 시도 시작`)
    console.log(`[BIRD_SMS] 받는번호: ${to}`)
    console.log(`[BIRD_SMS] 발신자 ID: ${senderId}`)
    console.log(`[BIRD_SMS] 메시지: ${message}`)

    // Bird API 엔드포인트
    const apiUrl = 'https://rest.messagebird.com/messages'

    // 요청 본문
    const requestBody = {
      recipients: [to],
      originator: senderId,
      body: message
    }

    console.log(`[BIRD_SMS] API 요청:`, {
      url: apiUrl,
      method: 'POST',
      recipient: to,
      originator: senderId,
      messageLength: message.length
    })

    // Bird API 호출
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseData = await response.json()

    if (!response.ok) {
      const error = responseData as BirdSMSError
      console.error('[BIRD_SMS] ========================================')
      console.error('[BIRD_SMS] ❌ 발송 실패!')
      console.error('[BIRD_SMS] HTTP 상태:', response.status)
      console.error('[BIRD_SMS] 에러 응답:', error)
      
      if (error.errors && error.errors.length > 0) {
        error.errors.forEach((err, index) => {
          console.error(`[BIRD_SMS] 에러 ${index + 1}:`, {
            code: err.code,
            description: err.description,
            parameter: err.parameter
          })
        })
      }
      console.error('[BIRD_SMS] ========================================')
      return false
    }

    const successData = responseData as BirdSMSResponse
    console.log(`[BIRD_SMS] 발송 성공:`, {
      id: successData.id,
      status: successData.status,
      recipient: to
    })
    console.log(`[BIRD_SMS] ========================================`)
    
    return true

  } catch (error: any) {
    console.error('[BIRD_SMS] ========================================')
    console.error('[BIRD_SMS] ❌ 발송 실패!')
    console.error('[BIRD_SMS] 받는번호:', to)
    console.error('[BIRD_SMS] 에러 타입:', error?.constructor?.name)
    console.error('[BIRD_SMS] 에러 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    })
    console.error('[BIRD_SMS] ========================================')
    return false
  }
}

/**
 * Bird API 계정 정보 확인
 * @returns 계정 유효성 및 정보
 */
export async function verifyBirdAccount(): Promise<{
  isValid: boolean
  balance?: number
  error?: string
}> {
  try {
    const apiKey = process.env.BIRD_API_KEY

    if (!apiKey) {
      return {
        isValid: false,
        error: 'BIRD_API_KEY가 설정되지 않았습니다.'
      }
    }

    // Bird API 계정 정보 조회 엔드포인트
    const apiUrl = 'https://rest.messagebird.com/balance'

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `AccessKey ${apiKey}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        isValid: false,
        error: errorData.errors?.[0]?.description || '계정 확인 실패'
      }
    }

    const data = await response.json()
    return {
      isValid: true,
      balance: data.amount || 0
    }

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

