import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { countries, getCountryByCode } from '@/constants/countries'

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
      birthDate,
      emailVerified = false,
      phoneVerified = false,
      biometricEnabled = false,
      referralCode = ''
    } = await request.json()

    // 필수 필드 검증
    if (!email || !password || !name || !nickname || !birthDate) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const birth = new Date(birthDate)
    if (Number.isNaN(birth.getTime())) {
      return NextResponse.json(
        { error: '유효한 생년월일을 입력해주세요.' },
        { status: 400 }
      )
    }

    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 13) {
      return NextResponse.json(
        { error: '만 13세 미만의 사용자는 보호자 동의 없이 가입할 수 없습니다.' },
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
    // 삭제된 계정(deleted_at이 있는 경우)은 제외하고 확인
    console.log(`[SIGNUP] Supabase 연결 상태: ${supabaseServer ? '연결됨' : '연결 안됨'}`)
    
    if (supabaseServer) {
      try {
        console.log(`[SIGNUP] 이메일 중복 확인 시작: ${email}`)
        const { data: existingUser, error: checkError } = await supabaseServer
          .from('users')
          .select('id, deleted_at')
          .eq('email', email)
          .is('deleted_at', null) // 삭제되지 않은 계정만 확인
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
        
        console.log(`[SIGNUP] 이메일 중복 확인 완료: ${email} (새 사용자 또는 삭제된 계정)`)
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
    
    // 전화번호에 국가번호 추가 (회원가입 시 선택한 country 기준)
    // 이렇게 하면 나중에 타임존 결정 시 국가번호를 정확히 찾을 수 있음
    let formattedPhone = phone
    const selectedCountry = getCountryByCode(country)
    if (selectedCountry && selectedCountry.phoneCode) {
      // 전화번호에서 숫자만 추출
      const phoneDigits = phone.replace(/\D/g, '')
      
      // 이미 국가번호로 시작하는지 확인
      const phoneCodeDigits = selectedCountry.phoneCode.replace(/\D/g, '')
      if (!phoneDigits.startsWith(phoneCodeDigits)) {
        // 국가번호가 없으면 추가
        // 한국 번호의 경우 010-1234-5678 형식에서 0 제거
        if (country === 'KR' && phoneDigits.startsWith('010')) {
          formattedPhone = `${selectedCountry.phoneCode}${phoneDigits.substring(1)}`
        } else {
          formattedPhone = `${selectedCountry.phoneCode}${phoneDigits}`
        }
        console.log(`[SIGNUP] 전화번호 포맷팅: ${phone} → ${formattedPhone} (국가: ${country}, phoneCode: ${selectedCountry.phoneCode})`)
      } else {
        // 이미 국가번호가 포함되어 있으면 +만 추가
        if (!phone.startsWith('+')) {
          formattedPhone = `+${phoneDigits}`
        }
      }
    }
    
    // 이메일을 전역 변수에 저장 (중복 검증용)
    global.registeredEmails!.add(email)
    
    // Supabase Auth를 사용하여 실제 사용자 생성
    if (supabaseServer) {
      try {
        console.log(`[SIGNUP] Supabase Auth를 사용하여 사용자 생성 시도`)
        const selectedCountry = getCountryByCode(country)
        if (selectedCountry && selectedCountry.phoneCode) {
          // 전화번호에서 숫자만 추출
          const phoneDigits = phone.replace(/\D/g, '')
          
          // 이미 국가번호로 시작하는지 확인
          const phoneCodeDigits = selectedCountry.phoneCode.replace(/\D/g, '')
          if (!phoneDigits.startsWith(phoneCodeDigits)) {
            // 국가번호가 없으면 추가
            // 한국 번호의 경우 010-1234-5678 형식에서 0 제거
            if (country === 'KR' && phoneDigits.startsWith('010')) {
              formattedPhone = `${selectedCountry.phoneCode}${phoneDigits.substring(1)}`
            } else {
              formattedPhone = `${selectedCountry.phoneCode}${phoneDigits}`
            }
            console.log(`[SIGNUP] 전화번호 포맷팅: ${phone} → ${formattedPhone} (국가: ${country}, phoneCode: ${selectedCountry.phoneCode})`)
          } else {
            // 이미 국가번호가 포함되어 있으면 +만 추가
            if (!phone.startsWith('+')) {
              formattedPhone = `+${phoneDigits}`
            }
          }
        }
        
        // Supabase Auth로 사용자 생성
        const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
          email: email,
          password: password,
          user_metadata: {
            name: name,
            phone: formattedPhone, // 국가번호 포함된 전화번호 저장
            country: country
          },
          email_confirm: true // 이메일 인증 완료로 설정
        })

        if (authError) {
          console.error('[SIGNUP] Supabase Auth 사용자 생성 실패:', authError)
          
          // 이메일 중복 에러 처리
          if (authError.message?.includes('already registered') || 
              authError.message?.includes('already exists') ||
              authError.message?.includes('User already registered') ||
              authError.message?.includes('email address is already registered')) {
            
            // Supabase Auth에서 이메일로 사용자 찾기
            try {
              const { data: authUsers, error: listError } = await supabaseServer.auth.admin.listUsers()
              
              if (!listError && authUsers) {
                const existingAuthUser = authUsers.users.find(u => u.email === email)
                
                if (existingAuthUser) {
                  // users 테이블에서 해당 사용자가 삭제된 계정인지 확인
                  const { data: userRecord } = await supabaseServer
                    .from('users')
                    .select('id, deleted_at')
                    .eq('id', existingAuthUser.id)
                    .single()
                  
                  // 삭제된 계정이면 강제로 삭제 후 재가입 허용
                  if (userRecord && userRecord.deleted_at) {
                    console.log(`[SIGNUP] 삭제된 계정 감지 (${existingAuthUser.id}), Supabase Auth에서 강제 삭제 시도`)
                    
                    // Supabase Auth에서 강제 삭제
                    const { error: forceDeleteError } = await supabaseServer.auth.admin.deleteUser(existingAuthUser.id)
                    
                    if (forceDeleteError) {
                      console.error('[SIGNUP] 강제 삭제 실패:', forceDeleteError)
                      return NextResponse.json(
                        { error: '계정 삭제 중 오류가 발생했습니다. 고객지원팀에 문의해주세요.' },
                        { status: 500 }
                      )
                    }
                    
                    console.log(`[SIGNUP] 삭제된 계정의 Auth 사용자 강제 삭제 완료: ${existingAuthUser.id}`)
                    
                    // 삭제 후 다시 사용자 생성 시도
                    const { data: retryAuthData, error: retryAuthError } = await supabaseServer.auth.admin.createUser({
                      email: email,
                      password: password,
                      user_metadata: {
                        name: name,
                        phone: formattedPhone,
                        country: country
                      },
                      email_confirm: true
                    })
                    
                    if (retryAuthError) {
                      console.error('[SIGNUP] 재시도 후에도 사용자 생성 실패:', retryAuthError)
                      return NextResponse.json(
                        { error: '계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
                        { status: 500 }
                      )
                    }
                    
                    userId = retryAuthData.user.id
                    console.log(`[SIGNUP] 재시도 후 사용자 생성 성공: ${userId}`)
                    // users 테이블 삽입은 아래 공통 로직으로 진행
                  } else {
                    // 삭제되지 않은 활성 계정
                    return NextResponse.json(
                      { error: '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.' },
                      { status: 409 }
                    )
                  }
                } else {
                  // Auth에 사용자가 없는데 에러가 발생한 경우 (드문 경우)
                  console.warn('[SIGNUP] Auth에 사용자가 없는데 중복 에러 발생, 재시도')
                  // 재시도
                  const { data: retryAuthData, error: retryAuthError } = await supabaseServer.auth.admin.createUser({
                    email: email,
                    password: password,
                    user_metadata: {
                      name: name,
                      phone: formattedPhone,
                      country: country
                    },
                    email_confirm: true
                  })
                  
                  if (retryAuthError) {
                    return NextResponse.json(
                      { error: '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.' },
                      { status: 409 }
                    )
                  }
                  
                  userId = retryAuthData.user.id
                  console.log(`[SIGNUP] 재시도 후 사용자 생성 성공: ${userId}`)
                  // users 테이블 삽입은 아래 공통 로직으로 진행
                }
              } else {
                return NextResponse.json(
                  { error: '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.' },
                  { status: 409 }
                )
              }
            } catch (cleanupError) {
              console.error('[SIGNUP] 삭제된 계정 정리 중 오류:', cleanupError)
              return NextResponse.json(
                { error: '계정 정리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
                { status: 500 }
              )
            }
          } else {
            // 기타 Auth 에러
            return NextResponse.json(
              { error: `계정 생성 실패: ${authError.message || '알 수 없는 오류가 발생했습니다.'}` },
              { status: 500 }
            )
          }
        }
        
        // userId가 설정되었으면 users 테이블에 추가 (정상 생성 또는 재시도 성공)
        if (userId) {
          console.log(`[SIGNUP] users 테이블에 사용자 추가: ${userId}`)
          
          // users 테이블에 추가 또는 업데이트 (삭제된 계정 재가입 시)
          const phoneCountryDigits = (selectedCountry?.phoneCode || '').replace(/\D/g, '') || null
          const userData = {
            id: userId,
            email: email,
            full_name: name,
            nickname: nickname.toLowerCase(), // 소문자로 저장
            phone: phone,
            phone_country: phoneCountryDigits,
            language: country === 'KR' ? 'ko' : 'es', // 한국이 아니면 스페인어로 설정
            is_korean: isKorean || false, // 한국인 여부 추가
            email_verified: false, // 이메일 인증은 별도로 진행
            phone_verified: phoneVerified, // SMS 인증 완료 여부
            birth_date: birth.toISOString().split('T')[0],
            age_verified: true,
            deleted_at: null, // 삭제된 계정 재가입 시 deleted_at 제거
            is_active: true, // 계정 활성화
            updated_at: new Date().toISOString()
          }
          
          // 기존 레코드가 있는지 확인 (삭제된 계정 재가입)
          const { data: existingUser } = await supabaseServer
            .from('users')
            .select('id')
            .eq('id', userId)
            .single()
          
          let userError
          if (existingUser) {
            // 기존 레코드 업데이트 (삭제된 계정 재가입)
            console.log(`[SIGNUP] 기존 사용자 레코드 업데이트: ${userId}`)
            const { error: updateError } = await supabaseServer
              .from('users')
              .update(userData)
              .eq('id', userId)
            userError = updateError
          } else {
            // 새 레코드 삽입
            userData.created_at = new Date().toISOString()
            const { error: insertError } = await supabaseServer
              .from('users')
              .insert(userData)
            userError = insertError
          }

          // 본인의 추천인 코드 생성
          try {
            const { data: myCodeData, error: codeGenError } = await supabaseServer
              .rpc('generate_referral_code')

            if (codeGenError) {
              console.error('[SIGNUP] 추천인 코드 생성 실패:', codeGenError)
            } else {
              const myReferralCode = myCodeData
              console.log('[SIGNUP] 본인 추천인 코드 생성:', myReferralCode)
              
              // 추천인 찾기
              let referredBy = null
              if (referralCode && referralCode.trim() !== '') {
                const { data: referrer, error: findError } = await supabaseServer
                  .from('referrals')
                  .select('user_id')
                  .eq('referral_code', referralCode.toUpperCase())
                  .single()

                if (!findError && referrer) {
                  referredBy = referrer.user_id
                  console.log('[SIGNUP] 추천인 찾음:', referredBy)
                } else {
                  console.log('[SIGNUP] 추천인을 찾을 수 없음:', referralCode)
                }
              }

              // 추천인 정보 저장
              const { error: referralError } = await supabaseServer
                .from('referrals')
                .insert({
                  user_id: userId,
                  referral_code: myReferralCode,
                  referred_by: referredBy
                })

              if (referralError) {
                console.error('[SIGNUP] 추천인 코드 저장 실패:', referralError)
              } else {
                console.log('[SIGNUP] 추천인 코드 저장 성공')
              }
            }
          } catch (error) {
            console.error('[SIGNUP] 추천인 코드 처리 중 오류:', error)
          }

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
    console.log(`전화번호: ${phone || '없음'} → ${typeof formattedPhone !== 'undefined' ? formattedPhone : phone || '없음'}`)
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

    // 이메일 중복 확인 (삭제된 계정은 제외)
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('id, email, name, created_at, deleted_at')
      .eq('email', email)
      .is('deleted_at', null) // 삭제되지 않은 계정만 확인
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