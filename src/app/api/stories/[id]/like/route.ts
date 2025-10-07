import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: storyId } = params

    // 인증 토큰 확인
    const authHeader = request.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }
      userId = user.id
    } else {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 이미 좋아요를 눌렀는지 확인
    const { data: existingLike } = await supabaseServer
      .from('story_likes')
      .select('id')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // 좋아요 취소
      await supabaseServer
        .from('story_likes')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId)

      // 좋아요 수 감소
      await supabaseServer.rpc('decrement_story_like_count', {
        story_id_param: storyId
      })

      return NextResponse.json({
        success: true,
        liked: false,
        message: '좋아요가 취소되었습니다.'
      })
    } else {
      // 좋아요 추가
      await supabaseServer
        .from('story_likes')
        .insert({
          story_id: storyId,
          user_id: userId
        })

      // 좋아요 수 증가
      await supabaseServer.rpc('increment_story_like_count', {
        story_id_param: storyId
      })

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

