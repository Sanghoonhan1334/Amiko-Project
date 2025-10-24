-- G-Dragon FanRoom 데이터 추가
INSERT INTO fanrooms (
  name, 
  slug, 
  description, 
  category, 
  country, 
  visibility,
  tags,
  is_trending,
  is_featured,
  trending_score,
  cover_image
) VALUES (
  'G-Dragon',
  'g-dragon',
  'Fans de G-Dragon - El Rey del K-Pop, líder de BIGBANG',
  'kpop',
  'latam',
  'public',
  ARRAY['g-dragon', 'bigbang', 'k-pop', 'solo', 'latam'],
  true,
  true,
  9.2,
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
);

-- G-Dragon FanRoom 멤버 추가 (테스트용)
INSERT INTO fanroom_members (
  fanroom_id,
  user_id,
  role,
  joined_at
) VALUES (
  (SELECT id FROM fanrooms WHERE slug = 'g-dragon'),
  '6ea93c19-81ba-4f9f-a848-325c5418cbba', -- 현재 사용자 ID
  'member',
  NOW()
);

-- 멤버 수 업데이트
UPDATE fanrooms 
SET member_count = (
  SELECT COUNT(*) FROM fanroom_members 
  WHERE fanroom_id = fanrooms.id
)
WHERE slug = 'g-dragon';
