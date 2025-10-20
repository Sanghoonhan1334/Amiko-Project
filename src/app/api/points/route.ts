import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('available_points, total_points, updated_at')
      .eq('user_id', userId)
      .single()

    if (pointsError) {
      console.error('포인트 조회 오류:', pointsError)
      
      // 사용자 포인트가 없는 경우 기본값으로 생성
      if (pointsError.code === 'PGRST116') {
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
          console.error('포인트 초기화 오류:', insertError)
          return NextResponse.json(
            { error: '포인트 초기화 중 오류가 발생했습니다.' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          userId,
          userPoints: newUserPoints,
          totalPoints: newUserPoints.total_points,
          availablePoints: newUserPoints.available_points,
          lastUpdated: newUserPoints.updated_at
        })
      }

      return NextResponse.json(
        { error: '포인트 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userId,
      userPoints,
      totalPoints: userPoints.total_points,
      availablePoints: userPoints.available_points,
      lastUpdated: userPoints.updated_at
    })

  } catch (error) {
    console.error('포인트 조회 오류:', error)
    return NextResponse.json(
      { error: '포인트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}