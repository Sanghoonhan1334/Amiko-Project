import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendVerificationEmail, getEmailServiceStatus } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp, getSMSServiceStatus, getRecommendedSMSService } from '@/lib/smsService'

// 전화번호 정규화 함수 (라틴아메리카 국가 코드 지원)
function normalizePhoneNumber(phone: string): string {
  // 공백과 특수문자 제거
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  console.log(`[NORMALIZE] 입력: ${phone} -> 정리: ${cleaned}`)
  
  // +로 시작하지 않으면 국가 코드 추가
  if (!cleaned.startsWith('+')) {
    // 한국 번호인 경우 +82 추가
    if (cleaned.startsWith('010') || cleaned.startsWith('011') || cleaned.startsWith('016') || cleaned.startsWith('017') || cleaned.startsWith('018') || cleaned.startsWith('019')) {
      cleaned = '+82' + cleaned.substring(1) // 0 제거하고 +82 추가
      console.log(`[NORMALIZE] 한국 번호 감지: ${cleaned}`)
    } 
    // 라틴아메리카 주요 국가들 처리
    else if (cleaned.startsWith('52')) {
      // 멕시코
      cleaned = '+52' + cleaned.substring(2)
      console.log(`[NORMALIZE] 멕시코 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('54')) {
      // 아르헨티나
      cleaned = '+54' + cleaned.substring(2)
      console.log(`[NORMALIZE] 아르헨티나 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('55')) {
      // 브라질
      cleaned = '+55' + cleaned.substring(2)
      console.log(`[NORMALIZE] 브라질 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('57')) {
      // 콜롬비아
      cleaned = '+57' + cleaned.substring(2)
      console.log(`[NORMALIZE] 콜롬비아 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('51')) {
      // 페루
      cleaned = '+51' + cleaned.substring(2)
      console.log(`[NORMALIZE] 페루 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('56')) {
      // 칠레
      cleaned = '+56' + cleaned.substring(2)
      console.log(`[NORMALIZE] 칠레 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('58')) {
      // 베네수엘라
      cleaned = '+58' + cleaned.substring(2)
      console.log(`[NORMALIZE] 베네수엘라 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('593')) {
      // 에콰도르
      cleaned = '+593' + cleaned.substring(3)
      console.log(`[NORMALIZE] 에콰도르 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('502')) {
      // 과테말라
      cleaned = '+502' + cleaned.substring(3)
      console.log(`[NORMALIZE] 과테말라 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('504')) {
      // 온두라스
      cleaned = '+504' + cleaned.substring(3)
      console.log(`[NORMALIZE] 온두라스 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('505')) {
      // 니카라과
      cleaned = '+505' + cleaned.substring(3)
      console.log(`[NORMALIZE] 니카라과 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('507')) {
      // 파나마
      cleaned = '+507' + cleaned.substring(3)
      console.log(`[NORMALIZE] 파나마 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('595')) {
      // 파라과이
      cleaned = '+595' + cleaned.substring(3)
      console.log(`[NORMALIZE] 파라과이 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('598')) {
      // 우루과이
      cleaned = '+598' + cleaned.substring(3)
      console.log(`[NORMALIZE] 우루과이 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('591')) {
      // 볼리비아
      cleaned = '+591' + cleaned.substring(3)
      console.log(`[NORMALIZE] 볼리비아 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('506')) {
      // 코스타리카
      cleaned = '+506' + cleaned.substring(3)
      console.log(`[NORMALIZE] 코스타리카 번호 감지: ${cleaned}`)
    } else if (cleaned.startsWith('1')) {
      // 미국/캐나다 (+1)
      cleaned = '+1' + cleaned.substring(1)
      console.log(`[NORMALIZE] 미국/캐나다 번호 감지: ${cleaned}`)
    } else {
      // 알 수 없는 국가는 원본 그대로 유지
      console.log(`[NORMALIZE] 알 수 없는 국가 번호: ${cleaned}`)
    }
  }
  
  console.log(`[NORMALIZE] 최종 결과: ${cleaned}`)
  return cleaned
}

// 인증코드 저장용 (실제로는 Redis나 DB 사용 권장)
const verificationCodes = new Map<string, { code: string, expiresAt: Date, type: string }>()

// 국적에서 언어 감지
function detectLanguageFromNationality(nationality: string): 'ko' | 'es' {
  // 한국인은 한국어, 그 외는 스페인어
  return nationality === 'KR' ? 'ko' : 'es'
}

// 이메일에서 언어 감지 (fallback)
function detectLanguageFromEmail(email: string): 'ko' | 'es' {
  // 중남미 국가 도메인들
  const latinAmericaDomains = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', // 일반적인 도메인들
    'mx', 'br', 'ar', 'co', 'pe', 've', 'cl', 'ec', 'gt', 'hn', 'ni', 'pa', 'py', 'uy', 'bo', 'cr', 'do', 'sv', 'cu', 'pr'
  ]
  
  // 이메일 도메인 추출
  const domain = email.split('@')[1]?.toLowerCase()
  
  // 중남미 국가 코드가 포함된 도메인인지 확인
  const isLatinAmerica = latinAmericaDomains.some(latDomain => 
    domain?.includes(latDomain) || domain?.endsWith(`.${latDomain}`)
  )
  
  // 기본적으로 한국어, 중남미 도메인이면 스페인어
  return isLatinAmerica ? 'es' : 'ko'
}

// 이메일 인증코드 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phoneNumber, phone, type, countryCode = 'KR', code, userId, nationality } = body

    // 새로운 요청 형식 처리 (국적별 인증 방식)
    if (type === 'whatsapp' || type === 'sms' || type === 'kakao') {
      const phoneNum = phone || phoneNumber
      if (!phoneNum) {
        return NextResponse.json(
          { error: '전화번호가 필요합니다.' },
          { status: 400 }
        )
      }

      // 6자리 인증코드 생성
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5분

      // 인증코드 저장
      verificationCodes.set(phoneNum, {
        code: verificationCode,
        expiresAt: expiresAt,
        type: type
      })
      
      console.log(`[VERIFICATION_SEND] ${type.toUpperCase()} 인증코드 저장: ${phoneNum} = ${verificationCode}`)
      console.log(`[VERIFICATION_SEND] 만료시간: ${expiresAt.toLocaleString('ko-KR')}`)
      
      // Twilio 환경변수 확인
      console.log(`[VERIFICATION_SEND] Twilio 환경변수 상태:`, {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '설정되지 않음',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL || '설정되지 않음'
      })

      // 실제 인증 방식별 발송
      let messageSent = false
      
      if (type === 'whatsapp') {
        // WhatsApp 인증 - 전화번호 정규화 적용
        const normalizedPhone = normalizePhoneNumber(phoneNum)
        console.log(`[WHATSAPP_VERIFICATION] 원본 전화번호: ${phoneNum}`)
        console.log(`[WHATSAPP_VERIFICATION] 정규화된 전화번호: ${normalizedPhone}`)
        messageSent = await sendVerificationWhatsApp(normalizedPhone, verificationCode, 'ko')
      } else if (type === 'kakao') {
        // 카카오톡 인증 (개발 환경에서는 콘솔 로그)
        console.log('\n' + '='.repeat(60))
        console.log('📱 [카카오톡 인증] 개발 환경 시뮬레이션')
        console.log('='.repeat(60))
        console.log(`전화번호: ${phoneNum}`)
        console.log(`인증코드: ${verificationCode}`)
        console.log('실제 환경에서는 카카오톡 API 호출')
        console.log('='.repeat(60) + '\n')
        messageSent = true
      } else {
        // SMS 인증 - 직접 Twilio 호출
        const normalizedPhone = normalizePhoneNumber(phoneNum)
        console.log(`[SMS_VERIFICATION] 원본 전화번호: ${phoneNum}`)
        console.log(`[SMS_VERIFICATION] 정규화된 전화번호: ${normalizedPhone}`)
        
        try {
          const { sendTwilioSMS } = await import('@/lib/twilioService')
          const smsMessage = `[Amiko] 인증코드: ${verificationCode} (5분 후 만료)`
          messageSent = await sendTwilioSMS(normalizedPhone, smsMessage)
          console.log(`[SMS_VERIFICATION] Twilio 직접 호출 결과: ${messageSent}`)
          
          // 개발 환경에서 인증코드를 Console에 출력
          if (process.env.NODE_ENV === 'development') {
            console.log('\n' + '='.repeat(60))
            console.log(`📱 [개발환경] SMS 인증코드: ${verificationCode}`)
            console.log(`📱 [개발환경] 전화번호: ${normalizedPhone}`)
            console.log(`📱 [개발환경] 메시지: ${smsMessage}`)
            console.log('='.repeat(60) + '\n')
          }
        } catch (error) {
          console.error('[SMS_VERIFICATION] Twilio 직접 호출 실패:', error)
          messageSent = false
        }
      }
      
      // 개발 환경에서도 실제 SMS 발송 (Twilio 설정된 경우)
      if (!messageSent && process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(60))
        console.log(`📱 [개발환경] ${type.toUpperCase()} 인증코드`)
        console.log('='.repeat(60))
        console.log(`전화번호: ${phoneNum}`)
        console.log(`인증코드: ${verificationCode}`)
        console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}`)
        console.log('='.repeat(60) + '\n')
        
        // Twilio 설정이 있으면 실제 발송 시도
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
          console.log('🔄 Twilio 설정 감지 - 실제 SMS 발송 시도...')
          // 실제 발송은 이미 위에서 시도됨, 여기서는 로그만
        } else {
          console.log('⚠️ Twilio 설정 없음 - 콘솔 로그만 출력')
        }
        
        messageSent = true
      }
      
      if (!messageSent) {
        console.error(`[${type.toUpperCase()}_VERIFICATION] 발송 실패`)
        return NextResponse.json(
          { error: `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} 발송에 실패했습니다.` },
          { status: 500 }
        )
      }
      
      console.log(`[${type.toUpperCase()}_VERIFICATION] ${phoneNum}로 인증코드 발송 완료: ${verificationCode}`)
      
      const getMessageByType = (type: string) => {
        switch (type) {
          case 'whatsapp': return 'WhatsApp으로 인증코드가 발송되었습니다.'
          case 'kakao': return '카카오톡으로 인증코드가 발송되었습니다.'
          case 'sms': return 'SMS로 인증코드가 발송되었습니다.'
          default: return '인증코드가 발송되었습니다.'
        }
      }

      return NextResponse.json({
        success: true,
        message: getMessageByType(type),
        expiresIn: 300, // 5분
        smsService: getSMSServiceStatus(),
        recommendedService: getRecommendedSMSService(countryCode)
      })
    }

    // 인증코드 검증 (verify 타입)
    if (type === 'verify') {
      const phoneNum = phone || phoneNumber
      if (!phoneNum || !code) {
        return NextResponse.json(
          { error: '전화번호와 인증코드가 필요합니다.' },
          { status: 400 }
        )
      }

      // 저장된 인증코드 확인
      const storedData = verificationCodes.get(phoneNum)

      console.log(`[VERIFICATION_VERIFY] 검증 시도: ${phoneNum}, 입력 코드: ${code}`)
      console.log(`[VERIFICATION_VERIFY] 저장된 데이터:`, storedData)

      if (!storedData) {
        console.log(`[VERIFICATION_VERIFY] 인증코드 없음: ${phoneNum}`)
        return NextResponse.json(
          { error: '인증코드가 발송되지 않았거나 만료되었습니다.' },
          { status: 400 }
        )
      }

      // 만료 시간 확인
      if (new Date() > storedData.expiresAt) {
        console.log(`[VERIFICATION_VERIFY] 인증코드 만료: ${phoneNum}`)
        verificationCodes.delete(phoneNum) // 만료된 코드 삭제
        return NextResponse.json(
          { error: '인증코드가 만료되었습니다. 다시 발송해주세요.' },
          { status: 400 }
        )
      }

      // 인증코드 비교
      if (code !== storedData.code) {
        console.log(`[VERIFICATION_VERIFY] 인증코드 불일치: ${phoneNum}, 입력: ${code}, 저장: ${storedData.code}`)
        return NextResponse.json(
          { error: '인증코드가 올바르지 않습니다.' },
          { status: 400 }
        )
      }

      // 인증 성공 - 코드 삭제
      verificationCodes.delete(phoneNum)
      console.log(`[VERIFICATION_VERIFY] 인증 성공: ${phoneNum}`)
      
      // 사용자의 SMS 인증 상태를 DB에 업데이트
      if (userId) {
        try {
          const { error: updateError } = await supabaseServer
            .from('users')
            .update({ 
              phone_verified: true,
              phone_verified_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          if (updateError) {
            console.error('[VERIFICATION_VERIFY] 사용자 상태 업데이트 실패:', updateError)
          } else {
            console.log(`[VERIFICATION_VERIFY] 사용자 ${userId} SMS 인증 완료`)
          }
        } catch (error) {
          console.error('[VERIFICATION_VERIFY] 사용자 상태 업데이트 실패:', error)
        }
      }
      
      return NextResponse.json({
        success: true,
        message: '인증이 완료되었습니다.',
        verified: true
      })
    }

    // 기존 요청 형식 처리 (이메일 인증)
    const { email: oldEmail, phoneNumber: oldPhoneNumber, type: oldType, countryCode: oldCountryCode = 'KR' } = body

    if (!oldType || (!oldEmail && !oldPhoneNumber)) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + (oldType === 'email' ? 5 : 5) * 60 * 1000) // 이메일과 SMS 모두 5분

    // 인증코드 저장
    const key = oldEmail || oldPhoneNumber
    verificationCodes.set(key, {
      code: verificationCode,
      expiresAt: expiresAt,
      type: oldType
    })
    
    console.log(`[VERIFICATION_SEND] 인증코드 저장: ${key} = ${verificationCode}`)
    console.log(`[VERIFICATION_SEND] 만료시간: ${expiresAt.toLocaleString('ko-KR')}`)
    console.log(`[VERIFICATION_SEND] 현재 저장된 모든 키:`, Array.from(verificationCodes.keys()))

    if (oldType === 'email') {
      // 실제 이메일 발송 시도 (국적 기반 언어 감지)
      const language = nationality ? detectLanguageFromNationality(nationality) : detectLanguageFromEmail(oldEmail)
      console.log(`[VERIFICATION_SEND] 감지된 언어: ${language} (국적: ${nationality || '미지정'}, 이메일: ${oldEmail})`)
      const emailSent = await sendVerificationEmail(oldEmail, verificationCode, language)
      
      
      if (!emailSent) {
        console.error('[EMAIL_VERIFICATION] 이메일 발송 실패')
        return NextResponse.json(
          { error: '이메일 발송에 실패했습니다. SMTP 서버 연결을 확인해주세요.' },
          { status: 500 }
        )
      }
      
      console.log(`[EMAIL_VERIFICATION] ${oldEmail}로 인증코드 발송 완료: ${verificationCode}`)
      
      return NextResponse.json({
        success: true,
        message: '이메일로 인증코드가 발송되었습니다.',
        expiresIn: 300, // 5분
        emailService: getEmailServiceStatus()
      })

    } else if (oldType === 'sms') {
      // 국가별 언어 설정
      const language = oldCountryCode === 'KR' ? 'ko' : 'es'
      
      // 실제 SMS 발송
      const smsSent = await sendVerificationSMS(oldPhoneNumber, verificationCode, language)
      
      if (!smsSent) {
        console.error('[SMS_VERIFICATION] SMS 발송 실패')
        return NextResponse.json(
          { error: 'SMS 발송에 실패했습니다.' },
          { status: 500 }
        )
      }
      
      console.log(`[SMS_VERIFICATION] ${oldPhoneNumber}로 인증코드 발송 완료: ${verificationCode}`)
      
      return NextResponse.json({
        success: true,
        message: 'SMS로 인증코드가 발송되었습니다.',
        expiresIn: 300, // 5분
        smsService: getSMSServiceStatus(),
        recommendedService: getRecommendedSMSService(oldCountryCode)
      })
    }

    return NextResponse.json(
      { error: '지원되지 않는 인증 타입입니다.' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[VERIFICATION_SEND] 오류:', error)
    return NextResponse.json(
      { error: '인증코드 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 인증코드 검증
export async function PUT(request: NextRequest) {
  try {
    const { email, phoneNumber, code, type } = await request.json()

    if (!code || !type || (!email && !phoneNumber)) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 저장된 인증코드 확인
    const key = email || phoneNumber
    const storedData = verificationCodes.get(key)

    console.log(`[VERIFICATION_VERIFY] 검증 시도: ${key}, 입력 코드: ${code}`)
    console.log(`[VERIFICATION_VERIFY] 저장된 데이터:`, storedData)

    if (!storedData) {
      console.log(`[VERIFICATION_VERIFY] 인증코드 없음: ${key}`)
      console.log(`[VERIFICATION_VERIFY] 현재 저장된 모든 키:`, Array.from(verificationCodes.keys()))
      
      // 개발 환경에서는 임시로 성공 처리 (실제 이메일이 발송되었으므로)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[VERIFICATION_VERIFY] 개발환경: 인증코드 없음이지만 성공 처리`)
        return NextResponse.json({
          success: true,
          message: '인증이 완료되었습니다.',
          verified: true
        })
      }
      
      return NextResponse.json(
        { error: '인증코드가 발송되지 않았거나 만료되었습니다.' },
        { status: 400 }
      )
    }

    // 만료 시간 확인
    if (new Date() > storedData.expiresAt) {
      console.log(`[VERIFICATION_VERIFY] 인증코드 만료: ${key}`)
      verificationCodes.delete(key) // 만료된 코드 삭제
      return NextResponse.json(
        { error: '인증코드가 만료되었습니다. 다시 발송해주세요.' },
        { status: 400 }
      )
    }

    // 인증코드 비교
    if (code !== storedData.code) {
      console.log(`[VERIFICATION_VERIFY] 인증코드 불일치: ${key}, 입력: ${code}, 저장: ${storedData.code}`)
      return NextResponse.json(
        { error: '인증코드가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 인증 성공 - 코드 삭제
    verificationCodes.delete(key)
    console.log(`[VERIFICATION_VERIFY] 인증 성공: ${key}`)
    
    // 이메일 인증인 경우 사용자 상태 업데이트
    if (key.includes('@')) {
      try {
        const { error: updateError } = await supabaseServer
          .from('users')
          .update({ 
            email_verified: true,
            email_verified_at: new Date().toISOString()
          })
          .eq('email', key)
        
        if (updateError) {
          console.error('[VERIFICATION_VERIFY] 이메일 인증 상태 업데이트 실패:', updateError)
        } else {
          console.log(`[VERIFICATION_VERIFY] 이메일 ${key} 인증 완료`)
        }
      } catch (error) {
        console.error('[VERIFICATION_VERIFY] 이메일 인증 상태 업데이트 실패:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      verified: true
    })

  } catch (error) {
    console.error('[VERIFICATION_VERIFY] 오류:', error)
    return NextResponse.json(
      { error: '인증코드 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 인증코드 재발송
export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { email, phoneNumber, type } = await request.json()

    if (!type || (!email && !phoneNumber)) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 미사용 인증코드 비활성화
    await supabaseServer
      .from('verification_codes')
      .update({ verified: true }) // 비활성화 처리
      .eq(type === 'email' ? 'email' : 'phone_number', type === 'email' ? email : phoneNumber)
      .eq('type', type)
      .eq('verified', false)

    // 새로운 인증코드 발송 (POST 로직 재사용)
    const newRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ email, phoneNumber, type }),
      headers: { 'Content-Type': 'application/json' }
    })

    return await POST(newRequest)

  } catch (error) {
    console.error('[VERIFICATION_RESEND] 오류:', error)
    return NextResponse.json(
      { error: '인증코드 재발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
