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

// 한국인 파트너의 가능 시간 등록
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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${decodedToken}`
            }
          }
        })
        
        console.log('[POST /api/partners/schedules] 사용자 토큰으로 클라이언트 생성:', user.id)
      } catch (error) {
        console.error('[POST /api/partners/schedules] 토큰 클라이언트 생성 실패:', error)
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
    const { date, start_time, end_time } = body

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: '날짜, 시작 시간, 종료 시간이 모두 필요합니다.' },
        { status: 400 }
      )
    }

    // 중복 시간 체크
    const { data: existing, error: checkError } = await supabase
      .from('available_schedules')
      .select('*')
      .eq('partner_id', partner.user_id)
      .eq('date', date)
      .eq('start_time', start_time)
      .maybeSingle()

    if (checkError) {
      console.error('[POST /api/partners/schedules] 중복 체크 오류:', checkError)
    }

    if (existing) {
      console.log('[POST /api/partners/schedules] 중복 시간 발견:', existing)
      return NextResponse.json(
        { 
          error: '이미 해당 시간이 등록되어 있습니다.',
          existingSchedule: existing
        },
        { status: 400 }
      )
    }

    // 가능 시간 등록
    const insertData = {
      partner_id: partner.user_id,
      date,
      start_time,
      end_time,
      status: 'available'
    }
    
    console.log('[POST /api/partners/schedules] 삽입 시도:', insertData)
    
    const { data, error } = await supabase
      .from('available_schedules')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/partners/schedules] 가능 시간 등록 오류:', error)
      return NextResponse.json(
        { error: '가능 시간 등록 실패', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('[POST /api/partners/schedules] 가능 시간 등록 성공:', data)

    return NextResponse.json({ schedule: data })

  } catch (error) {
    console.error('가능 시간 등록 예외:', error)
    return NextResponse.json(
      { error: '가능 시간 등록 중 오류 발생' },
      { status: 500 }
    )
  }
}

// 한국인 파트너의 등록된 가능 시간 목록 조회
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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${decodedToken}`
            }
          }
        })
        
        console.log('[GET /api/partners/schedules] 사용자 토큰으로 클라이언트 생성:', user.id)
      } catch (error) {
        console.error('[GET /api/partners/schedules] 토큰 클라이언트 생성 실패:', error)
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // 특정 날짜만 조회 (선택적)

    let query = supabase
      .from('available_schedules')
      .select('*')
      .eq('partner_id', partner.user_id)

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query.order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('[GET /api/partners/schedules] 가능 시간 조회 오류:', error)
      return NextResponse.json(
        { error: '가능 시간 조회 실패', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[GET /api/partners/schedules] 파트너 ID: ${partner.user_id}, 조회된 스케줄 수: ${data?.length || 0}`)
    if (data && data.length > 0) {
      console.log('[GET /api/partners/schedules] 조회된 스케줄 상세:', JSON.stringify(data, null, 2))
    } else {
      console.log('[GET /api/partners/schedules] 조회된 스케줄이 없습니다.')
      // 파트너의 모든 스케줄 확인 (RLS 문제 진단용)
      const { data: allSchedules, error: allError } = await supabase
        .from('available_schedules')
        .select('*')
        .eq('partner_id', partner.user_id)
      console.log('[GET /api/partners/schedules] RLS 진단 - 전체 조회 결과:', { 
        count: allSchedules?.length || 0, 
        error: allError,
        schedules: allSchedules 
      })
    }
    
    if (date) {
      console.log(`[GET /api/partners/schedules] 날짜 필터: ${date}`)
    }

    return NextResponse.json({ schedules: data || [] })

  } catch (error) {
    console.error('가능 시간 조회 예외:', error)
    return NextResponse.json(
      { error: '가능 시간 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

