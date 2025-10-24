// FanZone TypeScript Types
// Tipos actualizados con todas las mejoras sugeridas

import { Database } from '@/types/supabase'

// =============================================
// TIPOS BASE DE SUPABASE
// =============================================

export type Fanroom = Database['public']['Tables']['fanrooms']['Row']
export type FanroomInsert = Database['public']['Tables']['fanrooms']['Insert']
export type FanroomUpdate = Database['public']['Tables']['fanrooms']['Update']

export type FanroomMember = Database['public']['Tables']['fanroom_members']['Row']
export type FanroomMemberInsert = Database['public']['Tables']['fanroom_members']['Insert']
export type FanroomMemberUpdate = Database['public']['Tables']['fanroom_members']['Update']

export type FanroomPost = Database['public']['Tables']['fanroom_posts']['Row']
export type FanroomPostInsert = Database['public']['Tables']['fanroom_posts']['Insert']
export type FanroomPostUpdate = Database['public']['Tables']['fanroom_posts']['Update']

export type FanroomChat = Database['public']['Tables']['fanroom_chat']['Row']
export type FanroomChatInsert = Database['public']['Tables']['fanroom_chat']['Insert']

export type FanroomReport = Database['public']['Tables']['fanroom_reports']['Row']
export type FanroomReportInsert = Database['public']['Tables']['fanroom_reports']['Insert']

// =============================================
// ENUMS Y CONSTANTES
// =============================================

export type FanzoneCategory = 
  | 'kpop' 
  | 'kdrama' 
  | 'kbeauty' 
  | 'kfood' 
  | 'kgaming' 
  | 'learning' 
  | 'other'

export type FanroomVisibility = 'public' | 'private'

export type FanroomRole = 'creator' | 'admin' | 'moderator' | 'member'

export type PostStatus = 'active' | 'deleted' | 'hidden'

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export type SortOption = 'trending' | 'recent' | 'featured' | 'popular'

// =============================================
// TIPOS EXTENDIDOS CON RELACIONES
// =============================================

export interface FanroomWithDetails extends Fanroom {
  creator?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  member_count: number
  active_members: number
  is_member?: boolean
  user_role?: FanroomRole
  recent_posts_count?: number
  last_activity?: string
}

export interface FanroomPostWithAuthor extends FanroomPost {
  author?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  is_liked?: boolean
  likes?: FanroomPostLike[]
  comments?: FanroomPostCommentWithAuthor[]
}

export interface FanroomPostCommentWithAuthor {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  author?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface FanroomChatWithUser extends FanroomChat {
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface FanroomMemberWithUser extends FanroomMember {
  user?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

// =============================================
// TIPOS PARA COMPONENTES
// =============================================

export interface FanroomCardProps {
  fanroom: FanroomWithDetails
  onJoin?: (fanroomId: string) => void
  onLeave?: (fanroomId: string) => void
  onView?: (slug: string) => void
  showActions?: boolean
  variant?: 'default' | 'compact' | 'featured'
}

export interface FanroomListProps {
  fanrooms: FanroomWithDetails[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  sortBy?: SortOption
  category?: FanzoneCategory
  searchQuery?: string
}

export interface CreateFanroomFormData {
  name: string
  description?: string
  category: FanzoneCategory
  tags: string[]
  visibility: FanroomVisibility
  coverImage?: File
}

export interface CreatePostFormData {
  content: string
  mediaFiles?: File[]
  fanroomId: string
}

export interface JoinFanroomData {
  fanroomId: string
  userId: string
}

export interface LeaveFanroomData {
  fanroomId: string
  userId: string
}

// =============================================
// TIPOS PARA API RESPONSES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface FanroomListResponse extends PaginatedResponse<FanroomWithDetails> {
  filters: {
    sortBy: SortOption
    category?: FanzoneCategory
    searchQuery?: string
  }
}

export interface PostListResponse extends PaginatedResponse<FanroomPostWithAuthor> {
  fanroom: FanroomWithDetails
}

export interface ChatMessagesResponse extends PaginatedResponse<FanroomChatWithUser> {
  fanroom: FanroomWithDetails
}

// =============================================
// TIPOS PARA FILTROS Y BÚSQUEDA
// =============================================

export interface FanroomFilters {
  sortBy?: SortOption
  category?: FanzoneCategory
  visibility?: FanroomVisibility
  tags?: string[]
  searchQuery?: string
  isTrending?: boolean
  isFeatured?: boolean
}

export interface PostFilters {
  fanroomId: string
  sortBy?: 'recent' | 'popular' | 'likes'
  status?: PostStatus
  authorId?: string
}

export interface ChatFilters {
  fanroomId: string
  limit?: number
  before?: string // timestamp
  after?: string // timestamp
}

// =============================================
// TIPOS PARA ESTADOS DE UI
// =============================================

export interface FanroomTabState {
  activeTab: 'posts' | 'media' | 'chat' | 'members'
  posts: FanroomPostWithAuthor[]
  media: FanroomPostWithAuthor[]
  chatMessages: FanroomChatWithUser[]
  members: FanroomMemberWithUser[]
  loading: {
    posts: boolean
    media: boolean
    chat: boolean
    members: boolean
  }
}

export interface FanroomHomeState {
  myFanrooms: FanroomWithDetails[]
  exploreFanrooms: FanroomWithDetails[]
  trendingFanrooms: FanroomWithDetails[]
  featuredFanrooms: FanroomWithDetails[]
  filters: FanroomFilters
  loading: {
    myFanrooms: boolean
    explore: boolean
    trending: boolean
    featured: boolean
  }
}

// =============================================
// TIPOS PARA REALTIME
// =============================================

export interface RealtimeChannel {
  fanroomId: string
  channelName: string
  eventHandlers: {
    [event: string]: (payload: any) => void
  }
}

export interface ChatMessageEvent {
  type: 'chat_message'
  payload: FanroomChatWithUser
}

export interface PostEvent {
  type: 'post_created' | 'post_updated' | 'post_deleted'
  payload: FanroomPostWithAuthor
}

export interface MemberEvent {
  type: 'member_joined' | 'member_left' | 'member_role_changed'
  payload: {
    fanroomId: string
    member: FanroomMemberWithUser
  }
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop'
  payload: {
    fanroomId: string
    userId: string
    userName: string
  }
}

export type RealtimeEvent = ChatMessageEvent | PostEvent | MemberEvent | TypingEvent

// =============================================
// TIPOS PARA VALIDACIÓN
// =============================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface FanroomValidation extends ValidationResult {
  name?: string
  slug?: string
  description?: string
  category?: string
  tags?: string[]
  coverImage?: string
}

export interface PostValidation extends ValidationResult {
  content?: string
  mediaFiles?: string[]
}

// =============================================
// TIPOS PARA ESTADÍSTICAS
// =============================================

export interface FanroomStats {
  memberCount: number
  activeMembers: number
  postsCount: number
  commentsCount: number
  chatMessagesCount: number
  trendingScore: number
  lastActivity: string
}

export interface UserFanroomStats {
  joinedFanrooms: number
  createdFanrooms: number
  totalPosts: number
  totalLikes: number
  totalComments: number
}

// =============================================
// TIPOS PARA NOTIFICACIONES
// =============================================

export interface FanroomNotification {
  id: string
  type: 'new_post' | 'new_comment' | 'new_member' | 'role_changed' | 'fanroom_updated'
  fanroomId: string
  fanroomName: string
  userId: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

// =============================================
// TIPOS PARA MODERACIÓN
// =============================================

export interface ModerationAction {
  id: string
  type: 'warn' | 'mute' | 'kick' | 'ban' | 'delete_content'
  targetUserId: string
  targetContentId?: string
  reason: string
  moderatorId: string
  fanroomId: string
  created_at: string
}

export interface ReportData {
  reportableType: 'fanroom' | 'post' | 'comment' | 'chat'
  reportableId: string
  reason: ReportReason
  description?: string
}

// =============================================
// TIPOS PARA CONFIGURACIÓN
// =============================================

export interface FanroomSettings {
  allowMemberPosts: boolean
  requireApproval: boolean
  allowMediaUpload: boolean
  allowChat: boolean
  allowInvites: boolean
  maxMembers?: number
  autoDeleteInactiveDays?: number
}

export interface UserPreferences {
  notifications: {
    newPosts: boolean
    newComments: boolean
    newMembers: boolean
    mentions: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowDirectMessages: boolean
  }
}

// =============================================
// TIPOS PARA ERRORES
// =============================================

export interface FanroomError {
  code: string
  message: string
  details?: any
}

export type FanroomErrorCode = 
  | 'FANROOM_NOT_FOUND'
  | 'FANROOM_ALREADY_EXISTS'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVALID_SLUG'
  | 'SLUG_TAKEN'
  | 'MAX_MEMBERS_REACHED'
  | 'USER_ALREADY_MEMBER'
  | 'USER_NOT_MEMBER'
  | 'INVALID_CATEGORY'
  | 'INVALID_VISIBILITY'
  | 'COVER_UPLOAD_FAILED'
  | 'MEDIA_UPLOAD_FAILED'

// =============================================
// UTILIDADES DE TIPOS
// =============================================

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type FanroomCreateData = RequiredFields<FanroomInsert, 'name' | 'category'>

export type FanroomUpdateData = OptionalFields<FanroomUpdate, 'id'>

export type PostCreateData = RequiredFields<FanroomPostInsert, 'content' | 'fanroom_id'>

export type PostUpdateData = OptionalFields<FanroomPostUpdate, 'id'>

// =============================================
// TIPOS PARA TESTING
// =============================================

export interface MockFanroom extends Omit<FanroomWithDetails, 'id' | 'created_at' | 'updated_at'> {
  id: string
  created_at: string
  updated_at: string
}

export interface TestData {
  fanrooms: MockFanroom[]
  posts: FanroomPostWithAuthor[]
  members: FanroomMemberWithUser[]
  chatMessages: FanroomChatWithUser[]
}

// =============================================
// EXPORTACIONES PRINCIPALES
// =============================================

export {
  // Tipos base
  type Fanroom,
  type FanroomMember,
  type FanroomPost,
  type FanroomChat,
  
  // Tipos extendidos
  type FanroomWithDetails,
  type FanroomPostWithAuthor,
  type FanroomChatWithUser,
  
  // Enums
  type FanzoneCategory,
  type FanroomVisibility,
  type FanroomRole,
  type SortOption,
  
  // Props de componentes
  type FanroomCardProps,
  type FanroomListProps,
  type CreateFanroomFormData,
  
  // Estados
  type FanroomTabState,
  type FanroomHomeState,
  
  // Realtime
  type RealtimeEvent,
  type RealtimeChannel,
  
  // API
  type ApiResponse,
  type PaginatedResponse,
  type FanroomListResponse
}
