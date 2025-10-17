import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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
