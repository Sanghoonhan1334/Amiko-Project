import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 상담사 목록 조회
export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: consultants, error } = await supabase
      .from('consultants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN CONSULTANTS] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '상담사 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consultants: consultants || [],
      message: '상담사 목록 조회 성공'
    })

  } catch (error) {
    console.error('상담사 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '상담사 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 상담사 추가
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, specialty, hourly_rate, timezone, available_hours, is_active } = body

    // 필수 필드 검증
    if (!name || !email || !hourly_rate) {
      return NextResponse.json(
        { success: false, error: '이름, 이메일, 시간당 요금은 필수입니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // 이메일 중복 확인
    const { data: existingConsultant } = await supabase
      .from('consultants')
      .select('id')
      .eq('email', email)
      .single()

    if (existingConsultant) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    // 상담사 추가
    const { data: consultant, error } = await supabase
      .from('consultants')
      .insert({
        name,
        email,
        specialty: specialty || '',
        hourly_rate,
        timezone: timezone || 'Asia/Seoul',
        available_hours: available_hours || {
          monday: ['09:00-18:00'],
          tuesday: ['09:00-18:00'],
          wednesday: ['09:00-18:00'],
          thursday: ['09:00-18:00'],
          friday: ['09:00-18:00'],
          saturday: [],
          sunday: []
        },
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('[ADMIN CONSULTANTS] 추가 실패:', error)
      return NextResponse.json(
        { success: false, error: '상담사 추가에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consultant,
      message: '상담사가 성공적으로 추가되었습니다.'
    })

  } catch (error) {
    console.error('상담사 추가 실패:', error)
    return NextResponse.json(
      { success: false, error: '상담사 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}
