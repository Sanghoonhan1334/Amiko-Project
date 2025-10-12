// 알림 관련 타입 정의

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: NotificationMetadata;
  createdAt: string;
  readAt?: string;
}

export type NotificationType = 
  | 'system'        // 시스템 알림
  | 'post_like'     // 게시글 좋아요
  | 'post_comment'  // 게시글 댓글
  | 'comment_reply' // 댓글 답글
  | 'follow'        // 팔로우
  | 'points'        // 포인트 획득/사용
  | 'event'         // 이벤트
  | 'payment'       // 결제 관련
  | 'verification'; // 인증 관련

export interface NotificationMetadata {
  postId?: string;
  commentId?: string;
  userId?: string;
  points?: number;
  amount?: number;
  url?: string;
  actionType?: 'view' | 'reply' | 'like';
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: {
    [K in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  variables: string[]; // 템플릿 변수들
}

// 푸시 알림 관련
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  createdAt: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// 알림 통계
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  readRate: number;
  clickRate: number;
}
