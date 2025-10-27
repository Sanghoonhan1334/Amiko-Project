-- 기존 게시물의 author_name을 user_profiles의 display_name으로 업데이트

UPDATE idol_memes im
SET author_name = COALESCE(
  (
    SELECT split_part(up.display_name, '#', 1)
    FROM user_profiles up
    WHERE up.user_id = im.author_id
    LIMIT 1
  ),
  im.author_name
)
WHERE im.author_id IS NOT NULL;

