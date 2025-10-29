import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    
    // ZEP 이벤트 조회
    const { data, error } = await supabaseServer
      .from('events')
      .select('*')
      .eq('type', 'zep')
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[ZEP EVENT] 조회 실패:', error)
      return NextResponse.json(
        { error: '이벤트 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      event: data || null
    })

  } catch (error) {
    console.error('[ZEP EVENT] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = decodeURIComponent(token)
    
    // 토큰에서 사용자 정보 가져오기
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(decodedToken)
    
    if (authError || !authUser) {
      console.log('[ZEP EVENT] 인증 실패:', authError?.message)
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 관리자 체크 (admin_users 테이블에서)
    const { data: adminUser, error: adminError } = await supabaseServer
      .from('admin_users')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('is_active', true)
      .single()
    
    if (adminError || !adminUser) {
      console.log('[ZEP EVENT] 관리자 아님:', authUser.id)
      return NextResponse.json(
        { error: '권한이 없습니다. 관리자만 설정할 수 있습니다.' },
        { status: 403 }
      )
    }
    
    console.log('[ZEP EVENT] 관리자 확인:', adminUser.email)
    
    const { start_date, title, description, max_participants, zep_link } = body

    if (!start_date) {
      return NextResponse.json(
        { error: '시작 날짜가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 ZEP 이벤트 삭제 (하나만 유지)
    await supabaseServer
      .from('events')
      .delete()
      .eq('type', 'zep')

    // 새 ZEP 이벤트 생성
    const { data, error } = await supabaseServer
      .from('events')
      .insert({
        type: 'zep',
        title: title || 'Reunión con Operadores de ZEP',
        description: description || 'Tiempo para hablar directamente con los operadores una vez al mes',
        start_date: start_date,
        max_participants: max_participants || 30,
        zep_link: zep_link || 'https://zep.us/play/EgkBJz',
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) {
      console.error('[ZEP EVENT] 생성 실패:', error)
      return NextResponse.json(
        { error: '이벤트 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      event: data,
      message: 'ZEP 이벤트가 설정되었습니다.'
    })

  } catch (error) {
    console.error('[ZEP EVENT] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

