import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 게시물 투표 정보 조회
export async function GET(
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

    const { id } = params

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: true,
        voteType: null
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !authUser) {
      return NextResponse.json({
        success: true,
        voteType: null
      })
    }

    console.log('[VOTE_GET] 투표 정보 조회:', { postId: id, userId: authUser.id })

    // 사용자의 투표 정보 조회
    const { data: vote, error } = await supabaseServer
      .from('gallery_votes')
      .select('vote_type')
      .eq('post_id', id)
      .eq('user_id', authUser.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows returned" 오류
      console.error('[VOTE_GET] 투표 정보 조회 실패:', error)
      return NextResponse.json(
        { error: '투표 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      voteType: vote?.vote_type || null
    })

  } catch (error) {
    console.error('[VOTE_GET] 투표 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 투표 (추천/비추천)
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

    const { id } = params
    const body = await request.json()
    const { voteType } = body

    if (!voteType || !['like', 'dislike'].includes(voteType)) {
      return NextResponse.json(
        { error: '올바른 투표 타입을 선택해주세요.' },
        { status: 400 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    console.log('[VOTE_POST] 투표 처리 시작:', { postId: id, userId: authUser.id, voteType })

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('id, like_count, dislike_count')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 투표 확인
    const { data: existingVote, error: voteError } = await supabaseServer
      .from('gallery_votes')
      .select('vote_type')
      .eq('post_id', id)
      .eq('user_id', authUser.id)
      .single()

    let newLikeCount = post.like_count
    let newDislikeCount = post.dislike_count
    let finalVoteType = voteType

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('[VOTE_POST] 기존 투표 조회 실패:', voteError)
      return NextResponse.json(
        { error: '투표 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.vote_type === voteType) {
        // 같은 투표를 다시 누른 경우 - 투표 취소
        await supabaseServer
          .from('gallery_votes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', authUser.id)

        if (voteType === 'like') {
          newLikeCount = Math.max(0, newLikeCount - 1)
        } else {
          newDislikeCount = Math.max(0, newDislikeCount - 1)
        }
        finalVoteType = null
      } else {
        // 다른 투표로 변경
        await supabaseServer
          .from('gallery_votes')
          .update({ vote_type: voteType })
          .eq('post_id', id)
          .eq('user_id', authUser.id)

        if (existingVote.vote_type === 'like') {
          newLikeCount = Math.max(0, newLikeCount - 1)
        } else {
          newDislikeCount = Math.max(0, newDislikeCount - 1)
        }

        if (voteType === 'like') {
          newLikeCount += 1
        } else {
          newDislikeCount += 1
        }
      }
    } else {
      // 새로운 투표
      await supabaseServer
        .from('gallery_votes')
        .insert({
          post_id: id,
          user_id: authUser.id,
          vote_type: voteType
        })

      if (voteType === 'like') {
        newLikeCount += 1
      } else {
        newDislikeCount += 1
      }
    }

    // 게시물의 투표 수 업데이트
    await supabaseServer
      .from('gallery_posts')
      .update({
        like_count: newLikeCount,
        dislike_count: newDislikeCount
      })
      .eq('id', id)

    console.log('[VOTE_POST] 투표 처리 성공:', { 
      postId: id, 
      voteType: finalVoteType, 
      likeCount: newLikeCount, 
      dislikeCount: newDislikeCount 
    })

    return NextResponse.json({
      success: true,
      voteType: finalVoteType,
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount
    })

  } catch (error) {
    console.error('[VOTE_POST] 투표 처리 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
