import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, subscription, nativeToken, platform, tokenType } = body

    console.log('🔔 [API] 푸시 알림 구독 요청:', { userId, subscription, nativeToken, platform, tokenType })

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // Service Role Key 사용 (RLS 우회)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 네이티브 앱 토큰인 경우
    if (nativeToken) {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: `native://${platform}/${nativeToken}`, // 네이티브 토큰을 endpoint로 저장
          native_token: nativeToken,
          platform: platform || 'unknown',
          token_type: tokenType || 'fcm',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        })
        .select()

      if (error) {
        console.error('❌ 네이티브 푸시 구독 저장 실패:', error)
        return NextResponse.json(
          { success: false, message: '네이티브 구독 정보 저장에 실패했습니다.' },
          { status: 500 }
        )
      }

      // 자동으로 오래된 토큰 정리 (현재 토큰을 제외한 모든 토큰 삭제)
      console.log('🧹 자동 토큰 정리 시작:', userId)
      const { data: allTokens, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('id, native_token, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!fetchError && allTokens && allTokens.length > 1) {
        // 가장 최신 토큰을 제외한 나머지 삭제
        const newestToken = allTokens[0]
        const oldTokens = allTokens.slice(1)

        console.log(`📊 ${allTokens.length}개 토큰 발견, ${oldTokens.length}개 오래된 토큰 정리`)

        const oldTokenIds = oldTokens.map(t => t.id)
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .in('id', oldTokenIds)

        if (!deleteError) {
          console.log('✅ 자동 토큰 정리 완료')
        } else {
          console.warn('⚠️ 자동 토큰 정리 실패:', deleteError)
        }
      }

      console.log('✅ 네이티브 푸시 구독 저장 성공:', data)
      return NextResponse.json({
        success: true,
        message: '네이티브 푸시 알림 구독이 완료되었습니다.',
        data
      })
    }

    // 웹 푸시 구독인 경우
    if (!subscription) {
      return NextResponse.json(
        { success: false, message: '구독 정보 또는 네이티브 토큰이 필요합니다.' },
        { status: 400 }
      )
    }

    // 구독 정보 저장 또는 업데이트
    const { data, error } = await supabase
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

    // 자동으로 오래된 토큰 정리 (현재 구독을 제외한 모든 구독 삭제)
    console.log('🧹 자동 구독 정리 시작:', userId)
    const { data: allSubscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (!fetchError && allSubscriptions && allSubscriptions.length > 1) {
      // 가장 최신 구독을 제외한 나머지 삭제
      const newestSubscription = allSubscriptions[0]
      const oldSubscriptions = allSubscriptions.slice(1)

      console.log(`📊 ${allSubscriptions.length}개 구독 발견, ${oldSubscriptions.length}개 오래된 구독 정리`)

      const oldSubscriptionIds = oldSubscriptions.map(s => s.id)
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', oldSubscriptionIds)

      if (!deleteError) {
        console.log('✅ 자동 구독 정리 완료')
      } else {
        console.warn('⚠️ 자동 구독 정리 실패:', deleteError)
      }
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

    // Service Role Key 사용 (RLS 우회)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 구독 정보 삭제
    const { error } = await supabase
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
