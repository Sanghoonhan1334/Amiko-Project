const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://abrxigfmuebrnyzkfcyr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicnhpZ2ZtdWVicm55emtmY3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI1NTc1NSwiZXhwIjoyMDcyODMxNzU1fQ.q2N2pgB87TEXVBnrBZmSb-yQMMEmMo8iohlaXwQVucY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSimpleStoriesTable() {
  try {
    console.log('간단한 스토리 테이블 생성 시도...')
    
    // 먼저 테이블이 존재하는지 확인
    const { data: checkData, error: checkError } = await supabase
      .from('stories')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ 스토리 테이블이 이미 존재합니다!')
      return
    }
    
    console.log('테이블이 존재하지 않습니다. 생성이 필요합니다.')
    console.log('다음 단계를 따라주세요:')
    console.log('')
    console.log('1. https://supabase.com/dashboard 접속')
    console.log('2. 프로젝트 abrxigfmuebrnyzkfcyr 선택')
    console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭')
    console.log('4. 다음 SQL을 복사해서 실행:')
    console.log('')
    console.log('CREATE TABLE stories (')
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,')
    console.log('  image_url TEXT NOT NULL,')
    console.log('  text_content TEXT NOT NULL,')
    console.log('  is_public BOOLEAN DEFAULT true,')
    console.log('  is_expired BOOLEAN DEFAULT false,')
    console.log('  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL \'24 hours\'),')
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),')
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
    console.log(');')
    console.log('')
    console.log('5. 실행 후 이 스크립트를 다시 실행하세요.')
    
  } catch (error) {
    console.error('스크립트 실행 중 오류:', error)
  }
}

// 스크립트 실행
createSimpleStoriesTable()
