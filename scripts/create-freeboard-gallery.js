const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://abrxigfmuebrnyzkfcyr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicnhpZ2ZtdWVicm55emtmY3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI1NTc1NSwiZXhwIjoyMDcyODMxNzU1fQ.q2N2pgB87TEXVBnrBZmSb-yQMMEmMo8iohlaXwQVucY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFreeboardGallery() {
  try {
    console.log('🔍 freeboard 갤러리 존재 여부 확인...')
    
    // 먼저 freeboard 갤러리가 존재하는지 확인
    const { data: existingGallery, error: checkError } = await supabase
      .from('galleries')
      .select('id, slug, name_ko')
      .eq('slug', 'freeboard')
      .single()
    
    if (existingGallery && !checkError) {
      console.log('✅ freeboard 갤러리가 이미 존재합니다!')
      console.log('갤러리 정보:', existingGallery)
      return existingGallery
    }
    
    console.log('❌ freeboard 갤러리가 존재하지 않습니다. 생성 중...')
    
    // freeboard 갤러리 생성
    const { data: newGallery, error: createError } = await supabase
      .from('galleries')
      .insert({
        slug: 'freeboard',
        name_ko: '자유게시판',
        name_es: 'Foro Libre',
        description_ko: '자유롭게 이야기하는 공간',
        description_es: 'Espacio para hablar libremente',
        icon: '💬',
        color: '#98D8C8',
        sort_order: 0,
        is_active: true
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ 갤러리 생성 실패:', createError)
      throw createError
    }
    
    console.log('✅ freeboard 갤러리 생성 완료!')
    console.log('생성된 갤러리 정보:', newGallery)
    
    return newGallery
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    throw error
  }
}

async function checkGalleryPosts() {
  try {
    console.log('🔍 gallery_posts 테이블 확인...')
    
    const { data: posts, error } = await supabase
      .from('gallery_posts')
      .select('id, title, gallery_id, created_at')
      .limit(5)
    
    if (error) {
      console.error('❌ gallery_posts 테이블 확인 실패:', error)
      return
    }
    
    console.log('✅ gallery_posts 테이블 접근 성공')
    console.log('최근 게시물 수:', posts?.length || 0)
    
    if (posts && posts.length > 0) {
      console.log('최근 게시물들:')
      posts.forEach(post => {
        console.log(`- ${post.title} (ID: ${post.id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ gallery_posts 확인 중 오류:', error)
  }
}

async function main() {
  try {
    console.log('🚀 freeboard 갤러리 설정 시작...')
    
    await createFreeboardGallery()
    await checkGalleryPosts()
    
    console.log('✅ 모든 작업 완료!')
    
  } catch (error) {
    console.error('❌ 메인 함수 오류:', error)
    process.exit(1)
  }
}

main()
