import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * 이틀에 한번 게시판 알림 발송 API
 * 48시간마다 실행 (크론 작업)
 * "게시판에 재밌는 글이 올라왔어요! 지금 확인해볼까요?" 메시지 발송
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

    console.log('[BI_DAILY_DIGEST] 이틀에 한번 게시판 알림 발송 시작')

    // 48시간 전부터 현재까지의 시간 범위 계산
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    console.log('[BI_DAILY_DIGEST] 시간 범위:', {
      start: twoDaysAgo.toISOString(),
      end: now.toISOString()
    })

    // 1. 게시판 알림이 활성화된 사용자 조회
    const { data: usersWithNotifications, error: usersError } = await supabaseServer
      .from('notification_settings')
      .select('user_id, post_notifications_enabled, push_enabled')
      .eq('post_notifications_enabled', true)
      .eq('push_enabled', true)

    if (usersError) {
      console.error('[BI_DAILY_DIGEST] 사용자 조회 실패:', usersError)
      return NextResponse.json(
        { error: '사용자 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!usersWithNotifications || usersWithNotifications.length === 0) {
      console.log('[BI_DAILY_DIGEST] 알림을 받을 사용자가 없습니다.')
      return NextResponse.json({
        success: true,
        message: '알림을 받을 사용자가 없습니다.',
        sent: 0
      })
    }

    console.log(`[BI_DAILY_DIGEST] 알림을 받을 사용자 수: ${usersWithNotifications.length}`)

    // 2. 최근 48시간 내 새로운 게시글 확인
    const { data: newPosts, error: postsError } = await supabaseServer
      .from('posts')
      .select('id, title, created_at')
      .eq('status', 'published')
      .gte('created_at', twoDaysAgo.toISOString())
      .lt('created_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsError) {
      console.error('[BI_DAILY_DIGEST] 게시글 조회 실패:', postsError)
      return NextResponse.json(
        { error: '게시글 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    const newPostsCount = newPosts?.length || 0

    // 새로운 게시글이 있는 경우에만 알림 발송
    if (newPostsCount > 0) {
      const results = []
      let successCount = 0
      let failCount = 0

      // 3. 각 사용자에게 알림 발송
      for (const userSetting of usersWithNotifications) {
        const userId = userSetting.user_id

        try {
          // 마지막 알림 발송 시간 확인 (중복 방지)
          const { data: lastNotification } = await supabaseServer
            .from('notifications')
            .select('created_at')
            .eq('user_id', userId)
            .eq('type', 'bi_daily_digest')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // 마지막 알림이 48시간 이내에 발송되었다면 스킵
          if (lastNotification) {
            const lastNotificationTime = new Date(lastNotification.created_at)
            const timeSinceLastNotification = now.getTime() - lastNotificationTime.getTime()
            if (timeSinceLastNotification < 48 * 60 * 60 * 1000) {
              console.log(`[BI_DAILY_DIGEST] 사용자 ${userId}는 최근에 알림을 받았습니다. 스킵합니다.`)
              continue
            }
          }

          // Use localhost in development, app URL in production
          const baseUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_APP_URL || 'https://helloamiko.com')

          // 푸시 알림 발송
          const pushResponse = await fetch(
            `${baseUrl}/api/notifications/send-push`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userId,
                title: '게시판에 재밌는 글이 올라왔어요!',
                body: '지금 확인해볼까요?',
                data: {
                  type: 'bi_daily_digest',
                  newPostsCount,
                  url: '/community'
                },
                tag: `bi_daily_digest_${Math.floor(now.getTime() / (48 * 60 * 60 * 1000))}`
              })
            }
          )

          if (pushResponse.ok) {
            // 알림 기록 저장
            await supabaseServer
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'bi_daily_digest',
                title: '게시판에 재밌는 글이 올라왔어요!',
                message: '지금 확인해볼까요?',
                data: {
                  newPostsCount,
                  url: '/community'
                },
                is_read: false
              })

            successCount++
            results.push({ userId, status: 'success' })
          } else {
            failCount++
            const errorData = await pushResponse.json()
            results.push({ userId, status: 'failed', error: errorData.error || 'Unknown error' })
          }
        } catch (userError) {
          console.error(`[BI_DAILY_DIGEST] 사용자 ${userId} 처리 중 오류:`, userError)
          failCount++
          results.push({ userId, status: 'error', error: userError instanceof Error ? userError.message : 'Unknown error' })
        }
      }

      console.log('[BI_DAILY_DIGEST] 이틀에 한번 게시판 알림 발송 완료:', {
        total: usersWithNotifications.length,
        success: successCount,
        failed: failCount,
        newPostsCount
      })

      return NextResponse.json({
        success: true,
        message: '이틀에 한번 게시판 알림 발송 완료',
        data: {
          totalUsers: usersWithNotifications.length,
          successCount,
          failCount,
          newPostsCount,
          results
        }
      })
    } else {
      console.log('[BI_DAILY_DIGEST] 새로운 게시글이 없어 알림을 발송하지 않습니다.')
      return NextResponse.json({
        success: true,
        message: '새로운 게시글이 없어 알림을 발송하지 않습니다.',
        sent: 0,
        newPostsCount: 0
      })
    }

  } catch (error) {
    console.error('[BI_DAILY_DIGEST] 이틀에 한번 게시판 알림 발송 중 예외 발생:', error)
    return NextResponse.json(
      {
        success: false,
        error: '이틀에 한번 게시판 알림 발송 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

