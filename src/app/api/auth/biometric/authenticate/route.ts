import { NextRequest, NextResponse } from 'next/server'
import { generateUserAuthenticationOptions } from '@/lib/webauthn'

// 지문 인증 옵션 생성
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = await generateUserAuthenticationOptions(userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[WEBAUTHN_AUTHENTICATE] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 옵션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
