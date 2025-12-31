import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('[VERIFY_START] ========================================')
    console.log('[VERIFY_START] 함수 진입 성공!')
    console.log('[VERIFY_START] ========================================')
    
    // 최소한의 응답만 반환
    return NextResponse.json({ 
      ok: true, 
      message: '테스트 성공',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[VERIFY_START] ========================================')
    console.error('[VERIFY_START] 에러 발생!')
    console.error('[VERIFY_START] 에러:', error)
    console.error('[VERIFY_START] ========================================')
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
