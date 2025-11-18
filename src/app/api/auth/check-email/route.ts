import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 개발 환경 하드코딩 이메일 체크 제거
    // 실제 데이터베이스에서 확인하도록 변경

    // Supabase에서 이메일 중복 체크
    // 삭제된 계정(deleted_at이 있는 경우)은 제외하고 확인
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select('id, deleted_at')
        .eq('email', email.toLowerCase())
        .is('deleted_at', null) // 삭제되지 않은 계정만 확인
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
        console.error('[EMAIL_CHECK] Supabase 오류:', error)
        return NextResponse.json(
          { error: '이메일 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      // 데이터가 있으면 중복, 없으면 사용 가능 (삭제된 계정은 사용 가능으로 처리)
      const exists = !!data

      console.log(`[EMAIL_CHECK] ${email}: ${exists ? '중복' : '사용 가능'}`)

      return NextResponse.json({
        success: true,
        exists: exists,
        message: exists ? '이미 가입된 이메일입니다.' : '사용 가능한 이메일입니다.'
      })

    } catch (supabaseError) {
      console.error('[EMAIL_CHECK] Supabase 연결 오류:', supabaseError)
      
      return NextResponse.json(
        { error: '데이터베이스 연결 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[EMAIL_CHECK] 오류:', error)
    return NextResponse.json(
      { error: '이메일 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
