import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[ADMIN] 잘못된 위치의 게시물들 삭제 시작')
    
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 자유게시판 ID 조회
    const { data: freeGallery, error: freeError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (freeError || !freeGallery) {
      console.error('[ADMIN] 갤러리 조회 오류:', freeError)
      return NextResponse.json(
        { error: '자유게시판을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // Q&A 관련 키워드가 포함된 게시물들 찾기
    const { data: postsToDelete, error: selectError } = await supabaseServer
      .from('gallery_posts')
      .select('id, title, content')
      .eq('gallery_id', freeGallery.id)
      .eq('is_deleted', false)
      .or(`title.ilike.%질문%,title.ilike.%궁금%,title.ilike.%ㅇㅇ%`)

    if (selectError) {
      console.error('[ADMIN] 게시물 조회 오류:', selectError)
      return NextResponse.json(
        { error: '게시물을 조회하는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[ADMIN] 삭제할 게시물 수:', postsToDelete?.length || 0)

    if (!postsToDelete || postsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: '삭제할 Q&A 관련 게시물이 없습니다.',
        deleted_count: 0
      })
    }

    // 게시물들을 논리적 삭제 (is_deleted = true)
    const postIds = postsToDelete.map(post => post.id)
    
    const { error: updateError } = await supabaseServer
      .from('gallery_posts')
      .update({
        is_deleted: true
      })
      .in('id', postIds)

    if (updateError) {
      console.error('[ADMIN] 게시물 삭제 오류:', updateError)
      return NextResponse.json(
        { error: '게시물 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 갤러리 게시물 수 업데이트
    const { count: remainingCount, error: countError } = await supabaseServer
      .from('gallery_posts')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', freeGallery.id)
      .eq('is_deleted', false)

    if (!countError) {
      await supabaseServer
        .from('galleries')
        .update({
          post_count: remainingCount || 0
        })
        .eq('id', freeGallery.id)
    }

    console.log('[ADMIN] Q&A 관련 게시물 삭제 완료:', postsToDelete.length, '개')

    return NextResponse.json({
      success: true,
      message: `${postsToDelete.length}개의 Q&A 관련 게시물을 삭제했습니다.`,
      deleted_count: postsToDelete.length,
      deleted_posts: postsToDelete.map(post => ({
        id: post.id,
        title: post.title
      }))
    })

  } catch (error) {
    console.error('[ADMIN] 삭제 오류:', error)
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
