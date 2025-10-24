-- FanZone Phase C - Schema SQL con Capa Regional LATAM
-- Extensiones y configuración inicial

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA FANROOMS (Actualizada con país)
-- =============================================
CREATE TABLE fanrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información básica
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name TEXT NOT NULL CHECK (length(name) >= 3 AND length(name) <= 50),
  description TEXT CHECK (length(description) <= 200),
  cover_image TEXT, -- URL de Supabase Storage
  
  -- Categorización y región
  category TEXT NOT NULL CHECK (category IN ('kpop','kdrama','kbeauty','kfood','kgaming','learning','other')),
  country TEXT NOT NULL DEFAULT 'latam' CHECK (country IN ('latam','mx','pe','co','cl','ar','br','us')),
  
  -- Propietario y estadísticas
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INT DEFAULT 1 CHECK (member_count >= 0),
  active_members INT DEFAULT 0 CHECK (active_members >= 0),
  
  -- Visibilidad y moderación
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','private')),
  tags TEXT[] DEFAULT '{}',
  
  -- Destacados y trending
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  trending_score DECIMAL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints adicionales
  CONSTRAINT valid_slug_format CHECK (slug !~ '^-|-$|--'),
  CONSTRAINT valid_tags CHECK (array_length(tags, 1) <= 10)
);

-- =============================================
-- TABLA FANROOM_MEMBERS
-- =============================================
CREATE TABLE fanroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Roles jerárquicos
  role TEXT DEFAULT 'member' CHECK (role IN ('creator','admin','moderator','member')),
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(fanroom_id, user_id)
);

-- =============================================
-- TABLA FANROOM_POSTS
-- =============================================
CREATE TABLE fanroom_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contenido
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  media_urls TEXT[] DEFAULT '{}',
  
  -- Estadísticas
  like_count INT DEFAULT 0 CHECK (like_count >= 0),
  comment_count INT DEFAULT 0 CHECK (comment_count >= 0),
  
  -- Estado del post
  status TEXT DEFAULT 'active' CHECK (status IN ('active','deleted','hidden')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_media_count CHECK (array_length(media_urls, 1) <= 10),
  CONSTRAINT valid_content_or_media CHECK (length(content) > 0 OR array_length(media_urls, 1) > 0)
);

-- =============================================
-- TABLA FANROOM_POST_LIKES
-- =============================================
CREATE TABLE fanroom_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES fanroom_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- =============================================
-- TABLA FANROOM_POST_COMMENTS
-- =============================================
CREATE TABLE fanroom_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES fanroom_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_comment_content CHECK (trim(content) != '')
);

-- =============================================
-- TABLA FANROOM_CHAT
-- =============================================
CREATE TABLE fanroom_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_chat_message CHECK (trim(message) != '')
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Fanrooms
CREATE INDEX idx_fanrooms_slug ON fanrooms(slug);
CREATE INDEX idx_fanrooms_country ON fanrooms(country);
CREATE INDEX idx_fanrooms_category ON fanrooms(category);
CREATE INDEX idx_fanrooms_country_category ON fanrooms(country, category);
CREATE INDEX idx_fanrooms_trending ON fanrooms(is_trending, trending_score DESC) WHERE is_trending = true;
CREATE INDEX idx_fanrooms_featured ON fanrooms(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX idx_fanrooms_creator ON fanrooms(creator_id);

-- Members
CREATE INDEX idx_fanroom_members_user ON fanroom_members(user_id);
CREATE INDEX idx_fanroom_members_fanroom ON fanroom_members(fanroom_id);
CREATE INDEX idx_fanroom_members_role ON fanroom_members(role);

-- Posts
CREATE INDEX idx_fanroom_posts_fanroom_created ON fanroom_posts(fanroom_id, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_fanroom_posts_author ON fanroom_posts(author_id);
CREATE INDEX idx_fanroom_posts_status ON fanroom_posts(status);

-- Chat
CREATE INDEX idx_fanroom_chat_fanroom_created ON fanroom_chat(fanroom_id, created_at ASC);
CREATE INDEX idx_fanroom_chat_user ON fanroom_chat(user_id);

-- =============================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =============================================

-- Trigger para actualizar member_count
CREATE OR REPLACE FUNCTION update_fanroom_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fanrooms SET member_count = member_count + 1 WHERE id = NEW.fanroom_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fanrooms SET member_count = member_count - 1 WHERE id = OLD.fanroom_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE ON fanroom_members
FOR EACH ROW EXECUTE FUNCTION update_fanroom_member_count();

-- Trigger para actualizar like_count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fanroom_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fanroom_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
AFTER INSERT OR DELETE ON fanroom_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Trigger para actualizar comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fanroom_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fanroom_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON fanroom_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fanrooms_updated_at
BEFORE UPDATE ON fanrooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_posts_updated_at
BEFORE UPDATE ON fanroom_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Habilitar RLS
ALTER TABLE fanrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_chat ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FANROOMS POLICIES
-- =============================================

-- Lectura: Públicos visibles para todos, privados solo para miembros
CREATE POLICY "fanrooms_public_read" ON fanrooms FOR SELECT USING (true);

CREATE POLICY "fanrooms_insert_by_creator" ON fanrooms FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "fanrooms_update_by_creator" ON fanrooms FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "fanrooms_delete_by_creator" ON fanrooms FOR DELETE 
USING (auth.uid() = creator_id);

-- =============================================
-- FANROOM_MEMBERS POLICIES
-- =============================================

CREATE POLICY "fanroom_members_insert" ON fanroom_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "members_can_view" ON fanroom_members FOR SELECT USING (
  fanroom_id IN (
    SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "members_can_leave" ON fanroom_members FOR DELETE 
USING (auth.uid() = user_id);

-- =============================================
-- FANROOM_POSTS POLICIES
-- =============================================

CREATE POLICY "posts_select_members" ON fanroom_posts FOR SELECT USING (
  fanroom_id IN (
    SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "posts_insert_members" ON fanroom_posts FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND 
  fanroom_id IN (
    SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "posts_update_by_author" ON fanroom_posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "posts_delete_by_author" ON fanroom_posts FOR DELETE 
USING (auth.uid() = author_id);

-- =============================================
-- FANROOM_CHAT POLICIES
-- =============================================

CREATE POLICY "chat_select_members" ON fanroom_chat FOR SELECT USING (
  fanroom_id IN (
    SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "chat_insert_members" ON fanroom_chat FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  fanroom_id IN (
    SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
  )
);

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Función para generar slug único con país
CREATE OR REPLACE FUNCTION generate_unique_slug(name TEXT, country TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convertir a slug básico
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  final_slug := base_slug;
  
  -- Verificar unicidad y agregar sufijo si es necesario
  WHILE EXISTS (SELECT 1 FROM fanrooms WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(fanroom_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  member_weight DECIMAL := 0.3;
  post_weight DECIMAL := 0.4;
  chat_weight DECIMAL := 0.3;
BEGIN
  -- Peso por miembros activos (últimos 7 días)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM fanroom_members 
     WHERE fanroom_members.fanroom_id = calculate_trending_score.fanroom_id 
     AND last_active_at > NOW() - INTERVAL '7 days') * member_weight, 0
  ) INTO score;
  
  -- Peso por posts (últimos 7 días)
  score := score + COALESCE(
    (SELECT COUNT(*) FROM fanroom_posts 
     WHERE fanroom_posts.fanroom_id = calculate_trending_score.fanroom_id 
     AND created_at > NOW() - INTERVAL '7 days') * post_weight, 0
  );
  
  -- Peso por mensajes de chat (últimos 7 días)
  score := score + COALESCE(
    (SELECT COUNT(*) FROM fanroom_chat 
     WHERE fanroom_chat.fanroom_id = calculate_trending_score.fanroom_id 
     AND created_at > NOW() - INTERVAL '7 days') * chat_weight, 0
  );
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Insertar FanRooms de ejemplo por país
-- INSERT INTO fanrooms (name, slug, description, category, country, creator_id, visibility) VALUES
-- ('BTS Army México', 'bts-army-mexico', 'Fans mexicanos de BTS', 'kpop', 'mx', 'user-uuid', 'public'),
-- ('Blackpink Perú', 'blackpink-peru', 'Comunidad peruana de BLACKPINK', 'kpop', 'pe', 'user-uuid', 'public'),
-- ('K-Drama Colombia', 'k-drama-colombia', 'Dramas coreanos en Colombia', 'kdrama', 'co', 'user-uuid', 'public'),
-- ('K-Beauty Chile', 'k-beauty-chile', 'Belleza coreana en Chile', 'kbeauty', 'cl', 'user-uuid', 'public'),
-- ('NewJeans Argentina', 'newjeans-argentina', 'Fans argentinos de NewJeans', 'kpop', 'ar', 'user-uuid', 'public');

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE fanrooms IS 'FanRooms - Comunidades de fans por artista/grupo/temática con capa regional';
COMMENT ON COLUMN fanrooms.country IS 'País de origen: latam, mx, pe, co, cl, ar, br, us';
COMMENT ON COLUMN fanrooms.slug IS 'URL-friendly identifier, único por país';
COMMENT ON COLUMN fanrooms.trending_score IS 'Puntuación calculada basada en actividad reciente';

COMMENT ON TABLE fanroom_members IS 'Miembros de FanRooms con roles jerárquicos';
COMMENT ON TABLE fanroom_posts IS 'Posts dentro de FanRooms con soporte de media';
COMMENT ON TABLE fanroom_chat IS 'Mensajes de chat en tiempo real dentro de FanRooms';
