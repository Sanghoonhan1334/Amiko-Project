-- =====================================================
-- Events 테이블에 zoom_link와 week_number 필드 추가
-- Description: 2주차는 Zoom, 4주차는 Zep 구분을 위한 필드 추가
-- Date: 2025-12-11
-- =====================================================

-- zoom_link 필드 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'zoom_link'
    ) THEN
        ALTER TABLE public.events ADD COLUMN zoom_link TEXT;
        RAISE NOTICE 'zoom_link 필드가 추가되었습니다.';
    ELSE
        RAISE NOTICE 'zoom_link 필드가 이미 존재합니다.';
    END IF;
END $$;

-- week_number 필드 추가 (2주차 또는 4주차)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'week_number'
    ) THEN
        ALTER TABLE public.events ADD COLUMN week_number INTEGER CHECK (week_number IN (2, 4));
        RAISE NOTICE 'week_number 필드가 추가되었습니다.';
    ELSE
        RAISE NOTICE 'week_number 필드가 이미 존재합니다.';
    END IF;
END $$;

-- platform 필드 추가 (zoom 또는 zep)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'platform'
    ) THEN
        ALTER TABLE public.events ADD COLUMN platform TEXT CHECK (platform IN ('zoom', 'zep'));
        RAISE NOTICE 'platform 필드가 추가되었습니다.';
    ELSE
        RAISE NOTICE 'platform 필드가 이미 존재합니다.';
    END IF;
END $$;

-- 기존 ZEP 이벤트에 platform='zep' 설정
UPDATE public.events 
SET platform = 'zep' 
WHERE type = 'zep' AND (platform IS NULL OR platform = '');

-- 주석 추가
COMMENT ON COLUMN public.events.zoom_link IS 'Zoom 미팅 링크 (2주차 모임용)';
COMMENT ON COLUMN public.events.zep_link IS 'ZEP 링크 (4주차 모임용)';
COMMENT ON COLUMN public.events.week_number IS '주차 번호 (2주차 또는 4주차)';
COMMENT ON COLUMN public.events.platform IS '플랫폼 타입 (zoom 또는 zep)';
