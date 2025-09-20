import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 만료된 스토리 정리
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[STORY_CLEANUP] 만료된 스토리 정리 시작')

    // 만료된 스토리 조회
    const { data: expiredStories, error: fetchError } = await supabaseServer
      .from('stories')
      .select('id, expires_at, is_expired')
      .lt('expires_at', new Date().toISOString())
      .eq('is_expired', false)

    if (fetchError) {
      console.error('[STORY_CLEANUP] 만료된 스토리 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '만료된 스토리 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!expiredStories || expiredStories.length === 0) {
      console.log('[STORY_CLEANUP] 만료된 스토리가 없습니다.')
      return NextResponse.json({
        success: true,
        message: '만료된 스토리가 없습니다.',
        deletedCount: 0
      })
    }

    console.log(`[STORY_CLEANUP] ${expiredStories.length}개의 만료된 스토리 발견`)

    // 만료된 스토리 삭제
    const { error: deleteError } = await supabaseServer
      .from('stories')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('is_expired', false)

    if (deleteError) {
      console.error('[STORY_CLEANUP] 만료된 스토리 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '만료된 스토리 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(`[STORY_CLEANUP] ${expiredStories.length}개의 만료된 스토리 삭제 완료`)

    return NextResponse.json({
      success: true,
      message: `${expiredStories.length}개의 만료된 스토리가 삭제되었습니다.`,
      deletedCount: expiredStories.length
    })

  } catch (error) {
    console.error('[STORY_CLEANUP] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 만료된 스토리 조회 (테스트용)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { data: expiredStories, error } = await supabaseServer
      .from('stories')
      .select('id, expires_at, is_expired, created_at')
      .lt('expires_at', new Date().toISOString())
      .eq('is_expired', false)
      .order('expires_at', { ascending: true })

    if (error) {
      console.error('[STORY_CLEANUP] 만료된 스토리 조회 실패:', error)
      return NextResponse.json(
        { error: '만료된 스토리 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      expiredStories: expiredStories || [],
      count: expiredStories?.length || 0,
      currentTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('[STORY_CLEANUP] 서버 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
