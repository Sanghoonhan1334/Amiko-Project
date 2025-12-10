import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'
import { toE164 } from '@/lib/phoneUtils'

// 로그인 처리
export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    // 필수 필드 검증
    if (!identifier || !password) {
      return NextResponse.json(
        { error: '이메일/전화번호와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성 (쿠키 기반)
    const supabase = await createSupabaseClient()

    // 이메일 또는 전화번호로 로그인 시도
    // identifier가 이메일인지 전화번호인지 확인
    const isEmail = identifier.includes('@')
    
    let authResult
    if (isEmail) {
      // 이메일로 로그인
      authResult = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      })
    } else {
      // 전화번호로 로그인 (전화번호는 users 테이블에서 조회 필요)
      // 먼저 전화번호로 사용자 찾기
      if (!supabaseServer) {
        return NextResponse.json(
          { error: '데이터베이스 연결이 설정되지 않았습니다.' },
          { status: 500 }
        )
      }

      // 전화번호 정규화 시도 (E.164 형식)
      let normalizedPhone = identifier
      let userData = null
      let userError = null

      // 검색할 전화번호 변형 목록 생성
      const searchVariants: string[] = [identifier] // 원본 포함
      
      // 1. 원본 형식으로 먼저 검색
      console.log('[SIGNIN] 전화번호 로그인 시도 - 원본:', identifier)
      
      // 2. E.164 형식으로 정규화
      try {
        normalizedPhone = toE164(identifier)
        if (normalizedPhone && normalizedPhone !== identifier && normalizedPhone.startsWith('+')) {
          searchVariants.push(normalizedPhone)
          console.log('[SIGNIN] E.164 정규화:', identifier, '→', normalizedPhone)
        }
      } catch (normalizeError) {
        console.warn('[SIGNIN] 전화번호 정규화 실패:', normalizeError)
      }

      // 3. 하이픈 제거
      const digitsOnly = identifier.replace(/\D/g, '')
      if (digitsOnly !== identifier && digitsOnly.length > 0) {
        searchVariants.push(digitsOnly)
        console.log('[SIGNIN] 하이픈 제거:', digitsOnly)
      }

      // 4. 하이픈 제거 후 E.164 정규화
      if (digitsOnly.length > 0) {
        try {
          const normalizedFromDigits = toE164(digitsOnly)
          if (normalizedFromDigits && normalizedFromDigits.startsWith('+') && !searchVariants.includes(normalizedFromDigits)) {
            searchVariants.push(normalizedFromDigits)
            console.log('[SIGNIN] 하이픈 제거 후 E.164:', normalizedFromDigits)
          }
        } catch (error) {
          console.warn('[SIGNIN] 하이픈 제거 후 정규화 실패:', error)
        }
      }

      // 5. 한국 번호 특수 처리: +82010... → +8210... (0 제거)
      if (identifier.startsWith('+82') && identifier.length > 4) {
        const after82 = identifier.substring(3) // +82 이후 부분
        if (after82.startsWith('0')) {
          const corrected = '+82' + after82.substring(1) // 첫 번째 0 제거
          if (!searchVariants.includes(corrected)) {
            searchVariants.push(corrected)
            console.log('[SIGNIN] 한국 번호 0 제거:', identifier, '→', corrected)
          }
        }
      }

      // 6. 숫자만 추출 후 한국 번호 처리 (010... → +8210...)
      if (digitsOnly.length > 0) {
        // 010으로 시작하는 경우
        if (digitsOnly.startsWith('010')) {
          const koreanFormat = '+82' + digitsOnly.substring(1) // 0 제거 후 +82 추가
          if (!searchVariants.includes(koreanFormat)) {
            searchVariants.push(koreanFormat)
            console.log('[SIGNIN] 한국 번호 변환 (010 → +82):', koreanFormat)
          }
          
          // 하이픈 포함 형식 추가 (010-XXXX-XXXX)
          if (digitsOnly.length === 11) {
            const withHyphens = `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(3, 7)}-${digitsOnly.substring(7)}`
            if (!searchVariants.includes(withHyphens)) {
              searchVariants.push(withHyphens)
              console.log('[SIGNIN] 하이픈 포함 형식 추가:', withHyphens)
            }
          }
        }
        // 82로 시작하는 경우 (국가번호만)
        if (digitsOnly.startsWith('82') && digitsOnly.length > 2) {
          const withPlus = '+' + digitsOnly
          if (!searchVariants.includes(withPlus)) {
            searchVariants.push(withPlus)
            console.log('[SIGNIN] 국가번호 + 추가:', withPlus)
          }
        }
      }
      
      // 7. E.164 형식에서 하이픈 포함 형식으로 변환 (+8210... → 010-XXXX-XXXX)
      if (normalizedPhone && normalizedPhone.startsWith('+82') && normalizedPhone.length === 13) {
        // +8210XXXXXXXX 형식을 010-XXXX-XXXX로 변환
        const after82 = normalizedPhone.substring(3) // 10XXXXXXXX
        if (after82.startsWith('10') && after82.length === 10) {
          const withHyphens = `010-${after82.substring(2, 6)}-${after82.substring(6)}`
          if (!searchVariants.includes(withHyphens)) {
            searchVariants.push(withHyphens)
            console.log('[SIGNIN] E.164 → 하이픈 형식 변환:', normalizedPhone, '→', withHyphens)
          }
        }
      }

      // 중복 제거
      const uniqueVariants = [...new Set(searchVariants)]
      console.log('[SIGNIN] 검색할 전화번호 변형 목록:', uniqueVariants)

      // 각 변형으로 검색 시도
      let result = null
      for (const variant of uniqueVariants) {
        if (!variant || variant.length === 0) continue
        
        console.log('[SIGNIN] 검색 시도:', variant)
        result = await supabaseServer
          .from('users')
          .select('email, phone')
          .eq('phone', variant)
          .maybeSingle()

        if (result.data) {
          userData = result.data
          console.log('[SIGNIN] ✅ 사용자 찾음:', {
            검색형식: variant,
            DB저장형식: userData.phone,
            이메일: userData.email
          })
          break
        } else if (result.error && result.error.code !== 'PGRST116') {
          // PGRST116은 "not found" 에러이므로 무시, 다른 에러는 로깅
          console.warn('[SIGNIN] 검색 중 에러:', variant, result.error)
        }
      }

      if (!userData || !userData.email) {
        console.error('[SIGNIN] 전화번호로 사용자를 찾을 수 없음:', {
          입력값: identifier,
          검색시도한_변형들: uniqueVariants,
          마지막_검색_결과: result?.error || '사용자 없음',
          디버깅_정보: {
            '입력값_길이': identifier.length,
            '입력값_형식': identifier.startsWith('+') ? 'E.164' : '일반',
            '숫자만_추출': digitsOnly,
            '정규화_시도': normalizedPhone
          }
        })
        
        // 디버깅: 실제 DB에 저장된 전화번호 형식 샘플 조회 (최근 5개)
        try {
          const { data: samplePhones } = await supabaseServer
            .from('users')
            .select('phone')
            .not('phone', 'is', null)
            .limit(5)
          
          console.log('[SIGNIN] DB에 저장된 전화번호 샘플 (최근 5개):', samplePhones)
        } catch (sampleError) {
          console.warn('[SIGNIN] 샘플 조회 실패:', sampleError)
        }
        
        return NextResponse.json(
          { 
            error: '이메일 또는 비밀번호가 올바르지 않습니다.',
            hint: '전화번호로 로그인하는 경우, 가입 시 입력한 전화번호 형식과 동일하게 입력해주세요. (예: +821012345678 또는 010-1234-5678)',
            debug: process.env.NODE_ENV === 'development' ? {
              입력값: identifier,
              검색시도한_변형들: uniqueVariants
            } : undefined
          },
          { status: 401 }
        )
      }

      // 찾은 이메일로 로그인
      console.log('[SIGNIN] 찾은 사용자 이메일로 로그인 시도:', userData.email)
      authResult = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })
    }

    if (authResult.error) {
      console.error('[SIGNIN] 로그인 실패:', authResult.error)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    if (!authResult.data.session || !authResult.data.user) {
      return NextResponse.json(
        { error: '로그인에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    let userInfo
    const { data: userInfoData, error: userInfoError } = await supabaseServer!
      .from('users')
      .select('*')
      .eq('id', authResult.data.user.id)
      .single()

    if (userInfoError) {
      console.error('[SIGNIN] 사용자 정보 조회 실패:', userInfoError)
      
      // auth.users에는 있지만 public.users에는 없는 경우
      // 계정 삭제가 진행 중일 수 있으므로 삭제 로그 확인
      if (userInfoError.code === 'PGRST116') {
        console.log('[SIGNIN] public.users에 사용자 없음, 계정 삭제 진행 중인지 확인')
        
        // 계정 삭제가 최근에 진행되었는지 확인 (최근 1시간 내)
        const { data: deletionLog, error: deletionLogError } = await supabaseServer!
          .from('data_deletion_logs')
          .select('*')
          .eq('user_id', authResult.data.user.id)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 최근 1시간
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (deletionLog && !deletionLogError) {
          console.log('[SIGNIN] 계정 삭제가 진행 중입니다. auth.users에서도 삭제 시도')
          // 계정 삭제 진행 중이므로 auth.users에서도 삭제 시도
          try {
            const { error: deleteAuthError } = await supabaseServer!.auth.admin.deleteUser(authResult.data.user.id)
            if (deleteAuthError) {
              console.error('[SIGNIN] auth.users 삭제 실패:', deleteAuthError)
            } else {
              console.log('[SIGNIN] auth.users에서 사용자 삭제 성공')
            }
          } catch (deleteException) {
            console.error('[SIGNIN] auth.users 삭제 중 예외:', deleteException)
          }
          
          // 세션 무효화
          await supabase.auth.signOut()
          
          return NextResponse.json(
            { error: '계정이 삭제되었습니다. 다시 가입해주세요.' },
            { status: 401 }
          )
        }
        
        // 삭제 로그가 없으면 auth.users에만 존재하는 orphaned 계정
        // auth.users에서 삭제하여 깨끗한 상태로 만들기
        console.log('[SIGNIN] auth.users에는 있지만 public.users에는 없음. auth.users에서 삭제 시도 (force 옵션 사용)')
        try {
          // 관련 데이터 먼저 정리
          try {
            if (authResult.data.user.email) {
              await supabaseServer!
                .from('verification_codes')
                .delete()
                .eq('email', authResult.data.user.email.toLowerCase())
              console.log('[SIGNIN] verification_codes 정리 완료')
            }
          } catch (cleanupError) {
            console.warn('[SIGNIN] 관련 데이터 정리 중 오류 (무시하고 계속 진행):', cleanupError)
          }
          
          // force 옵션을 사용하여 외래 키 제약 조건을 무시하고 강제 삭제
          const { error: deleteAuthError } = await supabaseServer!.auth.admin.deleteUser(authResult.data.user.id, true)
          if (deleteAuthError) {
            console.error('[SIGNIN] auth.users 삭제 실패 (force 옵션 사용):', deleteAuthError)
            // 삭제 실패해도 에러 반환
            return NextResponse.json(
              { error: '계정 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.' },
              { status: 401 }
            )
          } else {
            console.log('[SIGNIN] auth.users에서 orphaned 사용자 삭제 성공')
            // 세션 무효화
            await supabase.auth.signOut()
            
            return NextResponse.json(
              { error: '계정 정보를 찾을 수 없습니다. 다시 가입해주세요.' },
              { status: 401 }
            )
          }
        } catch (deleteException) {
          console.error('[SIGNIN] auth.users 삭제 중 예외:', deleteException)
          // 세션 무효화
          await supabase.auth.signOut()
          
          return NextResponse.json(
            { error: '계정 정보를 찾을 수 없습니다. 다시 가입해주세요.' },
            { status: 401 }
          )
        }
      } else {
        userInfo = null
      }
    } else {
      userInfo = userInfoData
    }

    // 사용자 인증 상태 조회
    const { data: authStatus } = await supabaseServer!
      .from('user_auth_status')
      .select('*')
      .eq('user_id', authResult.data.user.id)
      .single()

    console.log('[SIGNIN] 로그인 성공:', {
      userId: authResult.data.user.id,
      email: authResult.data.user.email
    })

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        user: {
          id: authResult.data.user.id,
          email: authResult.data.user.email,
          name: userInfo?.name || '',
          phone: userInfo?.phone || '',
          country: userInfo?.country || '',
          isKorean: userInfo?.is_korean || false,
          emailVerified: authStatus?.email_verified || false,
          phoneVerified: authStatus?.phone_verified || false,
          biometricEnabled: authStatus?.biometric_enabled || false
        },
        session: {
          access_token: authResult.data.session.access_token,
          refresh_token: authResult.data.session.refresh_token,
          expires_at: authResult.data.session.expires_at
        }
      }
    })

    // 세션 쿠키는 createSupabaseClient가 자동으로 설정함
    return response

  } catch (error) {
    console.error('[SIGNIN] 오류:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 로그인 상태 확인
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 세션 확인
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        data: { isAuthenticated: false }
      })
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      // auth.users에는 있지만 public.users에는 없는 경우
      if (userError?.code === 'PGRST116') {
        console.log('[SIGNIN_STATUS] public.users에 사용자 없음, auth.users에서 삭제 시도')
        
        // auth.users에서 삭제 시도
        try {
          const { error: deleteAuthError } = await supabaseServer.auth.admin.deleteUser(session.user.id)
          if (deleteAuthError) {
            console.error('[SIGNIN_STATUS] auth.users 삭제 실패:', deleteAuthError)
          } else {
            console.log('[SIGNIN_STATUS] auth.users에서 orphaned 사용자 삭제 성공')
          }
        } catch (deleteException) {
          console.error('[SIGNIN_STATUS] auth.users 삭제 중 예외:', deleteException)
        }
      }
      
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다. 다시 가입해주세요.' },
        { status: 404 }
      )
    }

    // 사용자 인증 상태 조회
    const { data: authStatus, error: statusError } = await supabaseServer
      .from('user_auth_status')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: user.name,
          phone: user.phone,
          country: user.country,
          isKorean: user.is_korean,
          emailVerified: authStatus?.email_verified || false,
          phoneVerified: authStatus?.phone_verified || false,
          biometricEnabled: authStatus?.biometric_enabled || false
        },
        session: session
      }
    })

  } catch (error) {
    console.error('[SIGNIN_STATUS] 오류:', error)
    return NextResponse.json(
      { error: '로그인 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}