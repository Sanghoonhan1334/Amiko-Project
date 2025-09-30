import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 인증 상태 업데이트 API
export async function POST(request: NextRequest) {
  try {
    const { userId, isPhoneVerified, isEmailVerified } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[AUTH_UPDATE_STATUS] 인증 상태 업데이트 요청:', {
      userId,
      isPhoneVerified,
      isEmailVerified
    })

    // users 테이블의 인증 상태 업데이트
    const updateData: any = {}
    if (isPhoneVerified !== undefined) {
      updateData.is_phone_verified = isPhoneVerified
    }
    if (isEmailVerified !== undefined) {
      updateData.is_email_verified = isEmailVerified
    }

    const { data, error } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      console.error('[AUTH_UPDATE_STATUS] 업데이트 실패:', error)
      return NextResponse.json(
        { error: '인증 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[AUTH_UPDATE_STATUS] 업데이트 성공:', data)

    return NextResponse.json({
      success: true,
      message: '인증 상태가 업데이트되었습니다.',
      data: data[0]
    })

  } catch (error) {
    console.error('[AUTH_UPDATE_STATUS] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
