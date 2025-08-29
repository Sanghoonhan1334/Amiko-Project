import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 알림 시스템 상태 확인
export async function GET() {
  try {
    const status = {
      notifications_table: false,
      notification_settings_table: false,
      notification_logs_table: false,
      database_connection: false,
      tables_ready: false
    }

    // 데이터베이스 연결 확인
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)

      if (connectionError && connectionError.code === 'PGRST205') {
        // 테이블이 없는 것은 정상적인 상황
        status.database_connection = true
      } else if (connectionError) {
        // 다른 에러는 연결 문제
        status.database_connection = false
        console.error('[NOTIFICATION STATUS] 데이터베이스 연결 확인 실패:', connectionError)
      } else {
        status.database_connection = true
      }
    } catch (connectionError) {
      status.database_connection = false
      console.error('[NOTIFICATION STATUS] 데이터베이스 연결 확인 중 예외:', connectionError)
    }

    // 각 테이블 존재 여부 확인
    try {
      // notifications 테이블
      const { data: notificationsCheck, error: notificationsError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)

      if (!notificationsError) {
        status.notifications_table = true
      } else if (notificationsError.code !== 'PGRST205') {
        console.error('[NOTIFICATION STATUS] notifications 테이블 확인 실패:', notificationsError)
      }

      // notification_settings 테이블
      const { data: settingsCheck, error: settingsError } = await supabase
        .from('notification_settings')
        .select('user_id')
        .limit(1)

      console.log('[NOTIFICATION STATUS] settings 테이블 확인 결과:', { data: settingsCheck, error: settingsError })

      if (!settingsError) {
        status.notification_settings_table = true
      } else if (settingsError.code !== 'PGRST205') {
        console.error('[NOTIFICATION STATUS] notification_settings 테이블 확인 실패:', settingsError)
      }

      // notification_logs 테이블
      const { data: logsCheck, error: logsError } = await supabase
        .from('notification_logs')
        .select('id')
        .limit(1)

      if (!logsError) {
        status.notification_logs_table = true
      } else if (logsError.code !== 'PGRST205') {
        console.error('[NOTIFICATION STATUS] notification_logs 테이블 확인 실패:', logsError)
      }

    } catch (tableCheckError) {
      console.error('[NOTIFICATION STATUS] 테이블 확인 중 예외:', tableCheckError)
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
