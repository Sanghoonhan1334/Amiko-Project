-- =====================================================
-- Image URL Migration: Convert Paths to Full URLs
-- =====================================================
-- Purpose: Update all image references from relative paths to full public URLs
--          to eliminate runtime .getPublicUrl() calls and improve performance
--
-- What this does:
-- ✅ Converts: "userId/file.jpg" → "https://...supabase.co/storage/.../userId/file.jpg"
-- ✅ Keeps existing full URLs unchanged (WHERE NOT LIKE 'http%')
-- ✅ Safe: Only updates rows that need conversion
--
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

BEGIN;

-- 1. Fix users.avatar_url (profile images)
UPDATE users
SET avatar_url = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/profile-images/' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url != ''
  AND avatar_url NOT LIKE 'http%'
  AND avatar_url NOT LIKE 'default%';

-- 2. Fix users.profile_image (alternative profile field)
UPDATE users
SET profile_image = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/profile-images/' || profile_image
WHERE profile_image IS NOT NULL
  AND profile_image != ''
  AND profile_image NOT LIKE 'http%'
  AND profile_image NOT LIKE 'default%';

-- 3. Fix users.main_profile_image
UPDATE users
SET main_profile_image = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/profile-images/' || main_profile_image
WHERE main_profile_image IS NOT NULL
  AND main_profile_image != ''
  AND main_profile_image NOT LIKE 'http%'
  AND main_profile_image NOT LIKE 'default%';

-- 4. Fix users.profile_images array
UPDATE users
SET profile_images = ARRAY(
  SELECT CASE
    WHEN url LIKE 'http%' THEN url
    WHEN url LIKE 'default%' THEN url
    WHEN url IS NULL OR url = '' THEN url
    ELSE 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/profile-images/' || url
  END
  FROM unnest(profile_images) AS url
)
WHERE profile_images IS NOT NULL
  AND array_length(profile_images, 1) > 0;

-- 5. Fix chat_messages.image_url (chat images)
UPDATE chat_messages
SET image_url = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/images/' || image_url
WHERE image_url IS NOT NULL
  AND image_url != ''
  AND image_url NOT LIKE 'http%';

-- 6. Fix gallery_posts.images (supports both TEXT[] and JSONB array)
DO $$
DECLARE
  images_data_type text;
BEGIN
  IF to_regclass('public.gallery_posts') IS NULL THEN
    RAISE NOTICE 'Skipping gallery_posts: table does not exist';
    RETURN;
  END IF;

  SELECT data_type
    INTO images_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'gallery_posts'
    AND column_name = 'images';

  IF images_data_type = 'ARRAY' THEN
    EXECUTE $sql$
      UPDATE gallery_posts
      SET images = ARRAY(
        SELECT CASE
          WHEN url LIKE 'http%' THEN url
          WHEN url IS NULL OR url = '' THEN url
          ELSE 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/images/' || url
        END
        FROM unnest(images) AS url
      )
      WHERE images IS NOT NULL
        AND array_length(images, 1) > 0
        AND EXISTS (
          SELECT 1 FROM unnest(images) AS url WHERE url NOT LIKE 'http%'
        )
    $sql$;
    RAISE NOTICE 'gallery_posts.images migrated as TEXT[]';
  ELSIF images_data_type = 'jsonb' THEN
    EXECUTE $sql$
      UPDATE gallery_posts
      SET images = to_jsonb(
        ARRAY(
          SELECT CASE
            WHEN url LIKE 'http%' THEN url
            WHEN url IS NULL OR url = '' THEN url
            ELSE 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/images/' || url
          END
          FROM jsonb_array_elements_text(images) AS url
        )
      )
      WHERE images IS NOT NULL
        AND jsonb_typeof(images) = 'array'
        AND jsonb_array_length(images) > 0
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(images) AS url WHERE url NOT LIKE 'http%'
        )
    $sql$;
    RAISE NOTICE 'gallery_posts.images migrated as JSONB';
  ELSE
    RAISE NOTICE 'Skipping gallery_posts.images: unsupported or missing column type (%)', images_data_type;
  END IF;
END
$$;

-- 7. Fix idol_photos.image_url (if table exists)
DO $$
BEGIN
  IF to_regclass('public.idol_photos') IS NOT NULL THEN
    UPDATE idol_photos
    SET image_url = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/images/' || image_url
    WHERE image_url IS NOT NULL
      AND image_url != ''
      AND image_url NOT LIKE 'http%';
  ELSE
    RAISE NOTICE 'Skipping idol_photos: table does not exist';
  END IF;
END
$$;

-- 8. Fix fanart_posts.image_url (if table exists)
DO $$
BEGIN
  IF to_regclass('public.fanart_posts') IS NOT NULL THEN
    UPDATE fanart_posts
    SET image_url = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/images/' || image_url
    WHERE image_url IS NOT NULL
      AND image_url != ''
      AND image_url NOT LIKE 'http%';
  ELSE
    RAISE NOTICE 'Skipping fanart_posts: table does not exist';
  END IF;
END
$$;

-- 9. Fix stories.image_url (if table exists)
DO $$
BEGIN
  IF to_regclass('public.stories') IS NOT NULL THEN
    UPDATE stories
    SET image_url = 'https://abrxigfmuebrnyzkfcyr.supabase.co/storage/v1/object/public/images/' || image_url
    WHERE image_url IS NOT NULL
      AND image_url != ''
      AND image_url NOT LIKE 'http%';
  ELSE
    RAISE NOTICE 'Skipping stories: table does not exist';
  END IF;
END
$$;

COMMIT;

-- =====================================================
-- Verification Queries (run these to check results)
-- =====================================================

-- Check users table conversions
SELECT
  COUNT(*) FILTER (WHERE avatar_url LIKE 'http%') as converted_avatars,
  COUNT(*) FILTER (WHERE avatar_url NOT LIKE 'http%' AND avatar_url IS NOT NULL) as remaining_paths,
  COUNT(*) as total_users
FROM users;

-- Check chat_messages conversions
SELECT
  COUNT(*) FILTER (WHERE image_url LIKE 'http%') as converted_chat_images,
  COUNT(*) FILTER (WHERE image_url NOT LIKE 'http%' AND image_url IS NOT NULL) as remaining_paths,
  COUNT(*) FILTER (WHERE image_url IS NOT NULL) as total_with_images
FROM chat_messages;

-- Check profile_images arrays
SELECT
  COUNT(*) as users_with_arrays,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM unnest(profile_images) AS url WHERE url LIKE 'http%'
    )
  ) as users_with_converted_urls
FROM users
WHERE profile_images IS NOT NULL AND array_length(profile_images, 1) > 0;

-- Check gallery_posts.images arrays
DO $$
DECLARE
  images_data_type text;
  posts_with_images bigint;
  posts_with_converted_image_urls bigint;
BEGIN
  IF to_regclass('public.gallery_posts') IS NULL THEN
    RAISE NOTICE 'Verification skipped: gallery_posts table does not exist';
    RETURN;
  END IF;

  SELECT data_type
    INTO images_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'gallery_posts'
    AND column_name = 'images';

  IF images_data_type = 'ARRAY' THEN
    SELECT
      COUNT(*),
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM unnest(images) AS url WHERE url LIKE 'http%'
        )
      )
    INTO posts_with_images, posts_with_converted_image_urls
    FROM gallery_posts
    WHERE images IS NOT NULL AND array_length(images, 1) > 0;
  ELSIF images_data_type = 'jsonb' THEN
    SELECT
      COUNT(*),
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(images) AS url WHERE url LIKE 'http%'
        )
      )
    INTO posts_with_images, posts_with_converted_image_urls
    FROM gallery_posts
    WHERE images IS NOT NULL
      AND jsonb_typeof(images) = 'array'
      AND jsonb_array_length(images) > 0;
  ELSE
    RAISE NOTICE 'Verification skipped: unsupported or missing gallery_posts.images type (%)', images_data_type;
    RETURN;
  END IF;

  RAISE NOTICE 'gallery_posts verification -> posts_with_images: %, converted_image_urls: %', posts_with_images, posts_with_converted_image_urls;
END
$$;

-- =====================================================
-- Rollback (ONLY if something goes wrong)
-- =====================================================
-- WARNING: This will break images! Only use if migration fails
--
-- BEGIN;
-- UPDATE users SET avatar_url = regexp_replace(avatar_url, '^https://.*?/profile-images/', '') WHERE avatar_url LIKE 'http%';
-- UPDATE chat_messages SET image_url = regexp_replace(image_url, '^https://.*?/images/', '') WHERE image_url LIKE 'http%';
-- COMMIT;
