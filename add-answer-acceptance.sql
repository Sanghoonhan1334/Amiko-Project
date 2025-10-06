-- post_comments 테이블에 채택 관련 컬럼 추가
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS is_accepted boolean DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone;

-- gallery_posts 테이블에 채택된 답변 ID 저장
ALTER TABLE gallery_posts
ADD COLUMN IF NOT EXISTS accepted_answer_id uuid REFERENCES post_comments(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_post_comments_is_accepted ON post_comments (is_accepted) WHERE is_accepted = TRUE;
CREATE INDEX IF NOT EXISTS idx_gallery_posts_accepted_answer ON gallery_posts (accepted_answer_id);

-- 답변 채택 함수 생성
CREATE OR REPLACE FUNCTION accept_answer(
  p_post_id uuid,
  p_comment_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_post_user_id uuid;
  v_old_accepted_id uuid;
  v_result json;
BEGIN
  -- 질문의 작성자 확인
  SELECT user_id, accepted_answer_id INTO v_post_user_id, v_old_accepted_id
  FROM gallery_posts
  WHERE id = p_post_id;

  -- 질문 작성자만 채택 가능
  IF v_post_user_id != p_user_id THEN
    RAISE EXCEPTION '질문 작성자만 답변을 채택할 수 있습니다.';
  END IF;

  -- 이전 채택 취소
  IF v_old_accepted_id IS NOT NULL THEN
    UPDATE post_comments
    SET is_accepted = FALSE, accepted_at = NULL
    WHERE id = v_old_accepted_id;
  END IF;

  -- 새 답변 채택
  UPDATE post_comments
  SET is_accepted = TRUE, accepted_at = NOW()
  WHERE id = p_comment_id AND post_id = p_post_id;

  -- 질문에 채택된 답변 ID 저장
  UPDATE gallery_posts
  SET accepted_answer_id = p_comment_id
  WHERE id = p_post_id;

  v_result := json_build_object(
    'success', TRUE,
    'old_accepted_id', v_old_accepted_id,
    'new_accepted_id', p_comment_id
  );

  RETURN v_result;
END;
$$;

-- 채택 취소 함수
CREATE OR REPLACE FUNCTION unaccept_answer(
  p_post_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_post_user_id uuid;
  v_accepted_id uuid;
  v_result json;
BEGIN
  -- 질문의 작성자 확인
  SELECT user_id, accepted_answer_id INTO v_post_user_id, v_accepted_id
  FROM gallery_posts
  WHERE id = p_post_id;

  -- 질문 작성자만 채택 취소 가능
  IF v_post_user_id != p_user_id THEN
    RAISE EXCEPTION '질문 작성자만 답변 채택을 취소할 수 있습니다.';
  END IF;

  -- 채택 취소
  IF v_accepted_id IS NOT NULL THEN
    UPDATE post_comments
    SET is_accepted = FALSE, accepted_at = NULL
    WHERE id = v_accepted_id;

    UPDATE gallery_posts
    SET accepted_answer_id = NULL
    WHERE id = p_post_id;
  END IF;

  v_result := json_build_object(
    'success', TRUE,
    'unaccepted_id', v_accepted_id
  );

  RETURN v_result;
END;
$$;

-- 테이블 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'post_comments' 
  AND column_name IN ('is_accepted', 'accepted_at')
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'gallery_posts' 
  AND column_name = 'accepted_answer_id'
ORDER BY ordinal_position;

