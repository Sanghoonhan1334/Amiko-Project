console.log('🔥 VERIFY_START MODULE LOADING');

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp } from '@/lib/smsService'
import { toE164 } from '@/lib/phoneUtils'

export const runtime = 'nodejs';

// OTP 전송 시작 API
export async function POST(request: NextRequest) {
  console.log('🔥 VERIFY_START HANDLER ENTERED');
  
  try {
    console.log('[VERIFY_START] STEP 1: 요청 본문 파싱 시작');
    let body: any = null;
    
    try {
      body = await request.json();
      console.log('[VERIFY_START] STEP 1: req body 파싱 완료');
    } catch (parseError) {
      console.error('[VERIFY_START] STEP 1 에러: req.json() 파싱 실패');
      console.error('[VERIFY_START] 파싱 에러:', parseError);
      return NextResponse.json(
        { ok: false, error: 'INVALID_REQUEST_BODY', message: '요청 본문을 파싱할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (!body) {
      console.error('[VERIFY_START] STEP 1 에러: body가 null 또는 undefined');
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUEST_BODY', message: '요청 본문이 없습니다.' },
        { status: 400 }
      );
    }

    const { channel, target, purpose = 'signup', nationality } = body;
    console.log('[VERIFY_START] STEP 1 완료:', { 
      channel, 
      target: target?.substring(0, 5) + '...', 
      purpose, 
      nationality 
    });

    // 입력 검증
    if (!channel || !target) {
      console.error('[VERIFY_START] STEP 2 에러: 필수 필드 누락');
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS', message: 'channel과 target이 필요합니다.' },
        { status: 400 }
      );
    }

    const validChannels = ['email', 'sms', 'wa'];
    if (!validChannels.includes(channel)) {
      console.error('[VERIFY_START] STEP 2 에러: 잘못된 channel');
      return NextResponse.json(
        { ok: false, error: 'INVALID_CHANNEL', message: '유효하지 않은 채널입니다.' },
        { status: 400 }
      );
    }

    console.log('[VERIFY_START] STEP 3: 전화번호 정규화 시작');
    // 전화번호 정규화 (E.164 형식)
    let normalizedTarget = target;
    if (channel !== 'email') {
      if (nationality) {
        normalizedTarget = toE164(target, nationality);
        if (!normalizedTarget.startsWith('+')) {
          console.error('[VERIFY_START] STEP 3 에러: 전화번호 정규화 실패');
          return NextResponse.json(
            { ok: false, error: 'INVALID_PHONE_NUMBER', message: '전화번호 형식이 올바르지 않습니다.' },
            { status: 400 }
          );
        }
        console.log('[VERIFY_START] STEP 3: 전화번호 정규화 완료:', {
          original: target,
          normalized: normalizedTarget
        });
      } else {
        // nationality가 없으면 원본 사용 (하위 호환성)
        normalizedTarget = target;
        console.log('[VERIFY_START] STEP 3: nationality 없음, 원본 사용');
      }
    } else {
      normalizedTarget = target.toLowerCase().trim();
      console.log('[VERIFY_START] STEP 3: 이메일 정규화 완료');
    }

    console.log('[VERIFY_START] STEP 4: Supabase Admin Client 생성 시작');
    // Supabase Admin Client 생성 (함수 내부에서 - module scope env 접근 금지)
    const supabase = createAdminClient();
    console.log('[VERIFY_START] STEP 4: Supabase Admin Client 생성 완료');

    console.log('[VERIFY_START] STEP 5: Rate limit 체크 시작');
    // Rate limit 체크
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('check_auth_rate_limit', {
      p_identifier: normalizedTarget,
      p_auth_type: channel === 'email' ? 'email' : 'sms'
    });

    if (rateLimitError) {
      console.error('[VERIFY_START] STEP 5 에러: Rate limit 체크 실패');
      console.error('[VERIFY_START] Rate limit 에러:', rateLimitError);
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT_CHECK_FAILED', message: '요청 제한 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (rateLimitData === false) {
      console.error('[VERIFY_START] STEP 5: Rate limit 초과');
      // 차단 시간 확인
      const { data: rateLimitRecord } = await supabase
        .from('auth_rate_limits')
        .select('blocked_until, attempt_count')
        .eq('identifier', normalizedTarget)
        .eq('auth_type', channel === 'email' ? 'email' : 'sms')
        .single();

      const blockedUntil = rateLimitRecord?.blocked_until;
      const remainingMinutes = blockedUntil 
        ? Math.ceil((new Date(blockedUntil).getTime() - Date.now()) / 60000)
        : 0;

      return NextResponse.json(
        { 
          ok: false, 
          error: 'RATE_LIMIT_EXCEEDED', 
          message: `너무 많은 요청이 있었습니다. ${remainingMinutes > 0 ? remainingMinutes + '분 후' : '잠시 후'} 다시 시도해주세요.`,
          remainingMinutes: remainingMinutes > 0 ? remainingMinutes : null
        },
        { status: 429 }
      );
    }

    console.log('[VERIFY_START] STEP 5: Rate limit 체크 통과');

    console.log('[VERIFY_START] STEP 6: 인증코드 생성 시작');
    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분 후 만료
    console.log('[VERIFY_START] STEP 6: 인증코드 생성 완료 (만료 시간:', expiresAt, ')');

    console.log('[VERIFY_START] STEP 7: 기존 인증코드 비활성화 시작');
    // 기존 미인증 코드들 비활성화
    try {
      const { data: deactivateData, error: deactivateError } = await supabase
        .from('verification_codes')
        .update({ verified: true })
        .eq(channel === 'email' ? 'email' : 'phone_number', normalizedTarget)
        .eq('type', channel === 'wa' ? 'sms' : channel)
        .eq('verified', false)
        .select();

      if (deactivateError) {
        console.error('[VERIFY_START] STEP 7 에러: 기존 인증코드 비활성화 실패');
        console.error('[VERIFY_START] 비활성화 에러:', deactivateError);
      } else {
        console.log('[VERIFY_START] STEP 7: 기존 인증코드 비활성화 완료 (개수:', deactivateData?.length || 0, ')');
      }
    } catch (deactivateException) {
      console.error('[VERIFY_START] STEP 7 예외: 기존 인증코드 비활성화 중 예외 발생');
      console.error('[VERIFY_START] 비활성화 예외:', deactivateException);
    }

    console.log('[VERIFY_START] STEP 8: 새 인증코드 저장 시작');
    // 새 인증코드 저장
    try {
      const { data: verificationData, error: insertError } = await supabase
        .from('verification_codes')
        .insert([{
          email: channel === 'email' ? normalizedTarget : null,
          phone_number: channel !== 'email' ? normalizedTarget : null,
          code: verificationCode,
          type: channel === 'wa' ? 'sms' : channel,
          verified: false,
          expires_at: expiresAt,
          ip_address: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
          user_agent: request.headers.get('user-agent') || 'Unknown'
        }])
        .select()
        .single();

      if (insertError || !verificationData) {
        console.error('[VERIFY_START] STEP 8 에러: 인증코드 저장 실패!');
        console.error('[VERIFY_START] 저장 에러 객체:', {
          error: insertError,
          message: insertError?.message,
          code: insertError?.code,
          details: insertError?.details,
          hint: insertError?.hint,
          channel,
          normalizedTarget
        });
        return NextResponse.json(
          { ok: false, error: 'CODE_STORAGE_FAILED', message: '인증코드 저장에 실패했습니다.' },
          { status: 500 }
        );
      }

      console.log('[VERIFY_START] STEP 8: 인증코드 저장 완료 (ID:', verificationData.id, ')');
    } catch (insertException) {
      console.error('[VERIFY_START] STEP 8 예외: 인증코드 저장 중 예외 발생');
      console.error('[VERIFY_START] 저장 예외:', insertException);
      return NextResponse.json(
        { ok: false, error: 'CODE_STORAGE_EXCEPTION', message: '인증코드 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('[VERIFY_START] STEP 9: 인증코드 발송 시작 (channel:', channel, ')');
    // 채널별 인증코드 발송
    let sendSuccess = false;
    try {
      if (channel === 'email') {
        sendSuccess = await sendVerificationEmail(normalizedTarget, verificationCode);
      } else if (channel === 'sms') {
        sendSuccess = await sendVerificationSMS(normalizedTarget, verificationCode, nationality);
      } else if (channel === 'wa') {
        sendSuccess = await sendVerificationWhatsApp(normalizedTarget, verificationCode, nationality);
      }

      if (!sendSuccess) {
        console.error('[VERIFY_START] STEP 9 에러: 인증코드 발송 실패');
        return NextResponse.json(
          { ok: false, error: 'SEND_FAILED', message: '인증코드 발송에 실패했습니다.' },
          { status: 500 }
        );
      }

      console.log('[VERIFY_START] STEP 9: 인증코드 발송 완료');
    } catch (sendException) {
      console.error('[VERIFY_START] STEP 9 예외: 인증코드 발송 중 예외 발생');
      console.error('[VERIFY_START] 발송 예외:', sendException);
      return NextResponse.json(
        { ok: false, error: 'SEND_EXCEPTION', message: '인증코드 발송 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('[VERIFY_START] STEP 10: 성공 응답 반환');
    return NextResponse.json({
      ok: true,
      message: '인증코드가 발송되었습니다.',
      channel: channel,
      expiresIn: 600 // 10분 (초 단위)
    });

  } catch (error) {
    // 최상위 catch - 모든 예외를 잡아야 함
    console.error('========================================');
    console.error('[VERIFY_START] ❌ 최상위 catch 블록: 예외 발생!');
    console.error('========================================');
    console.error('[VERIFY_START] 에러 타입:', error?.constructor?.name);
    console.error('[VERIFY_START] 에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('[VERIFY_START] 에러 스택:', error instanceof Error ? error.stack : 'N/A');
    console.error('[VERIFY_START] 에러 전체:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[VERIFY_START] 에러 객체:', error);
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
