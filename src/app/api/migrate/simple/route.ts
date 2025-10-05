import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    console.log('[MIGRATE] 간단한 Q&A 게시물 마이그레이션 시작')
    
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

    // 특정 게시물 ID를 Q&A 갤러리로 이동
    const postId = '09bba659-1e23-4920-8833-52f0e1834504' // "이거 질문이요" 게시물 ID

    const { error: updateError } = await supabaseServer
      .from('gallery_posts')
      .update({
        gallery_id: qaGallery.id,
        category_name: 'Q&A'
      })
      .eq('id', postId)

    if (updateError) {
      console.error('[MIGRATE] 게시물 이동 오류:', updateError)
      return NextResponse.json(
        { error: '게시물 이동에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[MIGRATE] Q&A 게시물 마이그레이션 완료')

    return NextResponse.json({
      success: true,
      message: 'Q&A 게시물을 성공적으로 이동했습니다.',
      post_id: postId
    })

  } catch (error) {
    console.error('[MIGRATE] 마이그레이션 오류:', error)
    return NextResponse.json(
      { error: '마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
