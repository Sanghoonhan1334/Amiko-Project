import { NextRequest, NextResponse } from 'next/server'

// 개발 환경용 메모리 기반 중복 검증 초기화
export async function POST(request: NextRequest) {
  try {
    // 서버 재시작 없이 메모리 초기화를 위해 전역 변수 사용
    if (typeof global !== 'undefined') {
      // 전역 변수에서 등록된 이메일 목록 초기화
      if (global.registeredEmails) {
        global.registeredEmails.clear()
      }
    }

    console.log('[RESET] 등록된 이메일 목록이 초기화되었습니다.')
    
    return NextResponse.json({
      success: true,
      message: '등록된 이메일 목록이 초기화되었습니다.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[RESET] 초기화 오류:', error)
    return NextResponse.json(
      { error: '초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 현재 등록된 이메일 목록 확인
export async function GET(request: NextRequest) {
  try {
    let registeredEmails: string[] = []
    
    if (typeof global !== 'undefined' && global.registeredEmails) {
      registeredEmails = Array.from(global.registeredEmails)
    }

    return NextResponse.json({
      success: true,
      data: {
        registeredEmails,
        count: registeredEmails.length
      }
    })

  } catch (error) {
    console.error('[RESET] 조회 오류:', error)
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
