-- ============================================================
-- AMIKO Education Module - Complete Database Schema
-- Marketplace + Live Classes + Cultural Exchange
-- ============================================================

-- 1. Instructor Profiles
-- 강사 프로필 (instructor profile)
CREATE TABLE IF NOT EXISTS instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  display_name TEXT NOT NULL,
  country TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}',         -- e.g. {'es','ko'}
  experience TEXT,                                 -- 경력 사항
  specialty TEXT,                                  -- 전문 분야
  bio TEXT,                                        -- 프로필 요약
  is_verified BOOLEAN DEFAULT FALSE,               -- 관리자 인증 여부
  average_rating NUMERIC(3,2) DEFAULT 0,           -- 평균 평점
  total_reviews INTEGER DEFAULT 0,                 -- 총 리뷰 수
  total_students INTEGER DEFAULT 0,                -- 총 수강생 수
  total_courses INTEGER DEFAULT 0,                 -- 총 개설 과정
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user_id ON instructor_profiles(user_id);

-- 2. Courses (Adiestramientos / 교육과정)
CREATE TABLE IF NOT EXISTS education_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                             -- 과정 제목
  slug TEXT NOT NULL UNIQUE,                       -- URL-friendly identifier
  category TEXT NOT NULL CHECK (category IN (
    'korean_language',
    'korean_culture',
    'korea_business',
    'gastronomy',
    'history',
    'k_culture',
    'cultural_exchange'
  )),
  description TEXT NOT NULL,                       -- 과정 설명
  objectives TEXT,                                  -- 학습 목표
  level TEXT NOT NULL CHECK (level IN ('basic', 'intermediate', 'advanced')),
  teaching_language TEXT NOT NULL CHECK (teaching_language IN ('es', 'ko', 'bilingual')),
  total_classes INTEGER NOT NULL CHECK (total_classes > 0),
  class_duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_usd NUMERIC(10,2) NOT NULL CHECK (price_usd >= 0),
  max_students INTEGER NOT NULL DEFAULT 20 CHECK (max_students > 0),
  enrolled_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,                              -- 썸네일 이미지
  allow_recording BOOLEAN DEFAULT FALSE,           -- 녹화 허용 여부
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- 초안
    'pending_review',  -- 검토 대기
    'approved',        -- 승인됨
    'rejected',        -- 거절됨
    'published',       -- 게시됨
    'in_progress',     -- 진행 중
    'completed',       -- 완료
    'cancelled'        -- 취소
  )),
  rejection_reason TEXT,                           -- 거절 사유
  start_date TIMESTAMPTZ,                          -- 시작일
  end_date TIMESTAMPTZ,                            -- 종료일
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_courses_instructor ON education_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_education_courses_status ON education_courses(status);
CREATE INDEX IF NOT EXISTS idx_education_courses_category ON education_courses(category);
CREATE INDEX IF NOT EXISTS idx_education_courses_slug ON education_courses(slug);

-- 3. Course Sessions / Classes (개별 수업)
CREATE TABLE IF NOT EXISTS education_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,                 -- 수업 번호
  title TEXT,                                      -- 수업 제목 (optional)
  description TEXT,                                -- 수업 설명
  scheduled_at TIMESTAMPTZ NOT NULL,               -- 예정 시간 (UTC)
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  agora_channel TEXT,                              -- Agora 채널명
  recording_url TEXT,                              -- 녹화 URL
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',   -- 예정
    'live',        -- 진행 중
    'completed',   -- 완료
    'cancelled',   -- 취소
    'rescheduled'  -- 일정 변경
  )),
  rescheduled_to TIMESTAMPTZ,                      -- 변경된 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_education_sessions_course ON education_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_education_sessions_scheduled ON education_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_education_sessions_status ON education_sessions(status);

-- 4. Course Enrollments (수강 등록)
CREATE TABLE IF NOT EXISTS education_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID,                                 -- PayPal 결제 ID
  paypal_order_id TEXT,                            -- PayPal 주문 ID
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'completed', 'refunded', 'failed'
  )),
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN (
    'active', 'completed', 'dropped', 'refunded'
  )),
  progress_percentage INTEGER DEFAULT 0,
  completed_classes INTEGER DEFAULT 0,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_education_enrollments_course ON education_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_education_enrollments_student ON education_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_education_enrollments_status ON education_enrollments(enrollment_status);

-- 5. Session Attendance (출석 기록)
CREATE TABLE IF NOT EXISTS education_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'completed', 'pending', 'absent'
  )),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_education_attendance_session ON education_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_education_attendance_student ON education_attendance(student_id);

-- 6. Course Reviews (과정 리뷰)
CREATE TABLE IF NOT EXISTS education_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clarity_rating INTEGER NOT NULL CHECK (clarity_rating BETWEEN 1 AND 5),
  content_rating INTEGER NOT NULL CHECK (content_rating BETWEEN 1 AND 5),
  interaction_rating INTEGER NOT NULL CHECK (interaction_rating BETWEEN 1 AND 5),
  usefulness_rating INTEGER NOT NULL CHECK (usefulness_rating BETWEEN 1 AND 5),
  overall_rating NUMERIC(3,2) GENERATED ALWAYS AS (
    (clarity_rating + content_rating + interaction_rating + usefulness_rating)::NUMERIC / 4
  ) STORED,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_education_reviews_course ON education_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_education_reviews_student ON education_reviews(student_id);

-- 7. Course Materials (교육 자료)
CREATE TABLE IF NOT EXISTS education_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES education_courses(id) ON DELETE CASCADE,
  session_id UUID REFERENCES education_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'presentation', 'link', 'vocabulary', 'other')),
  file_url TEXT,
  external_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_materials_course ON education_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_education_materials_session ON education_materials(session_id);

-- 8. Class Chat Messages (수업 채팅)
CREATE TABLE IF NOT EXISTS education_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_chat_session ON education_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_education_chat_created ON education_chat_messages(created_at);

-- 9. Notification Reminders (알림 예약)
CREATE TABLE IF NOT EXISTS education_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES education_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', '15min')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'push' CHECK (channel IN ('email', 'push', 'in_app')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id, reminder_type, channel)
);

CREATE INDEX IF NOT EXISTS idx_education_reminders_scheduled ON education_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_education_reminders_sent ON education_reminders(sent);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_reminders ENABLE ROW LEVEL SECURITY;

-- Instructor profiles: public read, self write
CREATE POLICY "instructor_profiles_select" ON instructor_profiles FOR SELECT USING (true);
CREATE POLICY "instructor_profiles_insert" ON instructor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "instructor_profiles_update" ON instructor_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Courses: public read for published, instructor write own
CREATE POLICY "courses_select_published" ON education_courses FOR SELECT USING (
  status IN ('published', 'in_progress', 'completed') OR
  instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "courses_insert" ON education_courses FOR INSERT WITH CHECK (
  instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "courses_update" ON education_courses FOR UPDATE USING (
  instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid())
);

-- Sessions: enrolled students + instructor can read
CREATE POLICY "sessions_select" ON education_sessions FOR SELECT USING (
  course_id IN (SELECT course_id FROM education_enrollments WHERE student_id = auth.uid())
  OR course_id IN (SELECT id FROM education_courses WHERE instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
  OR course_id IN (SELECT id FROM education_courses WHERE status IN ('published', 'in_progress'))
);
CREATE POLICY "sessions_insert" ON education_sessions FOR INSERT WITH CHECK (
  course_id IN (SELECT id FROM education_courses WHERE instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "sessions_update" ON education_sessions FOR UPDATE USING (
  course_id IN (SELECT id FROM education_courses WHERE instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
);

-- Enrollments: students see own, instructors see their course enrollments
CREATE POLICY "enrollments_select" ON education_enrollments FOR SELECT USING (
  student_id = auth.uid()
  OR course_id IN (SELECT id FROM education_courses WHERE instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "enrollments_insert" ON education_enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

-- Attendance: students see own, instructor sees course
CREATE POLICY "attendance_select" ON education_attendance FOR SELECT USING (
  student_id = auth.uid()
  OR session_id IN (SELECT es.id FROM education_sessions es JOIN education_courses ec ON es.course_id = ec.id WHERE ec.instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
);

-- Reviews: public read, students write own
CREATE POLICY "reviews_select" ON education_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON education_reviews FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "reviews_update" ON education_reviews FOR UPDATE USING (student_id = auth.uid());

-- Materials: enrolled students + instructor
CREATE POLICY "materials_select" ON education_materials FOR SELECT USING (
  course_id IN (SELECT course_id FROM education_enrollments WHERE student_id = auth.uid())
  OR course_id IN (SELECT id FROM education_courses WHERE instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
  OR course_id IN (SELECT id FROM education_courses WHERE status IN ('published', 'in_progress'))
);
CREATE POLICY "materials_insert" ON education_materials FOR INSERT WITH CHECK (
  course_id IN (SELECT id FROM education_courses WHERE instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
);

-- Chat: session participants
CREATE POLICY "chat_select" ON education_chat_messages FOR SELECT USING (
  session_id IN (SELECT es.id FROM education_sessions es WHERE es.course_id IN (SELECT course_id FROM education_enrollments WHERE student_id = auth.uid()))
  OR session_id IN (SELECT es.id FROM education_sessions es JOIN education_courses ec ON es.course_id = ec.id WHERE ec.instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "chat_insert" ON education_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reminders: users see own
CREATE POLICY "reminders_select" ON education_reminders FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_education_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_instructor_profiles_updated_at
  BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trg_education_courses_updated_at
  BEFORE UPDATE ON education_courses
  FOR EACH ROW EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trg_education_sessions_updated_at
  BEFORE UPDATE ON education_sessions
  FOR EACH ROW EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trg_education_reviews_updated_at
  BEFORE UPDATE ON education_reviews
  FOR EACH ROW EXECUTE FUNCTION update_education_updated_at();

-- Auto generate slug from title
CREATE OR REPLACE FUNCTION generate_course_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9가-힣ñáéíóúü\s-]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  IF base_slug = '' THEN
    base_slug := 'course';
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM education_courses WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_course_slug
  BEFORE INSERT OR UPDATE OF title ON education_courses
  FOR EACH ROW EXECUTE FUNCTION generate_course_slug();

-- Update instructor stats on enrollment
CREATE OR REPLACE FUNCTION update_instructor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'completed' THEN
    UPDATE education_courses SET enrolled_count = enrolled_count + 1 WHERE id = NEW.course_id;
    UPDATE instructor_profiles SET total_students = total_students + 1
      WHERE id = (SELECT instructor_id FROM education_courses WHERE id = NEW.course_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_instructor_stats
  AFTER INSERT ON education_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_instructor_stats();

-- Update instructor rating on review
CREATE OR REPLACE FUNCTION update_instructor_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_instructor_id UUID;
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT ec.instructor_id INTO v_instructor_id
  FROM education_courses ec WHERE ec.id = NEW.course_id;
  
  SELECT AVG(overall_rating), COUNT(*) INTO v_avg, v_count
  FROM education_reviews er
  JOIN education_courses ec ON er.course_id = ec.id
  WHERE ec.instructor_id = v_instructor_id;
  
  UPDATE instructor_profiles
  SET average_rating = COALESCE(v_avg, 0),
      total_reviews = v_count
  WHERE id = v_instructor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_instructor_rating
  AFTER INSERT OR UPDATE ON education_reviews
  FOR EACH ROW EXECUTE FUNCTION update_instructor_rating();

-- Generate attendance records when enrollment is confirmed
CREATE OR REPLACE FUNCTION generate_attendance_records()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    INSERT INTO education_attendance (session_id, student_id, status)
    SELECT es.id, NEW.student_id, 'pending'
    FROM education_sessions es
    WHERE es.course_id = NEW.course_id
    ON CONFLICT (session_id, student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_attendance
  AFTER INSERT OR UPDATE OF payment_status ON education_enrollments
  FOR EACH ROW EXECUTE FUNCTION generate_attendance_records();

-- Generate reminders when session is created
CREATE OR REPLACE FUNCTION generate_session_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- For each enrolled student, create reminders
  INSERT INTO education_reminders (session_id, user_id, reminder_type, scheduled_at, channel)
  SELECT 
    NEW.id,
    ee.student_id,
    r.reminder_type,
    CASE r.reminder_type
      WHEN '24h' THEN NEW.scheduled_at - INTERVAL '24 hours'
      WHEN '1h' THEN NEW.scheduled_at - INTERVAL '1 hour'
      WHEN '15min' THEN NEW.scheduled_at - INTERVAL '15 minutes'
    END,
    c.channel
  FROM education_enrollments ee
  CROSS JOIN (VALUES ('24h'), ('1h'), ('15min')) AS r(reminder_type)
  CROSS JOIN (VALUES ('push'), ('email'), ('in_app')) AS c(channel)
  WHERE ee.course_id = NEW.course_id
    AND ee.payment_status = 'completed'
  ON CONFLICT (session_id, user_id, reminder_type, channel) DO NOTHING;
  
  -- Also create reminders for the instructor
  INSERT INTO education_reminders (session_id, user_id, reminder_type, scheduled_at, channel)
  SELECT 
    NEW.id,
    ip.user_id,
    r.reminder_type,
    CASE r.reminder_type
      WHEN '24h' THEN NEW.scheduled_at - INTERVAL '24 hours'
      WHEN '1h' THEN NEW.scheduled_at - INTERVAL '1 hour'
      WHEN '15min' THEN NEW.scheduled_at - INTERVAL '15 minutes'
    END,
    c.channel
  FROM education_courses ec
  JOIN instructor_profiles ip ON ec.instructor_id = ip.id
  CROSS JOIN (VALUES ('24h'), ('1h'), ('15min')) AS r(reminder_type)
  CROSS JOIN (VALUES ('push'), ('email'), ('in_app')) AS c(channel)
  WHERE ec.id = NEW.course_id
  ON CONFLICT (session_id, user_id, reminder_type, channel) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_session_reminders
  AFTER INSERT ON education_sessions
  FOR EACH ROW EXECUTE FUNCTION generate_session_reminders();
