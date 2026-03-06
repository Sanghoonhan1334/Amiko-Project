import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 화상 채팅 파트너 목록 조회 (일반 사용자용)
export async function GET() {
  try {
    const supabase = createClient()

    // conversation_partners 테이블 조회 (users 조인 없이 - RLS 무한재귀 방지)
    const { data, error } = await supabase
      .from('conversation_partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('파트너 조회 오류:', error)
      return NextResponse.json(
        { error: '파트너 조회 실패' },
        { status: 500 }
      )
    }

    const partners = data || []

    return NextResponse.json({ partners })

  } catch (error) {
    console.error('파트너 조회 예외:', error)
    return NextResponse.json(
      { error: '파트너 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

