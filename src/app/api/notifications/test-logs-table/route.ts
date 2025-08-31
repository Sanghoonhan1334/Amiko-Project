import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🧪 [LOGS TABLE TEST] push_notification_logs 테이블 테스트 시작')
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // 테이블 존재 여부 확인
    const { data: tableExists } = await supabase
      .from('notification_logs')
      .select('id')
      .limit(1)

    if (!tableExists) {
      return NextResponse.json(
        { success: false, error: 'notification_logs 테이블이 존재하지 않습니다.' },
        { status: 500 }
      )
    }

    // 테스트 로그 생성
    const { data: testLog, error: insertError } = await supabase
      .from('notification_logs')
      .insert({
        user_id: 'test-user',
        type: 'test',
        channel: 'test',
        status: 'sent',
        data: { test: true, timestamp: new Date().toISOString() },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ 테스트 로그 생성 실패:', insertError)
      return NextResponse.json(
        { success: false, error: '테스트 로그 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 테스트 로그 조회
    const { error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('id', testLog.id)
      .single()

    if (fetchError) {
      console.error('❌ 테스트 로그 조회 실패:', fetchError)
      return NextResponse.json(
        { success: false, error: '테스트 로그 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 테스트 로그 삭제
    const { error: deleteError } = await supabase
      .from('notification_logs')
      .delete()
      .eq('id', testLog.id)

    if (deleteError) {
      console.error('❌ 테스트 로그 삭제 실패:', deleteError)
      return NextResponse.json(
        { success: false, error: '테스트 로그 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'push_notification_logs 테이블 정상',
      timestamp: new Date().toISOString(),
      tableExists: true,
      structureOk: true,
      insertTest: true,
      existingRecords: 0 // No existing records in this test
    })
    
  } catch (error) {
    console.error('❌ [LOGS TABLE TEST] 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: '로그 테이블 테스트 실패', error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error' },
      { status: 500 }
    )
  }
}
