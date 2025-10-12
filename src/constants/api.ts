// API 기본 URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 인증 관련 API 엔드포인트
export const AUTH_ENDPOINTS = {
  SIGN_UP: '/api/auth/signup',
  SIGN_IN: '/api/auth/signin',
  CHECK_EMAIL: '/api/auth/check-email',
  CHECK_PHONE: '/api/auth/check-phone',
  VERIFY_EMAIL: '/api/auth/verify-email',
  VERIFY_PHONE: '/api/auth/verify-phone',
  REFRESH_TOKEN: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
} as const;

// 사용자 관련 API 엔드포인트
export const USER_ENDPOINTS = {
  PROFILE: '/api/profile',
  UPDATE_PROFILE: '/api/profile',
  UPLOAD_IMAGE: '/api/profile/upload-image',
  DELETE_IMAGE: '/api/profile/delete-image',
  PREFERENCES: '/api/user/preferences',
  NOTIFICATIONS: '/api/user/notifications',
} as const;

// 포인트 관련 API 엔드포인트
export const POINTS_ENDPOINTS = {
  GET_POINTS: '/api/points',
  GET_RANKING: '/api/points/ranking',
  ADD_POINTS: '/api/points/add',
  USE_POINTS: '/api/points/use',
} as const;

// 커뮤니티 관련 API 엔드포인트
export const COMMUNITY_ENDPOINTS = {
  POSTS: '/api/posts',
  COMMENTS: '/api/comments',
  REACTIONS: '/api/reactions',
  GALLERIES: '/api/galleries',
  UPLOAD_IMAGE: '/api/community/upload-image',
} as const;

// 알림 관련 API 엔드포인트
export const NOTIFICATION_ENDPOINTS = {
  GET_NOTIFICATIONS: '/api/notifications',
  MARK_AS_READ: '/api/notifications/mark-read',
  MARK_ALL_AS_READ: '/api/notifications/mark-all-read',
  DELETE_NOTIFICATION: '/api/notifications/delete',
} as const;

// 관리자 관련 API 엔드포인트
export const ADMIN_ENDPOINTS = {
  CHECK_ADMIN: '/api/admin/check',
  GET_USERS: '/api/admin/users',
  GET_POSTS: '/api/admin/posts',
  MODERATE_POST: '/api/admin/moderate-post',
  GET_ANALYTICS: '/api/admin/analytics',
} as const;

// 결제 관련 API 엔드포인트
export const PAYMENT_ENDPOINTS = {
  COUPONS: '/api/coupons',
  CHECK_COUPONS: '/api/coupons/check',
  PURCHASE: '/api/payment/purchase',
  SUBSCRIPTIONS: '/api/payment/subscriptions',
} as const;

// 스토리 관련 API 엔드포인트
export const STORY_ENDPOINTS = {
  GET_STORIES: '/api/stories',
  CREATE_STORY: '/api/stories',
  UPDATE_STORY: '/api/stories',
  DELETE_STORY: '/api/stories',
  CLEANUP_EXPIRED: '/api/stories/cleanup',
} as const;

// 전체 API 엔드포인트 통합
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...USER_ENDPOINTS,
  ...POINTS_ENDPOINTS,
  ...COMMUNITY_ENDPOINTS,
  ...NOTIFICATION_ENDPOINTS,
  ...ADMIN_ENDPOINTS,
  ...PAYMENT_ENDPOINTS,
  ...STORY_ENDPOINTS,
} as const;

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
