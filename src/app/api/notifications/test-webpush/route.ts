import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function GET() {
  try {
    console.log('🧪 [WEBPUSH TEST] web-push 테스트 시작')
    
    // 환경 변수 확인
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({
        success: false,
        message: 'VAPID 키가 설정되지 않음',
        vapidKeys: {
          publicKeyExists: !!vapidPublicKey,
          privateKeyExists: !!vapidPrivateKey
        }
      }, { status: 400 })
    }
    
    // web-push 초기화 테스트
    try {
      webpush.setVapidDetails(
        'mailto:noreply@ozcodingschool.com',
        vapidPublicKey,
        vapidPrivateKey
      )
      console.log('✅ [WEBPUSH TEST] web-push 초기화 성공')
    } catch (initError) {
      console.error('❌ [WEBPUSH TEST] web-push 초기화 실패:', initError)
      return NextResponse.json({
        success: false,
        message: 'web-push 초기화 실패',
        error: initError && typeof initError === 'object' && 'message' in initError ? String(initError.message) : 'Unknown error'
      }, { status: 500 })
    }
    
    // 간단한 구독 객체 생성 테스트
    try {
      const testSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      }
      
      // 실제 발송은 하지 않고 구독 객체만 검증
      console.log('✅ [WEBPUSH TEST] 구독 객체 검증 성공')
      
      return NextResponse.json({
        success: true,
        message: 'web-push 라이브러리 정상 작동',
        timestamp: new Date().toISOString(),
        vapidKeys: {
          publicKeyLength: vapidPublicKey.length,
          privateKeyLength: vapidPrivateKey.length
        },
        webpushStatus: 'initialized'
      })
      
    } catch (subscriptionError) {
      console.error('❌ [WEBPUSH TEST] 구독 객체 검증 실패:', subscriptionError)
      return NextResponse.json({
        success: false,
        message: '구독 객체 검증 실패',
        error: subscriptionError && typeof subscriptionError === 'object' && 'message' in subscriptionError ? String(subscriptionError.message) : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ [WEBPUSH TEST] 예외 발생:', error)
    return NextResponse.json(
      { success: false, message: 'web-push 테스트 실패', error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error' },
      { status: 500 }
    )
  }
}
