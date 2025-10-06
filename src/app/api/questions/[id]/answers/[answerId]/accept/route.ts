import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 답변 채택
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; answerId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: questionId, answerId } = params

    // 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // accept_answer 함수 호출
    const { data, error } = await supabaseServer.rpc('accept_answer', {
      p_post_id: questionId,
      p_comment_id: answerId,
      p_user_id: user.id
    })

    if (error) {
      console.error('[ACCEPT_ANSWER] 채택 실패:', error)
      return NextResponse.json(
        { error: error.message || '답변 채택에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '답변이 채택되었습니다.',
      data
    })

  } catch (error: any) {
    console.error('[ACCEPT_ANSWER] 서버 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 답변 채택 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: questionId } = params

    // 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // unaccept_answer 함수 호출
    const { data, error } = await supabaseServer.rpc('unaccept_answer', {
      p_post_id: questionId,
      p_user_id: user.id
    })

    if (error) {
      console.error('[UNACCEPT_ANSWER] 채택 취소 실패:', error)
      return NextResponse.json(
        { error: error.message || '답변 채택 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '답변 채택이 취소되었습니다.',
      data
    })

  } catch (error: any) {
    console.error('[UNACCEPT_ANSWER] 서버 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

