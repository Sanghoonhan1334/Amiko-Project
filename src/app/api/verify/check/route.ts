import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toE164, normalizeDigits } from '@/lib/phoneUtils'

// OTP 코드 검증 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, target, code, nationality } = body

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

    // 코드 정규화 (유니코드 숫자 처리)
    const normalizedCode = normalizeDigits(code)
    if (normalizedCode.length !== 6) {
      console.error('[VERIFY_CHECK] 코드 길이 이상:', { 
        original: code, 
        normalized: normalizedCode, 
        length: normalizedCode.length 
      })
      return NextResponse.json(
        { ok: false, error: 'INVALID_CODE_FORMAT' },
        { status: 400 }
      )
    }

    // DB type 변환: 'wa' → 'sms' (저장 시와 동일하게)
    const dbType = channel === 'wa' ? 'sms' : channel

    // 전화번호인 경우 정규화 (verification_codes 테이블에는 정규화된 형식으로 저장되므로)
    let normalizedTarget = target
    if (channel !== 'email') {
      // 이미 E.164 형식인지 확인
      if (target.startsWith('+')) {
        normalizedTarget = target
      } else if (nationality) {
        // nationality가 있으면 정규화 시도
        normalizedTarget = toE164(target, nationality)
        
        // 정규화 실패 시 원본 사용 (하위 호환성)
        if (!normalizedTarget.startsWith('+')) {
          console.warn('[VERIFY_CHECK] 전화번호 정규화 실패, 원본 사용:', { target, nationality, normalizedTarget })
          normalizedTarget = target
        } else {
          console.log('[VERIFY_CHECK] 전화번호 정규화 성공:', { target, nationality, normalizedTarget })
        }
      }
      // nationality가 없고 E.164 형식도 아니면 원본 사용 (하위 호환성)
    }

    const supabase = createClient()

    // 인증코드 검증 (정규화된 전화번호 또는 원본 전화번호로 검색)
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq(channel === 'email' ? 'email' : 'phone_number', normalizedTarget)
      .eq('type', dbType) // 'wa' → 'sms'로 변환된 값 사용
      .eq('code', normalizedCode) // 정규화된 코드 사용
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError || !verificationData) {
      console.error('[VERIFY_CHECK] 인증코드 검증 실패:', verificationError)
      console.error('[VERIFY_CHECK] 검색 조건:', { 
        target: normalizedTarget, 
        type: dbType, 
        code: normalizedCode.substring(0, 2) + '****',
        channel
      })
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

    // 사용자 인증 상태 업데이트
    if (channel === 'email') {
      // 이메일로 사용자 찾기
      const { data: userData, error: userFindError } = await supabase
        .from('users')
        .select('id')
        .eq('email', target)
        .maybeSingle()

      if (!userFindError && userData?.id) {
        // email_verified_at 직접 업데이트
        const { error: updateUserError } = await supabase
          .from('users')
          .update({ 
            email_verified_at: new Date().toISOString()
          })
          .eq('id', userData.id)

        if (updateUserError) {
          console.error('이메일 인증 시간 업데이트 실패:', updateUserError)
        } else {
          console.log('이메일 인증 시간 업데이트 성공:', userData.id)
        }
      } else {
        // RPC 함수로도 시도 (fallback)
      const { error: authStatusError } = await supabase
        .rpc('update_user_auth_status', {
          p_user_id: verificationData.user_id || null,
          p_email_verified: true
        })

      if (authStatusError) {
        console.error('사용자 인증 상태 업데이트 실패:', authStatusError)
        }
      }
    } else if (channel === 'sms' || channel === 'wa') {
      // SMS 또는 WhatsApp 인증 완료 시 sms_verified_at 업데이트
      // 전화번호로 사용자 찾기 (하이픈 제거 후 비교)
      const cleanPhone = target.replace(/\D/g, '')
      
      // verificationData.user_id가 있으면 직접 사용
      let userId = verificationData.user_id
      
      // user_id가 없으면 전화번호로 찾기
      if (!userId) {
        const { data: userData, error: userFindError } = await supabase
          .from('users')
          .select('id, phone')
          .or(`phone.eq.${target},phone.eq.${cleanPhone}`)
          .maybeSingle()

        if (!userFindError && userData?.id) {
          userId = userData.id
        }
      }

      if (userId) {
        // sms_verified_at 직접 업데이트
        const { error: updateUserError } = await supabase
          .from('users')
          .update({ 
            sms_verified_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateUserError) {
          console.error('SMS 인증 시간 업데이트 실패:', updateUserError)
        } else {
          console.log('SMS 인증 시간 업데이트 성공:', userId)
        }
      } else {
        console.warn('SMS 인증 완료했지만 사용자를 찾을 수 없음:', { target, cleanPhone, verificationId: verificationData.id })
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

    console.log('[VERIFY_CHECK] OTP 검증 성공:', {
      channel,
      dbType,
      target,
      code: normalizedCode.substring(0, 2) + '****', // 보안을 위해 코드 일부만 로그
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