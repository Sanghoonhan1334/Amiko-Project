import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    
    // Supabase 로그아웃 (서버 측 쿠키 삭제)
    await supabase.auth.signOut()
    
    const response = NextResponse.json({ success: true })
    
    // 모든 Supabase 관련 쿠키 삭제
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-localhost-auth-token'
    ]
    
    cookieNames.forEach(name => {
      // 모든 가능한 경로와 도메인에서 쿠키 삭제
      response.cookies.delete(name)
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
    })
    
    return response
  } catch (error) {
    console.error('[LOGOUT API] 로그아웃 오류:', error)
    // 오류가 발생해도 응답은 반환 (클라이언트 측 정리는 이미 수행됨)
    return NextResponse.json({ success: true })
  }
}

