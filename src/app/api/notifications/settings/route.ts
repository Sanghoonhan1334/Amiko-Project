import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 사용자별 알림 설정 조회
    const { data: settings, error: fetchError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('❌ 알림 설정 조회 실패:', fetchError)
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const settingsData: any = {
      user_id: userId,
      email_enabled: settings.email_enabled ?? true,
      push_enabled: settings.push_enabled ?? true,
      in_app_enabled: settings.in_app_enabled ?? true,
      email_types: settings.email_types ?? ['booking_created', 'payment_confirmed', 'consultation_reminder'],
      push_types: settings.push_types ?? ['payment_confirmed', 'consultation_reminder'],
      in_app_types: settings.in_app_types ?? ['booking_created', 'payment_confirmed', 'consultation_reminder', 'system'],
      updated_at: new Date().toISOString()
    }

    // 간소화된 알림 설정 필드
    if (settings.event_notifications_enabled !== undefined) {
      settingsData.event_notifications_enabled = settings.event_notifications_enabled
    }
    if (settings.interaction_notifications_enabled !== undefined) {
      settingsData.interaction_notifications_enabled = settings.interaction_notifications_enabled
    }
    if (settings.new_post_notifications_enabled !== undefined) {
      settingsData.new_post_notifications_enabled = settings.new_post_notifications_enabled
    }
    
    // 하위 호환성을 위한 필드 (기존 데이터 마이그레이션용)
    if (settings.like_notifications_enabled !== undefined) {
      settingsData.like_notifications_enabled = settings.like_notifications_enabled
    }
    if (settings.comment_notifications_enabled !== undefined) {
      settingsData.comment_notifications_enabled = settings.comment_notifications_enabled
    }
    if (settings.post_notifications_enabled !== undefined) {
      settingsData.post_notifications_enabled = settings.post_notifications_enabled
    }
    if (settings.daily_digest_enabled !== undefined) {
      settingsData.daily_digest_enabled = settings.daily_digest_enabled
    }
    if (settings.marketing_emails !== undefined) {
      settingsData.marketing_emails = settings.marketing_emails
    }

    // upsert를 사용하여 설정이 없으면 생성하고, 있으면 업데이트
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(settingsData, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ 알림 설정 저장 실패:', error)
      
      // 테이블이 없는 경우 로컬스토리지로 대체
      if (error.message.includes('relation') || error.code === '42P01') {
        console.log('[NOTIFICATION SETTINGS] 테이블 미생성 - localStorage 사용')
        return NextResponse.json({
          success: true,
          settings: settingsData,
          message: '설정이 로컬에 저장되었습니다.',
          is_local: true
        })
      }
      
      throw error
    }

    // 반환 데이터에 모든 필드 포함 (하위 호환성 포함)
    const responseData = {
      ...data,
      // 새로운 간소화된 필드
      event_notifications_enabled: data.event_notifications_enabled ?? data.marketing_emails ?? true,
      interaction_notifications_enabled: data.interaction_notifications_enabled ?? 
        (data.like_notifications_enabled && data.comment_notifications_enabled) ?? true,
      new_post_notifications_enabled: data.new_post_notifications_enabled ?? 
        (data.post_notifications_enabled && data.daily_digest_enabled) ?? true,
      // 기존 필드 (하위 호환성)
      like_notifications_enabled: data.like_notifications_enabled ?? true,
      comment_notifications_enabled: data.comment_notifications_enabled ?? true,
      post_notifications_enabled: data.post_notifications_enabled ?? true,
      daily_digest_enabled: data.daily_digest_enabled ?? true,
      daily_digest_time: data.daily_digest_time ?? '08:30:00',
      marketing_emails: data.marketing_emails ?? false
    }

    return NextResponse.json({
      success: true,
      settings: responseData,
      message: '알림 설정이 저장되었습니다.'
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
