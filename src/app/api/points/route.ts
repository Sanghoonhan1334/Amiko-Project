import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 포인트 시스템 설정
const POINT_SYSTEM = {
  korean: {
    question: 5,
    answer: 5,
    story: 5,
    freeboard: 2,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  },
  latin: {
    question: 5,
    answer: 5,
    story: 5,
    freeboard: 2,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  }
}

// 사용자 포인트 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[POINTS API] 포인트 조회 실패:', pointsError)
      return NextResponse.json(
        { error: '포인트 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 히스토리 조회
    const { data: pointHistory, error: historyError } = await supabaseServer
      .from('point_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('[POINTS API] 히스토리 조회 실패:', historyError)
      return NextResponse.json(
        { error: '포인트 히스토리 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 프로필 조회 (한국인 여부 확인)
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('is_korean')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[POINTS API] 프로필 조회 실패:', profileError)
      return NextResponse.json(
        { error: '사용자 프로필 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    const isKorean = (profile as any)?.is_korean || false
    const pointConfig = POINT_SYSTEM[isKorean ? 'korean' : 'latin']

    return NextResponse.json({
      points: userPoints || {
        total_points: 0,
        daily_points: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      },
      history: pointHistory || [],
      config: pointConfig
    })

  } catch (error) {
    console.error('[POINTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 포인트 획득
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { userId, activityType, refId, description } = await request.json()

    // 입력 검증
    if (!userId || !activityType) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['question', 'answer', 'story', 'freeboard', 'reaction', 'consultation'].includes(activityType)) {
      return NextResponse.json(
        { error: '잘못된 활동 타입입니다.' },
        { status: 400 }
      )
    }

    // 사용자 프로필 조회 (한국인 여부 확인)
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('is_korean')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[POINTS API] 프로필 조회 실패:', profileError)
      return NextResponse.json(
        { error: '사용자 프로필 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    const isKorean = (profile as any)?.is_korean || false
    const pointConfig = POINT_SYSTEM[isKorean ? 'korean' : 'latin']
    const pointsToAdd = pointConfig[activityType as keyof typeof pointConfig]

    if (!pointsToAdd) {
      return NextResponse.json(
        { error: '잘못된 활동 타입입니다.' },
        { status: 400 }
      )
    }

    // 사용자 포인트 조회 또는 생성
    const { data: userPoints, error: pointsError } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code === 'PGRST116') {
      // 포인트 레코드가 없으면 생성
      const { data: newPoints, error: createError } = await supabaseServer
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: 0,
          daily_points: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (createError) {
        console.error('[POINTS API] 포인트 생성 실패:', createError)
        return NextResponse.json(
          { error: '포인트 생성에 실패했습니다.' },
          { status: 500 }
        )
      }

      userPoints = newPoints
    } else if (pointsError) {
      console.error('[POINTS API] 포인트 조회 실패:', pointsError)
      return NextResponse.json(
        { error: '포인트 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 일일 한도 확인
    const today = new Date().toISOString().split('T')[0]
    const lastResetDate = userPoints.last_reset_date

    // 날짜가 바뀌었으면 일일 포인트 리셋
    if (lastResetDate !== today) {
      userPoints.daily_points = 0
      userPoints.last_reset_date = today
    }

    // 일일 한도 초과 확인
    if (userPoints.daily_points + pointsToAdd > pointConfig.dailyLimit) {
      return NextResponse.json(
        { 
          error: `오늘 포인트 한도를 초과했습니다. (일일 최대 ${pointConfig.dailyLimit}점)`,
          remainingLimit: pointConfig.dailyLimit - userPoints.daily_points
        },
        { status: 400 }
      )
    }

    // 포인트 업데이트
    const newTotalPoints = userPoints.total_points + pointsToAdd
    const newDailyPoints = userPoints.daily_points + pointsToAdd

    const { error: updateError } = await supabaseServer
      .from('user_points')
      .update({
        total_points: newTotalPoints,
        daily_points: newDailyPoints,
        last_reset_date: today
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('[POINTS API] 포인트 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '포인트 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 히스토리 추가
    const { error: historyError } = await supabaseServer
      .from('point_history')
      .insert({
        user_id: userId,
        activity_type: activityType,
        points: pointsToAdd,
        description: description || `${activityType} 활동`,
        ref_id: refId || null
      })

    if (historyError) {
      console.error('[POINTS API] 히스토리 추가 실패:', historyError)
      // 히스토리 추가 실패해도 포인트는 이미 업데이트됨
    }

    return NextResponse.json({
      success: true,
      pointsAdded: pointsToAdd,
      totalPoints: newTotalPoints,
      dailyPoints: newDailyPoints,
      remainingLimit: pointConfig.dailyLimit - newDailyPoints
    })

  } catch (error) {
    console.error('[POINTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
