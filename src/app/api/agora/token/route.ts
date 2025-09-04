import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

export async function POST(request: NextRequest) {
  try {
    const { channelName, uid } = await request.json()
    
    if (!channelName || !uid) {
      return NextResponse.json(
        { error: 'channelName and uid are required' },
        { status: 400 }
      )
    }

    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE
    
    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: 'Agora credentials not configured' },
        { status: 500 }
      )
    }

    // 토큰 만료 시간 (24시간)
    const expirationTimeInSeconds = 3600 * 24
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // 토큰 생성
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
