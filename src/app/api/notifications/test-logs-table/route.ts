import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 [LOGS TABLE TEST] push_notification_logs 테이블 테스트 시작')
    
    // 1. 테이블 존재 여부 확인
    console.log('📋 [LOGS TABLE TEST] push_notification_logs 테이블 확인...')
    const { data: tableCheck, error: tableError } = await (supabase as any)
      .from('push_notification_logs')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error('❌ [LOGS TABLE TEST] 테이블 확인 실패:', tableError)
      return NextResponse.json({
        success: false,
        message: 'push_notification_logs 테이블 확인 실패',
        error: tableError.message,
        code: tableError.code
      }, { status: 500 })
    }
    
    console.log('✅ [LOGS TABLE TEST] push_notification_logs 테이블 존재 확인')
    
    // 2. 테이블 구조 확인 (간단한 쿼리)
    console.log('🔍 [LOGS TABLE TEST] 테이블 구조 확인...')
    const { data: structureTest, error: structureError } = await (supabase as any)
      .from('push_notification_logs')
      .select('id, user_id, title, body, status, created_at')
      .limit(5)
    
    if (structureError) {
      console.error('❌ [LOGS TABLE TEST] 구조 확인 실패:', structureError)
      return NextResponse.json({
        success: false,
        message: '테이블 구조 확인 실패',
        error: structureError.message,
        code: structureError.code
      }, { status: 500 })
    }
    
    console.log('✅ [LOGS TABLE TEST] 테이블 구조 확인 완료')
    
    // 3. 테스트 데이터 삽입 시도 (올바른 UUID 사용)
    console.log('📝 [LOGS TABLE TEST] 테스트 데이터 삽입 시도...')
    const testLog = {
      user_id: '51c2700d-611e-4875-ac7a-29f3e62dbd94', // 실제 존재하는 UUID 사용
      title: '테스트 알림',
      body: '테스트 메시지',
      data: { test: true },
      status: 'pending'
    }
    
    const { data: insertTest, error: insertError } = await (supabase as any)
      .from('push_notification_logs')
      .insert(testLog)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ [LOGS TABLE TEST] 테스트 데이터 삽입 실패:', insertError)
      return NextResponse.json({
        success: false,
        message: '테스트 데이터 삽입 실패',
        error: insertError.message,
        code: insertError.code,
        tableExists: true,
        structureOk: true
      }, { status: 500 })
    }
    
    console.log('✅ [LOGS TABLE TEST] 테스트 데이터 삽입 성공')
    
    // 4. 테스트 데이터 삭제
    console.log('🗑️ [LOGS TABLE TEST] 테스트 데이터 삭제...')
    if (insertTest?.id) {
      await (supabase as any)
        .from('push_notification_logs')
        .delete()
        .eq('id', insertTest.id)
      console.log('✅ [LOGS TABLE TEST] 테스트 데이터 삭제 완료')
    }
    
    return NextResponse.json({
      success: true,
      message: 'push_notification_logs 테이블 정상',
      timestamp: new Date().toISOString(),
      tableExists: true,
      structureOk: true,
      insertTest: true,
      existingRecords: structureTest?.length || 0
    })
    
  } catch (error) {
    console.error('❌ [LOGS TABLE TEST] 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: '로그 테이블 테스트 실패', error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error' },
      { status: 500 }
    )
  }
}
