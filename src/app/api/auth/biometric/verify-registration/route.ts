import { NextRequest, NextResponse } from 'next/server'
import { verifyUserRegistrationResponse } from '@/lib/webauthn'

// 지문 인증 등록 응답 검증
export async function POST(request: NextRequest) {
  try {
    const { userId, response, expectedChallenge } = await request.json()

    if (!userId || !response || !expectedChallenge) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const result = await verifyUserRegistrationResponse(userId, response, expectedChallenge)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '지문 인증이 등록되었습니다.',
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[WEBAUTHN_VERIFY_REGISTER] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 등록 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
