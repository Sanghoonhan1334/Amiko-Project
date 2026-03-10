import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('[RESET_PASSWORD_CONFIRM] 비밀번호 재설정 확인 시작')

    const body = await request.json()
    const { token, password } = body

    console.log('[RESET_PASSWORD_CONFIRM] 요청 데이터:', { 
      token: token ? 'present' : 'missing', 
      password: password ? 'present' : 'missing' 
    })

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: '토큰과 새 비밀번호가 필요합니다.' },
        { status: 400 }
      )
    }

    // 토큰 디코딩 및 HMAC 서명 검증 (이메일:타임스탬프:hmac 형식)
    let email: string
    try {
      const secret = process.env.RESET_TOKEN_SECRET
      if (!secret) {
        console.error('[RESET_PASSWORD_CONFIRM] RESET_TOKEN_SECRET 환경변수가 설정되지 않음')
        return NextResponse.json(
          { success: false, error: '서버 설정 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      const decodedToken = Buffer.from(token, 'base64url').toString('utf-8')
      // 형식: email:timestamp:hmac (hmac은 hex이므로 마지막 64자)
      const lastColon = decodedToken.lastIndexOf(':')
      const secondLastColon = decodedToken.lastIndexOf(':', lastColon - 1)

      if (lastColon === -1 || secondLastColon === -1) {
        throw new Error('Invalid token format')
      }

      const payload = decodedToken.substring(0, lastColon)           // email:timestamp
      const receivedHmac = decodedToken.substring(lastColon + 1)     // hmac hex
      const tokenEmail = decodedToken.substring(0, secondLastColon)  // email
      const timestamp = decodedToken.substring(secondLastColon + 1, lastColon) // timestamp

      if (!tokenEmail || !timestamp || !receivedHmac) {
        throw new Error('Invalid token structure')
      }

      // HMAC 서명 검증 (타이밍 어택 방지를 위해 timingSafeEqual 사용)
      const expectedHmac = createHmac('sha256', secret).update(payload).digest('hex')
      const receivedBuf = Buffer.from(receivedHmac, 'hex')
      const expectedBuf = Buffer.from(expectedHmac, 'hex')

      if (receivedBuf.length !== expectedBuf.length || !timingSafeEqual(receivedBuf, expectedBuf)) {
        console.error('[RESET_PASSWORD_CONFIRM] HMAC 서명 불일치 - 위조된 토큰')
        return NextResponse.json(
          { success: false, error: '유효하지 않은 비밀번호 재설정 링크입니다.' },
          { status: 400 }
        )
      }

      email = tokenEmail

      // 토큰 만료 확인 (24시간)
      const tokenTime = parseInt(timestamp)
      const now = Date.now()
      const tokenAge = now - tokenTime
      const maxAge = 24 * 60 * 60 * 1000 // 24시간

      if (Number.isNaN(tokenTime) || tokenAge > maxAge) {
        return NextResponse.json(
          { success: false, error: '비밀번호 재설정 링크가 만료되었습니다.' },
          { status: 400 }
        )
      }

      console.log('[RESET_PASSWORD_CONFIRM] 토큰 HMAC 검증 성공:', { email, tokenAge: Math.round(tokenAge / 1000 / 60) + '분 전' })

    } catch (error) {
      console.error('[RESET_PASSWORD_CONFIRM] 토큰 디코딩 실패:', error)
      return NextResponse.json(
        { success: false, error: '유효하지 않은 비밀번호 재설정 링크입니다.' },
        { status: 400 }
      )
    }

    // Supabase Auth에서 사용자 찾기 및 비밀번호 업데이트
    // Service Role Key를 사용하여 Admin API 접근
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.error('[RESET_PASSWORD_CONFIRM] Service Role Key가 설정되지 않음')
      return NextResponse.json(
        { success: false, error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // Service Role로 Supabase 클라이언트 생성
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 사용자 이메일로 사용자 찾기
    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('[RESET_PASSWORD_CONFIRM] 사용자 목록 조회 실패:', listError)
      return NextResponse.json(
        { success: false, error: '사용자 목록을 조회할 수 없습니다.', details: listError.message },
        { status: 500 }
      )
    }

    console.log('[RESET_PASSWORD_CONFIRM] 전체 사용자 수:', authUsers.users.length)
    console.log('[RESET_PASSWORD_CONFIRM] 찾는 이메일:', email)

    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      console.error('[RESET_PASSWORD_CONFIRM] 사용자 찾기 실패 (email 비공개 처리)')
      // 사용자 열거 공격 방지: 등록된 이메일 여부를 외부에 노출하지 않음
      return NextResponse.json(
        { success: false, error: '유효하지 않은 비밀번호 재설정 링크입니다.' },
        { status: 400 }
      )
    }

    console.log('[RESET_PASSWORD_CONFIRM] 사용자 찾기 성공:', { userId: user.id, email: user.email })

    // 이메일 링크를 통한 비밀번호 재설정은 토큰이 유효하면 바로 비밀번호 변경
    // (현재 비밀번호 확인 불필요 - 비밀번호를 잊어버린 경우를 위한 기능)
    console.log('[RESET_PASSWORD_CONFIRM] 토큰 기반 비밀번호 재설정 - 현재 비밀번호 확인 생략')

    // Admin API로 비밀번호 업데이트 및 이메일 인증 상태 확인
    console.log('[RESET_PASSWORD_CONFIRM] 비밀번호 업데이트 시도:', { userId: user.id, email: user.email })
    
    // 이메일 인증 상태 확인
    const isEmailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined
    console.log('[RESET_PASSWORD_CONFIRM] 이메일 인증 상태:', { 
      isEmailConfirmed, 
      email_confirmed_at: user.email_confirmed_at 
    })
    
    // 비밀번호 업데이트와 함께 이메일 인증도 완료 처리
    // (비밀번호 재설정 링크를 받았다는 것은 이메일 소유권이 확인된 것이므로)
    const updateData: any = {
      password: password
    }
    
    // 이메일 인증이 안 되어 있으면 인증 완료 처리
    if (!isEmailConfirmed) {
      // Supabase Admin API에서 이메일 인증 완료 처리
      updateData.email_confirm = true
      // 또는 email_confirmed_at을 직접 설정
      updateData.email_confirmed_at = new Date().toISOString()
      console.log('[RESET_PASSWORD_CONFIRM] 이메일 인증 미완료 상태 - 인증 완료 처리')
    }
    
    const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, updateData)

    if (updateError) {
      console.error('[RESET_PASSWORD_CONFIRM] 비밀번호 업데이트 실패:', updateError)
      return NextResponse.json(
        { success: false, error: '비밀번호 업데이트에 실패했습니다.', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[RESET_PASSWORD_CONFIRM] 비밀번호 업데이트 성공:', { 
      userId: user.id, 
      email: user.email,
      updatedAt: updatedUser?.user?.updated_at 
    })

    // 비밀번호 업데이트 확인을 위해 사용자 정보 다시 조회
    const { data: verifyUser, error: verifyError } = await adminSupabase.auth.admin.getUserById(user.id)
    if (verifyError) {
      console.warn('[RESET_PASSWORD_CONFIRM] 업데이트 확인 실패 (무시하고 계속 진행):', verifyError)
    } else {
      console.log('[RESET_PASSWORD_CONFIRM] 비밀번호 업데이트 확인 완료:', { 
        userId: verifyUser.user.id,
        email: verifyUser.user.email,
        emailConfirmed: !!verifyUser.user.email_confirmed_at,
        emailConfirmedAt: verifyUser.user.email_confirmed_at,
        lastSignInAt: verifyUser.user.last_sign_in_at,
        updatedAt: verifyUser.user.updated_at
      })
      
      // 이메일 인증이 여전히 안 되어 있으면 경고
      if (!verifyUser.user.email_confirmed_at && !isEmailConfirmed) {
        console.warn('[RESET_PASSWORD_CONFIRM] ⚠️ 이메일 인증 상태 업데이트가 반영되지 않았을 수 있습니다. 로그인 시 문제가 발생할 수 있습니다.')
      }
    }

    // 모든 기존 세션 무효화 (보안상 중요)
    try {
      const { error: signOutError } = await adminSupabase.auth.admin.signOut(user.id, 'global')
      if (signOutError) {
        console.warn('[RESET_PASSWORD_CONFIRM] 기존 세션 무효화 실패 (무시하고 계속 진행):', signOutError)
      } else {
        console.log('[RESET_PASSWORD_CONFIRM] 모든 기존 세션 무효화 완료')
      }
    } catch (signOutException) {
      console.warn('[RESET_PASSWORD_CONFIRM] 세션 무효화 중 예외 (무시하고 계속 진행):', signOutException)
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.'
    })

  } catch (error: any) {
    console.error('[RESET_PASSWORD_CONFIRM] 에러 발생:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
