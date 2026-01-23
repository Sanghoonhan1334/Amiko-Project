-- 댄스 비디오 목업 데이터 삽입
-- 사용자 이메일: hsanghoon133334@gmail.com

-- 1. 플레이리스트가 없으면 먼저 생성
INSERT INTO public.dance_playlists (week_number, week_label, created_at)
VALUES 
  (1, 'Semana 1 de Enero', NOW())
ON CONFLICT (week_number) DO NOTHING;

-- 2. 플레이리스트 ID 가져오기 및 목업 데이터 삽입
DO $$
DECLARE
  playlist_id_var UUID;
  admin_user_id_var UUID;
  test_user_id_var UUID;
BEGIN
  -- 플레이리스트 ID 가져오기
  SELECT id INTO playlist_id_var
  FROM public.dance_playlists
  WHERE week_number = 1
  LIMIT 1;

  -- 운영자 사용자 ID 가져오기 (가이드 영상용)
  SELECT user_id INTO admin_user_id_var
  FROM public.admin_users
  WHERE is_active = true
  LIMIT 1;

  -- 테스트 사용자 ID 가져오기 (이메일로)
  SELECT id INTO test_user_id_var
  FROM auth.users
  WHERE email = 'hsanghoon133334@gmail.com'
  LIMIT 1;

  -- 가이드 영상 (운영자가 업로드)
  IF admin_user_id_var IS NOT NULL THEN
    INSERT INTO public.dance_videos (
      user_id,
      playlist_id,
      video_url,
      thumbnail_url,
      title,
      status,
      like_count,
      comment_count,
      view_count,
      created_at
    ) VALUES (
      admin_user_id_var,
      playlist_id_var,
      'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Guide+Video', -- placeholder 비디오 URL
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop', -- 가이드 댄스 썸네일
      'Video guía - K-POP Random Play Dance',
      'approved',
      15,
      3,
      120,
      NOW() - INTERVAL '2 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- 일반 사용자 영상들 (목업) - 테스트 사용자 ID 사용
  IF test_user_id_var IS NOT NULL THEN
    INSERT INTO public.dance_videos (
      user_id,
      playlist_id,
      video_url,
      thumbnail_url,
      title,
      status,
      like_count,
      comment_count,
      view_count,
      created_at
    ) VALUES 
      -- 영상 1
      (
        test_user_id_var,
        playlist_id_var,
        'https://via.placeholder.com/400x400/EC4899/FFFFFF?text=Dance+1',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop',
        'My K-POP Dance Cover',
        'approved',
        8,
        2,
        45,
        NOW() - INTERVAL '1 day'
      ),
      -- 영상 2
      (
        test_user_id_var,
        playlist_id_var,
        'https://via.placeholder.com/400x400/F43F5E/FFFFFF?text=Dance+2',
        'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=600&fit=crop',
        'Random Play Dance Challenge',
        'approved',
        12,
        4,
        67,
        NOW() - INTERVAL '18 hours'
      ),
      -- 영상 3
      (
        test_user_id_var,
        playlist_id_var,
        'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Dance+3',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=600&fit=crop',
        'K-POP Dance Practice',
        'approved',
        5,
        1,
        23,
        NOW() - INTERVAL '12 hours'
      ),
      -- 영상 4
      (
        test_user_id_var,
        playlist_id_var,
        'https://via.placeholder.com/400x400/6366F1/FFFFFF?text=Dance+4',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop',
        'Dance Cover Video',
        'approved',
        20,
        6,
        89,
        NOW() - INTERVAL '6 hours'
      ),
      -- 영상 5
      (
        test_user_id_var,
        playlist_id_var,
        'https://via.placeholder.com/400x400/A855F7/FFFFFF?text=Dance+5',
        'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=600&fit=crop',
        'My Dance Performance',
        'approved',
        3,
        0,
        15,
        NOW() - INTERVAL '3 hours'
      ),
      -- 영상 6
      (
        test_user_id_var,
        playlist_id_var,
        'https://via.placeholder.com/400x400/9333EA/FFFFFF?text=Dance+6',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
        'K-POP Random Dance',
        'approved',
        10,
        3,
        56,
        NOW() - INTERVAL '1 hour'
      )
    ON CONFLICT DO NOTHING;
  ELSE
    RAISE NOTICE '테스트 사용자를 찾을 수 없습니다. 이메일: hsanghoon133334@gmail.com';
  END IF;

  RAISE NOTICE '목업 데이터 삽입 완료. 플레이리스트 ID: %, 운영자 ID: %, 테스트 사용자 ID: %', 
    playlist_id_var, admin_user_id_var, test_user_id_var;
END $$;

-- 3. 확인 쿼리
SELECT 
  dv.id,
  dv.title,
  dv.status,
  dv.like_count,
  dv.comment_count,
  dv.view_count,
  u.email as user_email,
  up.display_name as user_display_name,
  up.avatar_url as user_avatar_url
FROM public.dance_videos dv
LEFT JOIN auth.users u ON dv.user_id = u.id
LEFT JOIN public.user_profiles up ON dv.user_id = up.user_id
WHERE dv.status = 'approved'
ORDER BY dv.created_at DESC;

