import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: storyId } = await params

    console.log('[STORY_LIKE] 좋아요 토글 요청:', { storyId })

    // 인증 토큰 확인
    const authHeader = request.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      console.log('[STORY_LIKE] 토큰 확인:', { hasToken: !!token, tokenLength: token.length })
      
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[STORY_LIKE] 인증 실패:', authError)
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }
      userId = user.id
      console.log('[STORY_LIKE] 사용자 인증 성공:', { userId })
    } else {
      console.error('[STORY_LIKE] 인증 헤더 없음')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 이미 좋아요를 눌렀는지 확인
    console.log('[STORY_LIKE] 기존 좋아요 확인:', { storyId, userId })
    const { data: existingLike, error: likeCheckError } = await supabaseServer
      .from('story_likes')
      .select('id')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('[STORY_LIKE] 좋아요 확인 오류:', likeCheckError)
      return NextResponse.json({ error: '좋아요 상태 확인에 실패했습니다.' }, { status: 500 })
    }

    console.log('[STORY_LIKE] 기존 좋아요 결과:', { existingLike, hasLike: !!existingLike })

    if (existingLike) {
      // 좋아요 취소
      console.log('[STORY_LIKE] 좋아요 취소 시도')
      const { error: deleteError } = await supabaseServer
        .from('story_likes')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('[STORY_LIKE] 좋아요 취소 실패:', deleteError)
        return NextResponse.json({ error: '좋아요 취소에 실패했습니다.' }, { status: 500 })
      }

      // 좋아요 수 감소
      console.log('[STORY_LIKE] 좋아요 수 감소 시도')
      const { error: decrementError } = await supabaseServer.rpc('decrement_story_like_count', {
        story_id_param: storyId
      })

      if (decrementError) {
        console.error('[STORY_LIKE] 좋아요 수 감소 실패:', decrementError)
      }

      console.log('[STORY_LIKE] 좋아요 취소 성공')
      return NextResponse.json({
        success: true,
        liked: false,
        message: '좋아요가 취소되었습니다.'
      })
    } else {
      // 좋아요 추가
      console.log('[STORY_LIKE] 좋아요 추가 시도')
      const { error: insertError } = await supabaseServer
        .from('story_likes')
        .insert({
          story_id: storyId,
          user_id: userId
        })

      if (insertError) {
        console.error('[STORY_LIKE] 좋아요 추가 실패:', insertError)
        return NextResponse.json({ error: '좋아요 추가에 실패했습니다.' }, { status: 500 })
      }

      // 좋아요 수 증가
      console.log('[STORY_LIKE] 좋아요 수 증가 시도')
      const { error: incrementError } = await supabaseServer.rpc('increment_story_like_count', {
        story_id_param: storyId
      })

      if (incrementError) {
        console.error('[STORY_LIKE] 좋아요 수 증가 실패:', incrementError)
      }

      console.log('[STORY_LIKE] 좋아요 추가 성공')
      return NextResponse.json({
        success: true,
        liked: true,
        message: '좋아요를 눌렀습니다.'
      })
    }
  } catch (error: any) {
    console.error('[STORY_LIKE] 좋아요 토글 오류:', error)
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

