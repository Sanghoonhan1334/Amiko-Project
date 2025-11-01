-- 아이돌 사진 댓글 답글 기능 추가
-- Add Reply Feature to Idol Photos Comments
-- 생성일: 2025-11-01

-- ============================================
-- 1. idol_memes_comments 테이블에 parent_comment_id 컬럼 추가
--    Add parent_comment_id column to idol_memes_comments table
-- ============================================

ALTER TABLE idol_memes_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES idol_memes_comments(id) ON DELETE CASCADE;

-- ============================================
-- 2. parent_comment_id 인덱스 생성
--    Create index for parent_comment_id
-- ============================================

CREATE INDEX IF NOT EXISTS idx_idol_memes_comments_parent_id 
ON idol_memes_comments(parent_comment_id);

-- ============================================
-- 3. 중첩 답글 방지 체크 함수
--    Prevent nested replies beyond 1 level
-- ============================================

CREATE OR REPLACE FUNCTION check_idol_memes_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
  -- 이미 답글인 댓글에는 답글을 달 수 없도록 제한 (1레벨만 허용)
  -- Prevent replies to replies (only allow 1 level)
  IF NEW.parent_comment_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM idol_memes_comments 
      WHERE id = NEW.parent_comment_id 
      AND parent_comment_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Please reply to the original comment.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS check_idol_memes_comment_depth_trigger ON idol_memes_comments;
CREATE TRIGGER check_idol_memes_comment_depth_trigger
  BEFORE INSERT ON idol_memes_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_idol_memes_comment_depth();

-- ============================================
-- 4. 스키마 캐시 새로고침
--    Refresh schema cache
-- ============================================

NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE idol_memes_comments IS 'Idol photos comments with reply support';

-- ============================================
-- 완료 / Completed
-- ============================================

-- 적용 확인 쿼리
-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'idol_memes_comments'
ORDER BY ordinal_position;

