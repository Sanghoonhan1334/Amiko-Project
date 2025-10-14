import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabaseServer'

// 포인트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('[POINTS_API] 요청 받음:', { userId })
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!supabaseClient) {
      console.log('[POINTS_API] Supabase 클라이언트 없음, Mock 데이터 반환')
      const mockPoints = {
        userPoints: {
          available_points: 0,
          total_points: 0
        },
        pointsHistory: [],
        ranking: {
          position: null,
          totalUsers: 100
        }
      }
      return NextResponse.json(mockPoints)
    }

    const supabase = supabaseClient

    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('available_points, total_points')
      .eq('user_id', userId)
      .single()

    if (pointsError) {
      console.log('[POINTS_API] 포인트 조회 실패:', pointsError)
      // 포인트가 없는 경우 기본값 반환
      const defaultPoints = {
        userPoints: {
          available_points: 0,
          total_points: 0
        },
        pointsHistory: [],
        ranking: {
          position: null,
          totalUsers: 100
        }
      }
      return NextResponse.json(defaultPoints)
    }

    // 포인트 히스토리 조회 (최근 10개)
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('id, points, type, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.log('[POINTS_API] 포인트 히스토리 조회 실패:', historyError)
    }

    // 랭킹 조회 (총 사용자 수와 현재 사용자 순위)
    const { data: ranking, error: rankingError } = await supabase
      .from('user_points')
      .select('user_id, total_points')
      .order('total_points', { ascending: false })

    let userRank = null
    let totalUsers = 0

    if (!rankingError && ranking) {
      totalUsers = ranking.length
      const userRankIndex = ranking.findIndex(item => item.user_id === userId)
      if (userRankIndex !== -1) {
        userRank = userRankIndex + 1
      }
    }

    const result = {
      userPoints: userPoints || { available_points: 0, total_points: 0 },
      pointsHistory: pointsHistory || [],
      ranking: {
        position: userRank,
        totalUsers: totalUsers
      }
    }
    
    console.log('[POINTS_API] 포인트 데이터 반환:', result)
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('[POINTS_API] 포인트 조회 중 오류:', error)
    // 에러 발생 시에도 기본값 반환 (500 대신 200)
    const defaultPoints = {
      userPoints: {
        available_points: 0,
        total_points: 0
      },
      pointsHistory: [],
      ranking: {
        position: null,
        totalUsers: 100
      }
    }
    return NextResponse.json(defaultPoints)
  }
}

// 포인트 추가/차감
export async function POST(request: NextRequest) {
  try {
    const { userId, points, type, description, relatedId } = await request.json()
    
    if (!userId || !points || !type) {
      return NextResponse.json(
        { error: 'userId, points, and type are required' },
        { status: 400 }
      )
    }

    if (!supabaseClient) {
      console.log('[POINTS_API] Supabase 클라이언트 없음, Mock 처리')
      const mockHistoryData = {
        id: `history_${Date.now()}`,
        user_id: userId,
        points: points,
        type: type,
        description: description,
        related_id: relatedId,
        created_at: new Date().toISOString()
      }
      
      return NextResponse.json({
        success: true,
        pointsHistory: mockHistoryData
      })
    }

    const supabase = supabaseClient

    // 포인트 히스토리에 추가 (트리거가 자동으로 user_points 테이블 업데이트)
    const { data: historyData, error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        points: points,
        type: type,
        description: description,
        related_id: relatedId
      })
      .select()
      .single()

    if (historyError) {
      console.error('[POINTS_API] 포인트 히스토리 추가 실패:', historyError)
      return NextResponse.json(
        { error: 'Failed to add points history' },
        { status: 500 }
      )
    }

    console.log('[POINTS_API] 포인트 추가 성공:', historyData)
    
    return NextResponse.json({
      success: true,
      pointsHistory: historyData
    })

  } catch (error) {
    console.error('Points update error:', error)
    return NextResponse.json(
      { error: 'Failed to update points' },
      { status: 500 }
    )
  }
}