import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    console.log('[QUESTIONS_API] GET 요청 시작')
    
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 자유게시판 갤러리 ID 조회
    const { data: gallery, error: galleryError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (galleryError || !gallery) {
      console.error('[QUESTIONS_API] 갤러리 조회 오류:', galleryError)
      return NextResponse.json(
        { error: '자유게시판을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // 질문 목록 조회 (자유게시판의 게시물들을 질문으로 사용)
    const { data: questions, error } = await supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        view_count,
        like_count,
        comment_count,
        user_id,
        images,
        author:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('gallery_id', gallery.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[QUESTIONS_API] 데이터베이스 오류:', error)
      console.error('[QUESTIONS_API] 오류 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: '질문을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[QUESTIONS_API] 질문 조회 성공:', questions?.length || 0, '개')

    return NextResponse.json({
      success: true,
      questions: questions || []
    })

  } catch (error) {
    console.error('[QUESTIONS_API] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[QUESTIONS_API] POST 요청 시작')
    
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { title, content, category = 'free', images = [] } = body

    // 필수 필드 검증
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: '제목과 내용을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 자유게시판 갤러리 ID 조회
    const { data: gallery, error: galleryError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (galleryError || !gallery) {
      console.error('[QUESTIONS_API] 갤러리 조회 오류:', galleryError)
      return NextResponse.json(
        { error: '게시판을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // 인증 토큰에서 사용자 ID 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 자유게시판 갤러리 ID 조회
    const { data: freeGallery, error: freeGalleryError } = await supabaseServer
      .from('galleries')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (freeGalleryError || !freeGallery) {
      console.error('[QUESTIONS_API] 갤러리 조회 오류:', freeGalleryError)
      return NextResponse.json(
        { error: '게시판을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // 질문 생성
    const { data: question, error: insertError } = await supabaseServer
      .from('gallery_posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        gallery_id: freeGallery.id,
        user_id: user.id,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        is_deleted: false,
        images: images // 이미지 정보 저장
      })
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        view_count,
        like_count,
        comment_count,
        user_id,
        images,
        author:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (insertError) {
      console.error('[QUESTIONS_API] 질문 생성 오류:', insertError)
      console.error('[QUESTIONS_API] 오류 상세:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        { error: '질문 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[QUESTIONS_API] 질문 생성 성공:', question.id)

    return NextResponse.json({
      success: true,
      question
    })

  } catch (error) {
    console.error('[QUESTIONS_API] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
