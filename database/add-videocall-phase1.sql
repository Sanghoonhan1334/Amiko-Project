-- ============================================================
-- AMIKO VIDEO CALL — PHASE 1 MIGRATION
-- PayPal orders, RTC access logs, presence, timezone support
-- ============================================================

-- 1. Add timezone column to schedule config
ALTER TABLE public.vc_schedule_config
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Seoul';

-- 2. PayPal orders tracking (per-session payments)
CREATE TABLE IF NOT EXISTS public.vc_paypal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.vc_bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_order_id TEXT NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'approved', 'captured', 'failed', 'refunded', 'cancelled'
  )),
  paypal_capture_id TEXT,
  paypal_payer_id TEXT,
  paypal_payer_email TEXT,
  paypal_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vc_paypal_orders_session ON public.vc_paypal_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_paypal_orders_user ON public.vc_paypal_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_paypal_orders_paypal ON public.vc_paypal_orders(paypal_order_id);

-- 3. RTC access logs (presence + access audit)
CREATE TABLE IF NOT EXISTS public.vc_rtc_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vc_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('join', 'leave', 'token_issued', 'token_denied')),
  agora_uid INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  reason TEXT,  -- denial reason if action = token_denied
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vc_rtc_access_logs_session ON public.vc_rtc_access_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_vc_rtc_access_logs_user ON public.vc_rtc_access_logs(user_id);

-- ============================================================
-- RLS for new tables
-- ============================================================
ALTER TABLE public.vc_paypal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vc_rtc_access_logs ENABLE ROW LEVEL SECURITY;

-- PayPal orders: user sees own, host sees session orders
CREATE POLICY "vc_paypal_orders_select" ON public.vc_paypal_orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.vc_sessions s
    JOIN public.vc_host_profiles h ON s.host_id = h.id
    WHERE s.id = session_id AND h.user_id = auth.uid()
  )
);
CREATE POLICY "vc_paypal_orders_insert" ON public.vc_paypal_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vc_paypal_orders_update" ON public.vc_paypal_orders FOR UPDATE USING (auth.uid() = user_id);

-- RTC access logs: admin only read (via service role), user can insert own
CREATE POLICY "vc_rtc_access_logs_insert" ON public.vc_rtc_access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vc_rtc_access_logs_select" ON public.vc_rtc_access_logs FOR SELECT USING (auth.uid() = user_id);

-- Trigger for updated_at on paypal_orders
CREATE TRIGGER vc_paypal_orders_updated BEFORE UPDATE ON public.vc_paypal_orders
  FOR EACH ROW EXECUTE FUNCTION public.vc_update_timestamp();
