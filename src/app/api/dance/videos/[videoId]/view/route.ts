import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const videoId = params.videoId

    // IP 주소 가져오기
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // 이미 조회했는지 확인 (중복 조회 방지)
    const viewCheck = {
      video_id: videoId,
      user_id: user?.id || null,
      ip_address: ipAddress !== 'unknown' ? ipAddress : null,
      user_agent: request.headers.get('user-agent') || null
    }

    // UNIQUE 제약 조건으로 중복 방지
    const { error } = await supabase
      .from('dance_video_views')
      .insert(viewCheck)
      .select()
      .single()

    // 중복 조회는 에러가 아니므로 무시
    if (error && error.code !== '23505') { // 23505는 UNIQUE 제약 조건 위반
      console.error('[DANCE_VIDEO_VIEW] 조회수 증가 실패:', error)
      // 에러가 있어도 성공으로 처리 (조회수는 중요하지 않음)
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('[DANCE_VIDEO_VIEW] 조회수 예외:', error)
    // 에러가 있어도 성공으로 처리
    return NextResponse.json({
      success: true
    })
  }
}

