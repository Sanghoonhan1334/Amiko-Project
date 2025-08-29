import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, subscription } = body

    console.log('🔔 [API] 푸시 알림 구독 요청:', { userId, subscription })

    if (!userId || !subscription) {
      return NextResponse.json(
        { success: false, message: '사용자 ID와 구독 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    // 구독 정보 저장 또는 업데이트
    const { data, error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()

    if (error) {
      console.error('❌ 푸시 구독 저장 실패:', error)
      return NextResponse.json(
        { success: false, message: '구독 정보 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 푸시 구독 저장 성공:', data)

    return NextResponse.json({
      success: true,
      message: '푸시 알림 구독이 완료되었습니다.',
      data
    })

  } catch (error) {
    console.error('❌ 푸시 구독 API 처리 중 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: '푸시 구독 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const endpoint = searchParams.get('endpoint')

    console.log('🔔 [API] 푸시 알림 구독 해제 요청:', { userId, endpoint })

    if (!userId || !endpoint) {
      return NextResponse.json(
        { success: false, message: '사용자 ID와 엔드포인트가 필요합니다.' },
        { status: 400 }
      )
    }

    // 구독 정보 삭제
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('❌ 푸시 구독 삭제 실패:', error)
      return NextResponse.json(
        { success: false, message: '구독 정보 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('✅ 푸시 구독 삭제 성공')

    return NextResponse.json({
      success: true,
      message: '푸시 알림 구독이 해제되었습니다.'
    })

  } catch (error) {
    console.error('❌ 푸시 구독 해제 API 처리 중 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: '푸시 구독 해제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
