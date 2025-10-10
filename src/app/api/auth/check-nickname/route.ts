import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json()

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      )
    }

    // 알파벳, 숫자, 특수문자 허용하는지 확인
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(nickname)) {
      return NextResponse.json(
        { error: '닉네임은 알파벳, 숫자, 특수문자만 사용할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 길이 확인 (3-20자)
    if (nickname.length < 3 || nickname.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 3-20자 사이여야 합니다.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname.toLowerCase()) // 소문자로 변환하여 검색
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
      console.error('닉네임 중복 확인 오류:', error)
      return NextResponse.json(
        { error: '닉네임 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const isAvailable = !existingUser

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
    })

  } catch (error) {
    console.error('닉네임 중복 확인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
