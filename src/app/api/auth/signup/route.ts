import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { countries, getCountryByCode } from '@/constants/countries'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

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
  // Rate limiting: IP당 30분에 5회
  const ip = getClientIp(request)
  const rl = checkRateLimit(`signup:${ip}`, { limit: 5, windowMs: 30 * 60 * 1000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) }
      }
    )
  }

  try {
    const { 
      email, 
      password, 
      name, 
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
    if (!email || !password || !name || !birthDate) {
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

    // 비밀번호 검증 (서버사이드 복잡도 체크)
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: '비밀번호에 숫자가 포함되어야 합니다.' },
        { status: 400 }
      )
    }
    if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\/~`]/.test(password)) {
      return NextResponse.json(
        { error: '비밀번호에 특수문자가 포함되어야 합니다.' },
        { status: 400 }
      )
    }
    if (/(.)(\1{2,})/.test(password)) {
      return NextResponse.json(
        { error: '비밀번호에 동일한 문자를 3번 이상 연속으로 사용할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인 (Supabase 기반)
    // 삭제된 계정(deleted_at이 있는 경우)은 제외하고 확인
    console.log(`[SIGNUP] Supabase 연결 상태: ${supabaseServer ? '연결됨' : '연결 안됨'}`)
    
    if (supabaseServer) {
      try {
        console.log(`[SIGNUP] 이메일 중복 확인 시작: ${email}`)
        
        // 1. public.users 테이블 확인
        const { data: existingUser, error: checkError } = await supabaseServer
          .from('users')
          .select('id, deleted_at')
          .eq('email', email)
          .is('deleted_at', null) // 삭제되지 않은 계정만 확인
          .single()

        console.log(`[SIGNUP] public.users 중복 확인 결과:`, { existingUser, checkError })

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
        
        // 2. auth.users 테이블 확인 (public.users에 없어도 auth.users에 남아있을 수 있음)
        // getUserByEmail이 없으므로 listUsers()를 사용하여 이메일로 필터링
        try {
          const { data: authUsersData, error: authListError } = await supabaseServer.auth.admin.listUsers()
          
          if (!authListError && authUsersData) {
            const emailLower = email.toLowerCase()
            const existingAuthUser = authUsersData.users.find(u => u.email?.toLowerCase() === emailLower)
            
            if (existingAuthUser) {
              console.log(`[SIGNUP] auth.users에 사용자 존재: ${email} (ID: ${existingAuthUser.id})`)
              console.log(`[SIGNUP] auth.users에서 사용자 삭제 시도 (force 옵션 사용)`)
              
              // auth.users에 존재하지만 public.users에는 없는 경우 (삭제 실패한 경우)
              // force 옵션을 사용하여 외래 키 제약 조건을 무시하고 강제 삭제
              const { error: deleteAuthError } = await supabaseServer.auth.admin.deleteUser(existingAuthUser.id, true)
              
              if (deleteAuthError) {
                console.error(`[SIGNUP] auth.users 삭제 실패 (force 옵션 사용): ${email}`, deleteAuthError)
                
                // force 옵션으로도 실패하면, 관련 데이터를 먼저 정리한 후 재시도
                console.log(`[SIGNUP] 관련 데이터 정리 후 재시도`)
                try {
                  // verification_codes에서 이메일 관련 데이터 삭제
                  await supabaseServer
                    .from('verification_codes')
                    .delete()
                    .eq('email', email.toLowerCase())
                  
                  // 다시 삭제 시도
                  const { error: retryDeleteError } = await supabaseServer.auth.admin.deleteUser(existingAuthUser.id, true)
                  
                  if (retryDeleteError) {
                    console.error(`[SIGNUP] 재시도 후에도 auth.users 삭제 실패: ${email}`, retryDeleteError)
                    // 삭제 실패 시 기존 사용자의 비밀번호를 새 비밀번호로 업데이트
                    console.log(`[SIGNUP] auth.users 삭제 실패, 기존 사용자의 비밀번호 업데이트 시도`)
                    try {
                      const { error: updatePasswordError } = await supabaseServer.auth.admin.updateUserById(existingAuthUser.id, {
                        password: password,
                        user_metadata: {
                          name: name,
                          country: country
                        },
                        email_confirm: true
                      })
                      
                      if (updatePasswordError) {
                        console.error(`[SIGNUP] 비밀번호 업데이트 실패: ${email}`, updatePasswordError)
                        // 업데이트 실패해도 계속 진행 (createUser 시도 시 에러 처리 로직에서 처리)
                        console.warn(`[SIGNUP] 비밀번호 업데이트 실패했지만 계속 진행 (createUser 시도 시 에러 처리)`)
                      } else {
                        console.log(`[SIGNUP] 기존 사용자의 비밀번호 업데이트 성공: ${email}`)
                        // 비밀번호 업데이트 성공 시 기존 사용자 ID 사용
                        userId = existingAuthUser.id
                        // 이메일을 전역 변수에 저장 (중복 검증용)
                        global.registeredEmails!.add(email)
                        console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
                        // createUser를 건너뛰고 바로 users 테이블 삽입으로 진행
                        // 아래 createUser 로직을 건너뛰기 위해 플래그 설정
                        const skipCreateUser = true
                        // 이 부분은 아래에서 처리하도록 수정 필요
                      }
                    } catch (updateException) {
                      console.error(`[SIGNUP] 비밀번호 업데이트 중 예외: ${email}`, updateException)
                      // 업데이트 실패해도 계속 진행
                    }
                    // 삭제 실패해도 계속 진행 (createUser 시도 시 에러 처리 로직에서 처리)
                    console.warn(`[SIGNUP] auth.users 삭제 실패했지만 계속 진행 (createUser 시도 시 에러 처리)`)
                  } else {
                    console.log(`[SIGNUP] 재시도 후 auth.users에서 사용자 삭제 성공: ${email}`)
                    // 삭제 성공 시 global.registeredEmails에서도 제거
                    if (global.registeredEmails!.has(email)) {
                      global.registeredEmails!.delete(email)
                      console.log(`[SIGNUP] 재시도 후 global.registeredEmails에서도 제거: ${email}`)
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
                  }
                } catch (cleanupError) {
                  console.error(`[SIGNUP] 관련 데이터 정리 중 오류: ${email}`, cleanupError)
                  // 정리 실패해도 계속 진행
                }
              } else {
                console.log(`[SIGNUP] auth.users에서 사용자 삭제 성공: ${email}`)
                // 삭제 성공 시 global.registeredEmails에서도 제거
                if (global.registeredEmails!.has(email)) {
                  global.registeredEmails!.delete(email)
                  console.log(`[SIGNUP] global.registeredEmails에서도 제거: ${email}`)
                }
                // 삭제 성공 후 충분한 대기 시간
                await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
              }
            } else {
              console.log(`[SIGNUP] auth.users에 사용자 없음: ${email}`)
              // auth.users에 사용자가 없으면 global.registeredEmails에서도 제거
              if (global.registeredEmails!.has(email)) {
                global.registeredEmails!.delete(email)
                console.log(`[SIGNUP] auth.users에 사용자 없으므로 global.registeredEmails에서도 제거: ${email}`)
              }
            }
          } else {
            console.warn(`[SIGNUP] auth.users 목록 조회 실패: ${authListError?.message || '알 수 없는 오류'}`)
            // 목록 조회 실패 시에도 global.registeredEmails에서 제거 (안전을 위해)
            if (global.registeredEmails!.has(email)) {
              global.registeredEmails!.delete(email)
              console.log(`[SIGNUP] auth.users 목록 조회 실패 시 global.registeredEmails에서도 제거: ${email}`)
            }
            // 목록 조회 실패는 경고만 하고 계속 진행 (createUser 시도 시 에러 처리)
          }
        } catch (authCheckException) {
          console.error(`[SIGNUP] auth.users 확인 중 예외: ${email}`, authCheckException)
          // 예외 발생 시에도 global.registeredEmails에서 제거 (안전을 위해)
          if (global.registeredEmails!.has(email)) {
            global.registeredEmails!.delete(email)
            console.log(`[SIGNUP] auth.users 확인 예외 시 global.registeredEmails에서도 제거: ${email}`)
          }
          // auth.users 확인 실패는 경고만 하고 계속 진행 (새 사용자일 수도 있음)
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
    let userId: string | undefined = undefined
    
    // 전화번호는 인증센터에서 입력하므로 회원가입 시에는 저장하지 않음
    // (전화번호 포맷팅 로직 제거)
    
    // Supabase Auth를 사용하여 실제 사용자 생성
    if (supabaseServer) {
      try {
        // userId가 이미 설정되었는지 확인 (비밀번호 업데이트 성공한 경우)
        if (!userId) {
        console.log(`[SIGNUP] Supabase Auth를 사용하여 사용자 생성 시도`)
        
        // Supabase Auth로 사용자 생성 (전화번호는 인증센터에서 입력)
        // 이메일 인증이 완료된 경우 email_confirm을 true로 설정하여 로그인 가능하도록 함
        // 이메일 인증이 완료되지 않은 경우에도 로그인을 허용하기 위해 true로 설정
        // (Supabase 설정에서 이메일 확인을 필수로 하지 않는 경우)
        const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
          email: email,
          password: password,
          user_metadata: {
            name: name,
            country: country
          },
          email_confirm: true // 이메일 인증 완료 여부와 관계없이 항상 true로 설정하여 로그인 가능하도록 함
        })

        if (!authError && authData?.user) {
          // 정상적인 createUser 성공
          userId = authData.user.id
          console.log(`[SIGNUP] Supabase Auth 사용자 생성 성공: ${userId}`)
          // 이메일을 전역 변수에 저장 (중복 검증용)
          global.registeredEmails!.add(email)
          console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
        } else if (authError) {
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
                const emailLower = email.toLowerCase()
                const existingAuthUser = authUsers.users.find(u => u.email?.toLowerCase() === emailLower)
                
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
                        // 삭제 실패 시 기존 사용자의 비밀번호를 새 비밀번호로 업데이트
                        console.log(`[SIGNUP] 삭제 실패, 기존 사용자의 비밀번호 업데이트 시도`)
                        try {
                          const { error: updatePasswordError } = await supabaseServer.auth.admin.updateUserById(existingAuthUser.id, {
                            password: password,
                            user_metadata: {
                              name: name,
                              country: country
                            },
                            email_confirm: true
                          })
                        
                          if (updatePasswordError) {
                            console.error('[SIGNUP] 비밀번호 업데이트 실패:', updatePasswordError)
                            // 업데이트 실패해도 재시도 (auth.users에서 이미 삭제되었을 수 있음)
                            console.warn('[SIGNUP] 비밀번호 업데이트 실패했지만 재시도 진행')
                          } else {
                            console.log(`[SIGNUP] 기존 사용자의 비밀번호 업데이트 성공: ${existingAuthUser.id}`)
                            // 비밀번호 업데이트 성공 시 기존 사용자 ID 사용
                            userId = existingAuthUser.id
                            // 이메일을 전역 변수에 저장 (중복 검증용)
                            global.registeredEmails!.add(email)
                            console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
                            // createUser를 건너뛰고 바로 users 테이블 삽입으로 진행
                            // 아래 createUser 로직을 건너뛰기 위해 여기서 return하지 않고 userId만 설정
                          }
                        } catch (updateException) {
                          console.error('[SIGNUP] 비밀번호 업데이트 중 예외:', updateException)
                          // 업데이트 실패해도 재시도
                        }
                      // 삭제 실패해도 재시도 (auth.users에서 이미 삭제되었을 수 있음)
                      console.warn('[SIGNUP] 삭제 실패했지만 재시도 진행')
                    } else {
                      console.log(`[SIGNUP] 삭제된 계정의 Auth 사용자 강제 삭제 완료: ${existingAuthUser.id}`)
                    }
                    
                      // userId가 설정되지 않았을 때만 createUser 시도
                      if (!userId) {
                    // 삭제 후 충분한 대기 시간 (Supabase가 완전히 처리할 시간)
                    await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
                    
                    // 다시 사용자 생성 시도
                    const { data: retryAuthData, error: retryAuthError } = await supabaseServer.auth.admin.createUser({
                      email: email,
                      password: password,
                      user_metadata: {
                        name: name,
                        country: country
                      },
                      email_confirm: emailVerified
                    })
                    
                    if (retryAuthError) {
                      console.error('[SIGNUP] 재시도 후에도 사용자 생성 실패:', retryAuthError)
                      
                      // 여전히 중복 에러면 한 번 더 시도
                      if (retryAuthError.message?.includes('already registered') || 
                          retryAuthError.message?.includes('already exists')) {
                        console.log('[SIGNUP] 여전히 중복 에러, 추가 대기 후 재시도')
                        await new Promise(resolve => setTimeout(resolve, 3000)) // 3초 더 대기
                        
                        const { data: finalRetryData, error: finalRetryError } = await supabaseServer.auth.admin.createUser({
                          email: email,
                          password: password,
                          user_metadata: {
                            name: name,
                            country: country
                          },
                          email_confirm: true
                        })
                        
                        if (finalRetryError) {
                          return NextResponse.json(
                            { error: '계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
                            { status: 500 }
                          )
                        }
                        
                        userId = finalRetryData.user.id
                        console.log(`[SIGNUP] 최종 재시도 후 사용자 생성 성공: ${userId}`)
                        // 이메일을 전역 변수에 저장 (중복 검증용)
                        global.registeredEmails!.add(email)
                        console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
                      } else {
                        return NextResponse.json(
                          { error: '계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
                          { status: 500 }
                        )
                      }
                    } else {
                      userId = retryAuthData.user.id
                      console.log(`[SIGNUP] 재시도 후 사용자 생성 성공: ${userId}`)
                      // 이메일을 전역 변수에 저장 (중복 검증용)
                      global.registeredEmails!.add(email)
                      console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
                        }
                    }
                    // users 테이블 삽입은 아래 공통 로직으로 진행
                    } else if (!userRecord) {
                      // public.users에 없는 경우 (삭제된 계정이지만 deleted_at이 null인 경우)
                      // 기존 사용자의 비밀번호를 업데이트
                      console.log(`[SIGNUP] public.users에 없는 계정 감지 (${existingAuthUser.id}), 비밀번호 업데이트 시도`)
                      try {
                        const { error: updatePasswordError } = await supabaseServer.auth.admin.updateUserById(existingAuthUser.id, {
                          password: password,
                          user_metadata: {
                            name: name,
                            country: country
                          },
                          email_confirm: true
                        })
                      
                        if (updatePasswordError) {
                          console.error('[SIGNUP] 비밀번호 업데이트 실패:', updatePasswordError)
                          return NextResponse.json(
                            { error: '계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
                            { status: 500 }
                          )
                        } else {
                          console.log(`[SIGNUP] 기존 사용자의 비밀번호 업데이트 성공: ${existingAuthUser.id}`)
                          // 비밀번호 업데이트 성공 시 기존 사용자 ID 사용
                          userId = existingAuthUser.id
                          // 이메일을 전역 변수에 저장 (중복 검증용)
                          global.registeredEmails!.add(email)
                          console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
                          // createUser를 건너뛰고 바로 users 테이블 삽입으로 진행
                        }
                      } catch (updateException) {
                        console.error('[SIGNUP] 비밀번호 업데이트 중 예외:', updateException)
                        return NextResponse.json(
                          { error: '계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
                          { status: 500 }
                        )
                      }
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
                      country: country
                    },
                    email_confirm: emailVerified
                  })
                  
                  if (retryAuthError) {
                    return NextResponse.json(
                      { error: '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.' },
                      { status: 409 }
                    )
                  }
                  
                  userId = retryAuthData.user.id
                  console.log(`[SIGNUP] 재시도 후 사용자 생성 성공: ${userId}`)
                  // 이메일을 전역 변수에 저장 (중복 검증용)
                  global.registeredEmails!.add(email)
                  console.log(`[SIGNUP] global.registeredEmails에 추가: ${email}`)
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
          
          // 언어 결정: 국적 기준 (한국 국적이면 한국어, 아니면 스페인어)
          const determinedLanguage = country === 'KR' ? 'ko' : 'es'
          
          // 한국인 여부: 국적 기준으로만 결정
          const isActuallyKorean = country === 'KR'
          
          console.log(`[SIGNUP] 언어 및 한국인 여부 결정:`, {
            selectedCountry: country,
            determinedLanguage: determinedLanguage,
            frontendIsKorean: isKorean,
            actualIsKorean: isActuallyKorean,
            note: '언어와 한국인 여부는 국적 기준으로 결정됩니다'
          })
          
          // users 테이블에 추가 또는 업데이트 (삭제된 계정 재가입 시)
          // nickname은 고유해야 하므로 이름 + 타임스탬프로 생성
          const timestamp = Date.now()
          const uniqueNickname = `${name}_${timestamp}`
          
          const userData: any = {
            id: userId,
            email: email,
            full_name: name,
            nickname: uniqueNickname, // 고유한 nickname 생성
            phone: null, // 전화번호는 인증센터에서 입력
            country: country, // 국적 저장
            language: determinedLanguage, // 국적 기준 언어
            is_korean: isActuallyKorean, // 국적 기준 한국인 여부
            updated_at: new Date().toISOString()
          }

          // SMS 인증은 인증센터에서 진행

          // 이메일 인증 완료 시 email_verified_at 저장
          // 실제 이메일 인증이 완료된 경우에만 email_verified_at 설정
          if (emailVerified) {
            userData.email_verified_at = new Date().toISOString()
            console.log('[SIGNUP] 이메일 인증 완료 - email_verified_at 저장')
          } else {
            userData.email_verified_at = null
            console.log('[SIGNUP] 이메일 인증 미완료 - email_verified_at null')
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
            console.error('[SIGNUP] userError 상세:', {
              code: userError.code,
              message: userError.message,
              details: userError.details,
              hint: userError.hint
            })
            // users 테이블 저장 실패 시 에러 반환
            // auth.users는 생성되었지만 public.users에 저장 실패한 경우
            // auth.users에서도 삭제하여 일관성 유지
            try {
              await supabaseServer.auth.admin.deleteUser(userId, true)
              console.log(`[SIGNUP] users 테이블 저장 실패로 인해 auth.users에서도 삭제: ${userId}`)
            } catch (deleteError) {
              console.error('[SIGNUP] auth.users 삭제 실패:', deleteError)
            }
            // global.registeredEmails에서도 제거
            if (global.registeredEmails!.has(email)) {
              global.registeredEmails!.delete(email)
              console.log(`[SIGNUP] users 테이블 저장 실패로 인해 global.registeredEmails에서도 제거: ${email}`)
            }
            // 개발 환경에서만 상세한 에러 정보 포함
            const errorMessage = process.env.NODE_ENV === 'development' 
              ? `회원가입 중 오류가 발생했습니다: ${userError.message || '알 수 없는 오류'}`
              : '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            return NextResponse.json(
              { 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && {
                  debug: {
                    code: userError.code,
                    details: userError.details,
                    hint: userError.hint
                  }
                })
              },
              { status: 500 }
            )
          } else {
            console.log('[SIGNUP] users 테이블 저장 성공')
          }
        } else {
          // userId가 설정되지 않았으면 에러 반환
          console.error('[SIGNUP] userId가 설정되지 않음')
          console.error('[SIGNUP] userId 미설정 상세:', {
            email,
            userId: userId,
            userIdType: typeof userId,
            userIdDefined: typeof userId !== 'undefined'
          })
          // global.registeredEmails에서도 제거
          if (global.registeredEmails!.has(email)) {
            global.registeredEmails!.delete(email)
            console.log(`[SIGNUP] userId 미설정으로 인해 global.registeredEmails에서도 제거: ${email}`)
          }
          return NextResponse.json(
            { 
              error: process.env.NODE_ENV === 'development'
                ? '계정 생성에 실패했습니다: userId가 설정되지 않았습니다'
                : '계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
              ...(process.env.NODE_ENV === 'development' && {
                debug: {
                  email,
                  userId: userId,
                  userIdDefined: typeof userId !== 'undefined'
                }
              })
            },
            { status: 500 }
          )
        }
        }
      } catch (error: any) {
        console.error('[SIGNUP] Supabase 사용자 생성 중 오류:', error)
        console.error('[SIGNUP] 에러 상세:', {
          message: error?.message,
          stack: error?.stack,
          code: error?.code,
          details: error?.details
        })
        // global.registeredEmails에서도 제거
        if (global.registeredEmails!.has(email)) {
          global.registeredEmails!.delete(email)
          console.log(`[SIGNUP] 예외 발생으로 인해 global.registeredEmails에서도 제거: ${email}`)
        }
        // 개발 환경에서만 상세한 에러 정보 포함
        const errorMessage = process.env.NODE_ENV === 'development'
          ? `회원가입 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`
          : '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        return NextResponse.json(
          { 
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && {
              debug: {
                code: error?.code,
                details: error?.details,
                stack: error?.stack
              }
            })
          },
          { status: 500 }
        )
      }
    } else {
      // Supabase가 연결되지 않은 경우 에러 반환
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('👤 회원가입 처리 완료')
    console.log('='.repeat(60))
    console.log(`사용자 ID: ${userId}`)
    console.log(`이메일: ${email}`)
    console.log(`이름: ${name}`)
    console.log(`전화번호: 인증센터에서 입력 예정`)
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