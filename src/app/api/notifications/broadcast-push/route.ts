import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { sendFCMv1Notification } from '@/lib/fcm-v1'

// VAPID 키 설정 (환경변수가 없으면 빌드 시점에 오류를 방지하기 위해 조건부로 설정)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:noreply@ozcodingschool.com',
    vapidPublicKey,
    vapidPrivateKey
  )
  console.log('[BROADCAST_PUSH] VAPID 키 설정 완료')
} else {
  console.warn('[BROADCAST_PUSH] VAPID 키가 설정되지 않았습니다. 푸시 알림 기능이 비활성화됩니다.')
}

export async function POST(request: Request) {
  try {
    // VAPID 키가 설정되지 않았으면 오류 반환
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[BROADCAST_PUSH] VAPID 키가 설정되지 않아 푸시 알림을 발송할 수 없습니다.')
      return NextResponse.json(
        {
          success: false,
          message: '푸시 알림 서비스가 설정되지 않았습니다.',
          error: 'VAPID 키가 설정되지 않음',
          suggestion: '환경변수 NEXT_PUBLIC_VAPID_PUBLIC_KEY와 VAPID_PRIVATE_KEY를 설정해주세요.'
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { title, body: messageBody, data, tag, actions, excludeUserId } = body

    console.log('📢 [BROADCAST_API] 푸시 알림 브로드캐스트 요청:', { title, messageBody, data, excludeUserId })

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, message: '제목과 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 모든 사용자의 푸시 구독 토큰 조회 (웹 푸시와 FCM 토큰 모두)
    // 뉴스의 경우 모든 사용자에게, 게시물의 경우 게시물 알림이 활성화된 사용자만 필터링
    let query = supabase
      .from('push_subscriptions')
      .select(`
        user_id,
        endpoint,
        p256dh,
        auth,
        native_token,
        created_at,
        notification_settings!inner(
          push_enabled
        )
      `)

    // 뉴스 브로드캐스트가 아닌 경우 (게시물 알림 등) 추가 필터링
    if (data?.type !== 'new_news') {
      query = query.select(`
        user_id,
        endpoint,
        p256dh,
        auth,
        native_token,
        created_at,
        notification_settings!inner(
          post_notifications_enabled,
          push_enabled
        )
      `)
      query = query.eq('notification_settings.post_notifications_enabled', true)
    }

    query = query.eq('notification_settings.push_enabled', true)

    // 특정 사용자를 제외할 경우 (예: 게시물 작성자)
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
    }

    const { data: subscriptions, error: subError } = await query

    if (subError) {
      console.error('[BROADCAST_PUSH] 구독 조회 실패:', subError)
      return NextResponse.json(
        { success: false, message: '사용자 구독 정보를 조회할 수 없습니다.' },
        { status: 500 }
      )
    }

    console.log(`[BROADCAST_PUSH] ${subscriptions?.length || 0}개의 구독 토큰 발견`)

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[BROADCAST_PUSH] 브로드캐스트할 구독자가 없습니다.')
      return NextResponse.json({
        success: true,
        message: '브로드캐스트할 구독자가 없습니다.',
        sent: 0,
        total: 0
      })
    }

    // 사용자별로 토큰 그룹화 (중복 제거)
    const userTokens: { [userId: string]: any[] } = {}
    subscriptions.forEach(sub => {
      if (!userTokens[sub.user_id]) {
        userTokens[sub.user_id] = []
      }
      userTokens[sub.user_id].push(sub)
    })

    console.log(`[BROADCAST_PUSH] ${Object.keys(userTokens).length}명의 사용자에게 브로드캐스트`)

    let totalSent = 0
    let totalFailed = 0
    const results = []

    // 각 사용자에게 푸시 알림 발송
    for (const [userId, tokens] of Object.entries(userTokens)) {
      try {
        console.log(`[BROADCAST_PUSH] 사용자 ${userId}에게 ${tokens.length}개 토큰으로 발송 시도`)

        // FCM 토큰 우선 사용 (네이티브 앱)
        const fcmTokens = tokens.filter(t => t.native_token).map(t => t.native_token)
        // 웹 푸시 토큰
        const webPushTokens = tokens.filter(t => !t.native_token && t.endpoint)

        let sentForUser = 0
        let failedForUser = 0

        // FCM 토큰으로 발송
        if (fcmTokens.length > 0) {
          console.log(`[BROADCAST_PUSH] FCM 토큰 ${fcmTokens.length}개로 발송`)
          const fcmResult = await sendFCMv1Notification({
            tokens: fcmTokens,
            title,
            body: messageBody,
            data: {
              ...data,
              userId,
              broadcast: true
            },
            tag,
            actions
          })

          if (fcmResult.success) {
            sentForUser += fcmResult.sent || 0
            failedForUser += fcmResult.failed || 0
            console.log(`[BROADCAST_PUSH] FCM 발송 결과: 성공 ${fcmResult.sent}, 실패 ${fcmResult.failed}`)
          } else {
            failedForUser += fcmTokens.length
            console.error('[BROADCAST_PUSH] FCM 발송 실패:', fcmResult.error)
          }
        }

        // 웹 푸시 토큰으로 발송
        if (webPushTokens.length > 0) {
          console.log(`[BROADCAST_PUSH] 웹 푸시 토큰 ${webPushTokens.length}개로 발송`)
          for (const token of webPushTokens) {
            try {
              const pushResult = await webpush.sendNotification({
                endpoint: token.endpoint,
                keys: {
                  p256dh: token.p256dh,
                  auth: token.auth
                }
              }, JSON.stringify({
                title,
                body: messageBody,
                data: {
                  ...data,
                  userId,
                  broadcast: true
                },
                tag,
                actions
              }))

              if (pushResult.statusCode === 201) {
                sentForUser++
                console.log(`[BROADCAST_PUSH] 웹 푸시 발송 성공: ${token.endpoint}`)
              } else {
                failedForUser++
                console.error(`[BROADCAST_PUSH] 웹 푸시 발송 실패 (${pushResult.statusCode}):`, pushResult)
              }
            } catch (webPushError) {
              failedForUser++
              console.error('[BROADCAST_PUSH] 웹 푸시 발송 예외:', webPushError)

              // 토큰이 유효하지 않으면 삭제
              if (webPushError.statusCode === 410 || webPushError.statusCode === 400) {
                console.log(`[BROADCAST_PUSH] 유효하지 않은 웹 푸시 토큰 삭제: ${token.endpoint}`)
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('endpoint', token.endpoint)
              }
            }
          }
        }

        totalSent += sentForUser
        totalFailed += failedForUser

        results.push({
          userId,
          tokens: tokens.length,
          sent: sentForUser,
          failed: failedForUser
        })

        console.log(`[BROADCAST_PUSH] 사용자 ${userId} 결과: 발송 ${sentForUser}, 실패 ${failedForUser}`)

      } catch (userError) {
        console.error(`[BROADCAST_PUSH] 사용자 ${userId} 처리 중 예외:`, userError)
        totalFailed += tokens.length
        results.push({
          userId,
          tokens: tokens.length,
          sent: 0,
          failed: tokens.length,
          error: userError.message
        })
      }
    }

    console.log(`[BROADCAST_PUSH] 브로드캐스트 완료: 총 ${totalSent}개 성공, ${totalFailed}개 실패`)

    return NextResponse.json({
      success: true,
      message: `브로드캐스트 완료: ${totalSent}개 성공, ${totalFailed}개 실패`,
      sent: totalSent,
      failed: totalFailed,
      total: totalSent + totalFailed,
      results
    })

  } catch (error) {
    console.error('[BROADCAST_PUSH] 브로드캐스트 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: '푸시 알림 브로드캐스트 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
