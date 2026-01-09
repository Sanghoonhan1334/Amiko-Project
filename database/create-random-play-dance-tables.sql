-- Random Play Dance 시스템 테이블 생성
-- 플레이리스트 관리 및 댄스 비디오 업로드 기능

-- 1. 플레이리스트 테이블 (관리자가 관리)
CREATE TABLE IF NOT EXISTS public.dance_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE, -- 주차 번호
  week_label TEXT NOT NULL, -- "Semana 1 de enero" 같은 라벨
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. 플레이리스트 노래 테이블
CREATE TABLE IF NOT EXISTS public.dance_playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.dance_playlists(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL, -- "Supernova"
  artist_name TEXT NOT NULL, -- "aespa"
  youtube_video_id TEXT, -- YouTube 영상 ID (임베드용)
  display_order INTEGER NOT NULL DEFAULT 0, -- 순서
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 댄스 비디오 업로드 테이블 (사용자가 업로드)
CREATE TABLE IF NOT EXISTS public.dance_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES public.dance_playlists(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL, -- Supabase Storage URL 또는 YouTube URL
  thumbnail_url TEXT, -- 썸네일 이미지 URL
  title TEXT, -- 사용자가 입력한 제목 (선택)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dance_playlists_week ON public.dance_playlists(week_number);
CREATE INDEX IF NOT EXISTS idx_dance_playlist_songs_playlist ON public.dance_playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_dance_playlist_songs_order ON public.dance_playlist_songs(playlist_id, display_order);
CREATE INDEX IF NOT EXISTS idx_dance_videos_user ON public.dance_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_dance_videos_playlist ON public.dance_videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_dance_videos_status ON public.dance_videos(status);
CREATE INDEX IF NOT EXISTS idx_dance_videos_created ON public.dance_videos(created_at DESC);

-- 5. RLS 정책 활성화
ALTER TABLE public.dance_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_videos ENABLE ROW LEVEL SECURITY;

-- 플레이리스트: 모든 사용자 읽기 가능, 관리자만 수정
DROP POLICY IF EXISTS "Anyone can view playlists" ON public.dance_playlists;
CREATE POLICY "Anyone can view playlists"
  ON public.dance_playlists FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage playlists" ON public.dance_playlists;
CREATE POLICY "Only admins can manage playlists"
  ON public.dance_playlists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 플레이리스트 노래: 모든 사용자 읽기 가능, 관리자만 수정
DROP POLICY IF EXISTS "Anyone can view playlist songs" ON public.dance_playlist_songs;
CREATE POLICY "Anyone can view playlist songs"
  ON public.dance_playlist_songs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage playlist songs" ON public.dance_playlist_songs;
CREATE POLICY "Only admins can manage playlist songs"
  ON public.dance_playlist_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 댄스 비디오: 승인된 비디오는 모든 사용자 읽기 가능, 본인만 업로드/수정
DROP POLICY IF EXISTS "Anyone can view approved dance videos" ON public.dance_videos;
CREATE POLICY "Anyone can view approved dance videos"
  ON public.dance_videos FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can upload their own videos" ON public.dance_videos;
CREATE POLICY "Users can upload their own videos"
  ON public.dance_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own videos" ON public.dance_videos;
CREATE POLICY "Users can update their own videos"
  ON public.dance_videos FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own videos" ON public.dance_videos;
CREATE POLICY "Users can delete their own videos"
  ON public.dance_videos FOR DELETE
  USING (auth.uid() = user_id);

-- 관리자는 모든 비디오 관리 가능
DROP POLICY IF EXISTS "Admins can manage all videos" ON public.dance_videos;
CREATE POLICY "Admins can manage all videos"
  ON public.dance_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 6. updated_at 자동 업데이트 트리거 함수 (이미 존재하면 스킵)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_dance_playlists_updated_at ON public.dance_playlists;
CREATE TRIGGER update_dance_playlists_updated_at
  BEFORE UPDATE ON public.dance_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dance_playlist_songs_updated_at ON public.dance_playlist_songs;
CREATE TRIGGER update_dance_playlist_songs_updated_at
  BEFORE UPDATE ON public.dance_playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dance_videos_updated_at ON public.dance_videos;
CREATE TRIGGER update_dance_videos_updated_at
  BEFORE UPDATE ON public.dance_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

