import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '설정되지 않음',
    environment: process.env.NODE_ENV
  })
}
