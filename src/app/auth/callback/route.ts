import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * OAuth Callback Handler
 * Supabase OAuth 인증 후 리다이렉트되는 엔드포인트
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/main'

  // 에러 처리
  if (error) {
    console.error('[AUTH_CALLBACK] OAuth 에러:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin)
    )
  }

  // 코드가 없으면 로그인 페이지로 리다이렉트
  if (!code) {
    console.error('[AUTH_CALLBACK] 인증 코드가 없습니다.')
    return NextResponse.redirect(
      new URL('/sign-in?error=missing_code', requestUrl.origin)
    )
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = await createSupabaseClient()

    // 인증 코드를 세션으로 교환
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[AUTH_CALLBACK] 세션 교환 실패:', exchangeError)
      return NextResponse.redirect(
        new URL(`/sign-in?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    if (!data.session || !data.user) {
      console.error('[AUTH_CALLBACK] 세션이 생성되지 않았습니다.')
      return NextResponse.redirect(
        new URL('/sign-in?error=no_session', requestUrl.origin)
      )
    }

    console.log('[AUTH_CALLBACK] OAuth 로그인 성공:', {
      userId: data.user.id,
      email: data.user.email,
      provider: data.user.app_metadata?.provider
    })

    // Google OAuth로 가입한 경우, 사용자 프로필이 없을 수 있으므로 확인 및 생성
    if (data.user.app_metadata?.provider === 'google' && supabaseServer) {
      try {
        // public.users에 사용자 정보가 있는지 확인
        const { data: userProfile, error: profileError } = await supabaseServer
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // 프로필이 없으면 생성 (Google OAuth로 첫 로그인)
        if (profileError || !userProfile) {
          console.log('[AUTH_CALLBACK] Google OAuth 사용자 프로필 생성 중...')
          
          const { error: insertError } = await supabaseServer
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
              avatar_url: data.user.user_metadata?.avatar_url || null,
              email_verified: true, // Google OAuth는 이메일이 이미 인증됨
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            console.error('[AUTH_CALLBACK] 사용자 프로필 생성 실패:', insertError)
            // 프로필 생성 실패해도 로그인은 진행 (나중에 프로필 완성하도록)
          } else {
            console.log('[AUTH_CALLBACK] Google OAuth 사용자 프로필 생성 완료')
          }
        }
      } catch (profileError) {
        console.error('[AUTH_CALLBACK] 프로필 확인 중 오류:', profileError)
        // 프로필 확인 실패해도 로그인은 진행
      }
    }

    // 성공적으로 로그인했으므로 메인 페이지로 리다이렉트
    const redirectUrl = new URL(next, requestUrl.origin)
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('[AUTH_CALLBACK] 예상치 못한 오류:', error)
    return NextResponse.redirect(
      new URL('/sign-in?error=unexpected_error', requestUrl.origin)
    )
  }
}

