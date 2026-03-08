-- ============================================================
-- AMIKO Education Module v3 — Migration
-- Correcciones y mejoras para videollamadas en Educación
-- Idempotente: seguro para re-ejecutar con IF NOT EXISTS / IF EXISTS
-- ============================================================

-- ============================================================
-- PARTE 1 — agora_uid_instructor en education_sessions
-- Permite que el instructor siempre use el mismo UID en Agora
-- por clase, independientemente de reconexiones o tokens nuevos.
-- ============================================================

ALTER TABLE education_sessions
  ADD COLUMN IF NOT EXISTS agora_uid_instructor INTEGER;

-- ============================================================
-- PARTE 2 — Normalizar agora_channel al formato corto
-- Formato: edu_{course_id_short8}_{session_number}
-- Ejemplo:  edu_9f1a2c3b_1
-- Los canales con UUID completo son válidos pero inconsistentes;
-- actualizamos los que tienen formato largo para homogeneizar.
-- ============================================================

UPDATE education_sessions
  SET agora_channel = 'edu_' || SUBSTRING(course_id::TEXT, 1, 8) || '_' || session_number
  WHERE agora_channel IS NULL
     OR agora_channel ~ '^edu_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_'; -- largo UUID

-- ============================================================
-- PARTE 3 — Tabla de seguimiento de recordatorios para el cron
-- El cron jobs necesita saber si YA envió un tipo de reminder
-- para una sesión. Se usa tabla separada para no mezclar con
-- los registros por-usuario de education_reminders.
-- ============================================================

CREATE TABLE IF NOT EXISTS education_reminder_sends (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID        NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  reminder_type  TEXT        NOT NULL CHECK (reminder_type IN ('24h', '1h', '15min')),
  sent_at        TIMESTAMPTZ DEFAULT NOW(),
  recipients     INTEGER     DEFAULT 0,
  UNIQUE(session_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_edrem_sends_session
  ON education_reminder_sends(session_id);

-- ============================================================
-- PARTE 4 — Corregir trigger de estadísticas de instructor
-- El trigger original solo disparaba en INSERT, pero en el
-- flujo PayPal la inscripción se crea con payment_status='pending'
-- y luego se actualiza a 'completed'.
-- También eliminamos el doble conteo si se vuelve a ejecutar.
-- ============================================================

CREATE OR REPLACE FUNCTION update_instructor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Inscripción confirmada por primera vez (INSERT con completed
  -- o UPDATE desde no-completed a completed)
  IF NEW.payment_status = 'completed' AND (
       TG_OP = 'INSERT' OR COALESCE(OLD.payment_status, '') <> 'completed'
     ) THEN
    UPDATE education_courses
      SET enrolled_count = enrolled_count + 1
      WHERE id = NEW.course_id;

    UPDATE instructor_profiles
      SET total_students = total_students + 1
      WHERE id = (
        SELECT instructor_id FROM education_courses WHERE id = NEW.course_id
      );
  END IF;

  -- Inscripción refundada: restar contador
  IF OLD IS NOT NULL
     AND OLD.payment_status = 'completed'
     AND NEW.payment_status IN ('refunded', 'partially_refunded') THEN
    UPDATE education_courses
      SET enrolled_count = GREATEST(enrolled_count - 1, 0)
      WHERE id = NEW.course_id;

    UPDATE instructor_profiles
      SET total_students = GREATEST(total_students - 1, 0)
      WHERE id = (
        SELECT instructor_id FROM education_courses WHERE id = NEW.course_id
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger para que dispare en INSERT y en UPDATE
DROP TRIGGER IF EXISTS trg_update_instructor_stats ON education_enrollments;
CREATE TRIGGER trg_update_instructor_stats
  AFTER INSERT OR UPDATE OF payment_status ON education_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_instructor_stats();

-- ============================================================
-- PARTE 5 — Corregir trigger de registros de asistencia
-- El trigger genera asistencia al confirmar el pago, pero
-- payment_status se actualiza (no se inserta en 'completed').
-- ============================================================

CREATE OR REPLACE FUNCTION generate_attendance_records()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (
       TG_OP = 'INSERT' OR COALESCE(OLD.payment_status, '') <> 'completed'
     ) THEN
    INSERT INTO education_attendance (session_id, student_id, status)
    SELECT es.id, NEW.student_id, 'pending'
    FROM education_sessions es
    WHERE es.course_id = NEW.course_id
      AND es.status NOT IN ('cancelled', 'completed')
    ON CONFLICT (session_id, student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_attendance ON education_enrollments;
CREATE TRIGGER trg_generate_attendance
  AFTER INSERT OR UPDATE OF payment_status ON education_enrollments
  FOR EACH ROW EXECUTE FUNCTION generate_attendance_records();

-- ============================================================
-- PARTE 6 — Trigger para generar recordatorios también en UPDATE
-- Cuando se reprograma una sesión, scheduled_at cambia y los
-- recordatorios se deben regenerar (el campo timezone_origin
-- puede cambiar también).
-- ============================================================

CREATE OR REPLACE FUNCTION generate_session_reminders_on_reschedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actuar si scheduled_at cambió
  IF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN

    -- Eliminar recordatorios pendientes (no enviados)
    DELETE FROM education_reminders
    WHERE session_id = NEW.id AND sent = FALSE;

    -- Recrear recordatorios para estudiantes activos
    INSERT INTO education_reminders (session_id, user_id, reminder_type, scheduled_at, channel)
    SELECT
      NEW.id,
      ee.student_id,
      r.reminder_type,
      CASE r.reminder_type
        WHEN '24h'   THEN NEW.scheduled_at - INTERVAL '24 hours'
        WHEN '1h'    THEN NEW.scheduled_at - INTERVAL '1 hour'
        WHEN '15min' THEN NEW.scheduled_at - INTERVAL '15 minutes'
      END,
      c.channel
    FROM education_enrollments ee
    CROSS JOIN (VALUES ('24h'), ('1h'), ('15min')) AS r(reminder_type)
    CROSS JOIN (VALUES ('push'), ('email'), ('in_app')) AS c(channel)
    WHERE ee.course_id = NEW.course_id
      AND ee.payment_status = 'completed'
      AND ee.enrollment_status IN ('active', 'enrolled')
    ON CONFLICT (session_id, user_id, reminder_type, channel) DO UPDATE
      SET scheduled_at = EXCLUDED.scheduled_at, sent = FALSE;

    -- Resetear seguimiento de envíos (el cron deberá re-enviarlos)
    DELETE FROM education_reminder_sends WHERE session_id = NEW.id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_session_reminders_reschedule ON education_sessions;
CREATE TRIGGER trg_session_reminders_reschedule
  AFTER UPDATE OF scheduled_at ON education_sessions
  FOR EACH ROW EXECUTE FUNCTION generate_session_reminders_on_reschedule();

-- ============================================================
-- PARTE 7 — RLS para education_reminder_sends
-- Solo admins y el sistema (service role) escriben;
-- no se expone a usuarios finales.
-- ============================================================

ALTER TABLE education_reminder_sends ENABLE ROW LEVEL SECURITY;

-- No hay política de SELECT para usuarios finales (cron usa service role)
-- Si se desea auditabilidad por admin, añadir:
-- CREATE POLICY "reminder_sends_admin_select" ON education_reminder_sends
--   FOR SELECT USING (auth.role() = 'service_role');
