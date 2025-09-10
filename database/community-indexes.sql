-- 커뮤니티 테이블 인덱스 생성 (성능 최적화)

-- 1. posts 테이블 인덱스
-- 기본 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_language ON public.posts(language);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 복합 인덱스 (자주 사용되는 조합)
CREATE INDEX IF NOT EXISTS idx_posts_type_category ON public.posts(type, category);
CREATE INDEX IF NOT EXISTS idx_posts_type_language ON public.posts(type, language);
CREATE INDEX IF NOT EXISTS idx_posts_category_created_at ON public.posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type_created_at ON public.posts(type, created_at DESC);

-- 특수 필드 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_is_solved ON public.posts(is_solved) WHERE is_solved = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_best ON public.posts(is_best) WHERE is_best = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_notice ON public.posts(is_notice) WHERE is_notice = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned) WHERE is_pinned = true;

-- 정렬용 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON public.posts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON public.posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_comment_count ON public.posts(comment_count DESC);

-- 검색용 인덱스 (GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_title_gin ON public.posts USING GIN(to_tsvector('korean', title));
CREATE INDEX IF NOT EXISTS idx_posts_content_gin ON public.posts USING GIN(to_tsvector('korean', content));

-- 2. comments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_language ON public.comments(language);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON public.comments(post_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_created_at ON public.comments(user_id, created_at DESC);

-- 특수 필드 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_is_accepted ON public.comments(is_accepted) WHERE is_accepted = true;
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON public.comments(is_deleted) WHERE is_deleted = false;

-- 3. reactions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON public.reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON public.reactions(type);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON public.reactions(created_at DESC);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_reactions_user_post ON public.reactions(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_comment ON public.reactions(user_id, comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_type ON public.reactions(post_id, type);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_type ON public.reactions(comment_id, type);

-- 4. user_profiles 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON public.user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_korean ON public.user_profiles(is_korean);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON public.user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_language_preference ON public.user_profiles(language_preference);

-- 정렬용 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_points ON public.user_profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON public.user_profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience_points ON public.user_profiles(experience_points DESC);

-- 5. points 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_points_user_id ON public.points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON public.points(type);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON public.points(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_related_id ON public.points(related_id);
CREATE INDEX IF NOT EXISTS idx_points_related_type ON public.points(related_type);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_points_user_created_at ON public.points(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_user_type ON public.points(user_id, type);
CREATE INDEX IF NOT EXISTS idx_points_related ON public.points(related_type, related_id);

-- 일일 포인트 한도 체크용 인덱스
CREATE INDEX IF NOT EXISTS idx_points_user_date ON public.points(user_id, created_at::date);

-- 6. 추가 성능 최적화 인덱스

-- 게시물 통계 조회용 (인기 게시물, 최신 게시물 등)
CREATE INDEX IF NOT EXISTS idx_posts_popularity ON public.posts(
    (like_count * 3 + view_count * 0.2 + comment_count * 2) DESC
);

-- 사용자 활동 통계용
CREATE INDEX IF NOT EXISTS idx_posts_user_activity ON public.posts(user_id, created_at DESC, type);
CREATE INDEX IF NOT EXISTS idx_comments_user_activity ON public.comments(user_id, created_at DESC);

-- 검색 성능 최적화 (한국어 + 영어)
CREATE INDEX IF NOT EXISTS idx_posts_search_ko ON public.posts 
USING GIN(to_tsvector('korean', title || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_posts_search_en ON public.posts 
USING GIN(to_tsvector('english', title || ' ' || content));

-- 태그 검색 최적화
CREATE INDEX IF NOT EXISTS idx_posts_tags_array ON public.posts USING GIN(tags);

-- 부분 인덱스 (NULL이 아닌 값만 인덱싱)
CREATE INDEX IF NOT EXISTS idx_posts_parent_id_not_null ON public.comments(parent_id) 
WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_post_not_null ON public.reactions(post_id) 
WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_comment_not_null ON public.reactions(comment_id) 
WHERE comment_id IS NOT NULL;
