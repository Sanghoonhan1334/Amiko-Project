import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 임시로 더미 데이터 반환 (실제 구현 시 데이터베이스에서 조회)
    const couponStatus = {
      hasActiveCoupons: false,
      availableCoupons: [],
      lastChecked: new Date().toISOString()
    }

    return NextResponse.json(couponStatus)

  } catch (error) {
    console.error('쿠폰 확인 오류:', error)
    return NextResponse.json(
      { error: '쿠폰 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}