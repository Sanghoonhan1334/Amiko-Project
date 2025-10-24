-- FanZone Storage Configuration
-- Configuración de buckets separados para covers y media

-- =============================================
-- 1. CREAR BUCKETS
-- =============================================

-- Bucket para imágenes de portada de FanRooms
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fanzone-covers',
  'fanzone-covers',
  true, -- Público para lectura
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para media de posts (fotos/videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fanzone-media',
  'fanzone-media',
  true, -- Público para lectura
  52428800, -- 50MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
);

-- =============================================
-- 2. POLICIES DE STORAGE
-- =============================================

-- =============================================
-- FANZONE-COVERS POLICIES
-- =============================================

-- Lectura pública (cualquiera puede ver las portadas)
CREATE POLICY "Covers are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fanzone-covers');

-- Upload: Solo usuarios autenticados pueden subir portadas
CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fanzone-covers' AND
    auth.role() = 'authenticated'
  );

-- Actualización: Solo el creator del fanroom
CREATE POLICY "Fanroom creators can update covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fanzone-covers' AND
    auth.uid() IN (
      SELECT creator_id FROM fanrooms 
      WHERE id::text = split_part(name, '/', 1)
    )
  );

-- Eliminación: Solo el creator del fanroom
CREATE POLICY "Fanroom creators can delete covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fanzone-covers' AND
    auth.uid() IN (
      SELECT creator_id FROM fanrooms 
      WHERE id::text = split_part(name, '/', 1)
    )
  );

-- =============================================
-- FANZONE-MEDIA POLICIES
-- =============================================

-- Lectura pública (cualquiera puede ver el media)
CREATE POLICY "Media is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fanzone-media');

-- Upload: Solo miembros del fanroom pueden subir media
CREATE POLICY "Fanroom members can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fanzone-media' AND
    auth.role() = 'authenticated' AND
    auth.uid() IN (
      SELECT user_id FROM fanroom_members 
      WHERE fanroom_id::text = split_part(name, '/', 1)
    )
  );

-- Actualización: Solo el autor del post
CREATE POLICY "Post authors can update their media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fanzone-media' AND
    auth.uid() IN (
      SELECT author_id FROM fanroom_posts 
      WHERE id::text = split_part(name, '/', 2)
    )
  );

-- Eliminación: Autor del post, creator del fanroom, admins
CREATE POLICY "Post authors and fanroom admins can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fanzone-media' AND
    (
      auth.uid() IN (
        SELECT author_id FROM fanroom_posts 
        WHERE id::text = split_part(name, '/', 2)
      ) OR
      auth.uid() IN (
        SELECT creator_id FROM fanrooms 
        WHERE id::text = split_part(name, '/', 1)
      ) OR
      auth.uid() IN (
        SELECT user_id FROM fanroom_members 
        WHERE fanroom_id::text = split_part(name, '/', 1) 
        AND role IN ('admin', 'moderator')
      )
    )
  );

-- =============================================
-- 3. FUNCIONES AUXILIARES PARA STORAGE
-- =============================================

-- Función para generar path de cover
CREATE OR REPLACE FUNCTION generate_cover_path(fanroom_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN fanroom_id::text || '/' || filename;
END;
$$ LANGUAGE plpgsql;

-- Función para generar path de media
CREATE OR REPLACE FUNCTION generate_media_path(fanroom_id UUID, post_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN fanroom_id::text || '/' || post_id::text || '/' || filename;
END;
$$ LANGUAGE plpgsql;

-- Función para validar tipo de archivo
CREATE OR REPLACE FUNCTION validate_file_type(filename TEXT, allowed_types TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  file_extension TEXT;
BEGIN
  file_extension := lower(split_part(filename, '.', 2));
  
  RETURN file_extension = ANY(
    SELECT split_part(unnest(string_to_array(unnest(allowed_types), '/')), '/', 2)
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. TRIGGERS PARA LIMPIAR STORAGE
-- =============================================

-- Función para eliminar archivos de storage cuando se elimina un fanroom
CREATE OR REPLACE FUNCTION cleanup_fanroom_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar cover del fanroom
  DELETE FROM storage.objects 
  WHERE bucket_id = 'fanzone-covers' 
  AND name LIKE OLD.id::text || '/%';
  
  -- Eliminar todo el media del fanroom
  DELETE FROM storage.objects 
  WHERE bucket_id = 'fanzone-media' 
  AND name LIKE OLD.id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_fanroom_storage
BEFORE DELETE ON fanrooms
FOR EACH ROW EXECUTE FUNCTION cleanup_fanroom_storage();

-- Función para eliminar media cuando se elimina un post
CREATE OR REPLACE FUNCTION cleanup_post_storage()
RETURNS TRIGGER AS $$
DECLARE
  fanroom_id UUID;
BEGIN
  -- Obtener fanroom_id del post
  SELECT fanroom_id INTO fanroom_id FROM fanroom_posts WHERE id = OLD.id;
  
  -- Eliminar media del post
  DELETE FROM storage.objects 
  WHERE bucket_id = 'fanzone-media' 
  AND name LIKE fanroom_id::text || '/' || OLD.id::text || '/%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_post_storage
BEFORE DELETE ON fanroom_posts
FOR EACH ROW EXECUTE FUNCTION cleanup_post_storage();

-- =============================================
-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON FUNCTION generate_cover_path IS 'Genera path para imagen de portada: {fanroom_id}/{filename}';
COMMENT ON FUNCTION generate_media_path IS 'Genera path para media de post: {fanroom_id}/{post_id}/{filename}';
COMMENT ON FUNCTION validate_file_type IS 'Valida que el tipo de archivo esté permitido';

-- =============================================
-- 6. EJEMPLOS DE USO
-- =============================================

/*
-- Ejemplo de upload de cover:
SELECT generate_cover_path('123e4567-e89b-12d3-a456-426614174000', 'cover.jpg');
-- Resultado: 123e4567-e89b-12d3-a456-426614174000/cover.jpg

-- Ejemplo de upload de media:
SELECT generate_media_path('123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001', 'photo.jpg');
-- Resultado: 123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/photo.jpg

-- Estructura de carpetas resultante:
fanzone-covers/
├── 123e4567-e89b-12d3-a456-426614174000/
│   └── cover.jpg
│
fanzone-media/
├── 123e4567-e89b-12d3-a456-426614174000/
│   ├── 456e7890-e89b-12d3-a456-426614174001/
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── video1.mp4
│   └── 789e0123-e89b-12d3-a456-426614174002/
│       └── photo3.jpg
*/

