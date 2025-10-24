import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // URL에서 limit 파라미터 가져오기 (기본값: 3)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '3')
    
    console.log('Fetching hot posts with limit:', limit)
    
    // 조회수가 높은 순으로 게시물 가져오기
    const { data: posts, error } = await supabase
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        author_name,
        likes_count,
        comments_count,
        views_count,
        created_at,
        category
      `)
      .order('views_count', { ascending: false })
      .limit(limit)
    
    console.log('Posts fetched:', posts?.length || 0)
    console.log('Error:', error)
    
    if (error) {
      console.error('Error fetching hot posts:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch hot posts', details: error.message },
        { status: 500 }
      )
    }
    
    // 데이터가 없는 경우 fallback 데이터 제공
    if (!posts || posts.length === 0) {
      console.log('No posts found, returning fallback data')
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
    }
    
    // 데이터 포맷팅
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author_name || '익명',
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      views: post.views_count || 0,
      createdAt: formatTimeAgo(post.created_at),
      category: post.category
    }))
    
    return NextResponse.json({
      success: true,
      posts: formattedPosts
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 시간 포맷팅 함수
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const postDate = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}분 전`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}시간 전`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}일 전`
  }
}
