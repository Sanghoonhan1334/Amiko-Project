import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 포인트 시스템 테스트 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 1. 사용자 포인트 정보 조회
    const { data: pointsSummary, error: summaryError } = await supabase
      .rpc('get_user_points_summary', { p_user_id: userId })

    if (summaryError) {
      console.error('포인트 요약 조회 실패:', summaryError)
    }

    // 2. 포인트 히스토리 조회 (최근 10개)
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('포인트 히스토리 조회 실패:', historyError)
    }

    // 3. 일일 한도 정보 조회
    const { data: dailyLimit, error: limitError } = await supabase
      .from('daily_points_limit')
      .select('*')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    if (limitError && limitError.code !== 'PGRST116') {
      console.error('일일 한도 조회 실패:', limitError)
    }

    // 4. 랭킹 정보 조회
    const { data: ranking, error: rankingError } = await supabase
      .rpc('get_points_ranking', { p_limit: 5 })

    if (rankingError) {
      console.error('랭킹 조회 실패:', rankingError)
    }

    return NextResponse.json({
      success: true,
      userId,
      pointsSummary: pointsSummary?.[0] || null,
      pointsHistory: pointsHistory || [],
      dailyLimit: dailyLimit || null,
      topRanking: ranking || [],
      testResults: {
        pointsSummaryWorking: !summaryError,
        pointsHistoryWorking: !historyError,
        dailyLimitWorking: !limitError || limitError.code === 'PGRST116',
        rankingWorking: !rankingError
      }
    })

  } catch (error) {
    console.error('포인트 시스템 테스트 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 포인트 테스트 지급 API
export async function POST(request: NextRequest) {
  try {
    const { userId, amount = 10, type = 'test_points', description = '테스트 포인트 지급' } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 테스트 포인트 지급
    const { data: result, error: pointError } = await supabase
      .rpc('add_points_with_limit', {
        p_user_id: userId,
        p_type: type,
        p_amount: amount,
        p_description: description,
        p_related_id: null,
        p_related_type: null
      })

    if (pointError) {
      console.error('테스트 포인트 지급 실패:', pointError)
      return NextResponse.json(
        { error: '포인트 지급 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { 
          error: '일일 포인트 한도를 초과했습니다.',
          maxPoints: 20
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      amount,
      message: '테스트 포인트가 성공적으로 지급되었습니다.'
    })

  } catch (error) {
    console.error('테스트 포인트 지급 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
