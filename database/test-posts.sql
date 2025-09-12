-- 테스트용 게시글 추가
-- Add test posts

-- 먼저 사용자 ID 확인
-- First, check user IDs
SELECT id, email, name FROM public.users LIMIT 5;

-- 자유게시판 카테고리 ID 확인
-- Check free board category ID
SELECT id, name FROM public.board_categories WHERE name = '자유게시판';

-- 테스트 게시글 추가 (실제 사용자 ID로 교체 필요)
-- Add test posts (replace with actual user IDs)
INSERT INTO public.posts (
    title,
    content,
    author_id,
    category_id,
    is_notice,
    is_survey,
    status,
    view_count,
    like_count,
    dislike_count,
    comment_count
) VALUES 
(
    '안녕하세요! 첫 번째 게시글입니다',
    '안녕하세요! Amiko 커뮤니티에 오신 것을 환영합니다. 이곳에서 한국 문화에 대해 이야기하고 소통해보세요.',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.board_categories WHERE name = '자유게시판' LIMIT 1),
    false,
    false,
    'published',
    5,
    3,
    1,
    2
),
(
    '한국 드라마 추천해주세요!',
    '최근에 한국 드라마에 관심이 생겼는데, 어떤 드라마를 보면 좋을까요? 추천해주세요!',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.board_categories WHERE name = '자유게시판' LIMIT 1),
    false,
    false,
    'published',
    12,
    7,
    0,
    5
),
(
    '한국어 공부 방법',
    '한국어를 배우고 있는데 효과적인 공부 방법이 있을까요? 도움 부탁드립니다!',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.board_categories WHERE name = '자유게시판' LIMIT 1),
    false,
    false,
    'published',
    8,
    4,
    1,
    3
)
ON CONFLICT DO NOTHING;

-- 게시글 확인
-- Check posts
SELECT 
    p.id,
    p.title,
    p.content,
    p.view_count,
    p.like_count,
    p.dislike_count,
    p.comment_count,
    p.created_at,
    u.name as author_name,
    bc.name as category_name
FROM public.posts p
LEFT JOIN public.users u ON p.author_id = u.id
LEFT JOIN public.board_categories bc ON p.category_id = bc.id
WHERE p.status = 'published'
ORDER BY p.created_at DESC;

-- 완료 메시지
-- Completion message
SELECT 'Test posts added successfully' as status,
       (SELECT COUNT(*) FROM public.posts WHERE status = 'published') as total_published_posts;
