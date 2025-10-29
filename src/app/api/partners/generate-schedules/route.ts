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

// 반복 스케줄을 available_schedules로 변환 (매일 실행 예정)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    const supabase = createClient()

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

    const body = await request.json()
    const { target_date } = body // 특정 날짜 (없으면 내일)

    // 대상 날짜 결정 (기본: 내일)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const targetDate = target_date ? new Date(target_date) : tomorrow
    const dayOfWeek = targetDate.getDay() // 0=일요일, 1=월요일, ..., 6=토요일

    // 해당 요일의 반복 스케줄 조회
    const { data: recurringSchedules, error: fetchError } = await supabase
      .from('partner_recurring_schedules')
      .select('*')
      .eq('partner_id', partner.user_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (fetchError) {
      console.error('반복 스케줄 조회 오류:', fetchError)
      return NextResponse.json(
        { error: '반복 스케줄 조회 실패' },
        { status: 500 }
      )
    }

    if (!recurringSchedules || recurringSchedules.length === 0) {
      return NextResponse.json({ 
        message: '변환할 반복 스케줄이 없습니다.',
        generated: 0
      })
    }

    // 날짜 문자열로 변환 (YYYY-MM-DD)
    const dateString = targetDate.toISOString().split('T')[0]
    const generated = []

    // 각 반복 스케줄을 available_schedules로 변환
    for (const schedule of recurringSchedules) {
      // 이미 존재하는지 확인
      const { data: existing } = await supabase
        .from('available_schedules')
        .select('*')
        .eq('partner_id', partner.user_id)
        .eq('date', dateString)
        .eq('start_time', schedule.start_time)
        .single()

      if (existing) {
        continue // 이미 존재하면 건너뛰기
      }

      // available_schedule 생성 (확정 전 상태로)
      const { data, error: insertError } = await supabase
        .from('available_schedules')
        .insert({
          partner_id: partner.user_id,
          date: dateString,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          status: 'available'
        })
        .select()
        .single()

      if (insertError) {
        console.error('가능 시간 생성 오류:', insertError)
        continue
      }

      generated.push(data)
    }

    return NextResponse.json({ 
      message: `${generated.length}개의 가능 시간이 생성되었습니다.`,
      generated: generated.length,
      schedules: generated
    })

  } catch (error) {
    console.error('가능 시간 생성 예외:', error)
    return NextResponse.json(
      { error: '가능 시간 생성 중 오류 발생' },
      { status: 500 }
    )
  }
}

