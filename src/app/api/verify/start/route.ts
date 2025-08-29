import { NextRequest, NextResponse } from 'next/server'

// OTP 전송 시작 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, target } = body

    // 입력 검증
    if (!channel || !target) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      )
    }

    // 채널 유효성 검증
    const validChannels = ['wa', 'sms', 'email']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_CHANNEL' },
        { status: 400 }
      )
    }

    // TODO: 실제 Supabase 연동
    // 현재는 mock 데이터로 시뮬레이션
    
    // otp_attempts 테이블에 'sent' 상태로 insert
    const otpRecord = {
      id: crypto.randomUUID(),
      user_id: 'mock-user-id', // TODO: 실제 로그인된 사용자 ID
      channel,
      target,
      status: 'sent',
      created_at: new Date().toISOString()
    }

    console.log('OTP 전송 시작:', {
      channel,
      target,
      record: otpRecord
    })

    // TODO: Supabase insert 쿼리
    // const { data, error } = await supabase
    //   .from('otp_attempts')
    //   .insert([otpRecord])
    
    // if (error) throw error

    // 성공 응답
    return NextResponse.json({
      ok: true,
      message: 'OTP 전송이 시작되었습니다.',
      data: {
        channel,
        target,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5분 후 만료
      }
    })

  } catch (error) {
    console.error('OTP 전송 시작 오류:', error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}

// GET 메서드 차단
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
