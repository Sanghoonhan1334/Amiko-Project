import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const authHeader = request.headers.get('authorization')
    
    // 댓글 목록 조회 (인증 없이도 가능) - 계층 구조로 조회
    const { data: allComments, error: commentsError } = await supabaseServer
      .from('post_comments')
      .select(`
        id,
        content,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        parent_id,
        user:users!post_comments_user_id_fkey (
          id,
          full_name,
          avatar_url,
          profile_image
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('댓글 조회 오류:', commentsError)
      return NextResponse.json({
        success: false,
        error: '댓글을 불러오는데 실패했습니다.'
      }, { status: 500 })
    }

    // 계층 구조로 댓글 정리
    const comments = (allComments || []).filter(comment => !comment.parent_id)
    const replies = (allComments || []).filter(comment => comment.parent_id)

    // 답글을 부모 댓글에 연결
    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: replies.filter(reply => reply.parent_id === comment.id)
    }))

    return NextResponse.json({
      success: true,
      comments: commentsWithReplies
    })

  } catch (error) {
    console.error('댓글 조회 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    const { content, parent_id } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json({
        success: false,
        error: '댓글 내용을 입력해주세요.'
      }, { status: 400 })
    }

    // 댓글 생성
    const { data: comment, error: commentError } = await supabaseServer
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
        like_count: 0,
        dislike_count: 0
      })
      .select(`
        id,
        content,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        parent_id,
        user:users!post_comments_user_id_fkey (
          id,
          full_name,
          avatar_url,
          profile_image
        )
      `)
      .single()

    if (commentError) {
      console.error('댓글 생성 오류:', commentError)
      return NextResponse.json({
        success: false,
        error: '댓글 작성에 실패했습니다.'
      }, { status: 500 })
    }

    // 게시글의 댓글 수 증가
    const { data: currentPost, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('comment_count')
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('게시글 조회 오류:', postError)
    } else {
      await supabaseServer
        .from('gallery_posts')
        .update({ 
          comment_count: (currentPost.comment_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: true,
      comment: comment
    })

  } catch (error) {
    console.error('댓글 작성 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}