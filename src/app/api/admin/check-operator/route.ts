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

export async function GET(request: NextRequest) {
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

    // 운영자 테이블에서 해당 사용자 확인
    const { data: operator, error: operatorError } = await supabase
      .from('lounge_operators')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { isOperator: false, message: 'User is not an operator' },
        { status: 200 }
      )
    }

    // TypeScript 타입 안전성을 위한 타입 가드
    if (!operator || typeof operator !== 'object') {
      return NextResponse.json(
        { isOperator: false, message: 'Invalid operator data' },
        { status: 200 }
      )
    }

    // operator 타입을 명시적으로 정의
    const operatorData = operator as {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    // 운영자 정보 반환
    return NextResponse.json({
      isOperator: true,
      operator: {
        id: operatorData.id,
        email: operatorData.email,
        name: operatorData.name,
        role: operatorData.role
      }
    })

  } catch (error) {
    console.error('Operator check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
