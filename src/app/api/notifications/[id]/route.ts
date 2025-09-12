import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 알림 읽음 처리
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json(
        { error: '알림 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 알림 읽음 처리
    const { data: notification, error } = await supabaseServer
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id) // 본인의 알림만 수정 가능
      .select()
      .single()

    if (error) {
      console.error('알림 읽음 처리 실패:', error)
      return NextResponse.json(
        { error: '알림 읽음 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!notification) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ notification })

  } catch (error) {
    console.error('알림 읽음 처리 중 오류:', error)
    return NextResponse.json(
      { error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 알림 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json(
        { error: '알림 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 알림 삭제
    const { error } = await supabaseServer
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id) // 본인의 알림만 삭제 가능

    if (error) {
      console.error('알림 삭제 실패:', error)
      return NextResponse.json(
        { error: '알림 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '알림이 삭제되었습니다.' })

  } catch (error) {
    console.error('알림 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '알림 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}