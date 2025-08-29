import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 상담사 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: consultant, error } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[ADMIN CONSULTANT] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '상담사 정보 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!consultant) {
      return NextResponse.json(
        { success: false, error: '상담사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      consultant,
      message: '상담사 정보 조회 성공'
    })

  } catch (error) {
    console.error('상담사 정보 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '상담사 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 상담사 정보 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, specialty, hourly_rate, timezone, available_hours, is_active } = body

    // 필수 필드 검증
    if (!name || !email || !hourly_rate) {
      return NextResponse.json(
        { success: false, error: '이름, 이메일, 시간당 요금은 필수입니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인 (자신 제외)
    const { data: existingConsultant } = await supabase
      .from('consultants')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .single()

    if (existingConsultant) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      )
    }

    // 상담사 정보 수정
    const { data: consultant, error } = await supabase
      .from('consultants')
      .update({
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
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN CONSULTANT] 수정 실패:', error)
      return NextResponse.json(
        { success: false, error: '상담사 정보 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consultant,
      message: '상담사 정보가 성공적으로 수정되었습니다.'
    })

  } catch (error) {
    console.error('상담사 정보 수정 실패:', error)
    return NextResponse.json(
      { success: false, error: '상담사 정보 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 상담사 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 상담사 삭제
    const { error } = await supabase
      .from('consultants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[ADMIN CONSULTANT] 삭제 실패:', error)
      return NextResponse.json(
        { success: false, error: '상담사 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '상담사가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('상담사 삭제 실패:', error)
    return NextResponse.json(
      { success: false, error: '상담사 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
