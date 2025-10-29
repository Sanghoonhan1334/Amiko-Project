import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 파트너 등록 여부 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('conversation_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()  // single() 대신 maybeSingle() 사용 (없을 경우 null 반환)

    console.log(`[GET /api/conversation-partners/check] userId: ${userId}`)
    console.log(`[GET /api/conversation-partners/check] data:`, JSON.stringify(data))
    console.log(`[GET /api/conversation-partners/check] error:`, error)
    
    // maybeSingle()은 데이터가 있으면 data 객체 반환, 없으면 null 반환
    // error는 데이터가 없을 때 PGRST116을 반환할 수 있지만, data가 null이면 없는 것
    const isRegistered = !!data
    
    console.log(`[GET /api/conversation-partners/check] isRegistered: ${isRegistered}`)
    
    return NextResponse.json({ 
      isRegistered,
      isPartner: isRegistered  // 호환성을 위해 두 개 다 반환
    })

  } catch (error) {
    console.error('파트너 확인 오류:', error)
    return NextResponse.json(
      { error: '파트너 확인 중 오류 발생' },
      { status: 500 }
    )
  }
}

