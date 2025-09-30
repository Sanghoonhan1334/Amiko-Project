import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호가 필요합니다.' },
        { status: 400 }
      )
    }

    // 전화번호 정규화 (숫자만 추출)
    const normalizedPhone = phone.replace(/\D/g, '')

    if (normalizedPhone.length < 8) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 개발 환경에서는 전화번호 중복 체크 비활성화 (운영진 계정 생성용)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PHONE_CHECK] 개발 환경 - 전화번호 중복 체크 비활성화: ${phone}`)
      return NextResponse.json({
        success: true,
        exists: false,
        message: '사용 가능한 전화번호입니다.'
      })
    }

    // Supabase에서 전화번호 중복 체크
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
        console.error('[PHONE_CHECK] Supabase 오류:', error)
        return NextResponse.json(
          { error: '전화번호 확인 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      // 데이터가 있으면 중복, 없으면 사용 가능
      const exists = !!data

      console.log(`[PHONE_CHECK] ${phone}: ${exists ? '중복' : '사용 가능'}`)

      return NextResponse.json({
        success: true,
        exists: exists,
        message: exists ? '이미 가입된 전화번호입니다.' : '사용 가능한 전화번호입니다.'
      })

    } catch (supabaseError) {
      console.error('[PHONE_CHECK] Supabase 연결 오류:', supabaseError)
      
      return NextResponse.json(
        { error: '데이터베이스 연결 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[PHONE_CHECK] 오류:', error)
    return NextResponse.json(
      { error: '전화번호 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
