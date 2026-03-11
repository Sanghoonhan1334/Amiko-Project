-- ============================================================
-- AMIKO VIDEO CALL MARKETPLACE
-- Complete database schema for video call sessions marketplace
-- ============================================================

-- 1. Host profiles (extends users)
CREATE TABLE IF NOT EXISTS public.vc_host_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  country TEXT,
  languages TEXT[] DEFAULT '{}',
  cultural_interests TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'verified', 'expert', 'suspended')),
  cancellation_count INTEGER DEFAULT 0,
  last_cancellation_at TIMESTAMPTZ,
  suspension_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Admin schedule configuration (available time slots)
CREATE TABLE IF NOT EXISTS public.vc_schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  max_slots INTEGER DEFAULT 10,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Video call sessions (the marketplace items)
CREATE TABLE IF NOT EXISTS public.vc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.vc_host_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'language', 'food', 'travel', 'music', 'fashion',
    'technology', 'sports', 'movies', 'history', 'art', 'business'
  )),
  language TEXT NOT NULL DEFAULT 'es',
  level TEXT NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'intermediate', 'advanced')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  max_participants INTEGER NOT NULL DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'completed', 'cancelled', 'no_show'
  )),
  agora_channel TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Session bookings (participants who paid)
CREATE TABLE IF NOT EXISTS public.vc_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'refunded', 'failed'
  )),
  paypal_order_id TEXT,
  amount_paid NUMERIC(10,2),
  host_share NUMERIC(10,2),
  platform_share NUMERIC(10,2),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN (
    'reserved', 'confirmed', 'joined', 'completed', 'cancelled', 'refunded', 'no_show'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 5. Ratings and reviews
CREATE TABLE IF NOT EXISTS public.vc_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.vc_host_profiles(id) ON DELETE CASCADE,
  knowledge_rating INTEGER CHECK (knowledge_rating BETWEEN 1 AND 5),
  clarity_rating INTEGER CHECK (clarity_rating BETWEEN 1 AND 5),
  friendliness_rating INTEGER CHECK (friendliness_rating BETWEEN 1 AND 5),
  usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),
  overall_rating NUMERIC(3,2),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 6. In-session chat messages
CREATE TABLE IF NOT EXISTS public.vc_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Abuse reports
CREATE TABLE IF NOT EXISTS public.vc_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.vc_sessions(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'inappropriate', 'spam', 'harassment', 'cultural_insensitivity',
    'adult_content', 'political', 'religious_extremism', 'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- 8. Notifications queue
CREATE TABLE IF NOT EXISTS public.vc_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'session_booked', 'payment_confirmed', 'reminder_24h', 'reminder_1h',
    'session_starting', 'session_cancelled', 'refund_processed',
    'new_rating', 'host_no_show'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_via TEXT[] DEFAULT '{}', -- 'app', 'email', 'push'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vc_sessions_host ON public.vc_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_status ON public.vc_sessions(status);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_scheduled ON public.vc_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_category ON public.vc_sessions(category);
CREATE INDEX IF NOT EXISTS idx_vc_bookings_session ON public.vc_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_bookings_user ON public.vc_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_ratings_host ON public.vc_ratings(host_id);
CREATE INDEX IF NOT EXISTS idx_vc_notifications_user ON public.vc_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_chat_session ON public.vc_chat_messages(session_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.vc_host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_notifications ENABLE ROW LEVEL SECURITY;

-- Host profiles: public read, owner write
CREATE POLICY "vc_host_profiles_select" ON public.vc_host_profiles FOR SELECT USING (true);
CREATE POLICY "vc_host_profiles_insert" ON public.vc_host_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vc_host_profiles_update" ON public.vc_host_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Schedule config: public read, admin only write (handled via service role)
CREATE POLICY "vc_schedule_config_select" ON public.vc_schedule_config FOR SELECT USING (true);

-- Sessions: public read, host write own
CREATE POLICY "vc_sessions_select" ON public.vc_sessions FOR SELECT USING (true);
CREATE POLICY "vc_sessions_insert" ON public.vc_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.vc_host_profiles WHERE id = host_id AND user_id = auth.uid())
);
CREATE POLICY "vc_sessions_update" ON public.vc_sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.vc_host_profiles WHERE id = host_id AND user_id = auth.uid())
);

-- Bookings: user sees own, host sees session bookings
CREATE POLICY "vc_bookings_select" ON public.vc_bookings FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.vc_sessions s
    JOIN public.vc_host_profiles h ON s.host_id = h.id
    WHERE s.id = session_id AND h.user_id = auth.uid()
  )
);
CREATE POLICY "vc_bookings_insert" ON public.vc_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can only cancel their own non-cancelled bookings (financial fields protected)
CREATE POLICY "vc_bookings_update" ON public.vc_bookings
  FOR UPDATE
  USING (auth.uid() = user_id AND status NOT IN ('cancelled', 'refunded'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Ratings: public read, user writes own
CREATE POLICY "vc_ratings_select" ON public.vc_ratings FOR SELECT USING (true);
CREATE POLICY "vc_ratings_insert" ON public.vc_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat: participants only
CREATE POLICY "vc_chat_select" ON public.vc_chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vc_bookings WHERE session_id = vc_chat_messages.session_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.vc_sessions s JOIN public.vc_host_profiles h ON s.host_id = h.id WHERE s.id = vc_chat_messages.session_id AND h.user_id = auth.uid())
);
CREATE POLICY "vc_chat_insert" ON public.vc_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports: user writes own
CREATE POLICY "vc_reports_insert" ON public.vc_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "vc_reports_select" ON public.vc_reports FOR SELECT USING (auth.uid() = reporter_id);

-- Notifications: user sees own
CREATE POLICY "vc_notifications_select" ON public.vc_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vc_notifications_update" ON public.vc_notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.vc_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vc_host_profiles_updated BEFORE UPDATE ON public.vc_host_profiles
  FOR EACH ROW EXECUTE FUNCTION public.vc_update_timestamp();
CREATE TRIGGER vc_sessions_updated BEFORE UPDATE ON public.vc_sessions
  FOR EACH ROW EXECUTE FUNCTION public.vc_update_timestamp();
CREATE TRIGGER vc_bookings_updated BEFORE UPDATE ON public.vc_bookings
  FOR EACH ROW EXECUTE FUNCTION public.vc_update_timestamp();

-- ============================================================
-- TRIGGER: Update host avg_rating when new rating is inserted
-- ============================================================
CREATE OR REPLACE FUNCTION public.vc_update_host_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vc_host_profiles SET
    avg_rating = (
      SELECT ROUND(AVG(overall_rating)::numeric, 2)
      FROM public.vc_ratings WHERE host_id = NEW.host_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM public.vc_ratings WHERE host_id = NEW.host_id
    )
  WHERE id = NEW.host_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vc_rating_inserted AFTER INSERT ON public.vc_ratings
  FOR EACH ROW EXECUTE FUNCTION public.vc_update_host_rating();

-- ============================================================
-- TRIGGER: Update session participant count on booking
-- ============================================================
CREATE OR REPLACE FUNCTION public.vc_update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vc_sessions SET
    current_participants = (
      SELECT COUNT(*) FROM public.vc_bookings
      WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
      AND payment_status = 'paid'
      AND status NOT IN ('cancelled', 'refunded')
    )
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vc_booking_count AFTER INSERT OR UPDATE OR DELETE ON public.vc_bookings
  FOR EACH ROW EXECUTE FUNCTION public.vc_update_participant_count();

-- ============================================================
-- TRIGGER: Host cancellation penalty system
-- ============================================================
CREATE OR REPLACE FUNCTION public.vc_check_host_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  cancel_count INTEGER;
  host_profile_id UUID;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT h.id INTO host_profile_id
    FROM public.vc_host_profiles h
    WHERE h.id = NEW.host_id;

    IF host_profile_id IS NOT NULL THEN
      UPDATE public.vc_host_profiles SET
        cancellation_count = cancellation_count + 1,
        last_cancellation_at = NOW()
      WHERE id = host_profile_id;

      SELECT cancellation_count INTO cancel_count
      FROM public.vc_host_profiles WHERE id = host_profile_id;

      -- 3+ cancellations = 7 day suspension
      IF cancel_count >= 3 THEN
        UPDATE public.vc_host_profiles SET
          status = 'suspended',
          suspension_until = NOW() + INTERVAL '7 days',
          cancellation_count = 0
        WHERE id = host_profile_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vc_session_cancellation AFTER UPDATE ON public.vc_sessions
  FOR EACH ROW EXECUTE FUNCTION public.vc_check_host_cancellation();

-- ============================================================
-- DEFAULT SCHEDULE CONFIG (sample data)
-- ============================================================
INSERT INTO public.vc_schedule_config (day_of_week, start_time, end_time, duration_minutes, price_usd, max_slots, is_active)
VALUES
  (3, '10:00', '10:30', 30, 5.00, 10, true),  -- Wed 10:00
  (3, '10:30', '11:00', 30, 5.00, 10, true),  -- Wed 10:30
  (3, '11:00', '11:30', 30, 5.00, 10, true),  -- Wed 11:00
  (3, '11:30', '12:00', 30, 5.00, 10, true),  -- Wed 11:30
  (5, '14:00', '14:30', 30, 5.00, 10, true),  -- Fri 14:00
  (5, '14:30', '15:00', 30, 5.00, 10, true),  -- Fri 14:30
  (5, '15:00', '15:30', 30, 5.00, 10, true),  -- Fri 15:00
  (6, '10:00', '10:30', 30, 5.00, 10, true),  -- Sat 10:00
  (6, '10:30', '11:00', 30, 5.00, 10, true),  -- Sat 10:30
  (6, '11:00', '11:30', 30, 5.00, 10, true)   -- Sat 11:00
ON CONFLICT DO NOTHING;
