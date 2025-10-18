import { NextRequest, NextResponse } from 'next/server'

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

    // 임시로 더미 데이터 반환 (실제 구현 시 데이터베이스에서 조회)
    const points = {
      userId,
      totalPoints: 1000,
      availablePoints: 800,
      usedPoints: 200,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(points)

  } catch (error) {
    console.error('포인트 조회 오류:', error)
    return NextResponse.json(
      { error: '포인트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}