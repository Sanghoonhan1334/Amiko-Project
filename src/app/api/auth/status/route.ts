import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    // DB에서 사용자 정보 조회
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email_verified, phone_verified')
      .eq('id', userId)
      .single()

    // 사용자가 없으면 미인증으로 처리 (404 대신 200 반환)
    if (userError || !userData) {
      return NextResponse.json(
        { success: true, emailVerified: false, smsVerified: false },
        { status: 200 }
      )
    }

    // 인증 상태 반환
    return NextResponse.json(
      { 
        success: true, 
        emailVerified: userData.email_verified || false, 
        smsVerified: userData.phone_verified || false 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[AUTH_STATUS] 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}