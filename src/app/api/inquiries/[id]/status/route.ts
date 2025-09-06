import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 문의 상태 업데이트
export async function PUT(
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
    const { status } = await request.json()

    // 입력 검증
    if (!status) {
      return NextResponse.json(
        { error: '상태가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: '잘못된 상태입니다.' },
        { status: 400 }
      )
    }

    // 문의 존재 확인
    const { data: inquiry, error: inquiryError } = await supabaseServer
      .from('inquiries')
      .select('id, status')
      .eq('id', inquiryId)
      .single()

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 업데이트
    const { data: updatedInquiry, error } = await (supabaseServer as any)
      .from('inquiries')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', inquiryId)
      .select()
      .single()

    if (error) {
      console.error('[INQUIRY STATUS API] 업데이트 실패:', error)
      return NextResponse.json(
        { error: '상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 상태 변경 히스토리는 트리거에서 자동 생성됨

    return NextResponse.json({
      inquiry: updatedInquiry
    })

  } catch (error) {
    console.error('[INQUIRY STATUS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
