import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer || !supabaseClient) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 세션 검증 — userId는 항상 토큰에서 추출 (IDOR + 개인정보 유출 방지)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = user.id

    console.log('[MY_REFERRALS] 조회 시작:', userId)

    // 현재 사용자의 referral_code 가져오기
    const { data: myReferral, error: referralError } = await supabaseServer
      .from('referrals')
      .select('referral_code')
      .eq('user_id', userId)
      .single()

    if (referralError || !myReferral) {
      console.log('[MY_REFERRALS] 추천인 코드 없음:', referralError?.message)
      return NextResponse.json({
        referralCode: null,
        myReferrals: [],
        totalCount: 0
      })
    }

    console.log('[MY_REFERRALS] 추천인 코드:', myReferral.referral_code)

    // 자신의 코드로 가입한 사람들 조회 (referred_by가 현재 사용자)
    const { data: referrals, error: referralsError } = await supabaseServer
      .from('referrals')
      .select(`
        id,
        user_id,
        created_at,
        users:user_id (
          id,
          full_name,
          email,
          nickname
        )
      `)
      .eq('referred_by', userId)
      .order('created_at', { ascending: false })

    if (referralsError) {
      console.error('[MY_REFERRALS] 조회 오류:', referralsError)
      return NextResponse.json(
        { error: '추천인 현황을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[MY_REFERRALS] 추천인 수:', referrals?.length || 0)

    return NextResponse.json({
      referralCode: myReferral.referral_code,
      myReferrals: referrals?.map((ref: any) => ({
        id: ref.id,
        userId: ref.user_id,
        joinedAt: ref.created_at,
        user: {
          id: ref.users?.id || ref.user_id,
          fullName: ref.users?.full_name || '익명',
          email: ref.users?.email || '',
          nickname: ref.users?.nickname || '익명'
        }
      })) || [],
      totalCount: referrals?.length || 0
    })

  } catch (error: any) {
    console.error('[MY_REFERRALS] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

