import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[ANSWERS_API] GET 요청 시작:', params.id)
    
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 질문의 답변 목록 조회 (댓글을 답변으로 사용)
    const { data: answers, error } = await supabaseServer
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        like_count,
        dislike_count,
        author:users!post_comments_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('post_id', params.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[ANSWERS_API] 데이터베이스 오류:', error)
      return NextResponse.json(
        { error: '답변을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[ANSWERS_API] 답변 조회 성공:', answers?.length || 0, '개')

    return NextResponse.json({
      success: true,
      answers: answers || []
    })

  } catch (error) {
    console.error('[ANSWERS_API] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[ANSWERS_API] POST 요청 시작:', params.id)
    console.log('[ANSWERS_API] 요청 헤더:', Object.fromEntries(request.headers.entries()))
    
    if (!supabaseServer) {
      console.error('[ANSWERS_API] Supabase 서버 클라이언트가 없습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { content } = body

    // 필수 필드 검증
    if (!content?.trim()) {
      return NextResponse.json(
        { error: '답변 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 인증 토큰에서 사용자 ID 추출
    const authHeader = request.headers.get('Authorization')
    console.log('[ANSWERS_API] Authorization 헤더:', authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[ANSWERS_API] 인증 헤더가 없거나 잘못된 형식입니다.')
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('[ANSWERS_API] 토큰 길이:', token.length)
    
    // 토큰에서 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)
    
    if (userError) {
      console.error('[ANSWERS_API] 사용자 인증 오류:', userError)
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('[ANSWERS_API] 사용자 정보가 없습니다.')
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }
    
    console.log('[ANSWERS_API] 인증된 사용자:', user.id)

    console.log('[ANSWERS_API] 답변 생성 시도:', {
      post_id: params.id,
      user_id: user.id,
      content_length: content.trim().length
    })

    // 답변 생성
    const { data: answer, error: insertError } = await supabaseServer
      .from('post_comments')
      .insert({
        post_id: params.id,
        content: content.trim(),
        user_id: user.id,
        like_count: 0,
        dislike_count: 0,
        is_deleted: false
      })
      .select(`
        id,
        content,
        created_at,
        author:users!post_comments_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (insertError) {
      console.error('[ANSWERS_API] 답변 생성 오류:', insertError)
      console.error('[ANSWERS_API] 오류 상세:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        { error: '답변 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 게시물의 댓글 수 증가 (임시로 비활성화)
    console.log('[ANSWERS_API] 댓글 수 업데이트는 나중에 구현')

    console.log('[ANSWERS_API] 답변 생성 성공:', answer.id)

    return NextResponse.json({
      success: true,
      answer
    })

  } catch (error) {
    console.error('[ANSWERS_API] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
