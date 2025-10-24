import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // URL에서 limit 파라미터 가져오기 (기본값: 3)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '3')
    
    console.log('Fetching hot posts with limit:', limit)
    
    // 임시로 fallback 데이터만 반환 (Supabase 연결 문제 해결 전까지)
    console.log('Returning fallback data due to API issues')
    
    const fallbackPosts = [
      {
        id: 'fallback-1',
        title: 'ACU-POINT 화장품 이벤트 참여 방법!',
        content: '커뮤니티 점수 1등에게 매월 선크림 + 마스크팩 세트를 드립니다! 자세한 참여 방법을 알려드릴게요...',
        author: 'Amiko Team',
        likes: 234,
        comments: 89,
        views: 2847,
        createdAt: '1시간 전',
        category: 'event'
      },
      {
        id: 'fallback-2',
        title: '한국 비행기 티켓 추첨 이벤트 공지',
        content: '2026년 말까지 진행되는 한국 비행기 티켓 추첨 이벤트입니다! 커뮤니티에 참여하고 티켓을 받아가세요...',
        author: 'Amiko Team',
        likes: 456,
        comments: 156,
        views: 1923,
        createdAt: '3시간 전',
        category: 'event'
      },
      {
        id: 'fallback-3',
        title: '심리테스트 결과 공유해요!',
        content: 'MBTI K-POP 테스트 결과가 어떻게 나왔는지 공유해보세요! 어떤 스타가 나왔나요?',
        author: '사용자123',
        likes: 178,
        comments: 67,
        views: 1234,
        createdAt: '5시간 전',
        category: 'test'
      }
    ]
    
    return NextResponse.json({
      success: true,
      posts: fallbackPosts
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
