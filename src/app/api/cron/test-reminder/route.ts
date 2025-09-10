import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('🧪 [CRON TEST] 리마인더 테스트 시작...')

    // 리마인더 API 호출
    const response = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/cron/reminder`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    console.log('🧪 [CRON TEST] 리마인더 테스트 결과:', result);

    return NextResponse.json({
      success: true,
      message: '리마인더 테스트가 완료되었습니다.',
      testResult: result
    });

  } catch (error) {
    console.error('❌ [CRON TEST] 리마인더 테스트 실패:', error);
    
    return NextResponse.json(
      { 
        error: '리마인더 테스트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
