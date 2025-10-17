import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 간단한 테이블 존재 확인
    const { data, error } = await supabase
      .from('verification_codes')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 연결 실패',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 성공',
      tableExists: true,
      data: data
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '서버 오류',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
