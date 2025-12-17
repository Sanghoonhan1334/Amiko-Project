-- ============================================
-- 푸시 구독 테이블 생성 및 gallery_posts 외래키 수정
-- ============================================

-- 1. push_subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 사용자별 엔드포인트는 유일해야 함
  UNIQUE(user_id, endpoint)
);

-- 푸시 구독 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- RLS 활성화
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (기존 정책이 있으면 제거 후 재생성)
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. gallery_posts 외래키 확인 및 수정
-- ============================================

-- 외래키 제약 조건 확인 및 수정
DO $$
DECLARE
    table_exists BOOLEAN;
    fk_name TEXT;
    fk_table TEXT;
    fk_exists BOOLEAN;
BEGIN
    -- gallery_posts 테이블 존재 여부 확인
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'gallery_posts'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'gallery_posts 테이블이 존재하지 않습니다. 외래키 수정을 건너뜁니다.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'gallery_posts 테이블 발견. 외래키 확인 중...';
    
    -- gallery_posts_user_id_fkey가 이미 존재하는지 확인
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.gallery_posts'::regclass
        AND conname = 'gallery_posts_user_id_fkey'
    ) INTO fk_exists;
    
    -- 기존 user_id 관련 외래키 확인
    SELECT conname, confrelid::regclass::text
    INTO fk_name, fk_table
    FROM pg_constraint
    WHERE conrelid = 'public.gallery_posts'::regclass
      AND conname LIKE '%user_id%'
      AND contype = 'f'
    LIMIT 1;
    
    IF fk_name IS NOT NULL THEN
        RAISE NOTICE '현재 외래키 발견: % -> %', fk_name, fk_table;
        
        -- public.users를 참조하고 있다면 auth.users로 변경
        IF fk_table = 'public.users' THEN
            RAISE NOTICE '외래키를 auth.users로 변경합니다...';
            
            -- 기존 외래키 제거
            EXECUTE format('ALTER TABLE public.gallery_posts DROP CONSTRAINT IF EXISTS %I', fk_name);
            
            -- auth.users를 참조하는 새 외래키 생성
            ALTER TABLE public.gallery_posts
            ADD CONSTRAINT gallery_posts_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
            RAISE NOTICE '외래키 변경 완료: gallery_posts.user_id -> auth.users.id';
        ELSIF fk_table = 'auth.users' THEN
            RAISE NOTICE '외래키가 이미 auth.users를 참조하고 있습니다.';
        END IF;
    ELSE
        -- 외래키가 없으면 생성
        IF NOT fk_exists THEN
            RAISE NOTICE '외래키가 없습니다. 생성합니다...';
            BEGIN
                ALTER TABLE public.gallery_posts
                ADD CONSTRAINT gallery_posts_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                
                RAISE NOTICE '외래키 생성 완료: gallery_posts.user_id -> auth.users.id';
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE '외래키가 이미 존재합니다.';
            END;
        ELSE
            RAISE NOTICE '외래키가 이미 존재합니다.';
        END IF;
    END IF;
    
    -- 인덱스 확인 및 생성
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_gallery_posts_user_id ON public.gallery_posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_gallery_posts_gallery_id ON public.gallery_posts(gallery_id);
        RAISE NOTICE '인덱스 생성 완료';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '인덱스 생성 중 오류 (이미 존재할 수 있음): %', SQLERRM;
    END;
END $$;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ push_subscriptions 테이블 생성 완료';
    RAISE NOTICE '✅ gallery_posts 외래키 수정 완료';
END $$;
