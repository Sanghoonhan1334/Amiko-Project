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

    // 사용자 프로필 조회 (포인트 정보 포함)
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('total_points, level, experience_points, is_korean')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[POINTS API] 프로필 조회 실패:', profileError)
      return NextResponse.json(
        { error: '사용자 프로필 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 히스토리 조회
    const { data: pointHistory, error: historyError } = await supabaseServer
      .from('points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (historyError) {
      console.error('[POINTS API] 히스토리 조회 실패:', historyError)
      return NextResponse.json(
        { error: '포인트 히스토리 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 오늘 적립된 포인트 계산
    const today = new Date().toISOString().split('T')[0]
    const todayPoints = pointHistory
      ?.filter(point => point.created_at.startsWith(today) && point.amount > 0)
      .reduce((sum, point) => sum + point.amount, 0) || 0

    const isKorean = profile?.is_korean || false
    const pointConfig = POINT_SYSTEM[isKorean ? 'korean' : 'latin']

    return NextResponse.json({
      points: {
        total_points: profile?.total_points || 0,
        daily_points: todayPoints,
        level: profile?.level || 1,
        experience_points: profile?.experience_points || 0,
        remaining_limit: Math.max(0, pointConfig.dailyLimit - todayPoints)
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

// 포인트 수동 적립 (관리자용)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { userId, type, amount, description, relatedId, relatedType } = await request.json()

    // 입력 검증
    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 인증 확인 (관리자만 수동 포인트 적립 가능)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: adminUser, error: adminError } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 포인트 적립 함수 호출
    const { error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
      p_user_id: userId,
      p_type: type,
      p_amount: amount,
      p_description: description || '관리자 수동 적립',
      p_related_id: relatedId || null,
      p_related_type: relatedType || null
    })

    if (pointError) {
      console.error('[POINTS API] 포인트 적립 실패:', pointError)
      return NextResponse.json(
        { error: '포인트 적립에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '포인트가 성공적으로 적립되었습니다.',
      pointsAdded: amount
    })

  } catch (error) {
    console.error('[POINTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
