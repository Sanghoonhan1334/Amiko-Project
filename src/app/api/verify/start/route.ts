import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp } from '@/lib/smsService'
import { toE164 } from '@/lib/phoneUtils'

// OTP 전송 시작 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, target, purpose = 'signup', nationality } = body

    // 입력 검증
    if (!channel || !target) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      )
    }
    
    // 전화번호인 경우 국가번호 정규화
    let normalizedTarget = target
    if (channel !== 'email') {
      // 이미 E.164 형식인지 확인
      if (target.startsWith('+')) {
        // 이미 E.164 형식이면 그대로 사용
        normalizedTarget = target
        console.log('[VERIFY_START] 이미 E.164 형식:', normalizedTarget)
      } else if (nationality) {
        // nationality가 있으면 정규화 시도
        normalizedTarget = toE164(target, nationality)
        
        // 정규화 실패 시 에러 (E.164 형식이 아님)
        if (!normalizedTarget.startsWith('+')) {
          console.error('[VERIFY_START] 전화번호 정규화 실패:', { target, nationality, normalizedTarget })
          return NextResponse.json(
            { ok: false, error: 'INVALID_PHONE_NUMBER', message: '전화번호 형식이 올바르지 않습니다. 국가번호를 포함해주세요.' },
            { status: 400 }
          )
        }
        
        console.log('[VERIFY_START] 전화번호 정규화 성공:', { target, nationality, normalizedTarget })
      } else {
        // nationality도 없고 E.164 형식도 아니면 에러
        console.error('[VERIFY_START] 국가번호 정보 없음:', { target, channel })
        return NextResponse.json(
          { ok: false, error: 'MISSING_NATIONALITY', message: '전화번호에 국가번호를 포함하거나 국가 정보를 제공해주세요.' },
          { status: 400 }
        )
      }
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
    // 개발 환경에서는 rate limit 체크를 건너뜀 (테스트 편의를 위해)
    const skipRateLimit = process.env.NODE_ENV === 'development'
    
    if (!skipRateLimit) {
      // 'wa' (WhatsApp)는 'sms'로 처리 (RPC 함수는 'email' 또는 'sms'만 체크)
      const authTypeForRateLimit = channel === 'wa' ? 'sms' : channel
      
      try {
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_auth_rate_limit', {
        p_identifier: normalizedTarget,
            p_auth_type: authTypeForRateLimit
      })

        // RPC 함수 에러가 있는 경우
        if (rateLimitError) {
      console.error('인증 시도 제한 확인 실패:', rateLimitError)
          // RPC 함수 에러는 일단 통과 (함수 자체의 문제일 수 있음)
          console.warn('RPC 함수 에러 발생, rate limit 체크를 건너뜁니다:', rateLimitError)
        } else {
          // rateLimitData가 false면 rate limit 초과
          if (rateLimitData === false) {
            console.error('인증 시도 제한 초과:', { target, channel, authTypeForRateLimit })
            
            // 차단 시간 확인
            try {
              const { data: rateLimitRecord } = await supabase
                .from('auth_rate_limits')
                .select('blocked_until, attempt_count')
                .eq('identifier', normalizedTarget)
                .eq('auth_type', authTypeForRateLimit)
                .single()
              
              let message = '인증코드 발송이 제한되었습니다.'
              if (rateLimitRecord?.blocked_until) {
                const blockedUntil = new Date(rateLimitRecord.blocked_until)
                const now = new Date()
                const minutesLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / (1000 * 60))
                if (minutesLeft > 0) {
                  message += ` ${minutesLeft}분 후 다시 시도해주세요.`
                } else {
                  message += ' 잠시 후 다시 시도해주세요.'
                }
              } else {
                message += ' 잠시 후 다시 시도해주세요.'
              }
              
              return NextResponse.json(
                { ok: false, error: 'RATE_LIMIT_EXCEEDED', message },
                { status: 429 }
              )
            } catch (queryError) {
              console.error('차단 시간 조회 실패:', queryError)
      return NextResponse.json(
                { ok: false, error: 'RATE_LIMIT_EXCEEDED', message: '인증코드 발송이 제한되었습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
            }
          }
          
          // rateLimitData가 true면 통과
          if (rateLimitData === true) {
            console.log('인증 시도 제한 통과:', { target, channel, authTypeForRateLimit })
          } else {
            // rateLimitData가 null이거나 undefined인 경우는 경고만
            console.warn('인증 시도 제한 확인 결과가 예상과 다릅니다:', { target, channel, authTypeForRateLimit, rateLimitData })
          }
        }
      } catch (rpcError) {
        console.error('RPC 함수 호출 중 예외 발생:', rpcError)
        // RPC 함수 호출 실패는 일단 통과 (함수 자체의 문제일 수 있음)
        console.warn('RPC 함수 호출 실패, rate limit 체크를 건너뜁니다')
      }
    } else {
      console.log('[RATE_LIMIT] 개발 환경에서 rate limit 체크를 건너뜁니다 (DISABLE_RATE_LIMIT=true)')
    }

    // 인증코드 생성 (6자리 숫자)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // 기존 미인증 코드들 비활성화 (정규화된 전화번호 사용)
    const { error: deactivateError } = await supabase
      .from('verification_codes')
      .update({ verified: true }) // 이미 사용된 것으로 처리
      .eq(channel === 'email' ? 'email' : 'phone_number', normalizedTarget)
      .eq('type', channel)
      .eq('verified', false)

    if (deactivateError) {
      console.error('기존 인증코드 비활성화 실패:', deactivateError)
    }

    // 새 인증코드 저장 (정규화된 전화번호 사용)
    console.log('[VERIFY_START] 인증코드 저장 시도:', {
      channel,
      normalizedTarget,
      code: verificationCode,
      email: channel === 'email' ? normalizedTarget : null,
      phone_number: channel !== 'email' ? normalizedTarget : null
    })
    
    const { data: verificationData, error: insertError } = await supabase
      .from('verification_codes')
      .insert([{
        email: channel === 'email' ? normalizedTarget : null,
        phone_number: channel !== 'email' ? normalizedTarget : null,
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
      console.error('[VERIFY_START] 인증코드 저장 실패:', {
        error: insertError,
        message: insertError?.message,
        code: insertError?.code,
        details: insertError?.details,
        hint: insertError?.hint,
        channel,
        normalizedTarget
      })
      return NextResponse.json(
        { 
          ok: false, 
          error: 'DATABASE_ERROR',
          message: insertError?.message || '인증코드 저장에 실패했습니다.',
          details: insertError?.details || insertError?.hint
        },
        { status: 500 }
      )
    }

    console.log('[VERIFY_START] 인증코드 저장 성공:', {
      id: verificationData.id,
      channel,
      target: normalizedTarget
    })

    // 채널별 실제 발송 (정규화된 전화번호 사용)
    if (channel === 'email') {
      // 이메일 발송 (purpose에 따라 다른 템플릿 사용)
      const emailPurpose = purpose === 'passwordReset' ? 'passwordReset' : 'signup'
      // 언어 결정 (이메일 도메인 기반 또는 기본값)
      const emailLanguage = normalizedTarget.toLowerCase().includes('@naver.com') || 
                           normalizedTarget.toLowerCase().includes('@gmail.com') || 
                           normalizedTarget.toLowerCase().includes('@daum.net') || 
                           normalizedTarget.toLowerCase().includes('@kakao.com') ? 'ko' : 'es'
      const emailSent = await sendVerificationEmail(normalizedTarget, verificationCode, emailLanguage, emailPurpose)
      
      if (!emailSent) {
        console.error('이메일 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'EMAIL_SEND_FAILED' },
          { status: 500 }
        )
      }
    } else if (channel === 'sms') {
      // SMS 발송 (정규화된 전화번호 사용)
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      const smsSent = await sendVerificationSMS(normalizedTarget, verificationCode, language)
      
      if (!smsSent) {
        console.error('SMS 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'SMS_SEND_FAILED' },
          { status: 500 }
        )
      }
    } else if (channel === 'wa') {
      // WhatsApp 발송 (정규화된 전화번호 사용)
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      const waSent = await sendVerificationWhatsApp(normalizedTarget, verificationCode, language)
      
      if (!waSent) {
        console.error('WhatsApp 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'WHATSAPP_SEND_FAILED' },
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