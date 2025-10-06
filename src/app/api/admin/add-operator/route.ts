import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 환경 변수가 없으면 빌드 시점에 오류를 방지하기 위해 조건부로 생성
let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    // Supabase 클라이언트가 초기화되지 않았으면 오류 반환
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 JWT 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // JWT 토큰 검증 및 사용자 정보 추출
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    console.log('[ADD_OPERATOR] 사용자 정보:', {
      id: user.id,
      email: user.email
    })

    // 이미 운영자인지 확인
    const { data: existingOperator } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (existingOperator) {
      return NextResponse.json({
        success: true,
        message: '이미 운영자로 등록되어 있습니다.',
        operator: existingOperator
      })
    }

    // 운영자로 등록
    const { data: newOperator, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.id,
        email: user.email || '',
        role: 'admin',
        permissions: {
          news: {
            create: true,
            edit: true,
            delete: true
          },
          users: {
            view: true
          }
        },
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('[ADD_OPERATOR] 운영자 등록 오류:', insertError)
      return NextResponse.json(
        { error: '운영자 등록에 실패했습니다: ' + insertError.message },
        { status: 500 }
      )
    }

    console.log('[ADD_OPERATOR] 운영자 등록 성공:', newOperator)

    return NextResponse.json({
      success: true,
      message: '운영자로 등록되었습니다.',
      operator: newOperator
    })

  } catch (error) {
    console.error('[ADD_OPERATOR] 운영자 등록 API 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
