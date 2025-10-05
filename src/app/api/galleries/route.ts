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

// 갤러리 생성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { slug, name_ko, name_es, description_ko, description_es, icon, color, is_active = true, sort_order } = body

    console.log('[GALLERIES] 갤러리 생성 시작:', slug)

    // 필수 필드 검증
    if (!slug || !name_ko || !icon || !color) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 갤러리 생성
    const { data: gallery, error } = await supabaseServer
      .from('galleries')
      .insert({
        slug,
        name_ko,
        name_es,
        description_ko,
        description_es,
        icon,
        color,
        is_active,
        sort_order,
        post_count: 0,
        comment_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('[GALLERIES] 갤러리 생성 실패:', error)
      return NextResponse.json(
        { error: '갤러리 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[GALLERIES] 갤러리 생성 성공:', gallery.id)

    return NextResponse.json({
      success: true,
      gallery
    })

  } catch (error) {
    console.error('[GALLERIES] 갤러리 생성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
