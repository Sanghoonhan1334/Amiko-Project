import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { adminNotificationService } from '@/lib/admin-notification-service';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authenticated) return auth.response;

    const { searchParams } = new URL(req.url);
    const userId = auth.user.id;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // 알림 목록 조회
    const notifications = await adminNotificationService.getNotifications(
      userId,
      limit,
      offset,
      unreadOnly
    );

    // 읽지 않은 알림 개수 조회
    const unreadCount = await adminNotificationService.getUnreadCount();

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

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authenticated) return auth.response;

    const { action, notificationId, notificationTypes } = await req.json();
    const userId = auth.user.id;

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
