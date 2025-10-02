import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.log('[NEWS_API] Supabase 서버 클라이언트가 없음, 빈 응답 반환')
      return NextResponse.json({ success: true, newsItems: [] })
    }

    // 쿼리 파라미터 처리
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')

    console.log('[NEWS_GET] 요청 파라미터:', { category, limit })

    // 기본 쿼리 구성
    let query = supabaseServer
      .from('korean_news')
      .select('*')
      .order('created_at', { ascending: false })

    // 카테고리 필터 적용
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // 제한 적용
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      console.error('[NEWS_GET] 뉴스 조회 오류:', error)
      // 테이블이 없거나 다른 오류면 빈 배열 반환
      return NextResponse.json({ success: true, newsItems: [] })
    }

    console.log('[NEWS_GET] 뉴스 조회 성공:', data?.length || 0, '개')
    return NextResponse.json({ success: true, newsItems: data })
  } catch (error) {
    console.error('[NEWS_GET] 뉴스 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[NEWS_CREATE] POST 요청 시작')
    
    if (!supabaseServer) {
      console.log('[NEWS_API] Supabase 서버 클라이언트가 없음, 뉴스 생성 불가')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 개발 환경에서는 인증 체크 생략
    // const authHeader = request.headers.get('Authorization')
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    // }

    const body = await request.json()
    const { title, title_es, content, content_es, source, category, thumbnail, author, published } = body

    console.log('[NEWS_CREATE] 요청 데이터:', { 
      title, 
      title_es, 
      content: content?.substring(0, 100) + '...', 
      content_es: content_es?.substring(0, 100) + '...', 
      source, 
      category, 
      thumbnail: thumbnail ? `Base64 data (${thumbnail.length} chars)` : null, 
      author 
    })

    // 필수 필드 검증: 제목과 내용은 한국어나 스페인어 중 하나라도 있으면 통과
    const hasTitle = title?.trim() || title_es?.trim()
    const hasContent = content?.trim() || content_es?.trim()
    
    if (!hasTitle || !hasContent || !author) {
      console.log('[NEWS_CREATE] 필수 필드 누락:', { hasTitle, hasContent, author })
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('korean_news')
      .insert({
        title,
        title_es: title_es || title, // 스페인어 제목이 없으면 한국어 제목 사용
        content,
        content_es: content_es || content, // 스페인어 내용이 없으면 한국어 내용 사용
        thumbnail,
        source,
        category,
        view_count: 0,
        comment_count: 0,
        like_count: 0,
        author: author,
        published: published || true,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('[NEWS_CREATE] 뉴스 생성 오류:', error)
      console.error('[NEWS_CREATE] 오류 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ error: '뉴스 생성 실패: ' + error.message }, { status: 500 })
    }

    console.log('[NEWS_CREATE] 뉴스 생성 성공:', data[0])
    return NextResponse.json({ 
      success: true, 
      newsItem: data[0] 
    })
  } catch (error) {
    console.error('뉴스 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// 뉴스 삭제
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.log('[NEWS_DELETE] Supabase 서버 클라이언트가 없음, 뉴스 삭제 불가')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('id')

    if (!newsId) {
      return NextResponse.json({ error: '뉴스 ID가 필요합니다' }, { status: 400 })
    }

    console.log('[NEWS_DELETE] 뉴스 삭제 요청:', newsId)

    const { error } = await supabaseServer
      .from('korean_news')
      .delete()
      .eq('id', newsId)

    if (error) {
      console.error('[NEWS_DELETE] 뉴스 삭제 오류:', error)
      return NextResponse.json({ error: '뉴스 삭제 실패' }, { status: 500 })
    }

    console.log('[NEWS_DELETE] 뉴스 삭제 성공:', newsId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NEWS_DELETE] 뉴스 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// 뉴스 수정
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.log('[NEWS_UPDATE] Supabase 서버 클라이언트가 없음, 뉴스 수정 불가')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { id, title, title_es, content, content_es, source, category, thumbnail, author, published, is_pinned } = body

    if (!id) {
      return NextResponse.json({ error: '뉴스 ID가 필요합니다' }, { status: 400 })
    }

    console.log('[NEWS_UPDATE] 뉴스 수정 요청:', { id, title, title_es, content, content_es, source, category, thumbnail, author, is_pinned })

    // 고정 상태만 변경하는 경우
    if (is_pinned !== undefined && !title && !content && !author) {
      console.log('[NEWS_UPDATE] 고정 상태만 변경:', { id, is_pinned })
      
      const { data, error } = await supabaseServer
        .from('korean_news')
        .update({ is_pinned })
        .eq('id', id)
        .select()

      if (error) {
        console.error('[NEWS_UPDATE] 고정 상태 변경 오류:', error)
        console.error('[NEWS_UPDATE] 오류 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return NextResponse.json({ error: '고정 상태 변경 실패: ' + error.message }, { status: 500 })
      }

      console.log('[NEWS_UPDATE] 고정 상태 변경 성공:', data[0])
      return NextResponse.json({ 
        success: true, 
        newsItem: data[0] 
      })
    }

    // 필수 필드 검증 (고정 상태만 변경하는 경우가 아닐 때)
    const hasTitle = title?.trim() || title_es?.trim()
    const hasContent = content?.trim() || content_es?.trim()
    
    if (!hasTitle || !hasContent || !author) {
      console.log('[NEWS_UPDATE] 필수 필드 누락:', { hasTitle, hasContent, author })
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    // 출처가 비어있으면 기본값 사용
    const finalSource = source?.trim() || 'Amiko 편집팀'

    const updateData: any = {
      title,
      title_es: title_es || title,
      content,
      content_es: content_es || content,
      source: finalSource,
      category,
      author,
      published: published !== undefined ? published : true,
      updated_at: new Date().toISOString()
    }

    // 썸네일이 제공된 경우에만 업데이트
    if (thumbnail !== undefined) {
      updateData.thumbnail = thumbnail
    }

    // 고정 상태가 제공된 경우에만 업데이트
    if (is_pinned !== undefined) {
      updateData.is_pinned = is_pinned
    }

    const { data, error } = await supabaseServer
      .from('korean_news')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('[NEWS_UPDATE] 뉴스 수정 오류:', error)
      return NextResponse.json({ error: '뉴스 수정 실패' }, { status: 500 })
    }

    console.log('[NEWS_UPDATE] 뉴스 수정 성공:', data[0])
    return NextResponse.json({ 
      success: true, 
      newsItem: data[0] 
    })
  } catch (error) {
    console.error('[NEWS_UPDATE] 뉴스 수정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}