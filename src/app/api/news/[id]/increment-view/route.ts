import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 뉴스 조회수 증가 API
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const newsId = params.id

    // 현재 조회수 가져오기
    const { data: currentNews, error: fetchError } = await supabaseServer
      .from('korean_news')
      .select('view_count')
      .eq('id', newsId)
      .single()

    if (fetchError) {
      console.error('[NEWS_VIEW] 뉴스 조회 오류:', fetchError)
      return NextResponse.json(
        { error: '뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가
    const newViewCount = (currentNews.view_count || 0) + 1

    const { data, error } = await supabaseServer
      .from('korean_news')
      .update({ view_count: newViewCount })
      .eq('id', newsId)
      .select()
      .single()

    if (error) {
      console.error('[NEWS_VIEW] 조회수 증가 오류:', error)
      return NextResponse.json(
        { error: '조회수 증가 실패' },
        { status: 500 }
      )
    }

    console.log('[NEWS_VIEW] 조회수 증가 성공:', {
      newsId,
      oldCount: currentNews.view_count,
      newCount: newViewCount
    })

    return NextResponse.json({
      success: true,
      view_count: newViewCount
    })
  } catch (error) {
    console.error('[NEWS_VIEW] API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    )
  }
}

