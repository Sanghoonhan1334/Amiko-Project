import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 관리자용 Supabase 클라이언트 (서비스 키 사용, RLS 우회)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[SUPABASE ADMIN] 환경변수가 설정되지 않았습니다.')
    throw new Error('Supabase admin 환경변수가 설정되지 않았습니다.')
  }

  const client = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return client
}

