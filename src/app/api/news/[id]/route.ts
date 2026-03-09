import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase 서버 클라이언트 초기화 실패' }, { status: 500 })
  }

  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const { title, content, source, category, thumbnail } = body

    // 필수 필드 검증
    if (!title || !content || !source) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('korean_news')
      .update({
        title,
        title_es: title,
        content,
        content_es: content,
        thumbnail,
        source,
        category,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', params.id)
      .select()

    if (error) {
      console.error('뉴스 수정 오류:', error)
      return NextResponse.json({ error: '뉴스 수정 실패' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '뉴스를 찾을 수 없는오' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      newsItem: data[0]
    })
  } catch (error) {
    console.error('뉴스 수정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Supabase 서버 클라이언트 초기화 실패' }, { status: 500 })
  }

  try {
    // Require admin auth for DELETE
    const adminCheck = await requireAdmin(request)
    if (adminCheck) return adminCheck

    const { error } = await supabaseServer
      .from('korean_news')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('뉴스 삭제 오류:', error)
      return NextResponse.json({ error: '뉴스 삭제 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('뉴스 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
