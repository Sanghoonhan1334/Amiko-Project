import { supabase } from './supabase';
import { emailService } from './email-service';

export interface AdminNotificationData {
  [key: string]: any;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: AdminNotificationData;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_by?: string;
  read_at?: string;
  target_roles: string[];
  created_at: string;
  expires_at?: string;
}

export interface AdminNotificationSettings {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

class AdminNotificationService {
  /**
   * 관리자 알림 생성
   */
  async createNotification(
    type: string,
    title: string,
    message: string,
    data?: AdminNotificationData,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    targetRoles: string[] = ['admin']
  ): Promise<string | null> {
    try {
      console.log('🔔 [ADMIN NOTIFICATION] 알림 생성:', { type, title, priority });

      // 1. 데이터베이스에 알림 저장
      const { data: notification, error: dbError } = await supabase
        .from('admin_notifications')
        .insert({
          type,
          title,
          message,
          data,
          priority,
          target_roles: targetRoles
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('❌ 관리자 알림 저장 실패:', dbError);
        return null;
      }

      console.log('✅ 관리자 알림 저장 성공:', notification.id);

      // 2. 해당 역할을 가진 관리자들에게 알림 발송
      await this.sendNotificationsToAdmins(type, title, message, data, priority, targetRoles);

      return notification.id;
    } catch (error) {
      console.error('❌ 관리자 알림 생성 중 오류:', error);
      return null;
    }
  }

  /**
   * 관리자들에게 알림 발송
   */
  private async sendNotificationsToAdmins(
    type: string,
    title: string,
    message: string,
    data?: AdminNotificationData,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    targetRoles: string[] = ['admin']
  ) {
    try {
      // 1. 해당 역할을 가진 관리자들 조회
      const { data: admins, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', targetRoles);

      if (adminError || !admins) {
        console.error('❌ 관리자 조회 실패:', adminError);
        return;
      }

      console.log(`👥 [ADMIN NOTIFICATION] 알림 대상 관리자: ${admins.length}명`);

      // 2. 각 관리자에게 알림 발송
      for (const admin of admins) {
        await this.sendNotificationToAdmin(admin.user_id, type, title, message, data, priority);
      }
    } catch (error) {
      console.error('❌ 관리자 알림 발송 중 오류:', error);
    }
  }

  /**
   * 개별 관리자에게 알림 발송
   */
  private async sendNotificationToAdmin(
    adminUserId: string,
    type: string,
    title: string,
    message: string,
    data?: AdminNotificationData,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ) {
    try {
      // 1. 관리자의 알림 설정 확인
      const { data: settings, error: settingsError } = await supabase
        .from('admin_notification_settings')
        .select('*')
        .eq('user_id', adminUserId)
        .eq('notification_type', type)
        .single();

      if (settingsError || !settings) {
        console.warn(`⚠️ [ADMIN ${adminUserId}] 알림 설정을 찾을 수 없음:`, type);
        return;
      }

      // 2. 푸시 알림 발송 (활성화된 경우)
      if (settings.push_enabled) {
        try {
          const pushResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: adminUserId,
              title: `🔔 ${title}`,
              body: message,
              data: {
                type: 'admin_notification',
                notificationType: type,
                priority,
                ...data
              }
            })
          });

          if (pushResponse.ok) {
            console.log(`✅ [ADMIN ${adminUserId}] 푸시 알림 발송 성공`);
          } else {
            console.warn(`⚠️ [ADMIN ${adminUserId}] 푸시 알림 발송 실패:`, pushResponse.status);
          }
        } catch (pushError) {
          console.error(`❌ [ADMIN ${adminUserId}] 푸시 알림 발송 중 오류:`, pushError);
        }
      }

      // 3. 이메일 발송 (활성화된 경우)
      if (settings.email_enabled) {
        try {
          const emailResult = await emailService.sendNotificationEmail(
            adminUserId, // 이메일 주소가 필요하므로 users 테이블에서 조회 필요
            'admin_notification',
            {
              notificationType: type,
              title,
              message,
              priority,
              data: JSON.stringify(data, null, 2)
            }
          );

          if (emailResult.success) {
            console.log(`✅ [ADMIN ${adminUserId}] 이메일 알림 발송 성공`);
          } else {
            console.warn(`⚠️ [ADMIN ${adminUserId}] 이메일 알림 발송 실패:`, emailResult.error);
          }
        } catch (emailError) {
          console.error(`❌ [ADMIN ${adminUserId}] 이메일 알림 발송 중 오류:`, emailError);
        }
      }

    } catch (error) {
      console.error(`❌ [ADMIN ${adminUserId}] 알림 발송 중 오류:`, error);
    }
  }

  /**
   * 새 예약 알림 생성
   */
  async notifyNewBooking(bookingData: {
    id: string;
    user_name: string;
    consultant_name: string;
    start_at: string;
    duration: number;
    amount: number;
  }) {
    return this.createNotification(
      'new_booking',
      '🎉 새로운 상담 예약!',
      `${bookingData.user_name}님이 ${bookingData.consultant_name} 상담사와 ${new Date(bookingData.start_at).toLocaleString('ko-KR')}에 ${bookingData.duration}분 상담을 예약했습니다.`,
      {
        bookingId: bookingData.id,
        userName: bookingData.user_name,
        consultantName: bookingData.consultant_name,
        startAt: bookingData.start_at,
        duration: bookingData.duration,
        amount: bookingData.amount
      },
      'high',
      ['admin', 'manager']
    );
  }

  /**
   * 결제 완료 알림 생성
   */
  async notifyPaymentCompleted(paymentData: {
    id: string;
    amount: number;
    user_name: string;
    consultant_name: string;
    payment_method: string;
  }) {
    return this.createNotification(
      'payment_completed',
      '✅ 결제 완료!',
      `${paymentData.user_name}님이 ${paymentData.consultant_name} 상담사와의 상담료 ${paymentData.amount.toLocaleString()}원을 ${paymentData.payment_method}로 결제했습니다.`,
      {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        userName: paymentData.user_name,
        consultantName: paymentData.consultant_name,
        paymentMethod: paymentData.payment_method
      },
      'normal',
      ['admin', 'manager']
    );
  }

  /**
   * 결제 실패 알림 생성
   */
  async notifyPaymentFailed(paymentData: {
    id: string;
    amount: number;
    user_name: string;
    error_message: string;
  }) {
    return this.createNotification(
      'payment_failed',
      '❌ 결제 실패!',
      `${paymentData.user_name}님이 ${paymentData.amount.toLocaleString()}원 결제를 시도했으나 실패했습니다. 오류: ${paymentData.error_message}`,
      {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        userName: paymentData.user_name,
        errorMessage: paymentData.error_message
      },
      'high',
      ['admin']
    );
  }

  /**
   * 상담 리마인더 알림 생성
   */
  async notifyConsultationReminder(reminderData: {
    totalBookings: number;
    successCount: number;
    failureCount: number;
  }) {
    return this.createNotification(
      'consultation_reminder',
      '⏰ 상담 리마인더 발송 완료',
      `상담 리마인더 발송이 완료되었습니다. 전체: ${reminderData.totalBookings}건, 성공: ${reminderData.successCount}건, 실패: ${reminderData.failureCount}건`,
      {
        totalBookings: reminderData.totalBookings,
        successCount: reminderData.successCount,
        failureCount: reminderData.failureCount
      },
      'normal',
      ['admin']
    );
  }

  /**
   * 시스템 알림 생성
   */
  async notifySystemAlert(
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    data?: AdminNotificationData
  ) {
    return this.createNotification(
      'system_alert',
      title,
      message,
      data,
      priority,
      ['admin']
    );
  }

  /**
   * 관리자 알림 목록 조회
   */
  async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ) {
    try {
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('❌ 관리자 알림 조회 실패:', error);
        return [];
      }

      return notifications || [];
    } catch (error) {
      console.error('❌ 관리자 알림 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_by: userId,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ 알림 읽음 처리 실패:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ 알림 읽음 처리 중 오류:', error);
      return false;
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string, notificationTypes?: string[]): Promise<number> {
    try {
      let query = supabase
        .from('admin_notifications')
        .update({
          is_read: true,
          read_by: userId,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false);

      if (notificationTypes && notificationTypes.length > 0) {
        query = query.in('type', notificationTypes);
      }

      const { count, error } = await query;

      if (error) {
        console.error('❌ 모든 알림 읽음 처리 실패:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ 모든 알림 읽음 처리 중 오류:', error);
      return 0;
    }
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('❌ 읽지 않은 알림 개수 조회 실패:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ 읽지 않은 알림 개수 조회 중 오류:', error);
      return 0;
    }
  }
}

export const adminNotificationService = new AdminNotificationService();
