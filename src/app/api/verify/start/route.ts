// 파일 최상단 - import 전에 즉시 실행되는 로그
console.log('[VERIFY_START] 파일 로드 완료 - 모듈 초기화')

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp } from '@/lib/smsService'
import { toE164 } from '@/lib/phoneUtils'

// Edge 런타임 문제 방지 - Node.js 런타임 명시
export const runtime = 'nodejs'

// OTP 전송 시작 API
export async function POST(request: NextRequest) {
  console.log('========================================')
  console.log('[VERIFY_START] STEP 1: 함수 진입')
  console.log('[VERIFY_START] STEP 1: Request 객체 확인', {
    hasRequest: !!request,
    method: request?.method,
    url: request?.url
  })
  console.log('========================================')
  
  let body: any = null
  
  try {
    console.log('[VERIFY_START] STEP 2: 요청 본문 파싱 시작')
    try {
      body = await request.json()
      console.log('[VERIFY_START] STEP 2: req body 파싱 성공', body)
    } catch (jsonError) {
      console.error('[VERIFY_START] STEP 2 에러: req.json() 파싱 실패')
      console.error('[VERIFY_START] STEP 2 에러 타입:', jsonError?.constructor?.name)
      console.error('[VERIFY_START] STEP 2 에러 메시지:', jsonError instanceof Error ? jsonError.message : String(jsonError))
      console.error('[VERIFY_START] STEP 2 에러 스택:', jsonError instanceof Error ? jsonError.stack : 'N/A')
      console.error(jsonError)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'INVALID_REQUEST_BODY',
          message: '요청 본문을 파싱할 수 없습니다.',
          detail: jsonError instanceof Error ? jsonError.message : String(jsonError)
        },
        { status: 400 }
      )
    }
    if (!body) {
      console.error('[VERIFY_START] STEP 2 에러: body가 null 또는 undefined')
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUEST_BODY', message: '요청 본문이 없습니다.' },
        { status: 400 }
      )
    }
    
    const { channel, target, purpose = 'signup', nationality } = body
    console.log('[VERIFY_START] STEP 2 완료:', { channel, target: target?.substring(0, 5) + '...', purpose, nationality })

    console.log('STEP 3: 입력 검증 시작')
    // 입력 검증
    if (!channel || !target) {
      console.error('STEP 3 에러: 필수 필드 누락', { channel, target })
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      )
    }
    console.log('STEP 3 완료')
    
    console.log('STEP 4: 전화번호 정규화 시작')
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

    console.log('STEP 4 완료:', { normalizedTarget })
    
    console.log('STEP 5: 채널 유효성 검증')
    // 채널 유효성 검증
    const validChannels = ['wa', 'sms', 'email']
    if (!validChannels.includes(channel)) {
      console.error('STEP 5 에러: 잘못된 채널', { channel })
      return NextResponse.json(
        { ok: false, error: 'INVALID_CHANNEL' },
        { status: 400 }
      )
    }
    console.log('STEP 5 완료')

    console.log('STEP 6: Admin Client 생성 시작')
    console.log('STEP 6: 환경 변수 확인', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    })
    let supabase
    try {
      supabase = createAdminClient()
      console.log('STEP 6 완료: Admin Client 생성 성공')
    } catch (err) {
      console.error('STEP 6 에러: Admin Client 생성 실패')
      console.error(err)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'SERVER_CONFIG_ERROR',
          message: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' 
        },
        { status: 500 }
      )
    }

    console.log('STEP 7: Rate Limit 체크 시작')
    // 인증 시도 제한 확인
    // 개발 환경에서는 rate limit 체크를 건너뜀 (테스트 편의를 위해)
    const skipRateLimit = process.env.NODE_ENV === 'development'
    console.log('STEP 7: skipRateLimit', skipRateLimit)
    
    if (!skipRateLimit) {
      // 'wa' (WhatsApp)는 'sms'로 처리 (RPC 함수는 'email' 또는 'sms'만 체크)
      const authTypeForRateLimit = channel === 'wa' ? 'sms' : channel
      
      console.log('[VERIFY_START] Rate limit 체크 시작:', {
        normalizedTarget,
        authTypeForRateLimit,
        channel
      })
      
      try {
        console.log('[VERIFY_START] RPC 함수 호출 전:', {
          p_identifier: normalizedTarget,
          p_auth_type: authTypeForRateLimit
        })
        
        const { data: rateLimitData, error: rateLimitError } = await supabase
          .rpc('check_auth_rate_limit', {
            p_identifier: normalizedTarget,
            p_auth_type: authTypeForRateLimit
          })
        
        console.log('STEP 7: RPC 함수 호출 후:', {
          rateLimitData,
          hasError: !!rateLimitError,
          error: rateLimitError
        })

        // RPC 함수 에러가 있는 경우
        if (rateLimitError) {
          console.error('STEP 7 에러: 인증 시도 제한 확인 실패')
          console.error(rateLimitError)
          // RPC 함수 에러는 일단 통과 (함수 자체의 문제일 수 있음)
          console.warn('[VERIFY_START] RPC 함수 에러 발생, rate limit 체크를 건너뜁니다:', rateLimitError)
        } else {
          // rateLimitData가 false면 rate limit 초과
          if (rateLimitData === false) {
            console.error('[VERIFY_START] 인증 시도 제한 초과:', { target, channel, authTypeForRateLimit })
            
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
              console.error('[VERIFY_START] 차단 시간 조회 실패:', queryError)
              return NextResponse.json(
                { ok: false, error: 'RATE_LIMIT_EXCEEDED', message: '인증코드 발송이 제한되었습니다. 잠시 후 다시 시도해주세요.' },
                { status: 429 }
              )
            }
          }
          
          // rateLimitData가 true면 통과
          if (rateLimitData === true) {
            console.log('[VERIFY_START] 인증 시도 제한 통과:', { target, channel, authTypeForRateLimit })
          } else {
            // rateLimitData가 null이거나 undefined인 경우는 경고만
            console.warn('[VERIFY_START] 인증 시도 제한 확인 결과가 예상과 다릅니다:', { target, channel, authTypeForRateLimit, rateLimitData })
          }
        }
      } catch (rpcError) {
        console.error('STEP 7 에러: RPC 함수 호출 중 예외 발생!')
        console.error('STEP 7 에러 타입:', rpcError?.constructor?.name)
        console.error('STEP 7 에러 메시지:', rpcError instanceof Error ? rpcError.message : String(rpcError))
        console.error('STEP 7 에러 스택:', rpcError instanceof Error ? rpcError.stack : 'N/A')
        console.error('STEP 7 에러 전체:', JSON.stringify(rpcError, Object.getOwnPropertyNames(rpcError || {}), 2))
        console.error(rpcError)
        // RPC 함수 호출 실패는 일단 통과 (함수 자체의 문제일 수 있음)
        console.warn('[VERIFY_START] RPC 함수 호출 실패, rate limit 체크를 건너뜁니다')
      }
    } else {
      console.log('STEP 7: 개발 환경에서 rate limit 체크를 건너뜁니다')
    }
    console.log('STEP 7 완료')

    console.log('STEP 8: 인증코드 생성 및 저장 시작')
    // 인증코드 생성 (6자리 숫자)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('STEP 8: 인증코드 생성 완료:', verificationCode.substring(0, 2) + '****')
    
    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    console.log('STEP 8: 기존 인증코드 비활성화 시작')
    try {
      // 기존 미인증 코드들 비활성화 (정규화된 전화번호 사용)
      const { data: deactivateData, error: deactivateError } = await supabase
        .from('verification_codes')
        .update({ verified: true }) // 이미 사용된 것으로 처리
        .eq(channel === 'email' ? 'email' : 'phone_number', normalizedTarget)
        .eq('type', channel)
        .eq('verified', false)
        .select()

      if (deactivateError) {
        console.error('STEP 8 에러: 기존 인증코드 비활성화 실패')
        console.error('STEP 8 에러 상세:', {
          message: deactivateError.message,
          code: deactivateError.code,
          details: deactivateError.details,
          hint: deactivateError.hint
        })
        console.error(deactivateError)
        // 에러가 있어도 계속 진행
      } else {
        console.log('STEP 8: 기존 인증코드 비활성화 완료', { deactivatedCount: deactivateData?.length || 0 })
      }
    } catch (deactivateErr) {
      console.error('STEP 8 예외: 기존 인증코드 비활성화 중 예외 발생')
      console.error(deactivateErr)
      // 예외가 있어도 계속 진행
    }

    console.log('STEP 8: 새 인증코드 저장 시작')
    // 새 인증코드 저장 (정규화된 전화번호 사용)
    console.log('STEP 8: 인증코드 저장 데이터:', {
      channel,
      normalizedTarget,
      code: verificationCode,
      email: channel === 'email' ? normalizedTarget : null,
      phone_number: channel !== 'email' ? normalizedTarget : null
    })
    
    console.log('STEP 8: Supabase insert 호출 직전')
    let verificationData
    let insertError
    try {
      const result = await supabase
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
      
      verificationData = result.data
      insertError = result.error
      
      console.log('STEP 8: Supabase insert 호출 완료', {
        hasData: !!verificationData,
        hasError: !!insertError,
        errorCode: insertError?.code,
        errorMessage: insertError?.message
      })
    } catch (insertException) {
      console.error('STEP 8 예외: Supabase insert 중 예외 발생!')
      console.error('STEP 8 예외 타입:', insertException?.constructor?.name)
      console.error('STEP 8 예외 메시지:', insertException instanceof Error ? insertException.message : String(insertException))
      console.error('STEP 8 예외 스택:', insertException instanceof Error ? insertException.stack : 'N/A')
      console.error(insertException)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'DATABASE_EXCEPTION',
          message: insertException instanceof Error ? insertException.message : '인증코드 저장 중 예외가 발생했습니다.'
        },
        { status: 500 }
      )
    }

    if (insertError || !verificationData) {
      console.error('STEP 8 에러: 인증코드 저장 실패!')
      console.error('STEP 8 에러 객체:', {
        error: insertError,
        message: insertError?.message,
        code: insertError?.code,
        details: insertError?.details,
        hint: insertError?.hint,
        channel,
        normalizedTarget
      })
      console.error('STEP 8 에러 전체:', JSON.stringify(insertError, Object.getOwnPropertyNames(insertError || {}), 2))
      console.error('STEP 8 verificationData:', verificationData)
      console.error(insertError)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'DATABASE_ERROR',
          message: insertError?.message || '인증코드 저장에 실패했습니다.',
          details: insertError?.details || insertError?.hint,
          code: insertError?.code
        },
        { status: 500 }
      )
    }

    console.log('STEP 8 완료: 인증코드 저장 성공:', {
      id: verificationData.id,
      channel,
      target: normalizedTarget
    })

    console.log('STEP 9: 인증코드 발송 시작')
    // 채널별 실제 발송 (정규화된 전화번호 사용)
    if (channel === 'email') {
      console.log('STEP 9: 이메일 발송 시작')
      // 이메일 발송 (purpose에 따라 다른 템플릿 사용)
      const emailPurpose = purpose === 'passwordReset' ? 'passwordReset' : 'signup'
      // 언어 결정 (이메일 도메인 기반 또는 기본값)
      const emailLanguage = normalizedTarget.toLowerCase().includes('@naver.com') || 
                           normalizedTarget.toLowerCase().includes('@gmail.com') || 
                           normalizedTarget.toLowerCase().includes('@daum.net') || 
                           normalizedTarget.toLowerCase().includes('@kakao.com') ? 'ko' : 'es'
      const emailSent = await sendVerificationEmail(normalizedTarget, verificationCode, emailLanguage, emailPurpose)
      
      if (!emailSent) {
        console.error('STEP 9 에러: 이메일 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'EMAIL_SEND_FAILED' },
          { status: 500 }
        )
      }
      console.log('STEP 9: 이메일 발송 완료')
    } else if (channel === 'sms') {
      console.log('STEP 9: SMS 발송 시작')
      // SMS 발송 (정규화된 전화번호 사용)
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      const smsSent = await sendVerificationSMS(normalizedTarget, verificationCode, language)
      
      if (!smsSent) {
        console.error('STEP 9 에러: SMS 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'SMS_SEND_FAILED' },
          { status: 500 }
        )
      }
      console.log('STEP 9: SMS 발송 완료')
    } else if (channel === 'wa') {
      console.log('STEP 9: WhatsApp 발송 시작')
      // WhatsApp 발송 (정규화된 전화번호 사용)
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      const waSent = await sendVerificationWhatsApp(normalizedTarget, verificationCode, language)
      
      if (!waSent) {
        console.error('STEP 9 에러: WhatsApp 발송 실패')
        return NextResponse.json(
          { ok: false, error: 'WHATSAPP_SEND_FAILED' },
          { status: 500 }
        )
      }
      console.log('STEP 9: WhatsApp 발송 완료')
    }
    console.log('STEP 9 완료')

    console.log('STEP 10: 인증 로그 기록 시작')
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
      console.error('STEP 10 에러: 인증 로그 기록 실패')
      console.error(logError)
      // 로그 실패는 인증코드 발송 성공에 영향을 주지 않음
    } else {
      console.log('STEP 10 완료')
    }

    console.log('========================================')
    console.log('STEP 11: OTP 전송 성공!')
    console.log('========================================')
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
    // 최상위 catch - 모든 예외를 잡아야 함
    console.error('========================================')
    console.error('[VERIFY_START] ❌ 최상위 catch 블록: 예외 발생!')
    console.error('========================================')
    console.error('[VERIFY_START] 에러 타입:', error?.constructor?.name)
    console.error('[VERIFY_START] 에러 메시지:', error instanceof Error ? error.message : String(error))
    console.error('[VERIFY_START] 에러 스택:', error instanceof Error ? error.stack : 'N/A')
    console.error('[VERIFY_START] 에러 전체:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2))
    console.error('[VERIFY_START] 에러 객체:', error)
    console.error(error)
    
    // 에러를 다시 throw하지 않고 응답 반환
    return NextResponse.json(
      { 
        ok: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error)
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