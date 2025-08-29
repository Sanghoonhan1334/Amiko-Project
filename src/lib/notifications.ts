// 알림 시스템 타입 정의
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: string
  readAt?: string
}

export type NotificationType = 
  | 'booking_created'      // 예약 생성
  | 'payment_confirmed'     // 결제 완료
  | 'consultation_reminder' // 상담 전날 알림
  | 'consultation_completed' // 상담 완료
  | 'review_reminder'       // 후기 작성 안내
  | 'system'                // 시스템 알림

// 알림 템플릿
export const NOTIFICATION_TEMPLATES = {
  booking_created: {
    title: '새로운 상담 예약',
    message: '새로운 상담 예약이 생성되었습니다.'
  },
  payment_confirmed: {
    title: '결제 완료',
    message: '상담 예약이 확정되었습니다.'
  },
  consultation_reminder: {
    title: '상담 일정 안내',
    message: '내일 상담이 예정되어 있습니다.'
  },
  consultation_completed: {
    title: '상담 완료',
    message: '상담이 완료되었습니다. 후기를 작성해주세요.'
  },
  review_reminder: {
    title: '후기 작성 안내',
    message: '상담 후기를 작성해주세요.'
  },
  system: {
    title: '시스템 알림',
    message: '시스템에서 전송된 알림입니다.'
  }
}

// 이메일 알림 설정
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@amiko.com',
  subject: {
    booking_created: '[Amiko] 새로운 상담 예약',
    payment_confirmed: '[Amiko] 결제 완료 및 예약 확정',
    consultation_reminder: '[Amiko] 상담 일정 안내',
    consultation_completed: '[Amiko] 상담 완료 및 후기 작성 안내',
    review_reminder: '[Amiko] 후기 작성 안내'
  }
}

// 푸시 알림 설정
export const PUSH_CONFIG = {
  title: 'Amiko',
  icon: '/favicon.ico',
  badge: '/favicon.ico',
      tag: 'amiko-notification'
}

// 알림 우선순위
export const NOTIFICATION_PRIORITY = {
  high: ['payment_confirmed', 'consultation_reminder'],
  medium: ['booking_created', 'consultation_completed'],
  low: ['review_reminder', 'system']
}
