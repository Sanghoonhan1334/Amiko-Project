import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 가능 시간 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const scheduleId = params.id

    // 파트너 조회
    const { data: partner } = await supabase
      .from('conversation_partners')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json(
        { error: '파트너가 아닙니다.' },
        { status: 403 }
      )
    }

    // 스케줄 조회 및 권한 확인
    const { data: schedule } = await supabase
      .from('available_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (!schedule) {
      return NextResponse.json(
        { error: '스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (schedule.partner_id !== partner.user_id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 예약된 경우 삭제 불가
    if (schedule.status === 'booked') {
      return NextResponse.json(
        { error: '예약된 시간은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 삭제
    const { error } = await supabase
      .from('available_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      console.error('가능 시간 삭제 오류:', error)
      return NextResponse.json(
        { error: '가능 시간 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('가능 시간 삭제 예외:', error)
    return NextResponse.json(
      { error: '가능 시간 삭제 중 오류 발생' },
      { status: 500 }
    )
  }
}
