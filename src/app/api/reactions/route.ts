import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 반응 추가/수정
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { postId, commentId, type } = await request.json()

    // 입력 검증
    if ((!postId && !commentId) || !type) {
      return NextResponse.json(
        { error: 'postId 또는 commentId와 type이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!['like', 'dislike', 'love', 'laugh', 'angry', 'sad'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 반응 타입입니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 반응 추가/수정
    const { error } = await supabaseServer.rpc('add_or_update_reaction', {
      p_user_id: user.id,
      p_post_id: postId || null,
      p_comment_id: commentId || null,
      p_type: type
    })

    if (error) {
      console.error('[REACTIONS API] 반응 추가/수정 실패:', error)
      return NextResponse.json(
        { error: '반응 추가/수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 반응 받은 사용자에게 포인트 적립 (좋아요만)
    if (type === 'like') {
      let targetUserId = null
      
      if (postId) {
        // 게시물 작성자 찾기
        const { data: post } = await supabaseServer
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single()
        targetUserId = post?.user_id
      } else if (commentId) {
        // 댓글 작성자 찾기
        const { data: comment } = await supabaseServer
          .from('comments')
          .select('user_id')
          .eq('id', commentId)
          .single()
        targetUserId = comment?.user_id
      }

      if (targetUserId && targetUserId !== user.id) {
        // 본인이 아닌 경우에만 포인트 적립
        const { error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
          p_user_id: targetUserId,
          p_type: 'reaction_received',
          p_amount: 2,
          p_description: '좋아요 받음',
          p_related_id: postId || commentId,
          p_related_type: postId ? 'post' : 'comment'
        })

        if (pointError) {
          console.error('[REACTIONS API] 포인트 적립 실패:', pointError)
        }
      }
    }

    return NextResponse.json({ message: '반응이 추가되었습니다.' })

  } catch (error) {
    console.error('[REACTIONS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 반응 삭제
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const commentId = searchParams.get('commentId')

    // 입력 검증
    if (!postId && !commentId) {
      return NextResponse.json(
        { error: 'postId 또는 commentId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 반응 삭제
    const { error } = await supabaseServer.rpc('remove_reaction', {
      p_user_id: user.id,
      p_post_id: postId || null,
      p_comment_id: commentId || null
    })

    if (error) {
      console.error('[REACTIONS API] 반응 삭제 실패:', error)
      return NextResponse.json(
        { error: '반응 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '반응이 삭제되었습니다.' })

  } catch (error) {
    console.error('[REACTIONS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
