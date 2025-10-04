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