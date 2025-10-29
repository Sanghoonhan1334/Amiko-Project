import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 화상 채팅 파트너 목록 조회 (일반 사용자용)
export async function GET() {
  try {
    const supabase = createClient()

    // users 테이블과 조인하여 최신 avatar_url 가져오기
    const { data, error } = await supabase
      .from('conversation_partners')
      .select(`
        *,
        users!conversation_partners_user_id_fkey (
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('파트너 조회 오류:', error)
      return NextResponse.json(
        { error: '파트너 조회 실패' },
        { status: 500 }
      )
    }

    // users 테이블의 최신 avatar_url을 우선 사용하도록 매핑
    const partners = (data || []).map(partner => {
      // Supabase는 foreign key 조인 시 배열로 반환할 수 있음
      const user = Array.isArray(partner.users) ? partner.users[0] : partner.users
      // users 테이블의 avatar_url이 있으면 우선 사용, 없으면 conversation_partners의 avatar_url 사용
      const avatarUrl = user?.avatar_url || partner.avatar_url
      
      // users 객체 제거 (불필요한 데이터 제거)
      const { users, ...partnerData } = partner
      
      return {
        ...partnerData,
        avatar_url: avatarUrl
      }
    })

    return NextResponse.json({ partners })

  } catch (error) {
    console.error('파트너 조회 예외:', error)
    return NextResponse.json(
      { error: '파트너 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

