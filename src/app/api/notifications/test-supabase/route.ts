import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    console.log('🧪 [SUPABASE TEST] Supabase 연결 테스트 시작')
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // 테이블 존재 여부 확인
    const { data: tableExists } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (!tableExists) {
      return NextResponse.json(
        { success: false, error: 'notifications 테이블이 존재하지 않습니다.' },
        { status: 500 }
      )
    }

    // 테이블 구조 확인
    const { data: structureData, error: structureError } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, type, created_at')
      .limit(5)

    if (structureError) {
      console.error('❌ 테이블 구조 확인 실패:', structureError)
      return NextResponse.json(
        { success: false, error: '테이블 구조 확인에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 컬럼 정보 확인
    const { error: columnsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('❌ 컬럼 정보 확인 실패:', columnsError)
      return NextResponse.json(
        { success: false, error: '컬럼 정보 확인에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 및 테이블 정상',
      timestamp: new Date().toISOString(),
      tableExists: true,
      queryTest: {
        count: structureData?.length || 0,
        sample: structureData?.slice(0, 2) || []
      }
    })
    
  } catch (error) {
    console.error('❌ [SUPABASE TEST] 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: 'Supabase 테스트 실패', error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error' },
      { status: 500 }
    )
  }
}
