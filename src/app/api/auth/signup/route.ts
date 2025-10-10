import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 개발 환경용 전역 변수 기반 중복 검증
declare global {
  var registeredEmails: Set<string> | undefined
}

if (!global.registeredEmails) {
  global.registeredEmails = new Set<string>()
}

// 개발 환경에서 중복 이메일 체크 초기화 함수
function clearRegisteredEmails() {
  if (process.env.NODE_ENV === 'development') {
    global.registeredEmails = new Set<string>()
    console.log('[SIGNUP] 개발환경: 등록된 이메일 목록 초기화')
  }
}

// 회원가입 처리
export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      name, 
      nickname,
      phone, 
      country, 
      isKorean,
      emailVerified = false,
      phoneVerified = false,
      biometricEnabled = false
    } = await request.json()

    // 필수 필드 검증
    if (!email || !password || !name || !nickname) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 닉네임 검증
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(nickname)) {
      return NextResponse.json(
        { error: '닉네임은 알파벳, 숫자, 특수문자만 사용할 수 있습니다.' },
        { status: 400 }
      )
    }

    if (nickname.length < 3 || nickname.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 3-20자 사이여야 합니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인 (Supabase 기반)
    console.log(`[SIGNUP] Supabase 연결 상태: ${supabaseServer ? '연결됨' : '연결 안됨'}`)
    
    if (supabaseServer) {
      try {
        console.log(`[SIGNUP] 이메일 중복 확인 시작: ${email}`)
        const { data: existingUser, error: checkError } = await supabaseServer
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        console.log(`[SIGNUP] 중복 확인 결과:`, { existingUser, checkError })

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116은 "no rows returned" 에러 (사용자 없음)
          console.error(`[SIGNUP] 이메일 중복 확인 오류: ${email}`, checkError)
          return NextResponse.json(
            { error: '이메일 중복 확인 중 오류가 발생했습니다.' },
            { status: 500 }
          )
        }

        if (existingUser) {
          console.log(`[SIGNUP] 중복 이메일 시도: ${email}`)
          return NextResponse.json(
            { error: '이미 가입된 이메일입니다.' },
            { status: 409 }
          )
        }
        
        console.log(`[SIGNUP] 이메일 중복 확인 완료: ${email} (새 사용자)`)
      } catch (error) {
        console.error(`[SIGNUP] 이메일 중복 확인 예외: ${email}`, error)
        return NextResponse.json(
          { error: '이메일 중복 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }
    } else {
      console.warn(`[SIGNUP] Supabase 연결 안됨 - 중복 체크 건너뜀: ${email}`)
    }

    // 개발 환경에서도 전역 변수 체크
    if (global.registeredEmails!.has(email)) {
      console.log(`[SIGNUP] 개발환경 중복 이메일 시도: ${email}`)
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 409 }
      )
    }

    // 실제 사용자 데이터를 Supabase에 저장
    let userId: string
    
    // 이메일을 전역 변수에 저장 (중복 검증용)
    global.registeredEmails!.add(email)
    
    // Supabase Auth를 사용하여 실제 사용자 생성
    if (supabaseServer) {
      try {
        console.log(`[SIGNUP] Supabase Auth를 사용하여 사용자 생성 시도`)
        
        // Supabase Auth로 사용자 생성
        const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
          email: email,
          password: password,
          user_metadata: {
            name: name,
            phone: phone,
            country: country
          },
          email_confirm: true // 이메일 인증 완료로 설정
        })

        if (authError) {
          console.error('[SIGNUP] Supabase Auth 사용자 생성 실패:', authError)
          // Auth 생성 실패 시 임시 ID 사용
          userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        } else {
          userId = authData.user.id
          console.log(`[SIGNUP] Supabase Auth 사용자 생성 성공: ${userId}`)
          
          // users 테이블에도 추가
          const { error: userError } = await supabaseServer
            .from('users')
            .insert({
              id: userId,
              email: email,
              full_name: name,
              nickname: nickname.toLowerCase(), // 소문자로 저장
              phone: phone,
              language: country === 'KR' ? 'ko' : 'en',
              email_verified: false, // 이메일 인증은 별도로 진행
              phone_verified: false, // 전화번호 인증은 별도로 진행
              created_at: new Date().toISOString()
            })

          if (userError) {
            console.error('[SIGNUP] users 테이블 저장 실패:', userError)
          } else {
            console.log('[SIGNUP] users 테이블 저장 성공')
          }
        }
      } catch (error) {
        console.error('[SIGNUP] Supabase 사용자 생성 중 오류:', error)
        userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    } else {
      // Supabase가 연결되지 않은 경우 임시 ID 생성
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.warn('[SIGNUP] Supabase가 연결되지 않았습니다. 임시 ID를 사용합니다.')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('👤 회원가입 처리 완료')
    console.log('='.repeat(60))
    console.log(`사용자 ID: ${userId}`)
    console.log(`이메일: ${email}`)
    console.log(`이름: ${name}`)
    console.log(`전화번호: ${phone || '없음'}`)
    console.log(`국가: ${country || '없음'}`)
    console.log(`한국인 여부: ${isKorean}`)
    console.log(`이메일 인증: ${emailVerified}`)
    console.log(`전화 인증: ${phoneVerified}`)
    console.log(`생체 인증: ${biometricEnabled}`)
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        userId: userId,
        email: email,
        name: name,
        emailVerified: emailVerified,
        phoneVerified: phoneVerified,
        biometricEnabled: biometricEnabled
      }
    })

  } catch (error) {
    console.error('[SIGNUP] 오류:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 회원가입 상태 확인
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('id, email, name, created_at')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[SIGNUP_CHECK] 조회 실패:', checkError)
      return NextResponse.json(
        { error: '이메일 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        exists: !!existingUser,
        user: existingUser || null
      }
    })

  } catch (error) {
    console.error('[SIGNUP_CHECK] 오류:', error)
    return NextResponse.json(
      { error: '이메일 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}