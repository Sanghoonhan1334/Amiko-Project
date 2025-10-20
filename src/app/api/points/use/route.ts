import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 포인트 사용 API
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, description, relatedId, relatedType } = await request.json()

    if (!userId || !amount || !description) {
      return NextResponse.json(
        { error: 'userId, amount, description이 필요합니다.' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: '사용할 포인트는 0보다 커야 합니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 통합 포인트 사용 함수 호출
    const { data: result, error: useError } = await supabase
      .rpc('use_points', {
        p_user_id: userId,
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
      .rpc('get_user_points_summary', { p_user_id: userId })

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
