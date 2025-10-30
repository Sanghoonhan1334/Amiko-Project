-- 레벨 변동·배지 노출 등 성장 지표/이벤트 로깅 테이블
CREATE TABLE IF NOT EXISTS public.level_event_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('level_up', 'level_down', 'badge_shown')),
  old_level TEXT,
  new_level TEXT,
  old_points INTEGER,
  new_points INTEGER,
  source_page TEXT, -- 예: mypage, community, quiz, etc
  extra JSONB, -- 필요 시 확장
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
