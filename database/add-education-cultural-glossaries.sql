-- ============================================================
--  Phase 4: Cultural Glossaries & Translation Rules
--  Shared tables used by the education translation engine
-- ============================================================

-- ── cultural_glossaries ──────────────────────────────────────────────────────
-- Stores cultural terms with explicit translation actions.
-- Context: 'education' | 'meet' | 'general' allows module-specific filtering.

CREATE TABLE IF NOT EXISTS cultural_glossaries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The source term to match (case-insensitive)
  term                 TEXT NOT NULL,
  source_language      TEXT NOT NULL CHECK (source_language IN ('ko', 'es', 'en')),
  -- Optional: restrict to a specific target language; NULL = apply to all
  target_language      TEXT CHECK (target_language IN ('ko', 'es', 'en')),
  -- How to handle this term when translating
  -- translate    → replace with preferred_translation (forced override)
  -- preserve     → keep original + append preferred_translation in parens
  -- no_translate → keep original exactly as-is (placeholder swap)
  -- annotate     → keep original + append in square brackets
  -- transliterate→ replace with phonetic/romanized form
  action               TEXT NOT NULL CHECK (action IN ('translate', 'preserve', 'no_translate', 'annotate', 'transliterate')),
  -- The replacement/annotation text (required unless action = 'no_translate')
  preferred_translation TEXT,
  -- Semantic category for filtering/UI grouping
  category             TEXT NOT NULL DEFAULT 'general'
                          CHECK (category IN ('food','honorific','name','expression','cultural','education','place','music','fashion','general')),
  -- Optional notes for admins (not passed to AI)
  context_hint         TEXT,
  -- Module this entry belongs to; NULL = shared across all contexts
  context              TEXT CHECK (context IN ('education', 'meet', 'general')) DEFAULT 'general',
  -- Higher = applied first (useful for compound terms)
  priority             INTEGER NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Unique: same term + source + target (NULL target treated as wildcard, allow multiple)
CREATE UNIQUE INDEX IF NOT EXISTS cultural_glossaries_term_unique
  ON cultural_glossaries (term, source_language, COALESCE(target_language, '__all__'), COALESCE(context, 'general'));

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS cultural_glossaries_source_lang_idx ON cultural_glossaries(source_language, is_active);
CREATE INDEX IF NOT EXISTS cultural_glossaries_context_idx     ON cultural_glossaries(context, is_active);
CREATE INDEX IF NOT EXISTS cultural_glossaries_category_idx    ON cultural_glossaries(category);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_cultural_glossaries_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cultural_glossaries_updated ON cultural_glossaries;
CREATE TRIGGER trg_cultural_glossaries_updated
  BEFORE UPDATE ON cultural_glossaries
  FOR EACH ROW EXECUTE FUNCTION update_cultural_glossaries_timestamp();

-- ── translation_rules ────────────────────────────────────────────────────────
-- Pattern-based (regex) rules applied to raw captions before/after AI translation.
-- More powerful than glossaries for structural transformations.

CREATE TABLE IF NOT EXISTS translation_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  -- Regex applied to the SOURCE text before translation
  pattern          TEXT NOT NULL,
  -- Replacement expression (supports capture groups: $1, $2)
  replacement      TEXT NOT NULL,
  -- When to apply: 'pre' = before AI call, 'post' = after AI response
  phase            TEXT NOT NULL DEFAULT 'pre' CHECK (phase IN ('pre', 'post')),
  source_language  TEXT CHECK (source_language IN ('ko', 'es', 'en')),
  target_language  TEXT CHECK (target_language IN ('ko', 'es', 'en')),
  -- Module scope
  context          TEXT CHECK (context IN ('education', 'meet', 'general')) DEFAULT 'general',
  -- Flags for the regex (e.g. 'gi')
  flags            TEXT NOT NULL DEFAULT 'gi',
  priority         INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS translation_rules_context_idx ON translation_rules(context, is_active, phase);

CREATE OR REPLACE FUNCTION update_translation_rules_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_translation_rules_updated ON translation_rules;
CREATE TRIGGER trg_translation_rules_updated
  BEFORE UPDATE ON translation_rules
  FOR EACH ROW EXECUTE FUNCTION update_translation_rules_timestamp();

-- ── RLS Policies ─────────────────────────────────────────────────────────────
-- Public read (cached on server anyway); admin-only write

ALTER TABLE cultural_glossaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_rules   ENABLE ROW LEVEL SECURITY;

-- Anyone can read active entries (server-side caching)
CREATE POLICY "public_read_glossaries"
  ON cultural_glossaries FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "public_read_rules"
  ON translation_rules FOR SELECT
  USING (is_active = TRUE);

-- Admins have full access (via service role the backend bypasses RLS anyway)
CREATE POLICY "admin_all_glossaries"
  ON cultural_glossaries FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_all_rules"
  ON translation_rules FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

-- ── Seed data: Korean cultural terms ─────────────────────────────────────────
-- Honoríficos coreanos
INSERT INTO cultural_glossaries (term, source_language, action, preferred_translation, category, context, priority, context_hint)
VALUES
  ('오빠',    'ko', 'transliterate', 'oppa',    'honorific', 'general', 10, 'Hermano mayor (lo dice una chica); también término afectivo'),
  ('언니',    'ko', 'transliterate', 'unnie',   'honorific', 'general', 10, 'Hermana mayor (lo dice una chica)'),
  ('오라버니','ko', 'transliterate', 'orabeoni','honorific', 'general',  8, 'Hermano mayor (formal)'),
  ('형',      'ko', 'transliterate', 'hyung',   'honorific', 'general', 10, 'Hermano mayor (lo dice un chico)'),
  ('누나',    'ko', 'transliterate', 'noona',   'honorific', 'general', 10, 'Hermana mayor (lo dice un chico)'),
  ('선배',    'ko', 'transliterate', 'sunbae',  'honorific', 'general', 10, 'Compañero/a de mayor rango o antigüedad'),
  ('후배',    'ko', 'transliterate', 'hoobae',  'honorific', 'general',  8, 'Compañero/a de menor rango'),
  ('선생님',  'ko', 'preserve',      '선생님 (maestro/a)', 'honorific', 'education', 10, 'Título de respeto para un profesor'),
  ('교수님',  'ko', 'preserve',      '교수님 (profesor/a universitario/a)', 'honorific', 'education', 10, 'Título universitario'),
  ('님',      'ko', 'no_translate',  NULL,      'honorific', 'general',  5, 'Sufijo de respeto; no traducir'),
  ('씨',      'ko', 'no_translate',  NULL,      'honorific', 'general',  5, 'Sufijo de cortesía; no traducir')
ON CONFLICT DO NOTHING;

-- Comida coreana
INSERT INTO cultural_glossaries (term, source_language, action, preferred_translation, category, context, priority, context_hint)
VALUES
  ('김치',    'ko', 'no_translate', NULL,      'food', 'general', 10, 'Verdura fermentada coreana; nombre propio culinario'),
  ('kimchi',  'es', 'no_translate', NULL,      'food', 'general', 10, 'Kimchi en contexto español — no re-traducir'),
  ('떡볶이',  'ko', 'transliterate','tteokbokki','food','general', 10, 'Pastel de arroz picante'),
  ('삼겹살',  'ko', 'transliterate','samgyeopsal','food','general',9, 'Panceta de cerdo a la parrilla'),
  ('불고기',  'ko', 'transliterate','bulgogi',  'food', 'general', 9, 'Carne de res marinada'),
  ('비빔밥',  'ko', 'transliterate','bibimbap', 'food', 'general', 9, 'Arroz mixto coreano'),
  ('냉면',    'ko', 'transliterate','naengmyeon','food','general', 8, 'Fideos fríos coreanos'),
  ('순두부',  'ko', 'transliterate','sundubu',  'food', 'general', 8, 'Tofu sedoso'),
  ('김밥',    'ko', 'transliterate','gimbap',   'food', 'general', 9, 'Rollo de arroz y algas'),
  ('라면',    'ko', 'transliterate','ramen',    'food', 'general', 7, 'Fideos instantáneos'),
  ('막걸리',  'ko', 'transliterate','makgeolli','food', 'general', 8, 'Bebida alcohólica de arroz'),
  ('soju',    'es', 'no_translate', NULL,       'food','general', 8, 'Licor coreano — no re-traducir'),
  ('소주',    'ko', 'transliterate','soju',     'food', 'general', 9, 'Licor coreano destilado'),
  ('arepa',   'es', 'no_translate', NULL,       'food','general', 9, 'Alimento típico latinoamericano — preservar'),
  ('tamale',  'es', 'no_translate', NULL,       'food','general', 8, 'Alimento típico latinoamericano — preservar'),
  ('empanada','es', 'no_translate', NULL,       'food','general', 8, 'Preservar en contexto culinario')
ON CONFLICT DO NOTHING;

-- Términos educativos / K-pop / cultura
INSERT INTO cultural_glossaries (term, source_language, action, preferred_translation, category, context, priority, context_hint)
VALUES
  ('한류',    'ko', 'preserve',     '한류 (Hallyu / Ola Coreana)', 'cultural', 'education', 10, 'Movimiento cultural coreano global'),
  ('K-pop',   'es', 'no_translate', NULL,   'music',   'general', 10, 'Término musical — no traducir'),
  ('K-drama', 'es', 'no_translate', NULL,   'cultural','general', 9,  'Término de entretenimiento — no traducir'),
  ('아이돌',  'ko', 'preserve',     '아이돌 (ídolo K-pop)', 'music', 'general', 9, 'Celebridad del pop coreano'),
  ('연습생',  'ko', 'preserve',     '연습생 (trainee)', 'cultural', 'education', 8, 'Artista en formación en una agencia'),
  ('데뷔',    'ko', 'transliterate','debut',   'music',   'general', 8, 'Debut artístico'),
  ('안녕하세요','ko','no_translate', NULL,    'expression','general',7, 'Saludo formal — contexto de aprendizaje'),
  ('감사합니다','ko','no_translate', NULL,    'expression','general',7, 'Gracias — contexto de aprendizaje'),
  ('화이팅',  'ko', 'transliterate','¡Fighting! / ¡Ánimo!', 'expression','general',8,'Expresión de aliento'),
  ('대박',    'ko', 'translate',    '¡Increíble! / ¡Genial!','expression','general',7,'Expresión de asombro positivo'),
  ('헐',      'ko', 'translate',    '¡Wow! / ¡No puede ser!','expression','general',6,'Expresión de sorpresa'),
  ('Amiko',   'es', 'no_translate', NULL,    'name',    'general', 10, 'Nombre de la plataforma — no traducir'),
  ('AMIKO',   'es', 'no_translate', NULL,    'name',    'general', 10, 'Nombre de la plataforma — no traducir')
ON CONFLICT DO NOTHING;

-- ── Seed data: translation_rules ─────────────────────────────────────────────
-- Rule: wrap numbers followed by Korean counters
INSERT INTO translation_rules (name, description, pattern, replacement, phase, source_language, context, priority)
VALUES
  (
    'Preserve YouTube/URL links',
    'Keep raw URLs untouched before and after translation',
    '(https?://[^\s]+)',
    '__URL_PLACEHOLDER_$1__',
    'pre',
    NULL,
    'general',
    10
  ),
  (
    'Preserve time expressions',
    'Prevent "분", "시간" etc. from being mis-translated when attached to digits',
    '(\d+)\s*(분|초|시간)',
    '$1$2',
    'pre',
    'ko',
    'general',
    5
  )
ON CONFLICT DO NOTHING;
