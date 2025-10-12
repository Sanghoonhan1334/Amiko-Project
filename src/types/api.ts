// API 응답 관련 타입 정의

// 기본 API 응답
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

// 페이지네이션
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 검색 관련
export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, any>;
}

// 파일 업로드
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// 통계 관련
export interface StatsResponse {
  users: {
    total: number;
    active: number;
    new: number;
  };
  posts: {
    total: number;
    today: number;
    thisWeek: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

// 관리자 관련
export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  dailyActiveUsers: number;
  monthlyRevenue: number;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
}

// 에러 응답
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
  path: string;
}

// 성공 응답
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// 웹소켓 메시지
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
}

// 실시간 업데이트
export interface RealtimeUpdate {
  type: 'post_created' | 'post_updated' | 'comment_added' | 'user_online' | 'user_offline';
  data: any;
  timestamp: string;
}
