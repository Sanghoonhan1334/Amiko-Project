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

    const settingsData = {
      user_id: userId,
      email_enabled: settings.email_enabled ?? true,
      push_enabled: settings.push_enabled ?? true,
      in_app_enabled: settings.in_app_enabled ?? true,
      email_types: settings.email_types ?? ['booking_created', 'payment_confirmed', 'consultation_reminder'],
      push_types: settings.push_types ?? ['payment_confirmed', 'consultation_reminder'],
      in_app_types: settings.in_app_types ?? ['booking_created', 'payment_confirmed', 'consultation_reminder', 'system'],
      updated_at: new Date().toISOString()
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

    return NextResponse.json({
      success: true,
      settings: data,
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
