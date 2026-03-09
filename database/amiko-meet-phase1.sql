-- ============================================================
-- AMIKO MEET — Phase 1: Videollamadas Gratuitas (20 min)
-- Agenda + Control de Acceso + Zona Horaria + Chat
-- ============================================================

-- 1. Admin Availability Slots
-- El administrador define franjas horarias disponibles para Meet
CREATE TABLE IF NOT EXISTS amiko_meet_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul', -- IANA timezone base del slot
  max_participants SMALLINT NOT NULL DEFAULT 6,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 2. Video Sessions (sesiones de videollamada gratuita)
CREATE TABLE IF NOT EXISTS amiko_meet_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES amiko_meet_slots(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  topic TEXT,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'ko', -- idioma base: 'ko' | 'es' | 'mixed'
  scheduled_at TIMESTAMPTZ NOT NULL, -- hora exacta UTC
  duration_minutes SMALLINT NOT NULL DEFAULT 20,
  max_participants SMALLINT NOT NULL DEFAULT 6,
  current_participants SMALLINT NOT NULL DEFAULT 0,
  agora_channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Session Participants (inscripción a videollamada)
CREATE TABLE IF NOT EXISTS amiko_meet_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'participant'
    CHECK (role IN ('host', 'participant')),
  status TEXT NOT NULL DEFAULT 'enrolled'
    CHECK (status IN ('enrolled', 'joined', 'left', 'no_show', 'cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  device_info JSONB, -- { userAgent, platform, screen }
  UNIQUE(session_id, user_id)
);

-- 4. RTC Access Logs (trazabilidad de acceso)
CREATE TABLE IF NOT EXISTS amiko_meet_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('token_issued', 'join', 'leave', 'denied', 'session_closed')),
  ip_address TEXT,
  device_info JSONB,
  metadata JSONB, -- extra context
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Session Chat Messages
CREATE TABLE IF NOT EXISTS amiko_meet_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES amiko_meet_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user'
    CHECK (message_type IN ('user', 'system', 'moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Monthly usage tracking view
-- Cuenta cuántas sesiones GRATUITAS ha usado cada usuario en el mes actual
CREATE OR REPLACE VIEW amiko_meet_monthly_usage AS
SELECT
  p.user_id,
  DATE_TRUNC('month', s.scheduled_at) AS month,
  COUNT(*) FILTER (WHERE p.status IN ('enrolled', 'joined', 'left')) AS sessions_used
FROM amiko_meet_participants p
JOIN amiko_meet_sessions s ON s.id = p.session_id
WHERE s.status IN ('scheduled', 'live', 'completed')
  AND p.status NOT IN ('cancelled', 'no_show')
GROUP BY p.user_id, DATE_TRUNC('month', s.scheduled_at);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_meet_slots_active ON amiko_meet_slots(is_active, day_of_week);
CREATE INDEX IF NOT EXISTS idx_meet_sessions_status ON amiko_meet_sessions(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meet_sessions_host ON amiko_meet_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_meet_sessions_scheduled ON amiko_meet_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meet_participants_session ON amiko_meet_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_meet_participants_user ON amiko_meet_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_access_logs_session ON amiko_meet_access_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_meet_chat_session ON amiko_meet_chat_messages(session_id, created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_amiko_meet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_meet_slots_updated_at
  BEFORE UPDATE ON amiko_meet_slots
  FOR EACH ROW EXECUTE FUNCTION update_amiko_meet_updated_at();

CREATE TRIGGER trg_meet_sessions_updated_at
  BEFORE UPDATE ON amiko_meet_sessions
  FOR EACH ROW EXECUTE FUNCTION update_amiko_meet_updated_at();

-- Auto-update participant count on session
CREATE OR REPLACE FUNCTION update_meet_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE amiko_meet_sessions SET current_participants = (
      SELECT COUNT(*) FROM amiko_meet_participants
      WHERE session_id = NEW.session_id
        AND status NOT IN ('cancelled', 'no_show')
    ) WHERE id = NEW.session_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    UPDATE amiko_meet_sessions SET current_participants = (
      SELECT COUNT(*) FROM amiko_meet_participants
      WHERE session_id = OLD.session_id
        AND status NOT IN ('cancelled', 'no_show')
    ) WHERE id = OLD.session_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_meet_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON amiko_meet_participants
  FOR EACH ROW EXECUTE FUNCTION update_meet_participant_count();

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE amiko_meet_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE amiko_meet_chat_messages ENABLE ROW LEVEL SECURITY;

-- Slots: todos leen, solo admin escribe (via service role)
CREATE POLICY meet_slots_read ON amiko_meet_slots FOR SELECT USING (true);

-- Sessions: todos leen, host puede crear
CREATE POLICY meet_sessions_read ON amiko_meet_sessions FOR SELECT USING (true);
CREATE POLICY meet_sessions_insert ON amiko_meet_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Participants: pueden ver sus propias inscripciones, inscribirse
CREATE POLICY meet_participants_read ON amiko_meet_participants FOR SELECT USING (true);
CREATE POLICY meet_participants_insert ON amiko_meet_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Access logs: solo el propio usuario puede ver
CREATE POLICY meet_access_read ON amiko_meet_access_logs FOR SELECT USING (auth.uid() = user_id);

-- Chat: participantes de la sesión pueden leer y escribir
CREATE POLICY meet_chat_read ON amiko_meet_chat_messages FOR SELECT USING (true);
CREATE POLICY meet_chat_insert ON amiko_meet_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED: Default slots (sample)
-- ============================================================
-- Lunes a Viernes, 10:00-10:20 y 15:00-15:20 KST
-- (Se pueden agregar más desde el admin)
-- INSERT INTO amiko_meet_slots (day_of_week, start_time, end_time, timezone, max_participants)
-- VALUES
--   (1, '10:00', '10:20', 'Asia/Seoul', 6),
--   (1, '15:00', '15:20', 'Asia/Seoul', 6),
--   (2, '10:00', '10:20', 'Asia/Seoul', 6),
--   (2, '15:00', '15:20', 'Asia/Seoul', 6),
--   (3, '10:00', '10:20', 'Asia/Seoul', 6),
--   (3, '15:00', '15:20', 'Asia/Seoul', 6),
--   (4, '10:00', '10:20', 'Asia/Seoul', 6),
--   (4, '15:00', '15:20', 'Asia/Seoul', 6),
--   (5, '10:00', '10:20', 'Asia/Seoul', 6),
--   (5, '15:00', '15:20', 'Asia/Seoul', 6);
