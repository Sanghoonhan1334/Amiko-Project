import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 알림 설정 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 테이블 존재 여부 확인
    try {
      const { data: tableCheck, error: tableError } = await (supabase as any)
        .from('notification_settings')
        .select('id')
        .limit(1)

      if (tableError) {
        console.error('[NOTIFICATION SETTINGS] 테이블 확인 실패:', tableError)
        
        if (tableError.code === 'PGRST205') {
          // 테이블이 없으면 기본 설정 반환
          const defaultSettings = {
            user_id: userId,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder'],
            push_types: ['booking_created', 'payment_confirmed'],
            in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
          }
          
          return NextResponse.json({
            success: true,
            settings: defaultSettings,
            message: '알림 설정 테이블이 아직 생성되지 않았습니다. 기본 설정을 반환합니다.'
          })
        }
        
        throw tableError
      }
    } catch (checkError) {
      console.error('[NOTIFICATION SETTINGS] 테이블 확인 중 오류:', checkError)
      
      // 에러가 발생해도 기본 설정 반환
      const defaultSettings = {
        user_id: userId,
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder'],
        push_types: ['booking_created', 'payment_confirmed'],
        in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
      }
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        message: '데이터베이스 연결에 문제가 있습니다. 기본 설정을 반환합니다.'
      })
    }

    // 기존 설정 조회
    const { data: settings, error } = await (supabase as any)
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 설정이 없는 경우 기본 설정 생성
        const defaultSettings = {
          user_id: userId,
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder'],
          push_types: ['booking_created', 'payment_confirmed'],
          in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
        }

        try {
          const { data: newSettings, error: insertError } = await (supabase as any)
            .from('notification_settings')
            .insert(defaultSettings)
            .select()
            .single()

          if (insertError) {
            console.error('[NOTIFICATION SETTINGS] 기본 설정 생성 실패:', insertError)
            // 생성 실패해도 기본 설정 반환
            return NextResponse.json({
              success: true,
              settings: defaultSettings,
              message: '기본 설정을 반환합니다.'
            })
          }

          return NextResponse.json({
            success: true,
            settings: newSettings,
            message: '기본 설정이 생성되었습니다.'
          })
        } catch (insertError) {
          console.error('[NOTIFICATION SETTINGS] 기본 설정 생성 중 오류:', insertError)
          return NextResponse.json({
            success: true,
            settings: defaultSettings,
            message: '기본 설정을 반환합니다.'
          })
        }
      }

      console.error('[NOTIFICATION SETTINGS] 설정 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '알림 설정 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings,
      message: '알림 설정 조회 성공'
    })

  } catch (error) {
    console.error('알림 설정 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 설정 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 알림 설정 업데이트
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, ...settings } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 임시로 항상 성공 응답 반환 (테이블 생성 전까지)
    console.log('[NOTIFICATION SETTINGS] 임시 응답 반환 (테이블 미생성)')
    
    const tempSettings = {
      user_id: userId,
      email_enabled: settings.email_enabled ?? true,
      push_enabled: settings.push_enabled ?? true,
      in_app_enabled: settings.in_app_enabled ?? true,
      email_types: settings.email_types ?? ['booking_created', 'payment_confirmed', 'consultation_reminder'],
      push_types: settings.push_types ?? ['payment_confirmed', 'consultation_reminder'],
      in_app_types: settings.in_app_types ?? ['booking_created', 'payment_confirmed', 'consultation_reminder', 'system'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      settings: tempSettings,
      message: '임시 응답: notification_settings 테이블을 생성한 후 실제 저장이 가능합니다.',
      is_temporary: true
    })

  } catch (error) {
    console.error('알림 설정 업데이트 실패:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '알림 설정 업데이트에 실패했습니다.',
        details: {
          error_message: error instanceof Error ? error.message : '알 수 없는 오류',
          error_type: error instanceof Error ? error.constructor.name : typeof error
        }
      },
      { status: 500 }
    )
  }
}
