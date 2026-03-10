import { NextResponse } from 'next/server'

// 환경 변수 확인 API — 개발 환경에서만 사용 가능
export async function GET() {
  // 프로덕션에서 완전 차단 (환경 설정 노출 방지)
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '설정되지 않음',
    environment: process.env.NODE_ENV
  })
}
