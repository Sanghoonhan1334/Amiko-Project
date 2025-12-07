import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * 특정 이메일의 상태를 확인하는 API
 * users 테이블과 auth.users 테이블 모두 확인
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const results: any = {
      email: normalizedEmail,
      usersTable: null,
      authUsers: null,
      verificationCodes: [],
      canSignUp: true,
      issues: []
    }

    // 1. users 테이블 확인
    try {
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('id, email, full_name, nickname, phone, deleted_at, created_at, updated_at')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') {
        results.issues.push(`users 테이블 조회 오류: ${userError.message}`)
      } else if (userData) {
        results.usersTable = {
          ...userData,
          isDeleted: !!userData.deleted_at,
          status: userData.deleted_at ? '삭제됨' : '활성'
        }
        
        if (!userData.deleted_at) {
          results.canSignUp = false
          results.issues.push('users 테이블에 활성 계정이 존재합니다.')
        }
      }
    } catch (error) {
      results.issues.push(`users 테이블 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }

    // 2. auth.users 테이블 확인 (Supabase Admin API 사용)
    try {
      const { data: authUsers, error: authError } = await supabaseServer.auth.admin.listUsers()
      
      if (authError) {
        results.issues.push(`auth.users 조회 오류: ${authError.message}`)
      } else if (authUsers?.users) {
        const authUser = authUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail)
        
        if (authUser) {
          results.authUsers = {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            email_confirmed_at: authUser.email_confirmed_at,
            deleted_at: authUser.deleted_at,
            status: authUser.deleted_at ? '삭제됨' : '활성'
          }
          
          if (!authUser.deleted_at) {
            results.canSignUp = false
            results.issues.push('auth.users 테이블에 활성 계정이 존재합니다.')
          }
        }
      }
    } catch (error) {
      results.issues.push(`auth.users 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }

    // 3. verification_codes 테이블 확인
    try {
      const { data: codes, error: codesError } = await supabaseServer
        .from('verification_codes')
        .select('id, email, phone_number, type, verified, created_at, expires_at')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(10)

      if (codesError) {
        results.issues.push(`verification_codes 조회 오류: ${codesError.message}`)
      } else if (codes) {
        results.verificationCodes = codes
      }
    } catch (error) {
      results.issues.push(`verification_codes 조회 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    console.error('[CHECK_USER_EMAIL] 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '이메일 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

