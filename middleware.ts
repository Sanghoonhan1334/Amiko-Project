import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 공개 경로 (인증 불필요)
const publicPaths = [
  '/',
  '/about',
  '/faq',
  '/privacy',
  '/terms',
  '/inquiry',
  '/partnership',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/verification',
  '/auth/callback',
  '/api/auth',
  '/api/webhooks',
  '/api/fanzone',
  '/_next',
  '/favicon.ico',
  '/sw.js',
  '/manifest.json',
  '/main'
]

// 보호된 경로 (인증 필요)
const protectedPaths = [
  '/profile',
  '/bookings',
  '/payments',
  '/notifications',
  '/community',
  '/lounge',
  '/consultants',
  '/checkout',
  '/chat-test'
]

// 관리자 전용 경로
const adminPaths = [
  '/admin'
]

// API 경로 중 보호된 경로
const protectedApiPaths = [
  '/api/users',
  '/api/bookings',
  '/api/payments',
  '/api/notifications',
  '/api/community',
  '/api/admin'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 정적 파일이나 Next.js 내부 경로는 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Supabase 클라이언트 생성 (SSR 방식)
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 세션 새로고침 (쿠키 동기화)
  const { data: { session }, error } = await supabase.auth.getSession()

  // 공개 경로 체크
  const isPublicPath = publicPaths.some(path => {
    // 정확한 경로 매칭 또는 하위 경로 매칭
    if (pathname === path) return true
    if (path === '/main' && pathname.startsWith('/main')) return true
    return pathname.startsWith(path + '/')
  })

  // 보호된 경로 체크
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // 관리자 경로 체크
  const isAdminPath = adminPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // 보호된 API 경로 체크
  const isProtectedApiPath = protectedApiPaths.some(path => 
    pathname.startsWith(path)
  )

  // 디버그 로그
  console.log('[MIDDLEWARE]', {
    pathname,
    hasSession: !!session,
    isPublicPath,
    isProtectedPath,
    isProtectedApiPath
  })

  // 🎨 디자인 모드: 인증 우회 (개발 중에만 사용)
  const isDesignMode = process.env.NEXT_PUBLIC_DESIGN_MODE === 'true'
  if (isDesignMode) {
    console.log('[MIDDLEWARE] 🎨 디자인 모드 활성화 - 인증 우회')
    return response
  }

  // 공개 경로는 인증 상태와 관계없이 통과
  if (isPublicPath) {
    console.log('[MIDDLEWARE] 공개 경로 통과:', pathname)
    return response
  }

  // 인증되지 않은 사용자가 보호된 경로에 접근하는 경우
  if (!session && (isProtectedPath || isProtectedApiPath)) {
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 관리자 경로 접근 체크
  if (isAdminPath) {
    if (!session) {
      const redirectUrl = new URL('/sign-in', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // 관리자 권한 체크 (사용자 메타데이터에서 확인)
    const userRole = session.user?.user_metadata?.role
    const userEmail = session.user?.email
    
    // 환경변수에서 관리자 이메일 확인
    const adminEmail = process.env.ADMIN_EMAIL
    
    if (userRole !== 'admin' && userEmail !== adminEmail) {
      return NextResponse.redirect(new URL('/main', request.url))
    }
  }

  // API 경로에서 인증 토큰 검증
  if (isProtectedApiPath && session) {
    // 토큰 만료 체크
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      // 토큰이 만료된 경우 새로고침 시도
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session) {
        // 리프레시 실패 시 로그인 페이지로 리다이렉트
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
