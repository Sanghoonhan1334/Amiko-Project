const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://abrxigfmuebrnyzkfcyr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicnhpZ2ZtdWVicm55emtmY3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI1NTc1NSwiZXhwIjoyMDcyODMxNzU1fQ.q2N2pgB87TEXVBnrBZmSb-yQMMEmMo8iohlaXwQVucY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function movePostsToFreeboard() {
  try {
    console.log('🔍 freeboard 갤러리 ID 확인...')
    
    // freeboard 갤러리 ID 가져오기
    const { data: freeboardGallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id')
      .eq('slug', 'freeboard')
      .single()
    
    if (galleryError || !freeboardGallery) {
      console.error('❌ freeboard 갤러리를 찾을 수 없습니다:', galleryError)
      return
    }
    
    console.log('✅ freeboard 갤러리 ID:', freeboardGallery.id)
    
    // 기존 게시물들을 freeboard 갤러리로 이동
    console.log('🔄 기존 게시물들을 freeboard 갤러리로 이동 중...')
    
    const { data: updatedPosts, error: updateError } = await supabase
      .from('gallery_posts')
      .update({ 
        gallery_id: freeboardGallery.id,
        category: '자유게시판'
      })
      .neq('gallery_id', freeboardGallery.id) // freeboard가 아닌 다른 갤러리의 게시물들
      .select()
    
    if (updateError) {
      console.error('❌ 게시물 이동 실패:', updateError)
      return
    }
    
    console.log('✅ 게시물 이동 완료!')
    console.log('이동된 게시물 수:', updatedPosts?.length || 0)
    
    // 이동된 게시물들 확인
    if (updatedPosts && updatedPosts.length > 0) {
      console.log('이동된 게시물들:')
      updatedPosts.forEach(post => {
        console.log(`- ${post.title} (ID: ${post.id})`)
      })
    }
    
    // freeboard 갤러리의 게시물 수 확인
    const { data: freeboardPosts, error: countError } = await supabase
      .from('gallery_posts')
      .select('id, title, view_count, like_count, comment_count')
      .eq('gallery_id', freeboardGallery.id)
      .eq('is_deleted', false)
      .order('view_count', { ascending: false })
    
    if (countError) {
      console.error('❌ freeboard 게시물 조회 실패:', countError)
      return
    }
    
    console.log('✅ freeboard 갤러리 게시물 현황:')
    console.log('총 게시물 수:', freeboardPosts?.length || 0)
    
    if (freeboardPosts && freeboardPosts.length > 0) {
      console.log('조회수 높은 게시물 TOP 3:')
      freeboardPosts.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`)
        console.log(`   조회수: ${post.view_count}, 좋아요: ${post.like_count}, 댓글: ${post.comment_count}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 게시물 이동 작업 시작...')
    
    await movePostsToFreeboard()
    
    console.log('✅ 모든 작업 완료!')
    
  } catch (error) {
    console.error('❌ 메인 함수 오류:', error)
    process.exit(1)
  }
}

main()
