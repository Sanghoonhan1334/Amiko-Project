import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 상담사별 예약 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 상담사 존재 여부 확인
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('id')
      .eq('id', id)
      .single()

    if (consultantError || !consultant) {
      return NextResponse.json(
        { success: false, error: '상담사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상담사별 예약 목록 조회 (사용자 정보 포함)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (
          email
        )
      `)
      .eq('consultant_id', id)
      .order('start_at', { ascending: true })

    if (error) {
      console.error('[CONSULTANT BOOKINGS] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '예약 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      message: '상담사별 예약 목록 조회 성공'
    })

  } catch (error) {
    console.error('상담사별 예약 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '상담사별 예약 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
