const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://abrxigfmuebrnyzkfcyr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicnhpZ2ZtdWVicm55emtmY3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI1NTc1NSwiZXhwIjoyMDcyODMxNzU1fQ.q2N2pgB87TEXVBnrBZmSb-yQMMEmMo8iohlaXwQVucY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createStoriesTable() {
  try {
    console.log('스토리 테이블 생성 시작...')
    
    // 스토리 테이블 생성
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS stories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          text_content TEXT NOT NULL,
          is_public BOOLEAN DEFAULT true,
          is_expired BOOLEAN DEFAULT false,
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (error) {
      console.error('테이블 생성 실패:', error)
      return
    }
    
    console.log('스토리 테이블 생성 성공!')
    
    // 인덱스 생성
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
        CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_stories_is_public ON stories(is_public);
        CREATE INDEX IF NOT EXISTS idx_stories_is_expired ON stories(is_expired);
      `
    })
    
    if (indexError) {
      console.error('인덱스 생성 실패:', indexError)
    } else {
      console.log('인덱스 생성 성공!')
    }
    
    // RLS 정책 설정
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own stories" ON stories
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can view public stories" ON stories
          FOR SELECT USING (is_public = true AND is_expired = false);
        
        CREATE POLICY "Users can create their own stories" ON stories
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own stories" ON stories
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own stories" ON stories
          FOR DELETE USING (auth.uid() = user_id);
      `
    })
    
    if (rlsError) {
      console.error('RLS 정책 설정 실패:', rlsError)
    } else {
      console.log('RLS 정책 설정 성공!')
    }
    
    // 트리거 생성
    const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_stories_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_stories_updated_at
          BEFORE UPDATE ON stories
          FOR EACH ROW
          EXECUTE FUNCTION update_stories_updated_at();
      `
    })
    
    if (triggerError) {
      console.error('트리거 생성 실패:', triggerError)
    } else {
      console.log('트리거 생성 성공!')
    }
    
    console.log('✅ 스토리 테이블 생성 완료!')
    
  } catch (error) {
    console.error('스크립트 실행 중 오류:', error)
  }
}

// 스크립트 실행
createStoriesTable()
