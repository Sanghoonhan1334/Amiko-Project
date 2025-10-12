-- Supabase 데이터베이스 스키마
-- Toss Payments 연동을 위한 테이블들

-- 1. 사용자 테이블 (기본)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 예약 테이블
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  price_cents INTEGER NOT NULL, -- 원 단위 (예: 50000 = 500원)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  order_id TEXT UNIQUE NOT NULL, -- Toss 주문 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 결제 테이블
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_key TEXT UNIQUE NOT NULL, -- Toss 결제 키
  order_id TEXT UNIQUE NOT NULL, -- Toss 주문 ID
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 원 단위
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'failed')),
  method TEXT, -- 결제 방법 (CARD, TRANSFER 등)
  receipt_url TEXT, -- 영수증 URL
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_key ON payments(payment_key);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 5. RLS (Row Level Security) 정책
-- 사용자는 자신의 예약과 결제만 볼 수 있음
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자 정책
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 예약 정책
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- 결제 정책
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- 6. 함수 및 트리거
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 커뮤니티 관련 테이블들

-- 사용자 프로필 확장 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT,
  native_language TEXT CHECK (native_language IN ('ko', 'es')),
  is_korean BOOLEAN DEFAULT FALSE,
  kakao_linked_at TIMESTAMP WITH TIME ZONE,
  wa_verified_at TIMESTAMP WITH TIME ZONE,
  sms_verified_at TIMESTAMP WITH TIME ZONE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 시스템 테이블
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  daily_points INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 히스토리 테이블
CREATE TABLE IF NOT EXISTS point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('question', 'answer', 'story', 'freeboard', 'reaction', 'consultation')),
  points INTEGER NOT NULL,
  description TEXT,
  ref_id UUID, -- 관련 게시물/댓글 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시물 테이블 (Q&A, 스토리, 자유게시판 통합)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('question', 'story', 'freeboard', 'news')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('beauty', 'fashion', 'travel', 'culture', 'free')),
  tags TEXT[], -- 태그 배열
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'es')),
  is_solved BOOLEAN DEFAULT FALSE, -- Q&A용
  is_featured BOOLEAN DEFAULT FALSE, -- 추천 게시물
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글/답변 테이블
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글용
  content TEXT NOT NULL,
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'es')),
  is_accepted BOOLEAN DEFAULT FALSE, -- 답변 채택용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요/반응 테이블
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id), -- 사용자당 게시물당 하나의 반응만
  UNIQUE(user_id, comment_id) -- 사용자당 댓글당 하나의 반응만
);

-- 번역 캐시 테이블
CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ref_type TEXT NOT NULL CHECK (ref_type IN ('post', 'comment', 'story', 'news')),
  ref_id UUID NOT NULL,
  source_hash TEXT NOT NULL,
  source_lang TEXT NOT NULL CHECK (source_lang IN ('ko', 'es')),
  target_lang TEXT NOT NULL CHECK (target_lang IN ('ko', 'es')),
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_hash, target_lang)
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reaction', 'mention', 'system')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  ref_id UUID, -- 관련 게시물/댓글 ID
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 추가 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_language ON posts(language);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_translations_ref ON translations(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 9. RLS 정책 추가
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자 프로필 정책
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 포인트 정책
CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own point history" ON point_history FOR SELECT USING (auth.uid() = user_id);

-- 게시물 정책
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- 댓글 정책
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- 반응 정책
CREATE POLICY "Users can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- 번역 정책
CREATE POLICY "Anyone can view translations" ON translations FOR SELECT USING (true);
CREATE POLICY "System can manage translations" ON translations FOR ALL USING (true);

-- 알림 정책
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 10. 트리거 추가
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. 문의 시스템 테이블

-- 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'payment', 'account', 'other')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'es')),
  attachments TEXT[], -- 첨부파일 URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 문의 답변 테이블
CREATE TABLE IF NOT EXISTS inquiry_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 관리자 ID
  responder_type TEXT DEFAULT 'admin' CHECK (responder_type IN ('admin', 'user')),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- 내부 메모 여부
  attachments TEXT[], -- 첨부파일 URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 문의 상태 변경 히스토리
CREATE TABLE IF NOT EXISTS inquiry_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 문의 시스템 인덱스
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_inquiry_id ON inquiry_responses(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_responder_id ON inquiry_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_status_history_inquiry_id ON inquiry_status_history(inquiry_id);

-- 13. 문의 시스템 RLS 정책
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_status_history ENABLE ROW LEVEL SECURITY;

-- 문의 정책
CREATE POLICY "Users can view own inquiries" ON inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create inquiries" ON inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inquiries" ON inquiries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all inquiries" ON inquiries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_korean = true
  )
);

-- 문의 답변 정책
CREATE POLICY "Users can view responses to own inquiries" ON inquiry_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inquiries 
    WHERE inquiries.id = inquiry_responses.inquiry_id 
    AND inquiries.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all responses" ON inquiry_responses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_korean = true
  )
);

-- 문의 상태 히스토리 정책
CREATE POLICY "Users can view history of own inquiries" ON inquiry_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inquiries 
    WHERE inquiries.id = inquiry_status_history.inquiry_id 
    AND inquiries.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all history" ON inquiry_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_korean = true
  )
);

-- 14. 문의 시스템 트리거
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 문의 상태 변경 시 히스토리 자동 생성
CREATE OR REPLACE FUNCTION create_inquiry_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO inquiry_status_history (
      inquiry_id,
      changed_by,
      old_status,
      new_status,
      reason
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      'Status changed by ' || COALESCE(auth.email(), 'system')
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER inquiry_status_change_trigger
  AFTER UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION create_inquiry_status_history();

-- 15. 샘플 데이터 (테스트용)
-- INSERT INTO users (email, name) VALUES 
--   ('test@example.com', '테스트 사용자');

-- INSERT INTO bookings (user_id, topic, start_at, end_at, price_cents, order_id) VALUES 
--   ((SELECT id FROM users WHERE email = 'test@example.com'), 
--    '테스트 수업', 
--    NOW() + INTERVAL '1 hour', 
--    NOW() + INTERVAL '2 hours', 
--    50000, 
--    'order-test-001');
