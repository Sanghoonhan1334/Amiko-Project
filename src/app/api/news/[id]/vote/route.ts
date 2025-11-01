import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// K-매거진 뉴스 좋아요/싫어요 처리
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: newsId } = await params
    const { vote_type } = await request.json()

    console.log('========================================')
    console.log('[NEWS_VOTE] 뉴스 투표 시작')
    console.log('[NEWS_VOTE] newsId:', newsId)
    console.log('[NEWS_VOTE] vote_type:', vote_type)

    if (!supabaseServer) {
      console.error('[NEWS_VOTE] Supabase 연결 실패')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[NEWS_VOTE] 인증 실패:', authError)
        return NextResponse.json(
          { error: '로그인이 필요합니다.' },
          { status: 401 }
        )
      }

      userId = user.id
    } else {
      console.error('[NEWS_VOTE] Authorization 헤더 없음')
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    console.log('[NEWS_VOTE] userId:', userId)

    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      console.error('[NEWS_VOTE] 잘못된 투표 타입:', vote_type)
      return NextResponse.json({ error: '유효하지 않은 투표 타입입니다.' }, { status: 400 })
    }

    // 1단계: 기존 투표 확인
    const { data: existingVote, error: existingVoteError } = await supabaseServer
      .from('reactions')
      .select('type')
      .eq('post_id', newsId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingVoteError) {
      console.error('[NEWS_VOTE] 기존 투표 조회 오류:', existingVoteError)
      return NextResponse.json({
        success: false,
        error: '투표 정보를 조회할 수 없습니다.',
        details: existingVoteError.message
      }, { status: 500 })
    }

    console.log('[NEWS_VOTE] 기존 투표:', existingVote)

    let newVoteType: string | null = vote_type
    let likeChange = 0
    let dislikeChange = 0

    // 2단계: 투표 로직 계산
    if (!existingVote) {
      // 새로운 투표
      if (vote_type === 'like') {
        likeChange = 1
      } else {
        dislikeChange = 1
      }
    } else if (existingVote.type === vote_type) {
      // 같은 투표를 다시 누르면 취소
      newVoteType = null
      if (vote_type === 'like') {
        likeChange = -1
      } else {
        dislikeChange = -1
      }
    } else {
      // 다른 투표로 변경
      if (vote_type === 'like') {
        likeChange = 1
        dislikeChange = -1
      } else {
        likeChange = -1
        dislikeChange = 1
      }
    }

    console.log('[NEWS_VOTE] 투표 변경:', { newVoteType, likeChange, dislikeChange })

    // 3단계: 투표 업데이트
    if (newVoteType === null) {
      // 투표 취소
      const { error: deleteError } = await supabaseServer
        .from('reactions')
        .delete()
        .eq('post_id', newsId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('[NEWS_VOTE] 투표 삭제 오류:', deleteError)
        return NextResponse.json({
          success: false,
          error: '투표 취소에 실패했습니다.',
          details: deleteError.message
        }, { status: 500 })
      }
    } else {
      // 투표 추가 또는 변경
      const { error: upsertError } = await supabaseServer
        .from('reactions')
        .upsert({
          post_id: newsId,
          user_id: userId,
          type: newVoteType
        }, {
          onConflict: 'user_id,post_id'
        })

      if (upsertError) {
        console.error('[NEWS_VOTE] 투표 처리 오류:', upsertError)
        return NextResponse.json({
          success: false,
          error: '투표 처리에 실패했습니다.',
          details: upsertError.message
        }, { status: 500 })
      }
    }

    // 4단계: 뉴스 카운트 조회 (korean_news 테이블 사용)
    const { data: currentNews, error: currentNewsError } = await supabaseServer
      .from('korean_news')
      .select('like_count, dislike_count')
      .eq('id', newsId)
      .single()

    if (currentNewsError) {
      console.error('[NEWS_VOTE] 뉴스 조회 오류:', currentNewsError)
      return NextResponse.json({
        success: false,
        error: '뉴스 정보를 조회할 수 없습니다.',
        details: currentNewsError.message
      }, { status: 500 })
    }

    // 5단계: 카운트 업데이트
    const newLikeCount = Math.max(0, (currentNews?.like_count || 0) + likeChange)
    const newDislikeCount = Math.max(0, (currentNews?.dislike_count || 0) + dislikeChange)

    console.log('[NEWS_VOTE] 카운트 업데이트:', {
      현재: { like: currentNews?.like_count, dislike: currentNews?.dislike_count },
      변경: { like: likeChange, dislike: dislikeChange },
      새값: { like: newLikeCount, dislike: newDislikeCount }
    })

    const { error: updateError } = await supabaseServer
      .from('korean_news')
      .update({
        like_count: newLikeCount,
        dislike_count: newDislikeCount
      })
      .eq('id', newsId)

    if (updateError) {
      console.error('[NEWS_VOTE] 카운트 업데이트 오류:', updateError)
      return NextResponse.json({
        success: false,
        error: '카운트 업데이트에 실패했습니다.',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('[NEWS_VOTE] 투표 처리 성공!')

    return NextResponse.json({
      success: true,
      vote_type: newVoteType,
      like_count: newLikeCount,
      dislike_count: newDislikeCount
    })

  } catch (error) {
    console.error('[NEWS_VOTE] 투표 처리 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 현재 사용자의 투표 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: newsId } = await params

    console.log('[NEWS_VOTE_GET] 투표 상태 조회:', newsId)

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (!authError && user) {
        userId = user.id
      }
    }

    // 로그인하지 않은 경우
    if (!userId) {
      return NextResponse.json({
        success: true,
        vote_type: null
      })
    }

    // 사용자의 투표 정보 조회
    const { data: vote, error: voteError } = await supabaseServer
      .from('reactions')
      .select('type')
      .eq('post_id', newsId)
      .eq('user_id', userId)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('[NEWS_VOTE_GET] 투표 정보 조회 오류:', voteError)
      return NextResponse.json({
        success: false,
        error: '투표 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      vote_type: vote?.type || null
    })

  } catch (error) {
    console.error('[NEWS_VOTE_GET] 투표 정보 조회 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
