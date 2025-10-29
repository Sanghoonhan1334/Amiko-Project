import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 전체 누적 포인트 랭킹 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // user_points만 먼저 조회
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('user_id, total_points, monthly_points, available_points')
      .order('total_points', { ascending: false })
      .limit(100)

    if (pointsError) {
      console.error('포인트 데이터 조회 오류:', pointsError)
      throw pointsError
    }

    // users 데이터는 별도로 조회
    const userIds = pointsData?.map(p => p.user_id) || []
    console.log('[TOTAL RANKING] 조회할 user_ids:', userIds)
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)
    
    console.log('[TOTAL RANKING] users 조회 결과:', { usersData, usersError })

    // 데이터 병합
    const data = pointsData?.map(point => ({
      ...point,
      users: usersData?.find(u => u.id === point.user_id)
    })) || []
    
    // 데이터가 없는 경우 처리
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        ranking: []
      })
    }

    // 랭킹 포맷팅
    const ranking = data.map((item: any, index: number) => {
      // full_name이 없으면 이메일의 @ 앞부분 사용
      let userName = item.users?.full_name;
      if (!userName && item.users?.email) {
        userName = item.users.email.split('@')[0];
      }
      if (!userName) {
        userName = '익명';
      }

      return {
        userId: item.user_id,
        userName,
        userEmail: item.users?.email || '',
        totalPoints: item.total_points || 0,
        monthlyPoints: item.monthly_points || 0,
        availablePoints: item.available_points || 0,
        rank: index + 1
      }
    })

    return NextResponse.json({
      success: true,
      ranking
    })

  } catch (error: any) {
    console.error('랭킹 조회 오류:', error)
    // 테이블이 없거나 데이터가 없는 경우 빈 배열 반환
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        ranking: []
      })
    }
    return NextResponse.json(
      { error: '랭킹 조회 중 오류가 발생했습니다.', details: error?.message },
      { status: 500 }
    )
  }
}

