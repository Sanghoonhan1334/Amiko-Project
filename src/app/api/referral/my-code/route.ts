import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 나의 추천인 코드 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 추천인 코드 조회
    console.log('[REFERRAL CODE] UserId:', userId)
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('user_id', userId)
      .single()

    console.log('[REFERRAL CODE] Result:', { referral, referralError })

    if (referralError || !referral) {
      return NextResponse.json(
        { 
          error: '추천인 코드를 찾을 수 없습니다.',
          details: referralError?.message 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      referral_code: referral.referral_code
    })

  } catch (error) {
    console.error('추천인 코드 조회 오류:', error)
    return NextResponse.json(
      { error: '추천인 코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

