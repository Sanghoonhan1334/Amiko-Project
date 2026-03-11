-- ============================================================
-- FIX: Restrict dangerous RLS policies on vc_paypal_orders and vc_bookings
-- Date: 2026-03-11
-- 
-- DB-3: vc_paypal_orders UPDATE policy allows users to modify their own
--        payment records (status, amount, etc.) — FRAUD RISK.
--        Solution: DROP the user-level UPDATE policy. All payment updates
--        must go through service role (webhook/API handler).
--
-- DB-4: vc_bookings UPDATE policy allows users to change their own
--        payment_status to 'paid' without actually paying.
--        Solution: Replace the broad UPDATE policy with one that only
--        allows updating non-financial fields (status = 'cancelled').
-- ============================================================

-- DB-3: Remove user-level UPDATE on vc_paypal_orders entirely.
-- Payment records must only be modified by server (service_role).
DROP POLICY IF EXISTS "vc_paypal_orders_update" ON public.vc_paypal_orders;

-- DB-4: Replace broad vc_bookings UPDATE with restrictive version.
-- Users can only cancel their own bookings (set status to 'cancelled'),
-- not change payment_status or any financial fields.
DROP POLICY IF EXISTS "vc_bookings_update" ON public.vc_bookings;

-- Allow users to cancel their own bookings only.
-- The USING clause restricts which rows can be targeted (own bookings that aren't already cancelled).
-- The WITH CHECK clause ensures the only allowed status change is to 'cancelled'.
CREATE POLICY "vc_bookings_update" ON public.vc_bookings
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status NOT IN ('cancelled', 'refunded')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled'
  );

-- Also add a CHECK constraint on duration_minutes to prevent invalid values (DB-2 from audit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vc_sessions_duration_positive'
  ) THEN
    ALTER TABLE public.vc_sessions
      ADD CONSTRAINT vc_sessions_duration_positive
      CHECK (duration_minutes BETWEEN 15 AND 180);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vc_schedule_config_duration_positive'
  ) THEN
    ALTER TABLE public.vc_schedule_config
      ADD CONSTRAINT vc_schedule_config_duration_positive
      CHECK (duration_minutes > 0);
  END IF;
END $$;
