import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 알림 시스템 상태 확인
export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const status = {
      notifications_table: false,
      notification_settings_table: false,
      notification_logs_table: false,
      database_connection: false,
      tables_ready: false
    }

    // 데이터베이스 연결 테스트
    const { error: connectionError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (connectionError) {
      console.error('❌ 데이터베이스 연결 실패:', connectionError)
      return NextResponse.json(
        { success: false, error: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 알림 테이블 상태 확인
    const { error: notificationsError } = await supabase
      .from('notifications')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (notificationsError) {
      console.error('❌ 알림 테이블 조회 실패:', notificationsError)
      return NextResponse.json(
        { success: false, error: '알림 테이블 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 로그 테이블 상태 확인
    const { error: logsError } = await supabase
      .from('notification_logs')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (logsError) {
      console.error('❌ 로그 테이블 조회 실패:', logsError)
      return NextResponse.json(
        { success: false, error: '로그 테이블 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 모든 필수 테이블이 준비되었는지 확인
    status.tables_ready = status.notifications_table && 
                          status.notification_settings_table && 
                          status.notification_logs_table

    // 상태에 따른 메시지 생성
    let message = ''
    if (status.tables_ready) {
      message = '알림 시스템이 정상적으로 작동하고 있습니다.'
    } else if (status.database_connection) {
      message = '데이터베이스는 연결되었지만 일부 테이블이 생성되지 않았습니다.'
    } else {
      message = '데이터베이스 연결에 문제가 있습니다.'
    }

    return NextResponse.json({
      success: true,
      status,
      message,
      recommendations: {
        if_tables_missing: 'database/notifications.sql 파일을 Supabase SQL Editor에서 실행하세요.',
        if_connection_failed: 'Supabase 프로젝트 설정과 환경 변수를 확인하세요.'
      }
    })

  } catch (error) {
    console.error('알림 시스템 상태 확인 실패:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '알림 시스템 상태 확인에 실패했습니다.',
        details: {
          error_message: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      },
      { status: 500 }
    )
  }
}
