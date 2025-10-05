import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('[MIGRATE] Q&A 게시물 마이그레이션 시작')
    
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 갤러리 ID 조회
    const { data: freeGallery, error: freeError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'free')
      .single()

    const { data: qaGallery, error: qaError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'qa')
      .single()

    if (freeError || !freeGallery || qaError || !qaGallery) {
      console.error('[MIGRATE] 갤러리 조회 오류:', { freeError, qaError })
      return NextResponse.json(
        { error: '갤러리를 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // Q&A 관련 키워드로 이동할 게시물들 찾기
    const { data: postsToMigrate, error: selectError } = await supabaseServer
      .from('gallery_posts')
      .select('id, title, content')
      .eq('gallery_id', freeGallery.id)
      .eq('is_deleted', false)
      .or(`title.ilike.%질문%,title.ilike.%궁금%,title.ilike.%문의%,title.ilike.%도움%,title.ilike.%help%,title.ilike.%question%,title.ilike.%?,title.ilike.%ㅇㅇ%`)

    if (selectError) {
      console.error('[MIGRATE] 게시물 조회 오류:', selectError)
      return NextResponse.json(
        { error: '게시물을 조회하는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[MIGRATE] 이동할 게시물 수:', postsToMigrate?.length || 0)

    if (!postsToMigrate || postsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: '이동할 Q&A 게시물이 없습니다.',
        migrated_count: 0
      })
    }

    // 게시물들을 Q&A 갤러리로 이동
    const postIds = postsToMigrate.map(post => post.id)
    
    const { error: updateError } = await supabaseServer
      .from('gallery_posts')
      .update({
        gallery_id: qaGallery.id,
        category_name: 'Q&A'
      })
      .in('id', postIds)

    if (updateError) {
      console.error('[MIGRATE] 게시물 이동 오류:', updateError)
      return NextResponse.json(
        { error: '게시물 이동에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 갤러리별 게시물 수 업데이트
    const { error: freeUpdateError } = await supabaseServer
      .from('galleries')
      .update({
        post_count: await getPostCount(freeGallery.id)
      })
      .eq('id', freeGallery.id)

    const { error: qaUpdateError } = await supabaseServer
      .from('galleries')
      .update({
        post_count: await getPostCount(qaGallery.id)
      })
      .eq('id', qaGallery.id)

    if (freeUpdateError || qaUpdateError) {
      console.error('[MIGRATE] 갤러리 게시물 수 업데이트 오류:', { freeUpdateError, qaUpdateError })
    }

    console.log('[MIGRATE] Q&A 게시물 마이그레이션 완료:', postsToMigrate.length, '개')

    return NextResponse.json({
      success: true,
      message: `${postsToMigrate.length}개의 Q&A 게시물을 성공적으로 이동했습니다.`,
      migrated_count: postsToMigrate.length,
      migrated_posts: postsToMigrate.map(post => ({
        id: post.id,
        title: post.title
      }))
    })

  } catch (error) {
    console.error('[MIGRATE] 마이그레이션 오류:', error)
    return NextResponse.json(
      { error: '마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 수 조회 함수
async function getPostCount(galleryId: string): Promise<number> {
  const { count, error } = await supabaseServer
    .from('gallery_posts')
    .select('*', { count: 'exact', head: true })
    .eq('gallery_id', galleryId)
    .eq('is_deleted', false)
  
  return error ? 0 : (count || 0)
}
