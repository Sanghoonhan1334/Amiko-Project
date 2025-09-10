import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 특정 문의의 답변 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: inquiryId } = await params

    const { data: responses, error } = await supabaseServer
      .from('inquiry_responses')
      .select(`
        *,
        users!inner(email, name)
      `)
      .eq('inquiry_id', inquiryId)
      .eq('is_internal', false) // 내부 메모 제외
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[INQUIRY RESPONSES API] 조회 실패:', error)
      return NextResponse.json(
        { error: '답변 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ responses })

  } catch (error) {
    console.error('[INQUIRY RESPONSES API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 문의에 답변 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: inquiryId } = await params
    const { responderId, responderType = 'admin', content, isInternal = false, attachments = [] } = await request.json()

    // 입력 검증
    if (!responderId || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['admin', 'user'].includes(responderType)) {
      return NextResponse.json(
        { error: '잘못된 응답자 타입입니다.' },
        { status: 400 }
      )
    }

    // 문의 존재 확인
    const { data: inquiry, error: inquiryError } = await supabaseServer
      .from('inquiries')
      .select('id, user_id')
      .eq('id', inquiryId)
      .single()

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 답변 생성
    const { data: response, error } = await (supabaseServer as any)
      .from('inquiry_responses')
      .insert({
        inquiry_id: inquiryId,
        responder_id: responderId,
        responder_type: responderType,
        content,
        is_internal: isInternal,
        attachments
      })
      .select(`
        *,
        users!inner(email, name)
      `)
      .single()

    if (error) {
      console.error('[INQUIRY RESPONSES API] 생성 실패:', error)
      return NextResponse.json(
        { error: '답변 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 관리자 답변인 경우 문의 상태를 'in_progress'로 변경
    if (responderType === 'admin' && !isInternal) {
      await (supabaseServer as any)
        .from('inquiries')
        .update({ status: 'in_progress' })
        .eq('id', inquiryId)
    }

    return NextResponse.json({
      response
    }, { status: 201 })

  } catch (error) {
    console.error('[INQUIRY RESPONSES API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
