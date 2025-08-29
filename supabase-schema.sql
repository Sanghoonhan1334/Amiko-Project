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

-- 7. 샘플 데이터 (테스트용)
-- INSERT INTO users (email, name) VALUES 
--   ('test@example.com', '테스트 사용자');

-- INSERT INTO bookings (user_id, topic, start_at, end_at, price_cents, order_id) VALUES 
--   ((SELECT id FROM users WHERE email = 'test@example.com'), 
--    '테스트 수업', 
--    NOW() + INTERVAL '1 hour', 
--    NOW() + INTERVAL '2 hours', 
--    50000, 
--    'order-test-001');
