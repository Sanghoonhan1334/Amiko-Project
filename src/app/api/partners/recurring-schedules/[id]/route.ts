import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 헬퍼 함수: 인증 토큰에서 사용자 가져오기
async function getUserFromRequest(request: NextRequest) {
  // Authorization 헤더에서 토큰 추출 시도
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '').trim()
      const decodedToken = decodeURIComponent(token)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
        const { data: { user }, error } = await supabase.auth.getUser(decodedToken)
        if (user && !error) {
          return user
        }
      }
    } catch (error) {
      console.error('헤더 토큰 검증 실패:', error)
    }
  }

  // 헤더 토큰이 없거나 실패하면 쿠키에서 시도
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user || null
}

// 반복 스케줄 삭제 또는 비활성화
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const supabase = createClient()
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

    // 스케줄 소유권 확인
    const { data: schedule } = await supabase
      .from('partner_recurring_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('partner_id', partner.user_id)
      .single()

    if (!schedule) {
      return NextResponse.json(
        { error: '스케줄을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 비활성화 (삭제 대신 is_active를 false로)
    const { error } = await supabase
      .from('partner_recurring_schedules')
      .update({ is_active: false })
      .eq('id', scheduleId)

    if (error) {
      console.error('반복 스케줄 삭제 오류:', error)
      return NextResponse.json(
        { error: '반복 스케줄 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('반복 스케줄 삭제 예외:', error)
    return NextResponse.json(
      { error: '반복 스케줄 삭제 중 오류 발생' },
      { status: 500 }
    )
  }
}

