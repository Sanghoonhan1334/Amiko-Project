import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { status, admin_notes } = body

    // 상태 유효성 검증
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'completed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: '유효하지 않은 상태입니다.' },
        { status: 400 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    // 데이터베이스 업데이트
    if (!supabase) {
      return NextResponse.json(
        { message: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('partnership_inquiries')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('데이터베이스 오류:', error)
      return NextResponse.json(
        { message: '제휴 문의 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: '해당 제휴 문의를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: '제휴 문의가 성공적으로 업데이트되었습니다.',
      data: data[0]
    })

  } catch (error) {
    console.error('제휴 문의 업데이트 API 오류:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // 데이터베이스에서 삭제
    if (!supabase) {
      return NextResponse.json(
        { message: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { error } = await supabase
      .from('partnership_inquiries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('데이터베이스 오류:', error)
      return NextResponse.json(
        { message: '제휴 문의 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '제휴 문의가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('제휴 문의 삭제 API 오류:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
