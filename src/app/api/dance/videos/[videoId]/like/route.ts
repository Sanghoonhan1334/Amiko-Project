import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const videoId = params.videoId

    // 이미 좋아요를 눌렀는지 확인
    const { data: existingLike } = await supabase
      .from('dance_video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json({
        success: true,
        liked: true,
        message: '이미 좋아요를 눌렀습니다.'
      })
    }

    // 좋아요 추가
    const { error } = await supabase
      .from('dance_video_likes')
      .insert({
        video_id: videoId,
        user_id: user.id
      })

    if (error) {
      console.error('[DANCE_VIDEO_LIKE] 좋아요 추가 실패:', error)
      return NextResponse.json(
        { error: '좋아요 추가 실패', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      liked: true
    })
  } catch (error) {
    console.error('[DANCE_VIDEO_LIKE] 좋아요 예외:', error)
    return NextResponse.json(
      { error: '좋아요 처리 실패' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const videoId = params.videoId

    // 좋아요 제거
    const { error } = await supabase
      .from('dance_video_likes')
      .delete()
      .eq('video_id', videoId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DANCE_VIDEO_LIKE] 좋아요 제거 실패:', error)
      return NextResponse.json(
        { error: '좋아요 제거 실패', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      liked: false
    })
  } catch (error) {
    console.error('[DANCE_VIDEO_LIKE] 좋아요 제거 예외:', error)
    return NextResponse.json(
      { error: '좋아요 처리 실패' },
      { status: 500 }
    )
  }
}

