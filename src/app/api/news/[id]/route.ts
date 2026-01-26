import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, source, category, thumbnail } = body

    // 필수 필드 검증
    if (!title || !content || !source) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('korean_news')
      .update({
        title,
        title_es: title, // 일단 같은 값으로
        content,
        content_es: content, // 일단 같은 값으로
        thumbnail,
        source,
        category,
        updated_at: new Date().toISOString()
      })
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
  try {
    // 개발 환경에서는 인증 체크 생략
    // const authHeader = request.headers.get('Authorization')
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    // }

    const { error } = await supabase
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
