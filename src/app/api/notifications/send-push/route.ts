import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { sendFCMv1Notification } from '@/lib/fcm-v1'

// VAPID 키 설정 (환경변수가 없으면 빌드 시점에 오류를 방지하기 위해 조건부로 설정)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

console.log('🔧 [INIT] Environment variables check:')
console.log('   NEXT_PUBLIC_VAPID_PUBLIC_KEY:', vapidPublicKey ? '✅ Set' : '❌ Missing')
console.log('   VAPID_PRIVATE_KEY:', vapidPrivateKey ? '✅ Set' : '❌ Missing')
console.log('   FCM_SERVICE_ACCOUNT_JSON:', process.env.FCM_SERVICE_ACCOUNT_JSON ? '✅ Set' : '❌ Missing')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:noreply@ozcodingschool.com',
    vapidPublicKey,
    vapidPrivateKey
  )
  console.log('✅ [INIT] VAPID 키 설정 완료')
} else {
  console.warn('⚠️ [INIT] VAPID 키가 설정되지 않았습니다. 푸시 알림 기능이 비활성화됩니다.')
}

export async function POST(request: Request) {
  console.log('🚀 [API] Push notification request started')

  try {
    // VAPID 키가 설정되지 않았으면 오류 반환
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('❌ [API] VAPID 키가 설정되지 않아 푸시 알림을 발송할 수 없습니다.')
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
    const { userId, title, body: messageBody, data, tag, actions } = body

    console.log('📨 [API] Push notification request details:', {
      userId,
      title,
      messageBody: messageBody?.substring(0, 100) + (messageBody?.length > 100 ? '...' : ''),
      hasData: !!data,
      tag,
      hasActions: !!actions
    })

    if (!userId || !title || !messageBody) {
      console.log('❌ [API] Missing required fields:', { userId: !!userId, title: !!title, messageBody: !!messageBody })
      return NextResponse.json(
        { success: false, message: '사용자 ID, 제목, 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    console.log('🔗 [API] Supabase connection:', {
      url: supabaseUrl ? '✅ Set' : '❌ Missing',
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      usingAnonKey: !process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ [SUPABASE] SUPABASE_SERVICE_ROLE_KEY not set; falling back to anon key for server operations')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. 사용자의 푸시 구독 정보 조회
    console.log('🔍 [API] Fetching push subscriptions for user:', userId)
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('❌ [API] Push subscription fetch failed:', {
        error: fetchError.message,
        code: fetchError.code,
        hint: fetchError.hint,
        details: fetchError.details
      })
      return NextResponse.json(
        {
          success: false,
          message: '푸시 구독 정보 조회에 실패했습니다.',
          error: fetchError.message,
          details: {
            code: fetchError.code,
            hint: fetchError.hint
          }
        },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ [API] No push subscriptions found for user:', userId)
      return NextResponse.json(
        { success: false, message: '사용자에게 푸시 구독이 없습니다.' },
        { status: 404 }
      )
    }

    console.log('✅ [API] Push subscriptions found:', {
      count: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        platform: sub.platform,
        isNative: String(sub.endpoint).startsWith('native://'),
        hasNativeToken: !!sub.native_token,
        endpoint: sub.endpoint ? sub.endpoint.substring(0, 50) + '...' : null
      }))
    })

    // 2. 알림 로그 생성
    const { data: notificationLog, error: logError } = await supabase
      .from('push_notification_logs')
      .insert({
        user_id: userId,
        title,
        body: messageBody,
        data: data || {},
        status: 'pending'
      })
      .select()
      .single()

    if (logError) {
      console.error('❌ 알림 로그 생성 실패:', logError)
      return NextResponse.json(
        {
          success: false,
          message: '알림 로그 생성에 실패했습니다.',
          error: logError.message,
          details: {
            code: logError.code,
            hint: logError.hint,
            suggestion: logError.code === '42P01' ?
              'push_notification_logs 테이블이 존재하지 않습니다. Supabase에서 테이블을 생성해주세요.' :
              '데이터베이스 연결을 확인해주세요.'
          }
        },
        { status: 500 }
      )
    }

    console.log('✅ 알림 로그 생성 성공:', notificationLog.id)

    // 3. 각 구독에 대해 푸시 알림 발송
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: Record<string, unknown>) => {
        try {
          const pushPayload = {
            title,
            body: messageBody,
            icon: data?.icon || '/favicon.ico',
            badge: data?.badge || '/favicon.ico',
            tag: tag || 'default',
            data: {
              ...data,
              url: data?.url || '/notifications',
              notificationId: notificationLog.id
            },
            actions: actions || [],
            requireInteraction: data?.requireInteraction || false
          }

          // 네이티브 앱 토큰인지 확인
          const isNative = String(subscription.endpoint).startsWith('native://')

          if (isNative) {
            // 네이티브 앱 푸시 알림 (FCM HTTP v1 API 사용)
            const nativeToken = subscription.native_token as string
            const platform = subscription.platform as string

            console.log(`📱 [FCM] Attempting native push for ${platform}, token: ${nativeToken?.substring(0, 20)}...`)

            if (platform === 'android') {
              console.log('🔥 [FCM] Sending via FCM HTTP v1 API')
              try {
                console.log('🔑 [FCM] Checking FCM service account...')
                // Test FCM service account loading
                const testFCM = process.env.FCM_SERVICE_ACCOUNT_JSON
                if (!testFCM) {
                  console.error('❌ [FCM] FCM_SERVICE_ACCOUNT_JSON environment variable is missing!')
                  throw new Error('FCM_SERVICE_ACCOUNT_JSON not configured')
                }

                try {
                  const parsedFCM = JSON.parse(testFCM)
                  console.log('✅ [FCM] FCM service account JSON is valid:', {
                    project_id: parsedFCM.project_id,
                    client_email: parsedFCM.client_email?.substring(0, 30) + '...',
                    has_private_key: !!parsedFCM.private_key
                  })
                } catch (parseError) {
                  console.error('❌ [FCM] FCM_SERVICE_ACCOUNT_JSON is not valid JSON:', parseError)
                  throw new Error('Invalid FCM service account JSON')
                }

                console.log('📤 [FCM] Calling sendFCMv1Notification...')
                const result = await sendFCMv1Notification(
                  nativeToken,
                  title,
                  messageBody,
                  {
                    ...data,
                    url: data?.url || '/notifications',
                    notificationId: String(notificationLog.id)
                  }
                )

                console.log('📥 [FCM] FCM response received:', result)

                if (result.success) {
                  console.log('✅ [FCM] Push notification sent successfully:', {
                    subscriptionId: subscription.id,
                    messageId: result.messageId,
                    platform: 'android'
                  })
                  return {
                    subscriptionId: subscription.id,
                    success: true,
                    statusCode: 200,
                    platform: 'android',
                    messageId: result.messageId
                  }
                } else {
                  console.error('❌ [FCM] FCM returned failure:', {
                    errorCode: result.errorCode,
                    error: result.error,
                    subscriptionId: subscription.id
                  })

                  // Check if token is unregistered and delete all tokens for this user
                  if (result.errorCode === 'UNREGISTERED') {
                    console.log('🗑️ [FCM] Token unregistered - deleting all user tokens:', userId)
                    await supabase
                      .from('push_subscriptions')
                      .delete()
                      .eq('user_id', userId)
                  }

                  return {
                    subscriptionId: subscription.id,
                    success: false,
                    error: result.error || 'FCM v1 발송 실패',
                    errorCode: result.errorCode,
                    statusCode: 500
                  }
                }
              } catch (fcmError) {
                console.error('💥 [FCM] FCM sending exception:', {
                  error: fcmError instanceof Error ? fcmError.message : 'Unknown FCM error',
                  stack: fcmError instanceof Error ? fcmError.stack : undefined,
                  subscriptionId: subscription.id
                })
                return {
                  subscriptionId: subscription.id,
                  success: false,
                  error: fcmError instanceof Error ? fcmError.message : 'FCM v1 발송 실패',
                  statusCode: 500
                }
              }
            } else if (platform === 'ios') {
              // iOS는 아직 지원되지 않음
              console.warn(`[PUSH] iOS 푸시 알림은 아직 지원되지 않습니다.`)
              return {
                subscriptionId: subscription.id,
                success: false,
                error: 'iOS는 아직 지원되지 않습니다.',
                statusCode: 503
              }
            } else {
              return {
                subscriptionId: subscription.id,
                success: false,
                error: `지원되지 않는 플랫폼: ${platform}`,
                statusCode: 400
              }
            }
          } else {
            // 웹 푸시 알림
          const pushSubscription = {
            endpoint: String(subscription.endpoint),
            keys: {
              p256dh: String(subscription.p256dh_key),
              auth: String(subscription.auth_key)
            }
          }

          const result = await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(pushPayload)
          )

            console.log('✅ 웹 푸시 알림 발송 성공:', subscription.id, result.statusCode)

          return {
            subscriptionId: subscription.id,
            success: true,
              statusCode: result.statusCode,
              platform: 'web'
            }
          }

        } catch (error) {
          console.error('❌ 푸시 알림 발송 실패:', subscription.id, error)

          // 구독이 유효하지 않은 경우 삭제 (웹 푸시만)
          if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
            console.log('🗑️ 유효하지 않은 구독 삭제:', subscription.id)
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id)
          }

          return {
            subscriptionId: subscription.id,
            success: false,
            error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error',
            statusCode: error && typeof error === 'object' && 'statusCode' in error ? Number(error.statusCode) : 500
          }
        }
      })
    )

    // 4. 결과 분석
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length
    const errors = results.filter(r => r.status === 'rejected').length

    console.log('📊 [API] Push notification results summary:', {
      totalSubscriptions: subscriptions.length,
      successful,
      failed,
      errors,
      finalStatus: failed === 0 ? 'sent' : (successful > 0 ? 'partial' : 'failed')
    })

    // Log detailed results for each subscription
    console.log('📋 [API] Detailed results per subscription:')
    results.forEach((result, index) => {
      const subscription = subscriptions[index]
      if (result.status === 'fulfilled') {
        console.log(`   ${index + 1}. ${subscription.platform}:`, {
          success: result.value.success,
          subscriptionId: result.value.subscriptionId,
          statusCode: result.value.statusCode,
          error: result.value.error || null,
          platform: result.value.platform
        })
      } else {
        console.log(`   ${index + 1}. ${subscription.platform}: REJECTED`, {
          error: result.reason,
          subscriptionId: subscription.id
        })
      }
    })

    // 5. 알림 로그 상태 업데이트
    const finalStatus = failed === 0 ? 'sent' : (successful > 0 ? 'partial' : 'failed')

    console.log('💾 [API] Updating notification log status:', {
      notificationId: notificationLog.id,
      status: finalStatus,
      errorMessage: failed > 0 ? `${failed}개 구독에서 발송 실패` : null
    })

    await supabase
      .from('push_notification_logs')
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        error_message: failed > 0 ? `${failed}개 구독에서 발송 실패` : null
      })
      .eq('id', notificationLog.id)

    // 6. 응답 반환
    const responseData = {
      success: true,
      message: '푸시 알림 발송 완료',
      data: {
        notificationId: notificationLog.id,
        totalSubscriptions: subscriptions.length,
        successful,
        failed,
        errors,
        status: finalStatus
      }
    }

    console.log('✅ [API] Push notification API completed successfully:', responseData)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ 푸시 알림 발송 API 처리 중 예외 발생:', error)

    // VAPID 키 관련 에러 처리
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('VAPID')) {
      return NextResponse.json(
        {
          success: false,
          message: 'VAPID 키 설정에 문제가 있습니다.',
          error: error.message,
          details: {
            suggestion: 'VAPID 키가 올바르게 설정되었는지 확인하고 서버를 재시작해주세요.'
          }
        },
        { status: 500 }
      )
    }

    // 네트워크 관련 에러 처리
    if (error && typeof error === 'object' && 'code' in error && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      return NextResponse.json(
        {
          success: false,
          message: '네트워크 연결에 문제가 있습니다.',
          error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error',
          details: {
            code: error.code,
            suggestion: '인터넷 연결을 확인하고 다시 시도해주세요.'
          }
        },
        { status: 503 }
      )
    }

    // 일반 에러 처리
    return NextResponse.json(
      {
        success: false,
        message: '푸시 알림 발송 처리 중 오류가 발생했습니다.',
        error: error && typeof error === 'object' && 'message' in error ? String(error.message) : '알 수 없는 오류',
        details: {
          timestamp: new Date().toISOString(),
          suggestion: '잠시 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.'
        }
      },
      { status: 500 }
    )
  }
}

// 배치 푸시 알림 발송 (여러 사용자에게 동시 발송)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userIds, title, body: messageBody, data, tag, actions } = body

    console.log('🔔 [API] 배치 푸시 알림 발송 요청:', { userIds, title, messageBody })

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !messageBody) {
      return NextResponse.json(
        { success: false, message: '사용자 ID 배열, 제목, 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 각 사용자에게 개별적으로 발송
    const results = await Promise.allSettled(
      userIds.map(userId =>
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, title, body: messageBody, data, tag, actions })
        }).then(res => res.json())
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length
    const errors = results.filter(r => r.status === 'rejected').length

    console.log('📊 배치 푸시 알림 발송 결과:', { total: userIds.length, successful, failed, errors })

    return NextResponse.json({
      success: true,
      message: '배치 푸시 알림 발송 완료',
      data: {
        totalUsers: userIds.length,
        successful,
        failed,
        errors
      }
    })

  } catch (error) {
    console.error('❌ 배치 푸시 알림 발송 API 처리 중 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: '배치 푸시 알림 발송 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
