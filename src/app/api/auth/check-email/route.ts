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

    // 개발 환경에서 테스트용 하드코딩된 중복 이메일 체크
    const testEmails = [
      'hsanghoon133334@gmail.com',
      'test@example.com',
      'admin@helloamiko.com'
    ]
    
    if (process.env.NODE_ENV === 'development' && testEmails.includes(email.toLowerCase())) {
      console.log(`[EMAIL_CHECK] 개발 환경 - 테스트 이메일 중복 체크: ${email}`)
      return NextResponse.json({
        success: true,
        exists: true,
        message: '이미 가입된 이메일입니다.'
      })
    }

    // Supabase에서 이메일 중복 체크
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
        console.error('[EMAIL_CHECK] Supabase 오류:', error)
        return NextResponse.json(
          { error: '이메일 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      // 데이터가 있으면 중복, 없으면 사용 가능
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
