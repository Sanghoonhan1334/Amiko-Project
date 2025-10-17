import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = createClient()

    // 인증코드 검증
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq(channel === 'email' ? 'email' : 'phone_number', target)
      .eq('type', channel)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError || !verificationData) {
      console.error('인증코드 검증 실패:', verificationError)
      return NextResponse.json(
        { ok: false, error: 'INVALID_CODE' },
        { status: 400 }
      )
    }

    // 인증코드를 verified로 업데이트
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ 
        verified: true, 
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationData.id)

    if (updateError) {
      console.error('인증코드 업데이트 실패:', updateError)
      return NextResponse.json(
        { ok: false, error: 'UPDATE_FAILED' },
        { status: 500 }
      )
    }

    // 사용자 인증 상태 업데이트 (이메일인 경우)
    if (channel === 'email') {
      const { error: authStatusError } = await supabase
        .rpc('update_user_auth_status', {
          p_user_id: verificationData.user_id || null,
          p_email_verified: true
        })

      if (authStatusError) {
        console.error('사용자 인증 상태 업데이트 실패:', authStatusError)
        // 인증코드는 이미 verified로 처리되었으므로 계속 진행
      }
    }

    // 인증 로그 기록
    const { error: logError } = await supabase
      .rpc('log_auth_attempt', {
        p_user_id: verificationData.user_id || null,
        p_auth_type: channel,
        p_action_type: 'verify',
        p_success: true,
        p_ip_address: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
        p_user_agent: request.headers.get('user-agent') || 'Unknown'
      })

    if (logError) {
      console.error('인증 로그 기록 실패:', logError)
      // 로그 실패는 인증 성공에 영향을 주지 않음
    }

    console.log('OTP 검증 성공:', {
      channel,
      target,
      code: code.substring(0, 2) + '****', // 보안을 위해 코드 일부만 로그
      verificationId: verificationData.id
    })

    // 성공 응답
    return NextResponse.json({
      ok: true,
      message: '인증이 완료되었습니다.',
      verified: true
    })

  } catch (error) {
    console.error('OTP 검증 오류:', error)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_SERVER_ERROR' },
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