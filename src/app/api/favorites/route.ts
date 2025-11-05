import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 즐겨찾기 추가/제거
export async function POST(request: NextRequest) {
  try {
    const { quizId, action } = await request.json()
    
    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    console.log('[FAVORITES_POST] 인증 결과:', { userId: user?.id, authError })
    
    if (authError || !user) {
      console.error('[FAVORITES_POST] 인증 실패:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[FAVORITES_POST] 요청:', { action, quizId, userId: user.id })

    if (action === 'add') {
      // 즐겨찾기 추가
      const { error } = await supabaseServer
        .from('user_favorites')
        .insert({ user_id: user.id, quiz_id: quizId })
      
      if (error) {
        // 중복 키 에러(23505)는 무시 - 이미 즐겨찾기에 있음
        if (error.code === '23505') {
          console.log('[FAVORITES_POST] 이미 즐겨찾기에 있음, 무시')
        } else {
          console.error('[FAVORITES_POST] 즐겨찾기 추가 오류:', error)
          return NextResponse.json({ 
            error: 'Failed to add favorite',
            details: error.message 
          }, { status: 500 })
        }
      } else {
        console.log('[FAVORITES_POST] 즐겨찾기 추가 성공')
      }
    } else if (action === 'remove') {
      // 즐겨찾기 제거
      const { error } = await supabaseServer
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
      
      if (error) {
        console.error('[FAVORITES_POST] 즐겨찾기 제거 오류:', error)
        return NextResponse.json({ 
          error: 'Failed to remove favorite',
          details: error.message 
        }, { status: 500 })
      }
      console.log('[FAVORITES_POST] 즐겨찾기 제거 성공')
    }

    // 업데이트된 즐겨찾기 개수 반환
    const { count, error: countError } = await supabaseServer
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)

    if (countError) {
      console.error('[FAVORITES_POST] 카운트 조회 오류:', countError)
    }

    console.log('[FAVORITES_POST] 최종 카운트:', count)

    return NextResponse.json({ 
      success: true, 
      favoriteCount: count || 0 
    })

  } catch (error: any) {
    console.error('[FAVORITES_POST] 서버 오류:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// 즐겨찾기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const quizId = searchParams.get('quizId')

    if (quizId) {
      // Authorization 헤더에서 토큰 가져오기
      const authHeader = request.headers.get('Authorization')
      let user = null
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: authUser } } = await supabaseServer.auth.getUser(token)
        user = authUser
      }
      
      let isFavorited = false
      let favoriteCount = 0

      if (user) {
        const { data: favoriteData } = await supabaseServer
          .from('user_favorites')
          .select('id')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .single()
        
        isFavorited = !!favoriteData
      }

      // 전체 즐겨찾기 개수
      const { count } = await supabaseServer
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
      
      favoriteCount = count || 0

      return NextResponse.json({
        isFavorited,
        favoriteCount
      })
    }

    if (userId) {
      // 특정 사용자의 즐겨찾기 목록 조회 (JOIN 제거, quiz_id만 반환)
      const { data: favorites, error } = await supabaseServer
        .from('user_favorites')
        .select('id, quiz_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('[FAVORITES] 조회 오류:', error.message)
        return NextResponse.json({ favorites: [] })
      }

      // quiz_id를 quizzes.id 형식으로 변환 (기존 클라이언트 코드와 호환)
      const formattedFavorites = (favorites || []).map(fav => ({
        id: fav.id,
        created_at: fav.created_at,
        quizzes: {
          id: fav.quiz_id  // quiz_id를 quizzes.id로 매핑
        }
      }))

      console.log('[FAVORITES] 조회 성공:', formattedFavorites.length, '개')
      return NextResponse.json({ favorites: formattedFavorites })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  } catch (error) {
    console.error('즐겨찾기 조회 API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
