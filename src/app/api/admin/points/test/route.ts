import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 테스트: 단순 조회만
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. user_points만 조회 (users 조인 없이)
    const { data, error } = await supabase
      .from('user_points')
      .select('user_id, total_points, monthly_points')
      .order('total_points', { ascending: false })
      .limit(10)

    console.log('[TEST API] 데이터:', data)
    console.log('[TEST API] 에러:', error)

    if (error) {
      return NextResponse.json({ 
        error: '조회 실패', 
        details: error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('[TEST API] 예외 발생:', error)
    return NextResponse.json({ 
      error: '예외 발생', 
      details: error.message 
    }, { status: 500 })
  }
}

