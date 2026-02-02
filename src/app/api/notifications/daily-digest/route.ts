import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * 하루 요약 알림 발송 API
 * 멕시코 시간 기준 오전 8:30에 실행 (크론 작업)
 */
export async function GET(request: NextRequest) {
  try {
    // 보안: 크론 작업은 Authorization 헤더로 보호
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[DAILY_DIGEST] 하루 요약 알림 발송 시작')

    // 멕시코 시간 기준 어제 오전 8:30부터 오늘 오전 8:30까지의 시간 범위 계산
    // UTC 기준으로 계산 (멕시코는 UTC-6 또는 UTC-5)
    const now = new Date()
    const mexicoOffset = -6 * 60 // CST (UTC-6), 일광절약시간 고려 필요
    const mexicoTime = new Date(now.getTime() + (mexicoOffset * 60 * 1000))

    // 오늘 오전 8:30
    const today830 = new Date(mexicoTime)
    today830.setHours(8, 30, 0, 0)

    // 어제 오전 8:30
    const yesterday830 = new Date(today830)
    yesterday830.setDate(yesterday830.getDate() - 1)

    // UTC로 변환
    const startTime = new Date(yesterday830.getTime() - (mexicoOffset * 60 * 1000))
    const endTime = new Date(today830.getTime() - (mexicoOffset * 60 * 1000))

    console.log('[DAILY_DIGEST] 시간 범위:', {
      start: startTime.toISOString(),
      end: endTime.toISOString()
    })

    // 1. 새게시물 알림이 활성화된 사용자 조회 (간소화된 설정)
    const { data: usersWithDigest, error: usersError } = await supabaseServer
      .from('notification_settings')
      .select('user_id, new_post_notifications_enabled, push_enabled')
      .eq('new_post_notifications_enabled', true)
      .eq('push_enabled', true)

    if (usersError) {
      console.error('[DAILY_DIGEST] 사용자 조회 실패:', usersError)
      return NextResponse.json(
        { error: '사용자 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!usersWithDigest || usersWithDigest.length === 0) {
      console.log('[DAILY_DIGEST] 알림을 받을 사용자가 없습니다.')
      return NextResponse.json({
        success: true,
        message: '알림을 받을 사용자가 없습니다.',
        sent: 0
      })
    }

    console.log(`[DAILY_DIGEST] 알림을 받을 사용자 수: ${usersWithDigest.length}`)

    const results = []
    let successCount = 0
    let failCount = 0

    // 2. 각 사용자별로 새로운 콘텐츠 확인 및 알림 발송
    for (const userSetting of usersWithDigest) {
      const userId = userSetting.user_id

      try {
        // 사용자가 작성한 게시글 조회
        const { data: userPosts } = await supabaseServer
          .from('posts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'published')

        if (!userPosts || userPosts.length === 0) continue

        const postIds = userPosts.map(p => p.id)

        // 해당 게시글들에 대한 새로운 좋아요 수
        const { data: newLikes } = await supabaseServer
          .from('post_reactions')
          .select('id, post_id')
          .in('post_id', postIds)
          .eq('reaction_type', 'like')
          .gte('created_at', startTime.toISOString())
          .lt('created_at', endTime.toISOString())

        // 관심 있는 게시판의 새로운 게시글 수 (사용자가 팔로우하거나 관심있는 카테고리)
        // 간단하게 전체 게시글 중 최근 24시간 내 게시글 수로 계산
        const { data: newPosts } = await supabaseServer
          .from('posts')
          .select('id')
          .eq('status', 'published')
          .gte('created_at', startTime.toISOString())
          .lt('created_at', endTime.toISOString())

        const newLikesCount = newLikes?.length || 0
        const newPostsCount = newPosts?.length || 0

        // 알림을 보낼 내용이 있는 경우에만 발송 (새 게시물이 있으면 발송)
        if (newPostsCount > 0) {
          const message = `새로운 게시물 ${newPostsCount}개가 올라왔어요`

          // 푸시 알림 발송
          const pushResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'https://helloamiko.com'}/api/notifications/send-push`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userId,
                title: '오늘의 새로운 소식',
                body: message,
                data: {
                  type: 'daily_digest',
                  newLikesCount,
                  newPostsCount,
                  url: '/community'
                },
                tag: `daily_digest_${new Date().toISOString().split('T')[0]}`
              })
            }
          )

          if (pushResponse.ok) {
            successCount++
            results.push({ userId, status: 'success', message })
          } else {
            failCount++
            const errorData = await pushResponse.json()
            results.push({ userId, status: 'failed', error: errorData.error || 'Unknown error' })
          }
        }
      } catch (userError) {
        console.error(`[DAILY_DIGEST] 사용자 ${userId} 처리 중 오류:`, userError)
        failCount++
        results.push({ userId, status: 'error', error: userError instanceof Error ? userError.message : 'Unknown error' })
      }
    }

    console.log('[DAILY_DIGEST] 하루 요약 알림 발송 완료:', {
      total: usersWithDigest.length,
      success: successCount,
      failed: failCount
    })

    return NextResponse.json({
      success: true,
      message: '하루 요약 알림 발송 완료',
      data: {
        totalUsers: usersWithDigest.length,
        successCount,
        failCount,
        results
      }
    })

  } catch (error) {
    console.error('[DAILY_DIGEST] 하루 요약 알림 발송 중 예외 발생:', error)
    return NextResponse.json(
      {
        success: false,
        error: '하루 요약 알림 발송 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

