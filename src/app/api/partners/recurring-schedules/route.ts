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

// 반복 스케줄 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // 사용자 토큰으로 Supabase 클라이언트 생성 (RLS를 위한 세션 설정)
    const authHeader = request.headers.get('Authorization')
    let supabase = createClient()
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '').trim()
        const decodedToken = decodeURIComponent(token)
        
        // 토큰으로 세션 설정된 클라이언트 생성
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${decodedToken}`
            }
          }
        })
        
        console.log('[GET /api/partners/recurring-schedules] 사용자 토큰으로 클라이언트 생성:', user.id)
      } catch (error) {
        console.error('[GET /api/partners/recurring-schedules] 토큰 클라이언트 생성 실패:', error)
        // 기본 클라이언트 사용 계속
      }
    }

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

    const { data, error } = await supabase
      .from('partner_recurring_schedules')
      .select('*')
      .eq('partner_id', partner.user_id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('반복 스케줄 조회 오류:', error)
      return NextResponse.json(
        { error: '반복 스케줄 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedules: data || [] })

  } catch (error) {
    console.error('반복 스케줄 조회 예외:', error)
    return NextResponse.json(
      { error: '반복 스케줄 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

// 반복 스케줄 등록
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // 사용자 토큰으로 Supabase 클라이언트 생성 (RLS를 위한 세션 설정)
    const authHeader = request.headers.get('Authorization')
    let supabase = createClient()
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '').trim()
        const decodedToken = decodeURIComponent(token)
        
        // 토큰으로 세션 설정된 클라이언트 생성
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${decodedToken}`
            }
          }
        })
        
        console.log('[POST /api/partners/recurring-schedules] 사용자 토큰으로 클라이언트 생성:', user.id)
      } catch (error) {
        console.error('[POST /api/partners/recurring-schedules] 토큰 클라이언트 생성 실패:', error)
        // 기본 클라이언트 사용 계속
      }
    }

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
    const { days_of_week, start_time, end_time } = body

    console.log('[POST /api/partners/recurring-schedules] 요청 데이터:', { days_of_week, start_time, end_time, partner_id: partner.user_id })

    if (!days_of_week || !Array.isArray(days_of_week) || days_of_week.length === 0) {
      return NextResponse.json(
        { error: '요일을 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: '시작 시간과 종료 시간이 필요합니다.' },
        { status: 400 }
      )
    }

    // 각 요일에 대해 반복 스케줄 생성
    const schedules = []
    const errors = []
    for (const dayOfWeek of days_of_week) {
      // 중복 체크
      const { data: existing, error: checkError } = await supabase
        .from('partner_recurring_schedules')
        .select('*')
        .eq('partner_id', partner.user_id)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', start_time)
        .eq('is_active', true)
        .maybeSingle()

      if (checkError) {
        console.error(`[POST /api/partners/recurring-schedules] 중복 체크 오류 (요일 ${dayOfWeek}):`, checkError)
      }

      if (existing) {
        console.log(`[POST /api/partners/recurring-schedules] 요일 ${dayOfWeek}는 이미 존재함, 건너뜀`)
        continue // 이미 존재하면 건너뛰기
      }

      const insertData = {
        partner_id: partner.user_id,
        day_of_week: dayOfWeek,
        start_time,
        end_time,
        is_active: true
      }
      
      console.log(`[POST /api/partners/recurring-schedules] 삽입 시도 (요일 ${dayOfWeek}):`, insertData)

      const { data, error } = await supabase
        .from('partner_recurring_schedules')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error(`[POST /api/partners/recurring-schedules] 요일 ${dayOfWeek} 스케줄 등록 오류:`, error)
        errors.push({ dayOfWeek, error: error.message })
        continue
      }

      console.log(`[POST /api/partners/recurring-schedules] 요일 ${dayOfWeek} 스케줄 등록 성공:`, data)
      schedules.push(data)
    }

    console.log(`[POST /api/partners/recurring-schedules] 최종 결과: ${schedules.length}개 성공, ${errors.length}개 실패`)

    if (errors.length > 0) {
      console.error(`[POST /api/partners/recurring-schedules] 등록 실패한 요일들:`, errors)
    }

    return NextResponse.json({ 
      schedules,
      errors: errors.length > 0 ? errors : undefined,
      message: `${schedules.length}개의 반복 스케줄이 등록되었습니다.`
    })

  } catch (error) {
    console.error('반복 스케줄 등록 예외:', error)
    return NextResponse.json(
      { error: '반복 스케줄 등록 중 오류 발생' },
      { status: 500 }
    )
  }
}

