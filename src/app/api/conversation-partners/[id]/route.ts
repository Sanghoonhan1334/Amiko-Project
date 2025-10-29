import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 특정 파트너 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    
    const { id } = await params
    const partnerId = id

    // 먼저 conversation_partners에서 조회
    const { data: partner, error: partnerError } = await supabase
      .from('conversation_partners')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      console.error('[API] Partner not found:', partnerError)
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // user_id로 users 테이블에서 최신 정보 조회
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('avatar_url, full_name, nickname')
      .eq('id', partner.user_id)
      .single()

    // users 테이블의 최신 정보를 우선 사용
    const avatarUrl = userInfo?.avatar_url || partner.avatar_url
    const partnerName = userInfo?.full_name || userInfo?.nickname || partner.name

    return NextResponse.json({ 
      partner: {
        id: partner.id,
        user_id: partner.user_id,
        name: partnerName,
        avatar_url: avatarUrl,
        specialty: partner.specialty,
        bio: partner.bio,
        country: partner.country,
        language_level: partner.language_level,
        interests: partner.interests,
        status: partner.status || 'online'
      }
    })

  } catch (error) {
    console.error('Error fetching partner:', error)
    return NextResponse.json(
      { error: 'Error fetching partner' },
      { status: 500 }
    )
  }
}

