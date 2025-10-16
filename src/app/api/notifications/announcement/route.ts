import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { title, content, type, url } = body

    console.log('[ANNOUNCEMENT_NOTIFICATION] 공지사항 알림 전송 요청:', {
      title: title?.substring(0, 50),
      contentLength: content?.length,
      type,
      url
    })

    // 모든 활성 사용자에게 알림 전송
    const { data: users, error: usersError } = await supabaseServer
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_deleted', false)

    if (usersError) {
      console.error('[ANNOUNCEMENT_NOTIFICATION] 사용자 조회 실패:', usersError)
      return NextResponse.json(
        { error: '사용자 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('[ANNOUNCEMENT_NOTIFICATION] 알림을 받을 사용자가 없습니다.')
      return NextResponse.json({ message: '알림을 받을 사용자가 없습니다.' })
    }

    // 각 사용자에게 알림 생성
    const notifications = users.map(user => ({
      user_id: user.id,
      title: title || '새로운 공지사항',
      content: content || '',
      type: type || 'announcement',
      url: url || '/community/freeboard',
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { data: createdNotifications, error: notificationError } = await supabaseServer
      .from('notifications')
      .insert(notifications)
      .select('id, user_id')

    if (notificationError) {
      console.error('[ANNOUNCEMENT_NOTIFICATION] 알림 생성 실패:', notificationError)
      return NextResponse.json(
        { error: '알림 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[ANNOUNCEMENT_NOTIFICATION] 공지사항 알림 전송 완료:', {
      totalUsers: users.length,
      notificationsCreated: createdNotifications?.length || 0
    })

    return NextResponse.json({
      message: '공지사항 알림이 전송되었습니다.',
      totalUsers: users.length,
      notificationsCreated: createdNotifications?.length || 0
    })

  } catch (error) {
    console.error('[ANNOUNCEMENT_NOTIFICATION] 공지사항 알림 전송 실패:', error)
    return NextResponse.json(
      { error: '공지사항 알림 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
