import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuthenticationResponse } from '@/lib/webauthn'

// 지문 인증 응답 검증
export async function POST(request: NextRequest) {
  try {
    const { userId, response, expectedChallenge } = await request.json()

    if (!userId || !response || !expectedChallenge) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const result = await verifyUserAuthenticationResponse(userId, response, expectedChallenge)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '지문 인증이 완료되었습니다.',
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[WEBAUTHN_VERIFY_AUTHENTICATE] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
