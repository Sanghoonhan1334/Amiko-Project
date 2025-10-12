// 콘텐츠 관련 타입 정의 (게시글, 스토리, 댓글 등)

// 게시글 관련
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  category: PostCategory;
  gallery?: string;
  tags?: string[];
  images?: string[];
  isPinned?: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostCreate {
  title: string;
  content: string;
  category: PostCategory;
  gallery?: string;
  tags?: string[];
  images?: File[];
}

export interface PostUpdate extends Partial<PostCreate> {
  id: string;
}

export type PostCategory = 
  | 'free'      // 자유게시판
  | 'qna'       // Q&A
  | 'kpop'      // K-POP
  | 'news'      // 뉴스
  | 'gallery';  // 갤러리

export interface PostFilter {
  category?: PostCategory;
  gallery?: string;
  tags?: string[];
  authorId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'latest' | 'popular' | 'views' | 'comments';
}

// 댓글 관련
export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorProfileImage?: string;
  parentId?: string; // 대댓글인 경우
  replies?: Comment[];
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreate {
  postId: string;
  content: string;
  parentId?: string;
}

// 스토리 관련
export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  category: StoryCategory;
  isPublic: boolean;
  isExpired: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type StoryCategory = 'personal' | 'cultural' | 'language' | 'travel';

export interface StoryCreate {
  title: string;
  content: string;
  category: StoryCategory;
  isPublic: boolean;
  expiresAt?: string;
}

// 갤러리 관련
export interface Gallery {
  id: string;
  name: string;
  description?: string;
  category: PostCategory;
  postCount: number;
  createdAt: string;
}

// 반응 관련
export interface Reaction {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export type ReactionType = 'like' | 'love' | 'laugh' | 'angry' | 'sad';

// 검색 관련
export interface SearchResult {
  posts: Post[];
  users: User[];
  totalCount: number;
  hasMore: boolean;
}

export interface SearchFilter {
  query: string;
  type: 'all' | 'posts' | 'users';
  category?: PostCategory;
  dateRange?: {
    start: string;
    end: string;
  };
}
