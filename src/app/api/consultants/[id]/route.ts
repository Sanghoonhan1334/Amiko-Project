import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 상담사 조회 (일반 사용자용)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: `잘못된 상담사 ID 형식입니다: ${id}` },
        { status: 400 }
      )
    }

    const { data: consultant, error } = await supabase
      .from('consultants')
      .select('id, name, specialty, hourly_rate, timezone, available_hours, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('[CONSULTANT] 조회 실패:', error)
      
      // PGRST116: no rows returned (상담사를 찾을 수 없음)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: `상담사 ID ${id}를 찾을 수 없습니다.` },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: '상담사 정보 조회에 실패했습니다.', details: error.message },
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
