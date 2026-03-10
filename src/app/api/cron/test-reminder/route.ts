import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    console.log('🧪 [CRON TEST] 리마인더 테스트 시작...')

    // Use localhost in development, app URL in production
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://helloamiko.com')

    // 리마인더 API 호출
    const response = await fetch(`${baseUrl}/api/cron/reminder`, {
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
