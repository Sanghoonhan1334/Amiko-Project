import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { adminNotificationService } from '@/lib/admin-notification-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 권한 확인
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'manager'])
      .single();

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 알림 목록 조회
    const notifications = await adminNotificationService.getNotifications(
      userId,
      limit,
      offset,
      unreadOnly
    );

    // 읽지 않은 알림 개수 조회
    const unreadCount = await adminNotificationService.getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit,
          offset,
          total: notifications.length
        }
      }
    });

  } catch (error) {
    console.error('❌ 관리자 알림 조회 실패:', error);
    
    return NextResponse.json(
      { 
        error: '관리자 알림 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action, notificationId, userId, notificationTypes } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 권한 확인
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'manager'])
      .single();

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    let result: boolean | number = false;

    switch (action) {
      case 'mark_read':
        if (!notificationId) {
          return NextResponse.json(
            { error: '알림 ID가 필요합니다.' },
            { status: 400 }
          );
        }
        result = await adminNotificationService.markAsRead(notificationId, userId);
        break;

      case 'mark_all_read':
        result = await adminNotificationService.markAllAsRead(userId, notificationTypes);
        break;

      default:
        return NextResponse.json(
          { error: '알 수 없는 액션입니다.' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: '알림 상태가 업데이트되었습니다.',
      data: { result }
    });

  } catch (error) {
    console.error('❌ 관리자 알림 상태 업데이트 실패:', error);
    
    return NextResponse.json(
      { 
        error: '관리자 알림 상태 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
