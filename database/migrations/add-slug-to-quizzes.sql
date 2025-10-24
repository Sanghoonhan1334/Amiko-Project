BEGIN;

-- 1) slug 컬럼 추가
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2) 없는 행만 slug 백필(제목 기반 slugify; 비영문은 떨어질 수 있지만 충돌 처리 아래서 함)
UPDATE quizzes q
SET slug = regexp_replace(lower(coalesce(q.slug, q.title, 'quiz')), '[^a-z0-9]+', '-', 'g')
WHERE q.slug IS NULL;

-- 3) 중복 slug 해소: 첫 번째만 유지, 나머지는 짧은 해시 붙이기
WITH dups AS (
  SELECT slug, array_agg(id ORDER BY created_at, id) AS ids
  FROM quizzes
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE quizzes q
SET slug = q.slug || '-' || substr(md5(q.id::text), 1, 6)
FROM dups
WHERE q.slug = dups.slug
  AND q.id <> dups.ids[1];

-- 4) NOT NULL + UNIQUE 보장
ALTER TABLE quizzes
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quizzes_slug_key ON quizzes(slug);

COMMIT;

