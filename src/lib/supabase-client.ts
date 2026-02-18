import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Supabase Browser Client Helper
 * Para uso en Client Components solamente
 */
export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  // 서버사이드에서 실행되는 경우 체크
  if (typeof window === 'undefined') {
    console.warn('[SUPABASE CLIENT] 서버사이드에서 브라우저 클라이언트 생성 시도됨 - 기본 클라이언트 반환')
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=')
            return { name, value: rest.join('=') }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=/; ${options?.maxAge ? `max-age=${options.maxAge}` : ''}`
          })
        },
      },
    }
  )

  return browserClient
}
