import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 포인트 사용 API
export async function POST(request: NextRequest) {
  try {
    // Supabase 클라이언트 생성 및 세션 검증 (IDOR 방지)
    const supabase = createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // userId는 항상 세션 토큰에서 추출 — body의 userId는 무시 (IDOR 방지)
    const authenticatedUserId = session.user.id

    const { amount, description, relatedId, relatedType } = await request.json()

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'amount, description이 필요합니다.' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: '사용할 포인트는 0보다 커야 합니다.' },
        { status: 400 }
      )
    }

    // 통합 포인트 사용 함수 호출
    const { data: result, error: useError } = await supabase
      .rpc('use_points', {
        p_user_id: authenticatedUserId,
        p_amount: amount,
        p_description: description,
        p_related_id: relatedId,
        p_related_type: relatedType
      })

    if (useError) {
      console.error('포인트 사용 실패:', useError)
      return NextResponse.json(
        { error: '포인트 사용 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { 
          error: '포인트가 부족합니다.',
          requiredAmount: amount
        },
        { status: 400 }
      )
    }

    // 사용 후 포인트 정보 조회
    const { data: pointsData, error: pointsError } = await supabase
      .rpc('get_user_points_summary', { p_user_id: authenticatedUserId })

    if (pointsError) {
      console.error('포인트 정보 조회 실패:', pointsError)
    }

    return NextResponse.json({
      success: true,
      usedAmount: amount,
      remainingPoints: pointsData?.[0]?.available_points || 0,
      message: '포인트가 성공적으로 사용되었습니다.'
    })

  } catch (error) {
    console.error('포인트 사용 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
