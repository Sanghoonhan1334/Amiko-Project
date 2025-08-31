import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 상담사 목록 조회 (일반 사용자용)
export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: consultants, error } = await supabase
      .from('consultants')
      .select('id, name, specialty, hourly_rate, timezone, available_hours, is_active')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[CONSULTANTS] 목록 조회 실패:', error)
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
