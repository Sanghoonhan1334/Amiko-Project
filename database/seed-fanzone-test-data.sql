-- FanZone Test Data Seed
-- 데이터베이스에 테스트용 FanRoom 데이터 추가

-- =============================================
-- FANROOMS 테스트 데이터 삽입
-- =============================================

-- 1. BTS Army México
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
  trending_score
) VALUES (
  'BTS Army México',
  'bts-army-mexico',
  'Fans mexicanos de BTS - Compartimos contenido, teorías y nuestra pasión por los 7',
  'kpop',
  'mx',
  'public',
  ARRAY['bts', 'army', 'k-pop', 'mexico'],
  true,
  true,
  8.5
);

-- 2. BLACKPINK LATAM
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
  trending_score
) VALUES (
  'BLACKPINK LATAM',
  'blackpink-latam',
  'Comunidad latinoamericana de BLACKPINK - Lisa, Jennie, Rosé y Jisoo',
  'kpop',
  'latam',
  'public',
  ARRAY['blackpink', 'k-pop', 'latam'],
  true,
  false,
  7.8
);

-- 3. NewJeans Fans Chile
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
  trending_score
) VALUES (
  'NewJeans Fans Chile',
  'newjeans-fans-chile',
  'Fans chilenos de NewJeans - La nueva generación del K-Pop',
  'kpop',
  'cl',
  'public',
  ARRAY['newjeans', 'k-pop', 'chile'],
  true,
  true,
  7.2
);

-- 4. K-Drama Lovers
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
  trending_score
) VALUES (
  'K-Drama Lovers',
  'k-drama-lovers',
  'Discutimos los mejores dramas coreanos - Romance, Thriller, Fantasy',
  'kdrama',
  'latam',
  'public',
  ARRAY['k-drama', 'dramas', 'korea'],
  false,
  false,
  6.5
);

-- 5. K-Beauty Tips
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
  trending_score
) VALUES (
  'K-Beauty Tips',
  'k-beauty-tips',
  'Compartimos tips de belleza coreana - Skincare, makeup y productos',
  'kbeauty',
  'latam',
  'public',
  ARRAY['k-beauty', 'skincare', 'makeup'],
  false,
  true,
  5.8
);

-- 6. LE SSERAFIM Global
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
  trending_score
) VALUES (
  'LE SSERAFIM Global',
  'le-sserafim-global',
  'Fans globales de LE SSERAFIM - Unforgiven era',
  'kpop',
  'latam',
  'public',
  ARRAY['lesserafim', 'k-pop', 'global'],
  true,
  false,
  7.0
);

-- 7. K-Food Adventures
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
  trending_score
) VALUES (
  'K-Food Adventures',
  'k-food-adventures',
  'Exploramos la deliciosa comida coreana - Recetas y restaurantes',
  'kfood',
  'latam',
  'public',
  ARRAY['k-food', 'cooking', 'recipes'],
  false,
  false,
  4.5
);

-- 8. ATEEZ World
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
  trending_score
) VALUES (
  'ATEEZ World',
  'ateez-world',
  'Fans de ATEEZ - Pirate Kings del K-Pop',
  'kpop',
  'latam',
  'public',
  ARRAY['ateez', 'k-pop', 'pirates'],
  true,
  false,
  6.8
);

-- 9. Stray Kids LATAM
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
  trending_score
) VALUES (
  'Stray Kids LATAM',
  'stray-kids-latam',
  'STAYs latinoamericanos - STAY con Stray Kids',
  'kpop',
  'latam',
  'public',
  ARRAY['straykids', 'stay', 'k-pop'],
  true,
  true,
  7.5
);

-- 10. K-Learning Together
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
  trending_score
) VALUES (
  'K-Learning Together',
  'k-learning-together',
  'Aprendamos coreano juntos - Vocabulario, gramática y práctica',
  'learning',
  'latam',
  'public',
  ARRAY['korean', 'learning', 'language'],
  false,
  false,
  5.2
);

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE fanrooms IS 'FanRooms - Comunidades de fans por artista/grupo/temática';
COMMENT ON COLUMN fanrooms.member_count IS 'Número total de miembros (actualizado automáticamente por trigger)';
COMMENT ON COLUMN fanrooms.active_members IS 'Número de miembros activos en los últimos 7 días';
COMMENT ON COLUMN fanrooms.trending_score IS 'Puntuación calculada basada en actividad reciente (miembros, posts, chat)';

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar que los datos se insertaron correctamente
SELECT 
  id,
  name,
  slug,
  category,
  country,
  is_trending,
  is_featured,
  member_count,
  created_at
FROM fanrooms
ORDER BY created_at DESC;

