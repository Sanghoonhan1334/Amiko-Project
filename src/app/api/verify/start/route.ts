import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/emailService'

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

    const supabase = createClient()

    // 인증 시도 제한 확인
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_auth_rate_limit', {
        p_identifier: target,
        p_auth_type: channel
      })

    if (rateLimitError || !rateLimitData) {
      console.error('인증 시도 제한 확인 실패:', rateLimitError)
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      )
    }

    // 인증코드 생성 (6자리 숫자)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // 기존 미인증 코드들 비활성화
    const { error: deactivateError } = await supabase
      .from('verification_codes')
      .update({ verified: true }) // 이미 사용된 것으로 처리
      .eq(channel === 'email' ? 'email' : 'phone_number', target)
      .eq('type', channel)
      .eq('verified', false)

    if (deactivateError) {
      console.error('기존 인증코드 비활성화 실패:', deactivateError)
    }

    // 새 인증코드 저장
    const { data: verificationData, error: insertError } = await supabase
      .from('verification_codes')
      .insert([{
        email: channel === 'email' ? target : null,
        phone_number: channel !== 'email' ? target : null,
        code: verificationCode,
        type: channel,
        verified: false,
        expires_at: expiresAt,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'Unknown'
      }])
      .select()
      .single()

    if (insertError || !verificationData) {
      console.error('인증코드 저장 실패:', insertError)
      return NextResponse.json(
        { ok: false, error: 'DATABASE_ERROR' },
        { status: 500 }
      )
    }

    // 이메일인 경우 실제 이메일 발송
    if (channel === 'email') {
      const emailSent = await sendVerificationEmail(target, verificationCode)
      
      if (!emailSent) {
        console.error('이메일 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'EMAIL_SEND_FAILED' },
          { status: 500 }
        )
      }
    }

    // 인증 로그 기록
    const { error: logError } = await supabase
      .rpc('log_auth_attempt', {
        p_user_id: null, // 아직 로그인하지 않은 상태
        p_auth_type: channel,
        p_action_type: 'resend',
        p_success: true,
        p_ip_address: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
        p_user_agent: request.headers.get('user-agent') || 'Unknown'
      })

    if (logError) {
      console.error('인증 로그 기록 실패:', logError)
      // 로그 실패는 인증코드 발송 성공에 영향을 주지 않음
    }

    console.log('OTP 전송 성공:', {
      channel,
      target,
      code: verificationCode.substring(0, 2) + '****', // 보안을 위해 코드 일부만 로그
      verificationId: verificationData.id,
      expiresAt
    })

    // 성공 응답
    return NextResponse.json({
      ok: true,
      message: '인증코드가 발송되었습니다.',
      data: {
        channel,
        target,
        expires_at: expiresAt
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