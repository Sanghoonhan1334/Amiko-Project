import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 갤러리 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[GALLERIES] 갤러리 목록 조회 시작')

    // 활성화된 갤러리들을 정렬 순서대로 조회
    const { data: galleries, error } = await supabaseServer
      .from('galleries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[GALLERIES] 갤러리 조회 실패:', error)
      return NextResponse.json(
        { error: '갤러리를 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[GALLERIES] 갤러리 조회 성공:', galleries?.length || 0, '개')

    return NextResponse.json({
      success: true,
      galleries: galleries || []
    })

  } catch (error) {
    console.error('[GALLERIES] 갤러리 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
