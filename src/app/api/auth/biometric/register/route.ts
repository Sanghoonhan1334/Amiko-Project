import { NextRequest, NextResponse } from 'next/server'
import { generateUserRegistrationOptions, verifyUserRegistrationResponse } from '@/lib/webauthn'

// 지문 인증 등록 옵션 생성
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, userDisplayName } = await request.json()
    
    console.log('[WEBAUTHN_REGISTER] 요청 파라미터:', { userId, userName, userDisplayName })

    if (!userId || !userName || !userDisplayName) {
      console.error('[WEBAUTHN_REGISTER] 필수 정보 누락')
      return NextResponse.json({
        success: false,
        error: '필수 정보가 누락되었습니다.'
      }, { status: 400 })
    }

    const result = await generateUserRegistrationOptions(userId, userName, userDisplayName)
    
    console.log('[WEBAUTHN_REGISTER] 생성 결과:', { 
      success: result.success, 
      hasData: !!result.data,
      error: result.error 
    })

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      console.error('[WEBAUTHN_REGISTER] 생성 실패:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || '등록 옵션 생성에 실패했습니다.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[WEBAUTHN_REGISTER] 오류:', error)
    return NextResponse.json({
      success: false,
      error: '지문 인증 등록 옵션 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
