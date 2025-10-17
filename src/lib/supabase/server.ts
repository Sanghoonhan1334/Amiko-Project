import { createClient } from '@supabase/supabase-js'

// 서버 사이드용 Supabase 클라이언트 생성
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[SUPABASE SERVER] 환경변수가 설정되지 않았습니다.')
    // 더미 클라이언트 반환
    return {
      from: () => ({
        select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        rpc: () => Promise.resolve({ data: null, error: null })
      })
    } as any
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
