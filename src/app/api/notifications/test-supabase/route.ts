import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 [SUPABASE TEST] Supabase 연결 테스트 시작')
    
    // 1. 기본 연결 테스트
    console.log('🔗 [SUPABASE TEST] 기본 연결 테스트...')
    
    // 2. push_subscriptions 테이블 존재 여부 확인
    console.log('📋 [SUPABASE TEST] push_subscriptions 테이블 확인...')
    const { data: tableCheck, error: tableError } = await (supabase as any)
      .from('push_subscriptions')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error('❌ [SUPABASE TEST] 테이블 확인 실패:', tableError)
      return NextResponse.json({
        success: false,
        message: 'push_subscriptions 테이블 확인 실패',
        error: tableError.message,
        code: tableError.code
      }, { status: 500 })
    }
    
    console.log('✅ [SUPABASE TEST] push_subscriptions 테이블 존재 확인')
    
    // 3. 테이블 구조 확인
    console.log('🔍 [SUPABASE TEST] 테이블 구조 확인...')
    const { data: columns, error: columnsError } = await (supabase as any)
      .rpc('get_table_columns', { table_name: 'push_subscriptions' })
      .single()
    
    if (columnsError) {
      console.log('⚠️ [SUPABASE TEST] 컬럼 정보 조회 실패 (정상적일 수 있음):', columnsError.message)
    } else {
      console.log('✅ [SUPABASE TEST] 테이블 구조 확인 완료')
    }
    
    // 4. 간단한 쿼리 테스트
    console.log('🔍 [SUPABASE TEST] 간단한 쿼리 테스트...')
    const { data: queryTest, error: queryError } = await (supabase as any)
      .from('push_subscriptions')
      .select('id, user_id, endpoint')
      .limit(5)
    
    if (queryError) {
      console.error('❌ [SUPABASE TEST] 쿼리 테스트 실패:', queryError)
      return NextResponse.json({
        success: false,
        message: '쿼리 테스트 실패',
        error: queryError.message,
        code: queryError.code
      }, { status: 500 })
    }
    
    console.log('✅ [SUPABASE TEST] 쿼리 테스트 성공')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 및 테이블 정상',
      timestamp: new Date().toISOString(),
      tableExists: true,
      queryTest: {
        count: queryTest?.length || 0,
        sample: queryTest?.slice(0, 2) || []
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
