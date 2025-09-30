import { NextRequest, NextResponse } from 'next/server'

// 포인트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('[POINTS_API] 요청 받음:', { userId })
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 임시로 포인트 데이터 반환 (테스트용)
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
    
    console.log('[POINTS_API] Mock 포인트 데이터 반환:', mockPoints)
    
    return NextResponse.json(mockPoints)

  } catch (error) {
    console.error('Points fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    )
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

    // 임시로 포인트 추가 성공 처리 (테스트용)
    const mockHistoryData = {
      id: `history_${Date.now()}`,
      user_id: userId,
      points: points,
      type: type,
      description: description,
      related_id: relatedId,
      created_at: new Date().toISOString()
    }
    
    console.log('[POINTS_API] Mock 포인트 추가:', mockHistoryData)
    
    return NextResponse.json({
      success: true,
      pointsHistory: mockHistoryData
    })

  } catch (error) {
    console.error('Points update error:', error)
    return NextResponse.json(
      { error: 'Failed to update points' },
      { status: 500 }
    )
  }
}