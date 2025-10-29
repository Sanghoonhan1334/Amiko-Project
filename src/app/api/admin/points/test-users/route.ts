import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// users 테이블 조회 테스트
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // users 조회
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .limit(10)

    console.log('[USERS TEST] 데이터:', data)
    console.log('[USERS TEST] 에러:', error)

    return NextResponse.json({ 
      success: true, 
      data,
      error: error?.message,
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('[USERS TEST] 예외 발생:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

