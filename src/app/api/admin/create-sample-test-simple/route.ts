import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE_SAMPLE_TEST_SIMPLE] 간단한 샘플 테스트 생성 시작');
    
    // Supabase 없이 간단한 응답만 제공
    const sampleQuiz = {
      id: 'sample-mbti-' + Date.now(),
      title: '🎯 간단 MBTI 테스트',
      description: '당신의 성격 유형을 간단히 알아보세요',
      category: 'personality',
      total_questions: 4,
      total_participants: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };

    console.log('[CREATE_SAMPLE_TEST_SIMPLE] 샘플 테스트 생성 완료');

    return NextResponse.json({
      success: true,
      message: '샘플 테스트가 성공적으로 생성되었습니다!',
      quiz: sampleQuiz
    });

  } catch (error) {
    console.error('[CREATE_SAMPLE_TEST_SIMPLE] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
