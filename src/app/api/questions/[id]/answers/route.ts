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

    // 질문의 답변 목록 조회 (사용자 정보는 별도로 가져옴)
    const { data: answers, error } = await supabaseServer
      .from('post_comments')
      .select('id, content, created_at, updated_at, like_count, dislike_count, user_id, is_accepted, accepted_at')
      .eq('post_id', params.id)
      .eq('is_deleted', false)
      .is('parent_comment_id', null)
      .order('is_accepted', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[ANSWERS_API] 데이터베이스 오류:', error)
      return NextResponse.json(
        { error: '답변을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[ANSWERS_API] 답변 조회 성공:', answers?.length || 0, '개')

    // 사용자 ID 목록 추출
    const userIds = [...new Set(answers?.map(a => a.user_id).filter(Boolean))]
    
    // 사용자 정보 조회
    let usersMap: { [key: string]: any } = {}
    if (userIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)

      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as { [key: string]: any })
      }
    }

    // 답변 데이터 변환
    const answersWithAuthors = answers?.map(answer => {
      const author = usersMap[answer.user_id] || { id: answer.user_id, full_name: '알 수 없음', email: null }
      return {
        ...answer,
        author
      }
    }) || []

    return NextResponse.json({
      success: true,
      answers: answersWithAuthors
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
      .select('id, content, created_at, user_id')
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

    // 사용자 정보 조회
    const { data: author } = await supabaseServer
      .from('users')
      .select('id, full_name, email')
      .eq('id', answer.user_id)
      .single()

    // 게시물의 댓글 수 증가
    await supabaseServer.rpc('increment_comment_count', {
      post_id: params.id
    })

    console.log('[ANSWERS_API] 답변 생성 성공:', answer.id)

    return NextResponse.json({
      success: true,
      answer: {
        ...answer,
        author: author || { id: answer.user_id, full_name: '알 수 없음', email: null }
      }
    })

  } catch (error) {
    console.error('[ANSWERS_API] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
