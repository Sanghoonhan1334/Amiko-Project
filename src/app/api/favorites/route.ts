import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// 즐겨찾기 추가/제거
export async function POST(request: NextRequest) {
  try {
    const { quizId, action } = await request.json()
    
    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'add') {
      // 즐겨찾기 추가
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, quiz_id: quizId })
      
      if (error) {
        console.error('즐겨찾기 추가 오류:', error)
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
      }
    } else if (action === 'remove') {
      // 즐겨찾기 제거
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
      
      if (error) {
        console.error('즐겨찾기 제거 오류:', error)
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
      }
    }

    // 업데이트된 즐겨찾기 개수 반환
    const { data: countData, error: countError } = await supabase
      .rpc('get_quiz_favorite_count', { quiz_uuid: quizId })

    if (countError) {
      console.error('즐겨찾기 개수 조회 오류:', countError)
      return NextResponse.json({ error: 'Failed to get favorite count' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      favoriteCount: countData || 0 
    })

  } catch (error) {
    console.error('즐겨찾기 API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 즐겨찾기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const quizId = searchParams.get('quizId')

    const supabase = createClient()

    if (quizId) {
      // 특정 퀴즈의 즐겨찾기 상태 및 개수 조회
      const { data: { user } } = await supabase.auth.getUser()
      
      let isFavorited = false
      if (user) {
        const { data: favoriteData } = await supabase
          .rpc('is_quiz_favorited_by_user', { 
            quiz_uuid: quizId, 
            user_uuid: user.id 
          })
        isFavorited = favoriteData || false
      }

      const { data: countData } = await supabase
        .rpc('get_quiz_favorite_count', { quiz_uuid: quizId })

      return NextResponse.json({
        isFavorited,
        favoriteCount: countData || 0
      })
    }

    if (userId) {
      // 특정 사용자의 즐겨찾기 목록 조회
      const { data: favorites, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          created_at,
          quizzes (
            id,
            title,
            slug,
            thumbnail_url,
            category,
            participant_count
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('즐겨찾기 목록 조회 오류:', error)
        return NextResponse.json({ error: 'Failed to get favorites' }, { status: 500 })
      }

      return NextResponse.json({ favorites: favorites || [] })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  } catch (error) {
    console.error('즐겨찾기 조회 API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
