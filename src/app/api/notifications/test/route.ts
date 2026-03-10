import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    console.log('🧪 [TEST API] 테스트 API 호출됨')
    
    // 환경 변수 확인
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    
    console.log('🔑 [TEST API] VAPID 공개키 길이:', vapidPublicKey?.length || 0)
    console.log('🔑 [TEST API] VAPID 비공개키 길이:', vapidPrivateKey?.length || 0)
    
    return NextResponse.json({
      success: true,
      message: '테스트 API 정상 작동',
      timestamp: new Date().toISOString(),
      vapidKeys: {
        publicKeyLength: vapidPublicKey?.length || 0,
        privateKeyLength: vapidPrivateKey?.length || 0,
        publicKeyExists: !!vapidPublicKey,
        privateKeyExists: !!vapidPrivateKey
      }
    })
    
  } catch (error) {
    console.error('❌ [TEST API] 오류 발생:', error)
    return NextResponse.json(
      { success: false, message: '테스트 API 오류', error: error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error' },
      { status: 500 }
    )
  }
}
