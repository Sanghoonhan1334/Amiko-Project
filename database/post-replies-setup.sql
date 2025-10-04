-- 대댓글 기능을 위한 추가 SQL

-- 대댓글 조회를 위한 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW post_comments_with_replies AS
SELECT 
  c.id,
  c.post_id,
  c.user_id,
  c.content,
  c.parent_id,
  c.like_count,
  c.dislike_count,
  c.is_deleted,
  c.created_at,
  c.updated_at,
  u.full_name as user_name,
  u.avatar_url as user_avatar,
  CASE 
    WHEN c.parent_id IS NULL THEN 'comment'
    ELSE 'reply'
  END as comment_type,
  CASE 
    WHEN c.parent_id IS NULL THEN 0
    ELSE 1
  END as is_reply
FROM post_comments c
JOIN users u ON c.user_id = u.id
WHERE c.is_deleted = FALSE;

-- 대댓글 개수 조회를 위한 함수
CREATE OR REPLACE FUNCTION get_reply_count(comment_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM post_comments
    WHERE parent_id = comment_id
    AND is_deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- 댓글과 대댓글을 함께 조회하는 함수
CREATE OR REPLACE FUNCTION get_comments_with_replies(post_uuid UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  user_id UUID,
  content TEXT,
  parent_id UUID,
  like_count INTEGER,
  dislike_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_avatar TEXT,
  comment_type TEXT,
  reply_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.content,
    c.parent_id,
    c.like_count,
    c.dislike_count,
    c.created_at,
    u.full_name,
    u.avatar_url,
    CASE 
      WHEN c.parent_id IS NULL THEN 'comment'
      ELSE 'reply'
    END,
    CASE 
      WHEN c.parent_id IS NULL THEN get_reply_count(c.id)
      ELSE 0
    END
  FROM post_comments c
  JOIN users u ON c.user_id = u.id
  WHERE c.post_id = post_uuid
  AND c.is_deleted = FALSE
  ORDER BY 
    CASE WHEN c.parent_id IS NULL THEN c.created_at END ASC,
    CASE WHEN c.parent_id IS NOT NULL THEN c.created_at END ASC;
END;
$$ LANGUAGE plpgsql;

-- 대댓글 권한 정책 추가
CREATE POLICY "Users can reply to comments" ON post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (parent_id IS NULL OR EXISTS (
      SELECT 1 FROM post_comments pc 
      WHERE pc.id = parent_id AND pc.is_deleted = FALSE
    ))
  );

-- 대댓글 조회 권한 정책
CREATE POLICY "Anyone can view replies" ON post_comments
  FOR SELECT USING (
    NOT is_deleted AND (
      parent_id IS NULL OR EXISTS (
        SELECT 1 FROM post_comments pc 
        WHERE pc.id = parent_id AND pc.is_deleted = FALSE
      )
    )
  );
