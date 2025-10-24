-- FanZone Phase B - Schema SQL Mejorado
-- Aplicando todas las mejoras sugeridas

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABLA FANROOMS (Mejorada)
-- =============================================
CREATE TABLE fanrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(name) >= 3 AND length(name) <= 50),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'), -- lowercase, hyphen, numbers only
  description TEXT CHECK (length(description) <= 200),
  
  -- Media
  cover_image TEXT, -- URL de Supabase Storage
  
  -- Categorización
  category TEXT NOT NULL CHECK (category IN ('kpop', 'kdrama', 'kbeauty', 'kfood', 'kgaming', 'learning', 'other')),
  tags TEXT[] DEFAULT '{}', -- Array de tags para búsqueda avanzada
  
  -- Visibilidad y moderación
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  
  -- Propietario y estadísticas
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INT DEFAULT 1 CHECK (member_count >= 0),
  active_members INT DEFAULT 0 CHECK (active_members >= 0),
  
  -- Destacados y trending
  is_trending BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  trending_score DECIMAL DEFAULT 0, -- Calculado por actividad
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints adicionales
  CONSTRAINT valid_slug_format CHECK (slug !~ '^-|-$|--'), -- No empezar/terminar con -, no doble -
  CONSTRAINT valid_tags CHECK (array_length(tags, 1) <= 10) -- Máximo 10 tags
);

-- =============================================
-- 2. TABLA FANROOM_MEMBERS (Mejorada)
-- =============================================
CREATE TABLE fanroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Roles jerárquicos
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'moderator', 'member')),
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(fanroom_id, user_id),
  CONSTRAINT valid_role_hierarchy CHECK (
    (role = 'creator' AND fanroom_id IN (
      SELECT id FROM fanrooms WHERE creator_id = user_id
    )) OR role != 'creator'
  )
);

-- =============================================
-- 3. TABLA FANROOM_POSTS (Mejorada)
-- =============================================
CREATE TABLE fanroom_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contenido
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  media_urls TEXT[] DEFAULT '{}', -- URLs de Supabase Storage
  
  -- Estadísticas
  likes_count INT DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INT DEFAULT 0 CHECK (comments_count >= 0),
  
  -- Estado del post
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_media_count CHECK (array_length(media_urls, 1) <= 10), -- Máximo 10 media por post
  CONSTRAINT valid_content_or_media CHECK (length(content) > 0 OR array_length(media_urls, 1) > 0) -- Debe tener contenido o media
);

-- =============================================
-- 4. TABLA FANROOM_POST_LIKES
-- =============================================
CREATE TABLE fanroom_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES fanroom_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 5. TABLA FANROOM_POST_COMMENTS
-- =============================================
CREATE TABLE fanroom_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES fanroom_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_comment_content CHECK (trim(content) != '')
);

-- =============================================
-- 6. TABLA FANROOM_CHAT (Mejorada)
-- =============================================
CREATE TABLE fanroom_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fanroom_id UUID REFERENCES fanrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_chat_message CHECK (trim(message) != '')
);

-- =============================================
-- 7. TABLA REPORTS (MVP Moderación)
-- =============================================
CREATE TABLE fanroom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Qué se reporta
  reportable_type TEXT NOT NULL CHECK (reportable_type IN ('fanroom', 'post', 'comment', 'chat')),
  reportable_id UUID NOT NULL,
  
  -- Quién reporta
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Razón del reporte
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'fake', 'other')),
  description TEXT CHECK (length(description) <= 500),
  
  -- Estado del reporte
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reportable CHECK (
    (reportable_type = 'fanroom' AND reportable_id IN (SELECT id FROM fanrooms)) OR
    (reportable_type = 'post' AND reportable_id IN (SELECT id FROM fanroom_posts)) OR
    (reportable_type = 'comment' AND reportable_id IN (SELECT id FROM fanroom_post_comments)) OR
    (reportable_type = 'chat' AND reportable_id IN (SELECT id FROM fanroom_chat))
  )
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Fanrooms
CREATE INDEX idx_fanrooms_slug ON fanrooms(slug);
CREATE INDEX idx_fanrooms_category ON fanrooms(category);
CREATE INDEX idx_fanrooms_visibility ON fanrooms(visibility);
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

-- Reports
CREATE INDEX idx_fanroom_reports_status ON fanroom_reports(status);
CREATE INDEX idx_fanroom_reports_type ON fanroom_reports(reportable_type, reportable_id);

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

-- Trigger para actualizar likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fanroom_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fanroom_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON fanroom_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger para actualizar comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fanroom_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fanroom_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON fanroom_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

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
-- RLS POLICIES (Mejoradas)
-- =============================================

-- Habilitar RLS
ALTER TABLE fanrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE fanroom_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FANROOMS POLICIES
-- =============================================

-- Lectura: Públicos visibles para todos, privados solo para miembros
CREATE POLICY "Public fanrooms are viewable by everyone"
  ON fanrooms FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Private fanrooms are viewable by members only"
  ON fanrooms FOR SELECT
  USING (
    visibility = 'private' AND
    id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Creación: Solo usuarios autenticados
CREATE POLICY "Authenticated users can create fanrooms"
  ON fanrooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Actualización: Solo creator y admins
CREATE POLICY "Creators and admins can update fanrooms"
  ON fanrooms FOR UPDATE
  USING (
    auth.uid() = creator_id OR
    auth.uid() IN (
      SELECT user_id FROM fanroom_members 
      WHERE fanroom_id = id AND role IN ('admin', 'moderator')
    )
  );

-- Eliminación: Solo creator
CREATE POLICY "Only creators can delete fanrooms"
  ON fanrooms FOR DELETE
  USING (auth.uid() = creator_id);

-- =============================================
-- FANROOM_MEMBERS POLICIES
-- =============================================

-- Lectura: Solo miembros del fanroom
CREATE POLICY "Members can view other members"
  ON fanroom_members FOR SELECT
  USING (
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Unirse: Cualquier usuario autenticado
CREATE POLICY "Users can join fanrooms"
  ON fanroom_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Salir: Solo el propio usuario
CREATE POLICY "Users can leave fanrooms"
  ON fanroom_members FOR DELETE
  USING (auth.uid() = user_id);

-- Actualizar rol: Solo creator y admins
CREATE POLICY "Creators and admins can update member roles"
  ON fanroom_members FOR UPDATE
  USING (
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members 
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
    )
  );

-- =============================================
-- FANROOM_POSTS POLICIES
-- =============================================

-- Lectura: Solo miembros del fanroom
CREATE POLICY "Members can view posts"
  ON fanroom_posts FOR SELECT
  USING (
    status = 'active' AND
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Creación: Solo miembros del fanroom
CREATE POLICY "Members can create posts"
  ON fanroom_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Actualización: Solo el autor
CREATE POLICY "Authors can update their posts"
  ON fanroom_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Eliminación: Autor, creator, admins
CREATE POLICY "Authors, creators and admins can delete posts"
  ON fanroom_posts FOR DELETE
  USING (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT creator_id FROM fanrooms WHERE id = fanroom_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM fanroom_members 
      WHERE fanroom_id = fanroom_posts.fanroom_id AND role IN ('admin', 'moderator')
    )
  );

-- =============================================
-- FANROOM_CHAT POLICIES
-- =============================================

-- Lectura: Solo miembros del fanroom
CREATE POLICY "Members can view chat messages"
  ON fanroom_chat FOR SELECT
  USING (
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Creación: Solo miembros del fanroom
CREATE POLICY "Members can send chat messages"
  ON fanroom_chat FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    fanroom_id IN (
      SELECT fanroom_id FROM fanroom_members WHERE user_id = auth.uid()
    )
  );

-- Eliminación: Solo el autor
CREATE POLICY "Authors can delete their chat messages"
  ON fanroom_chat FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- REPORTS POLICIES
-- =============================================

-- Lectura: Solo el reportero y admins
CREATE POLICY "Reporters and admins can view reports"
  ON fanroom_reports FOR SELECT
  USING (
    auth.uid() = reporter_id OR
    auth.uid() IN (
      SELECT user_id FROM fanroom_members 
      WHERE role IN ('admin', 'moderator')
    )
  );

-- Creación: Cualquier usuario autenticado
CREATE POLICY "Authenticated users can create reports"
  ON fanroom_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Actualización: Solo admins
CREATE POLICY "Only admins can update report status"
  ON fanroom_reports FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM fanroom_members 
      WHERE role IN ('admin', 'moderator')
    )
  );

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Función para generar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(name TEXT)
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
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE fanrooms IS 'FanRooms - Comunidades de fans por artista/grupo/temática';
COMMENT ON COLUMN fanrooms.slug IS 'URL-friendly identifier, unique, lowercase with hyphens';
COMMENT ON COLUMN fanrooms.visibility IS 'public: visible to all, private: members only';
COMMENT ON COLUMN fanrooms.tags IS 'Array of tags for advanced search and categorization';
COMMENT ON COLUMN fanrooms.trending_score IS 'Calculated score based on recent activity';

COMMENT ON TABLE fanroom_members IS 'Membership table with hierarchical roles';
COMMENT ON COLUMN fanroom_members.role IS 'creator > admin > moderator > member';

COMMENT ON TABLE fanroom_posts IS 'Posts within fanrooms with media support';
COMMENT ON COLUMN fanroom_posts.status IS 'active: visible, deleted: soft delete, hidden: moderated';

COMMENT ON TABLE fanroom_chat IS 'Real-time chat messages within fanrooms';

COMMENT ON TABLE fanroom_reports IS 'Moderation reports for content and behavior';

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Insertar categorías de ejemplo (opcional)
-- INSERT INTO fanrooms (name, slug, description, category, creator_id, visibility) VALUES
-- ('BTS Army México', 'bts-army-mexico', 'Fans mexicanos de BTS', 'kpop', 'user-uuid', 'public'),
-- ('Blackpink LATAM', 'blackpink-latam', 'Comunidad latinoamericana de BLACKPINK', 'kpop', 'user-uuid', 'public');

