import { NextRequest, NextResponse } from 'next/server'

// 지문 인증 등록
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, userDisplayName } = await request.json()

    if (!userId || !userName || !userDisplayName) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 임시로 지문 인증 등록 성공 처리 (테스트용)
    const mockCredentialId = `credential_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('[BIOMETRIC_REGISTER] Mock 지문 인증 등록:', {
      userId,
      userName,
      userDisplayName,
      credentialId: mockCredentialId
    })

    return NextResponse.json({
      success: true,
      message: '지문 인증이 등록되었습니다.',
      data: {
        credentialId: mockCredentialId,
        counter: 0
      }
    })

  } catch (error) {
    console.error('[BIOMETRIC_REGISTER] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 지문 인증 검증
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 임시로 지문 인증 성공 처리 (테스트용)
    console.log('[BIOMETRIC_VERIFY] Mock 지문 인증 성공:', { userId })

    return NextResponse.json({
      success: true,
      message: '지문 인증이 완료되었습니다.',
      data: {
        userId: userId,
        credentialId: `credential_${userId}`,
        counter: 1
      }
    })

  } catch (error) {
    console.error('[BIOMETRIC_VERIFY] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 지문 인증 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 임시로 지문 인증 목록 반환 (테스트용)
    const mockCredentials = [
      {
        id: `credential_${userId}_1`,
        deviceName: 'iPhone 15 Pro',
        deviceType: 'fingerprint',
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        counter: 5
      },
      {
        id: `credential_${userId}_2`,
        deviceName: 'MacBook Pro',
        deviceType: 'touchid',
        lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        counter: 12
      }
    ]
    
    console.log('[BIOMETRIC_LIST] Mock 지문 인증 목록 반환:', { userId, credentials: mockCredentials })

    return NextResponse.json({
      success: true,
      data: mockCredentials
    })

  } catch (error) {
    console.error('[BIOMETRIC_LIST] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 지문 인증 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const credentialId = searchParams.get('credentialId')

    if (!userId || !credentialId) {
      return NextResponse.json(
        { error: '사용자 ID와 인증 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 임시로 지문 인증 삭제 성공 처리 (테스트용)
    console.log('[BIOMETRIC_DELETE] Mock 지문 인증 삭제:', { userId, credentialId })

    return NextResponse.json({
      success: true,
      message: '지문 인증이 삭제되었습니다.',
      data: {
        credentialId: credentialId,
        biometricEnabled: true
      }
    })

  } catch (error) {
    console.error('[BIOMETRIC_DELETE] 오류:', error)
    return NextResponse.json(
      { error: '지문 인증 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
