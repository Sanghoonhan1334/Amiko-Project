-- ============================================================
-- AMIKO Meet Phase 4: Cultural Glossaries + Linguistic Quality
--                      + Moderation Panel
-- Run this migration AFTER amiko-meet-phase3-translation.sql
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. CULTURAL GLOSSARIES
-- ══════════════════════════════════════════════════════════════

-- Rules:
--   translate      → always translate to target language
--   no_translate   → never translate (keep original)
--   preserve       → keep original + add translation in parentheses
--   transliterate  → convert to phonetic equivalent in target script
--   annotate       → keep original + add cultural note
CREATE TABLE IF NOT EXISTS amiko_meet_cultural_glossaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- The source term exactly as spoken/written
  source_term TEXT NOT NULL,

  -- Language of the source term
  source_language TEXT NOT NULL
    CHECK (source_language IN ('ko', 'es')),

  -- The rule to apply
  rule TEXT NOT NULL
    CHECK (rule IN ('translate', 'no_translate', 'preserve', 'transliterate', 'annotate')),

  -- Target value: translated text, transliteration, or annotation
  -- NULL when rule = 'no_translate' (just keep original)
  target_value TEXT,

  -- Target language for this entry (NULL = applies to all targets)
  target_language TEXT
    CHECK (target_language IS NULL OR target_language IN ('ko', 'es')),

  -- Category for organization
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN (
      'food', 'honorific', 'name', 'expression', 'cultural',
      'music', 'fashion', 'place', 'general'
    )),

  -- Context hint for the translation engine
  context_hint TEXT,

  -- Priority: higher = applied first (tie-break by longer source_term)
  priority INTEGER NOT NULL DEFAULT 0,

  -- Is this entry active?
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Who created / updated
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one rule per source term + source language + target language
CREATE UNIQUE INDEX IF NOT EXISTS idx_glossary_term_unique
  ON amiko_meet_cultural_glossaries(
    LOWER(source_term), source_language, COALESCE(target_language, '__all__')
  );

-- Fast lookup by source language (for pipeline)
CREATE INDEX IF NOT EXISTS idx_glossary_source_lang
  ON amiko_meet_cultural_glossaries(source_language, is_active)
  WHERE is_active = true;

-- Full-text search on source_term
CREATE INDEX IF NOT EXISTS idx_glossary_source_term_trgm
  ON amiko_meet_cultural_glossaries USING gin (source_term gin_trgm_ops);

-- ── Seed: Korean cultural terms ──────────────────────
INSERT INTO amiko_meet_cultural_glossaries
  (source_term, source_language, rule, target_value, target_language, category, context_hint, priority)
VALUES
  -- Food (comida)
  ('김치', 'ko', 'preserve', 'kimchi', 'es', 'food', 'Plato tradicional fermentado coreano', 10),
  ('떡볶이', 'ko', 'preserve', 'tteokbokki', 'es', 'food', 'Pasteles de arroz picantes', 10),
  ('비빔밥', 'ko', 'preserve', 'bibimbap', 'es', 'food', 'Arroz mezclado con verduras y carne', 10),
  ('불고기', 'ko', 'preserve', 'bulgogi', 'es', 'food', 'Carne marinada a la parrilla', 10),
  ('삼겹살', 'ko', 'preserve', 'samgyeopsal', 'es', 'food', 'Panceta de cerdo a la parrilla', 10),
  ('소주', 'ko', 'preserve', 'soju', 'es', 'food', 'Bebida alcohólica coreana', 10),
  ('막걸리', 'ko', 'preserve', 'makgeolli', 'es', 'food', 'Vino de arroz coreano', 10),
  ('김밥', 'ko', 'preserve', 'gimbap', 'es', 'food', 'Rollo de arroz coreano', 10),
  ('라면', 'ko', 'preserve', 'ramyeon', 'es', 'food', 'Fideos instantáneos coreanos', 10),
  ('치맥', 'ko', 'preserve', 'chimaek', 'es', 'food', 'Pollo frito con cerveza', 10),

  -- Honorifics (honoríficos)
  ('오빠', 'ko', 'no_translate', NULL, 'es', 'honorific', 'Término cariñoso: hermano mayor (dicho por mujer)', 20),
  ('언니', 'ko', 'no_translate', NULL, 'es', 'honorific', 'Hermana mayor (dicho por mujer)', 20),
  ('누나', 'ko', 'no_translate', NULL, 'es', 'honorific', 'Hermana mayor (dicho por hombre)', 20),
  ('형', 'ko', 'no_translate', NULL, 'es', 'honorific', 'Hermano mayor (dicho por hombre)', 20),
  ('선배', 'ko', 'annotate', 'senior (en la escuela o trabajo)', 'es', 'honorific', 'Persona de mayor antigüedad', 15),
  ('후배', 'ko', 'annotate', 'junior (en la escuela o trabajo)', 'es', 'honorific', 'Persona de menor antigüedad', 15),
  ('씨', 'ko', 'transliterate', '-ssi', 'es', 'honorific', 'Sufijo de cortesía como Sr./Sra.', 15),
  ('님', 'ko', 'transliterate', '-nim', 'es', 'honorific', 'Sufijo honorífico formal', 15),

  -- Expressions (expresiones)
  ('화이팅', 'ko', 'preserve', 'hwaiting / ¡Ánimo!', 'es', 'expression', 'Expresión de aliento', 15),
  ('대박', 'ko', 'preserve', 'daebak / ¡Increíble!', 'es', 'expression', 'Expresión de asombro', 15),
  ('아이고', 'ko', 'preserve', 'aigo / ¡Ay!', 'es', 'expression', 'Exclamación de sorpresa o queja', 15),
  ('헐', 'ko', 'preserve', 'heol / ¡No puede ser!', 'es', 'expression', 'Expresión de shock', 15),
  ('맞다', 'ko', 'translate', '¡Exacto! / ¡Cierto!', 'es', 'expression', 'Afirmación', 10),

  -- Cultural (cultural)
  ('한복', 'ko', 'preserve', 'hanbok', 'es', 'cultural', 'Traje tradicional coreano', 10),
  ('한글', 'ko', 'preserve', 'hangul', 'es', 'cultural', 'Alfabeto coreano', 10),
  ('세배', 'ko', 'annotate', 'sebae (reverencia de Año Nuevo)', 'es', 'cultural', 'Ritual de respeto en Seollal', 10),
  ('설날', 'ko', 'preserve', 'Seollal (Año Nuevo Lunar)', 'es', 'cultural', 'Año Nuevo Lunar coreano', 10),
  ('추석', 'ko', 'preserve', 'Chuseok (Acción de Gracias coreana)', 'es', 'cultural', 'Festival de la cosecha', 10),

  -- Music (K-pop)
  ('아이돌', 'ko', 'translate', 'idol', 'es', 'music', 'Artista de K-pop', 5),
  ('컴백', 'ko', 'translate', 'comeback', 'es', 'music', 'Regreso musical', 5),
  ('팬미팅', 'ko', 'translate', 'fan meeting', 'es', 'music', 'Encuentro con fans', 5)
ON CONFLICT DO NOTHING;

-- ── Seed: Latin American cultural terms ──────────────
INSERT INTO amiko_meet_cultural_glossaries
  (source_term, source_language, rule, target_value, target_language, category, context_hint, priority)
VALUES
  ('arepa', 'es', 'preserve', '아레파', 'ko', 'food', '콜롬비아/베네수엘라 옥수수 빵', 10),
  ('hallaca', 'es', 'preserve', '아야카', 'ko', 'food', '베네수엘라 전통 크리스마스 요리', 10),
  ('empanada', 'es', 'preserve', '엠파나다', 'ko', 'food', '고기/치즈가 든 튀긴 반죽', 10),
  ('tamal', 'es', 'preserve', '따말', 'ko', 'food', '옥수수 반죽에 싼 전통 요리', 10),
  ('pupusa', 'es', 'preserve', '뿌뿌사', 'ko', 'food', '엘살바도르 전통 옥수수 떡', 10),
  ('ceviche', 'es', 'preserve', '세비체', 'ko', 'food', '라임즙에 절인 해산물 요리', 10),
  ('taco', 'es', 'preserve', '타코', 'ko', 'food', '멕시코 전통 요리', 10),
  ('compadre', 'es', 'annotate', '꼼빠드레 (가까운 친구/대부)', 'ko', 'expression', '친한 친구나 대부를 부르는 말', 15),
  ('comadre', 'es', 'annotate', '꼬마드레 (가까운 친구/대모)', 'ko', 'expression', '친한 여성 친구나 대모를 부르는 말', 15),
  ('pana', 'es', 'annotate', '빠나 (친한 친구)', 'ko', 'expression', '베네수엘라에서 친구를 뜻하는 속어', 15),
  ('chévere', 'es', 'translate', '멋지다 / 좋다', 'ko', 'expression', '긍정적 감탄사', 10),
  ('bacano', 'es', 'translate', '멋지다 / 훌륭하다', 'ko', 'expression', '콜롬비아식 긍정 표현', 10)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- 2. MODERATION REPORTS (user-submitted)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amiko_meet_moderation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Which session
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,

  -- Who reported
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id),
  reporter_name TEXT,

  -- Who is being reported (NULL = report about the session in general)
  reported_user_id UUID REFERENCES auth.users(id),
  reported_user_name TEXT,

  -- Report reason
  reason TEXT NOT NULL
    CHECK (reason IN ('harassment', 'insults', 'spam', 'offensive_content', 'other')),
  description TEXT, -- free-text

  -- Evidence
  evidence_caption_ids UUID[] DEFAULT '{}',  -- caption/translation event IDs
  evidence_screenshot_url TEXT,

  -- Severity assigned by system or admin
  severity TEXT NOT NULL DEFAULT 'informative'
    CHECK (severity IN ('informative', 'warning', 'high_risk')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),

  -- Admin resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- Action taken
  action_taken TEXT
    CHECK (action_taken IS NULL OR action_taken IN (
      'none', 'warning_sent', 'user_muted', 'user_banned', 'session_ended'
    )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_reports_session
  ON amiko_meet_moderation_reports(session_id);

CREATE INDEX IF NOT EXISTS idx_mod_reports_status
  ON amiko_meet_moderation_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mod_reports_reported_user
  ON amiko_meet_moderation_reports(reported_user_id)
  WHERE reported_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mod_reports_reporter
  ON amiko_meet_moderation_reports(reporter_user_id);


-- ══════════════════════════════════════════════════════════════
-- 3. MODERATION FLAGS (auto-detected)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amiko_meet_moderation_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Which session
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,

  -- Who triggered it
  flagged_user_id UUID REFERENCES auth.users(id),
  flagged_user_name TEXT,

  -- The content that was flagged
  flagged_content TEXT NOT NULL,
  content_language TEXT
    CHECK (content_language IS NULL OR content_language IN ('ko', 'es', 'mixed', 'unknown')),

  -- Reference to the caption or translation event
  caption_event_id UUID,
  translation_event_id UUID,

  -- Detection info
  detection_rule TEXT NOT NULL,   -- which rule matched
  detection_type TEXT NOT NULL DEFAULT 'keyword'
    CHECK (detection_type IN ('keyword', 'pattern', 'ml_score', 'manual')),

  -- Severity
  severity TEXT NOT NULL DEFAULT 'informative'
    CHECK (severity IN ('informative', 'warning', 'high_risk')),

  -- Confidence score (0.0 - 1.0)
  confidence NUMERIC(3,2) DEFAULT 1.00
    CHECK (confidence >= 0 AND confidence <= 1),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'reviewed', 'false_positive', 'confirmed')),

  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_flags_session
  ON amiko_meet_moderation_flags(session_id);

CREATE INDEX IF NOT EXISTS idx_mod_flags_severity
  ON amiko_meet_moderation_flags(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mod_flags_user
  ON amiko_meet_moderation_flags(flagged_user_id)
  WHERE flagged_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mod_flags_status
  ON amiko_meet_moderation_flags(status);


-- ══════════════════════════════════════════════════════════════
-- 4. Auto-update timestamps
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_meet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_glossary_updated_at ON amiko_meet_cultural_glossaries;
CREATE TRIGGER trg_glossary_updated_at
  BEFORE UPDATE ON amiko_meet_cultural_glossaries
  FOR EACH ROW EXECUTE FUNCTION update_meet_updated_at();

DROP TRIGGER IF EXISTS trg_mod_reports_updated_at ON amiko_meet_moderation_reports;
CREATE TRIGGER trg_mod_reports_updated_at
  BEFORE UPDATE ON amiko_meet_moderation_reports
  FOR EACH ROW EXECUTE FUNCTION update_meet_updated_at();


-- ══════════════════════════════════════════════════════════════
-- 5. RLS Policies
-- ══════════════════════════════════════════════════════════════

-- ── Glossaries: everyone can read, only admins write ──
ALTER TABLE amiko_meet_cultural_glossaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "glossary_read_all" ON amiko_meet_cultural_glossaries
  FOR SELECT USING (true);

CREATE POLICY "glossary_admin_insert" ON amiko_meet_cultural_glossaries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "glossary_admin_update" ON amiko_meet_cultural_glossaries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "glossary_admin_delete" ON amiko_meet_cultural_glossaries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Moderation Reports: participants can create, admins can read/update ──
ALTER TABLE amiko_meet_moderation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mod_reports_create" ON amiko_meet_moderation_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_user_id
  );

CREATE POLICY "mod_reports_read_own" ON amiko_meet_moderation_reports
  FOR SELECT USING (
    auth.uid() = reporter_user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "mod_reports_admin_update" ON amiko_meet_moderation_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Moderation Flags: server inserts, admins read/update ──
ALTER TABLE amiko_meet_moderation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mod_flags_read" ON amiko_meet_moderation_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "mod_flags_insert" ON amiko_meet_moderation_flags
  FOR INSERT WITH CHECK (true);  -- service role inserts

CREATE POLICY "mod_flags_admin_update" ON amiko_meet_moderation_flags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );


-- ══════════════════════════════════════════════════════════════
-- Done — Phase 4 tables ready
-- ══════════════════════════════════════════════════════════════
