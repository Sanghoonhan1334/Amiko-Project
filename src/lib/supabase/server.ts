import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const isDev = process.env.NODE_ENV === 'development'

// 서버 사이드용 Supabase 클라이언트 생성
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isDev) {
    console.log('[SUPABASE SERVER] 클라이언트 생성 시도')
    console.log('[SUPABASE SERVER] URL 존재:', !!supabaseUrl)
    console.log('[SUPABASE SERVER] Key 존재:', !!supabaseAnonKey)
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[SUPABASE SERVER] 환경변수가 설정되지 않았습니다.')
    console.warn('[SUPABASE SERVER] URL:', supabaseUrl)
    console.warn('[SUPABASE SERVER] Key:', supabaseAnonKey ? '설정됨' : '없음')

    // 더미 클라이언트 반환
    return {
      from: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: null,
            error: {
              code: '42P01',
              message: '테이블이 존재하지 않습니다 (환경변수 미설정)'
            }
          })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: {
                code: '42P01',
                message: '테이블이 존재하지 않습니다 (환경변수 미설정)'
              }
            })
          })
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        rpc: () => Promise.resolve({ data: null, error: null })
      })
    } as any
  }

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    if (isDev) {
      console.log('[SUPABASE SERVER] 클라이언트 생성 성공')
    }
    return client
  } catch (error) {
    console.error('[SUPABASE SERVER] 클라이언트 생성 실패:', error)
    throw error
  }
}
