import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    if (!postId) {
      return NextResponse.json({
        success: false,
        error: '게시글 ID가 필요합니다.'
      }, { status: 400 })
    }

    // 게시글 상세 정보 조회
    const { data: post, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        images,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        created_at,
        updated_at,
        user:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          avatar_url,
          profile_image
        ),
        gallery:galleries!gallery_posts_gallery_id_fkey (
          id,
          slug,
          name_ko
        )
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (postError) {
      console.error('게시글 조회 오류:', postError)
      return NextResponse.json({
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    if (!post) {
      return NextResponse.json({
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 조회수 증가
    await supabaseServer
      .from('gallery_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', postId)

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        view_count: (post.view_count || 0) + 1
      }
    })

  } catch (error) {
    console.error('게시글 상세 조회 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    if (!postId) {
      return NextResponse.json({
        success: false,
        error: '게시글 ID가 필요합니다.'
      }, { status: 400 })
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: tokenUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !tokenUser) {
      console.error('[DELETE_POST] 인증 실패:', authError)
      return NextResponse.json({
        success: false,
        error: '인증에 실패했습니다.'
      }, { status: 401 })
    }

    // 게시글 정보 조회 (작성자 확인용)
    const { data: post, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      return NextResponse.json({
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 작성자 확인 (작성자이거나 운영자만 삭제 가능)
    const isAuthor = post.user_id === tokenUser.id
    
    // 운영자 권한 확인
    const { data: dbUser } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', tokenUser.id)
      .single()

    const adminEmails = ['admin@amiko.com', 'editor@amiko.com', 'manager@amiko.com']
    const isAdmin = dbUser && adminEmails.includes(dbUser.email)

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: '삭제 권한이 없습니다.'
      }, { status: 403 })
    }

    // 게시글 삭제 (soft delete)
    const { error: deleteError } = await supabaseServer
      .from('gallery_posts')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (deleteError) {
      console.error('[DELETE_POST] 삭제 실패:', deleteError)
      return NextResponse.json({
        success: false,
        error: '게시글 삭제에 실패했습니다.'
      }, { status: 500 })
    }

    console.log('[DELETE_POST] 게시글 삭제 성공:', postId)

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[DELETE_POST] 서버 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}