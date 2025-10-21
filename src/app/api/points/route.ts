import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[POINTS API] GET 요청 시작')
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('[POINTS API] userId:', userId)

    if (!userId) {
      console.log('[POINTS API] userId가 없음')
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()
    console.log('[POINTS API] Supabase 클라이언트 생성됨')

    // 사용자 포인트 조회
    console.log('[POINTS API] user_points 테이블에서 조회 시작')
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('available_points, total_points, updated_at')
      .eq('user_id', userId)
      .single()

    if (pointsError) {
      console.error('[POINTS API] 포인트 조회 오류:', pointsError)
      console.error('[POINTS API] 오류 코드:', pointsError.code)
      console.error('[POINTS API] 오류 메시지:', pointsError.message)
      
      // 사용자 포인트가 없는 경우 기본값으로 생성
      if (pointsError.code === 'PGRST116') {
        console.log('[POINTS API] 사용자 포인트 없음, 새로 생성 시도')
        
        // 먼저 users 테이블에 사용자가 존재하는지 확인
        const { data: userExists, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single()

        if (userCheckError || !userExists) {
          console.log('[POINTS API] users 테이블에 사용자가 존재하지 않음, 더미 데이터 반환')
          return NextResponse.json({
            userId,
            userPoints: { available_points: 0, total_points: 0, updated_at: new Date().toISOString() },
            totalPoints: 0,
            availablePoints: 0,
            lastUpdated: new Date().toISOString(),
            isDummy: true,
            reason: 'User not found in users table'
          })
        }
        
        const { data: newUserPoints, error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            available_points: 0,
            total_points: 0
          })
          .select('available_points, total_points, updated_at')
          .single()

        if (insertError) {
          console.error('[POINTS API] 포인트 초기화 오류:', insertError)
          
          // Foreign Key 제약 조건 위반인 경우 더미 데이터 반환
          if (insertError.code === '23503') {
            console.log('[POINTS API] Foreign Key 제약 조건 위반, 더미 데이터 반환')
            return NextResponse.json({
              userId,
              userPoints: { available_points: 0, total_points: 0, updated_at: new Date().toISOString() },
              totalPoints: 0,
              availablePoints: 0,
              lastUpdated: new Date().toISOString(),
              isDummy: true,
              reason: 'Foreign key constraint violation'
            })
          }
          
          return NextResponse.json(
            { 
              error: '포인트 초기화 중 오류가 발생했습니다.',
              details: insertError.message,
              code: insertError.code
            },
            { status: 500 }
          )
        }

        console.log('[POINTS API] 포인트 초기화 성공:', newUserPoints)
        return NextResponse.json({
          userId,
          userPoints: newUserPoints,
          totalPoints: newUserPoints.total_points,
          availablePoints: newUserPoints.available_points,
          lastUpdated: newUserPoints.updated_at
        })
      }

      // 테이블이 존재하지 않는 경우 더미 데이터 반환
      if (pointsError.code === '42P01') {
        console.log('[POINTS API] user_points 테이블이 존재하지 않음, 더미 데이터 반환')
        return NextResponse.json({
          userId,
          userPoints: { available_points: 0, total_points: 0, updated_at: new Date().toISOString() },
          totalPoints: 0,
          availablePoints: 0,
          lastUpdated: new Date().toISOString(),
          isDummy: true
        })
      }

      return NextResponse.json(
        { 
          error: '포인트 조회 중 오류가 발생했습니다.',
          details: pointsError.message,
          code: pointsError.code
        },
        { status: 500 }
      )
    }

    console.log('[POINTS API] 포인트 조회 성공:', userPoints)
    return NextResponse.json({
      userId,
      userPoints,
      totalPoints: userPoints.total_points,
      availablePoints: userPoints.available_points,
      lastUpdated: userPoints.updated_at
    })

  } catch (error) {
    console.error('[POINTS API] 예상치 못한 오류:', error)
    return NextResponse.json(
      { 
        error: '포인트 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}