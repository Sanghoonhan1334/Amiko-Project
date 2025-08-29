import { NextRequest, NextResponse } from 'next/server'

// OTP 코드 검증 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, target, code } = body

    // 입력 검증
    if (!channel || !target || !code) {
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

    // 코드 검증 (mock: '123456'이 유효한 코드)
    if (code !== '123456') {
      return NextResponse.json(
        { ok: false, error: 'INVALID_CODE' },
        { status: 400 }
      )
    }

    // TODO: 실제 Supabase 연동
    // 현재는 mock 데이터로 시뮬레이션
    
    const userId = 'mock-user-id' // TODO: 실제 로그인된 사용자 ID
    const now = new Date().toISOString()

    // 1. 현재 로그인 사용자 필드 업데이트
    const verificationField = `${channel}_verified_at`
    const userUpdateData = {
      [verificationField]: now
    }

    console.log('사용자 인증 상태 업데이트:', {
      userId,
      field: verificationField,
      value: now
    })

    // TODO: Supabase update 쿼리
    // const { data: userData, error: userError } = await supabase
    //   .from('profiles')
    //   .update(userUpdateData)
    //   .eq('id', userId)
    
    // if (userError) throw userError

    // 2. otp_attempts에 'verified' 상태로 insert
    const otpRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      channel,
      target,
      status: 'verified',
      created_at: now
    }

    console.log('OTP 검증 완료 기록:', {
      channel,
      target,
      code,
      record: otpRecord
    })

    // TODO: Supabase insert 쿼리
    // const { data: otpData, error: otpError } = await supabase
    //   .from('otp_attempts')
    //   .insert([otpRecord])
    
    // if (otpError) throw otpError

    // 성공 응답
    return NextResponse.json({
      ok: true,
      message: '인증이 완료되었습니다.',
      data: {
        channel,
        target,
        verified_at: now,
        user_id: userId
      }
    })

  } catch (error) {
    console.error('OTP 검증 오류:', error)
    
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
