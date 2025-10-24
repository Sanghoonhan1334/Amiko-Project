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
