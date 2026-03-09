-- ============================================================
-- AMIKO Education Module v2 — Migration FINAL (idempotente)
-- Seguro para re-ejecutar aunque versiones anteriores hayan
-- corrido parcialmente.
-- ============================================================

-- ============================================================
-- PARTE 0 — Limpiar constraint de cursos + migrar datos
-- ============================================================

-- Eliminar constraint viejo (puede o no existir)
ALTER TABLE education_courses
  DROP CONSTRAINT IF EXISTS education_courses_status_check;

-- Migrar legacy 'pending_review' → 'submitted_for_review'
UPDATE education_courses
  SET status = 'submitted_for_review'
  WHERE status = 'pending_review';

-- Re-crear constraint con todos los estados válidos
ALTER TABLE education_courses
  ADD CONSTRAINT education_courses_status_check
  CHECK (status IN (
    'draft',
    'submitted_for_review',
    'changes_requested',
    'approved',
    'rejected',
    'published',
    'in_progress',
    'completed',
    'cancelled',
    'archived'
  ));

-- ============================================================
-- PARTE 1 — Constraints de las demás tablas
-- ============================================================

-- 1.1 education_sessions
ALTER TABLE education_sessions
  DROP CONSTRAINT IF EXISTS education_sessions_status_check;

ALTER TABLE education_sessions
  ADD CONSTRAINT education_sessions_status_check
  CHECK (status IN (
    'scheduled',
    'ready',
    'live',
    'ending',
    'completed',
    'cancelled',
    'rescheduled'
  ));

-- 1.2 education_attendance
ALTER TABLE education_attendance
  DROP CONSTRAINT IF EXISTS education_attendance_status_check;

ALTER TABLE education_attendance
  ADD CONSTRAINT education_attendance_status_check
  CHECK (status IN (
    'pending',
    'not_joined',
    'joined',
    'attended',
    'late',
    'left_early',
    'absent',
    'completed'
  ));

-- 1.3 education_enrollments — payment_status
ALTER TABLE education_enrollments
  DROP CONSTRAINT IF EXISTS education_enrollments_payment_status_check;

ALTER TABLE education_enrollments
  ADD CONSTRAINT education_enrollments_payment_status_check
  CHECK (payment_status IN (
    'pending',
    'payment_created',
    'payment_approved',
    'payment_captured',
    'completed',
    'failed',
    'cancelled',
    'partially_refunded',
    'refunded'
  ));

-- 1.4 education_enrollments — enrollment_status
ALTER TABLE education_enrollments
  DROP CONSTRAINT IF EXISTS education_enrollments_enrollment_status_check;

ALTER TABLE education_enrollments
  ADD CONSTRAINT education_enrollments_enrollment_status_check
  CHECK (enrollment_status IN (
    'pending_payment',
    'enrolled',
    'active',
    'completed',
    'dropped',
    'cancelled',
    'blocked',
    'refunded'
  ));

-- ============================================================
-- PARTE 2 — Columnas nuevas en tablas existentes
-- ============================================================

-- 2.1 education_sessions
ALTER TABLE education_sessions
  ADD COLUMN IF NOT EXISTS timezone_origin TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_end_utc TIMESTAMPTZ
    GENERATED ALWAYS AS (scheduled_at + (duration_minutes || ' minutes')::INTERVAL) STORED,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 2.2 education_attendance
ALTER TABLE education_attendance
  ADD COLUMN IF NOT EXISTS total_seconds_connected INTEGER DEFAULT 0;

-- 2.3 education_enrollments
ALTER TABLE education_enrollments
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS review_eligible BOOLEAN DEFAULT FALSE;

-- ============================================================
-- PARTE 3 — Nuevas tablas (idempotente con IF NOT EXISTS)
-- ============================================================

-- 3.1 course_payments
CREATE TABLE IF NOT EXISTS course_payments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID        NOT NULL REFERENCES education_courses(id)    ON DELETE CASCADE,
  enrollment_id     UUID                 REFERENCES education_enrollments(id) ON DELETE SET NULL,
  user_id           UUID        NOT NULL REFERENCES auth.users(id)            ON DELETE CASCADE,
  provider          TEXT        NOT NULL DEFAULT 'paypal'
                                CHECK (provider IN ('paypal', 'stripe', 'manual')),
  paypal_order_id   TEXT,
  paypal_capture_id TEXT,
  amount            NUMERIC(10,2) NOT NULL,
  currency          TEXT        NOT NULL DEFAULT 'USD',
  status            TEXT        NOT NULL DEFAULT 'created'
                                CHECK (status IN (
                                  'created', 'approved', 'captured',
                                  'failed', 'cancelled', 'partially_refunded', 'refunded'
                                )),
  raw_payload       JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_payments_course      ON course_payments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_user        ON course_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_enrollment  ON course_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_status      ON course_payments(status);
CREATE INDEX IF NOT EXISTS idx_course_payments_paypal_order ON course_payments(paypal_order_id);

-- 3.2 course_certificates
CREATE TABLE IF NOT EXISTS course_certificates (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             UUID          NOT NULL REFERENCES education_courses(id)    ON DELETE CASCADE,
  enrollment_id         UUID          NOT NULL REFERENCES education_enrollments(id) ON DELETE CASCADE,
  student_id            UUID          NOT NULL REFERENCES auth.users(id)            ON DELETE CASCADE,
  certificate_code      TEXT          NOT NULL UNIQUE,
  issued_at             TIMESTAMPTZ   DEFAULT NOW(),
  pdf_url               TEXT,
  attendance_percentage NUMERIC(5,2),
  is_valid              BOOLEAN       DEFAULT TRUE,
  UNIQUE(course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_certificates_course  ON course_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_student ON course_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_code    ON course_certificates(certificate_code);

-- 3.3 course_status_history
CREATE TABLE IF NOT EXISTS course_status_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID        NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT        NOT NULL,
  changed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_status_history_course   ON course_status_history(course_id);
CREATE INDEX IF NOT EXISTS idx_course_status_history_created  ON course_status_history(created_at);

-- 3.4 session_status_history
CREATE TABLE IF NOT EXISTS session_status_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT        NOT NULL,
  changed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_status_history_session_id ON session_status_history(session_id);
CREATE INDEX IF NOT EXISTS idx_session_status_history_created    ON session_status_history(created_at);

-- ============================================================
-- PARTE 4 — RLS (drop + recreate para idempotencia)
-- ============================================================

ALTER TABLE course_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_status_history ENABLE ROW LEVEL SECURITY;

-- course_payments
DROP POLICY IF EXISTS "course_payments_select" ON course_payments;
CREATE POLICY "course_payments_select" ON course_payments FOR SELECT USING (
  user_id = auth.uid()
  OR course_id IN (
    SELECT id FROM education_courses
    WHERE instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "course_payments_insert" ON course_payments;
CREATE POLICY "course_payments_insert" ON course_payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- course_certificates
DROP POLICY IF EXISTS "course_certificates_select" ON course_certificates;
CREATE POLICY "course_certificates_select" ON course_certificates FOR SELECT USING (
  student_id = auth.uid()
  OR course_id IN (
    SELECT id FROM education_courses
    WHERE instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- course_status_history
DROP POLICY IF EXISTS "course_status_history_select" ON course_status_history;
CREATE POLICY "course_status_history_select" ON course_status_history FOR SELECT USING (
  course_id IN (
    SELECT id FROM education_courses
    WHERE instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- session_status_history
DROP POLICY IF EXISTS "session_status_history_select" ON session_status_history;
CREATE POLICY "session_status_history_select" ON session_status_history FOR SELECT USING (
  session_id IN (
    SELECT es.id FROM education_sessions es
    JOIN education_courses ec ON es.course_id = ec.id
    WHERE ec.instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================
-- PARTE 5 — Triggers de auditoría (CREATE OR REPLACE + DROP/CREATE)
-- ============================================================

CREATE OR REPLACE FUNCTION log_course_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO course_status_history (course_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_course_status ON education_courses;
CREATE TRIGGER trg_log_course_status
  AFTER UPDATE OF status ON education_courses
  FOR EACH ROW EXECUTE FUNCTION log_course_status_change();

CREATE OR REPLACE FUNCTION log_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO session_status_history (session_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_session_status ON education_sessions;
CREATE TRIGGER trg_log_session_status
  AFTER UPDATE OF status ON education_sessions
  FOR EACH ROW EXECUTE FUNCTION log_session_status_change();

DROP TRIGGER IF EXISTS trg_course_payments_updated_at ON course_payments;
CREATE TRIGGER trg_course_payments_updated_at
  BEFORE UPDATE ON course_payments
  FOR EACH ROW EXECUTE FUNCTION update_education_updated_at();

-- ============================================================
-- PARTE 6 — Función de cálculo de asistencia
-- ============================================================

CREATE OR REPLACE FUNCTION compute_attendance_status(
  p_session_duration_minutes INTEGER,
  p_joined_at  TIMESTAMPTZ,
  p_left_at    TIMESTAMPTZ,
  p_scheduled_at TIMESTAMPTZ
)
RETURNS TEXT AS $$
DECLARE
  v_total_seconds      INTEGER;
  v_duration_seconds   INTEGER;
  v_join_delay_seconds INTEGER;
  v_pct_attended       NUMERIC;
  v_pct_late           NUMERIC;
BEGIN
  v_duration_seconds := p_session_duration_minutes * 60;

  IF p_joined_at IS NULL THEN
    RETURN 'absent';
  END IF;

  v_join_delay_seconds := EXTRACT(EPOCH FROM (p_joined_at - p_scheduled_at))::INTEGER;

  IF p_left_at IS NOT NULL THEN
    v_total_seconds := EXTRACT(EPOCH FROM (p_left_at - p_joined_at))::INTEGER;
  ELSE
    v_total_seconds := v_duration_seconds - GREATEST(v_join_delay_seconds, 0);
  END IF;

  v_total_seconds   := GREATEST(v_total_seconds, 0);
  v_pct_attended    := (v_total_seconds::NUMERIC   / v_duration_seconds) * 100;
  v_pct_late        := (v_join_delay_seconds::NUMERIC / v_duration_seconds) * 100;

  IF v_pct_attended < 20                          THEN RETURN 'absent';     END IF;
  IF v_pct_late > 15 AND v_pct_attended < 75      THEN RETURN 'late';       END IF;
  IF v_pct_late > 15                              THEN RETURN 'late';       END IF;
  IF v_pct_attended < 80                          THEN RETURN 'left_early'; END IF;

  RETURN 'attended';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
