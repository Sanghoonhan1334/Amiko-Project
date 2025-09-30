import { NextRequest, NextResponse } from 'next/server'
import { generateUserRegistrationOptions, verifyUserRegistrationResponse } from '@/lib/webauthn'

// 지문 인증 등록 옵션 생성
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, userDisplayName } = await request.json()

    if (!userId || !userName || !userDisplayName) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const result = await generateUserRegistrationOptions(userId, userName, userDisplayName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[WEBAUTHN_REGISTER] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 등록 옵션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
