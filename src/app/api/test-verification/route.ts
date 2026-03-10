import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 프로덕션에서 완전 차단 (테스트/디버그 엔드포인트)
  if (process.env.NODE_ENV !== 'development') {
    return new (require('next/server').NextResponse)(null, { status: 404 })
  }


  try {
    console.log('[TEST_VERIFICATION] 새로운 API 함수 시작')
    
    return NextResponse.json({ 
      success: true, 
      message: '새로운 API 테스트 성공',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TEST_VERIFICATION] 에러 발생:', error)
    return NextResponse.json(
      { error: '테스트 API 오류', details: error.message },
      { status: 500 }
    )
  }
}
