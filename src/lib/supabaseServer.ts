import { createClient } from '@supabase/supabase-js'

// 환경변수가 없으면 빌드 시점에 오류를 방지하기 위해 조건부로 생성
let supabaseServer: ReturnType<typeof createClient> | null = null
let supabaseClient: ReturnType<typeof createClient> | null = null

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  console.log('[SUPABASE SERVER] 서버 클라이언트 생성 완료')
} else {
  console.warn('[SUPABASE SERVER] Supabase 환경변수가 설정되지 않았습니다. 서버 클라이언트가 비활성화됩니다.')
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  console.log('[SUPABASE SERVER] 클라이언트 생성 완료')
} else {
  console.warn('[SUPABASE SERVER] Supabase 환경변수가 설정되지 않았습니다. 클라이언트가 비활성화됩니다.')
}

export { supabaseServer, supabaseClient }
