import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('[UPDATE_CELEB_IMAGES] 연예인 이미지 URL 업데이트 시작');
    
    if (!supabaseClient) {
      console.log('[UPDATE_CELEB_IMAGES] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // 연예인 이미지 매핑 데이터
    const celebImageMappings = [
      // BTS 멤버들
      { stage_name: 'RM', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/rm.jpg' },
      { stage_name: 'Jin', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/jin.webp' },
      { stage_name: 'Suga', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/suga.jpg' },
      { stage_name: 'j-hope', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/jhope.png' },
      { stage_name: 'Jimin', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/jimin.png' },
      { stage_name: 'V', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/v.png' },
      { stage_name: 'Jungkook', group_name: 'BTS', image_url: '/quizzes/mbti-with-kpop-stars/celebs/jungkook.png' },
      
      // BLACKPINK 멤버들
      { stage_name: 'Jennie', group_name: 'BLACKPINK', image_url: '/quizzes/mbti-with-kpop-stars/celebs/jennie.png' },
      { stage_name: 'Lisa', group_name: 'BLACKPINK', image_url: '/quizzes/mbti-with-kpop-stars/celebs/lisa.png' },
      { stage_name: 'Jisoo', group_name: 'BLACKPINK', image_url: '/quizzes/mbti-with-kpop-stars/celebs/jisoo.png' },
      { stage_name: 'Rose', group_name: 'BLACKPINK', image_url: '/quizzes/mbti-with-kpop-stars/celebs/rose.png' },
      { stage_name: 'Rosé', group_name: 'BLACKPINK', image_url: '/quizzes/mbti-with-kpop-stars/celebs/rose.png' },
      
      // BIGBANG 멤버들
      { stage_name: 'G-Dragon', group_name: 'BIGBANG', image_url: '/quizzes/mbti-with-kpop-stars/celebs/gdragon.png' },
      { stage_name: 'TOP', group_name: 'BIGBANG', image_url: '/quizzes/mbti-with-kpop-stars/celebs/top.png' },
      
      // EXO 멤버들
      { stage_name: 'Kai', group_name: 'EXO', image_url: '/quizzes/mbti-with-kpop-stars/celebs/kai.png' },
      { stage_name: 'Baekhyun', group_name: 'EXO', image_url: '/quizzes/mbti-with-kpop-stars/celebs/baekhyun.png' },
      { stage_name: 'D.O.', group_name: 'EXO', image_url: '/quizzes/mbti-with-kpop-stars/celebs/dohyun.jpeg' },
      
      // Red Velvet 멤버들
      { stage_name: 'Irene', group_name: 'Red Velvet', image_url: '/quizzes/mbti-with-kpop-stars/celebs/irene.webp' },
      { stage_name: 'Seulgi', group_name: 'Red Velvet', image_url: '/quizzes/mbti-with-kpop-stars/celebs/seulgi.png' },
      { stage_name: 'Wendy', group_name: 'Red Velvet', image_url: '/quizzes/mbti-with-kpop-stars/celebs/wendy.png' },
      
      // SNSD 멤버들
      { stage_name: 'Taeyeon', group_name: 'SNSD', image_url: '/quizzes/mbti-with-kpop-stars/celebs/taeyeon.png' },
      { stage_name: 'Yoona', group_name: 'SNSD', image_url: '/quizzes/mbti-with-kpop-stars/celebs/yoona.png' },
      { stage_name: 'Sunny', group_name: 'SNSD', image_url: '/quizzes/mbti-with-kpop-stars/celebs/sunny.png' },
      
      // MAMAMOO 멤버들
      { stage_name: 'Solar', group_name: 'MAMAMOO', image_url: '/quizzes/mbti-with-kpop-stars/celebs/solar.png' },
      { stage_name: 'Hwasa', group_name: 'MAMAMOO', image_url: '/quizzes/mbti-with-kpop-stars/celebs/hwasa.png' },
      
      // 솔로 아티스트들
      { stage_name: 'IU', group_name: null, image_url: '/quizzes/mbti-with-kpop-stars/celebs/iu.png' },
      { stage_name: 'CL', group_name: null, image_url: '/quizzes/mbti-with-kpop-stars/celebs/cl.png' },
      { stage_name: 'Jay Park', group_name: null, image_url: '/quizzes/mbti-with-kpop-stars/celebs/jaypark.png' },
      { stage_name: 'Hyuna', group_name: null, image_url: '/quizzes/mbti-with-kpop-stars/celebs/hyuna.png' },
      { stage_name: 'Zico', group_name: null, image_url: '/quizzes/mbti-with-kpop-stars/celebs/zico.png' },
      { stage_name: 'Sunmi', group_name: null, image_url: '/quizzes/mbti-with-kpop-stars/celebs/sunmi.png' },
      { stage_name: 'Heechul', group_name: 'Super Junior', image_url: '/quizzes/mbti-with-kpop-stars/celebs/heechul.png' },
      
      // NCT 멤버들
      { stage_name: 'Mark', group_name: 'NCT', image_url: '/quizzes/mbti-with-kpop-stars/celebs/mark.png' },
      
      // NewJeans 멤버들
      { stage_name: 'Minji', group_name: 'NewJeans', image_url: '/quizzes/mbti-with-kpop-stars/celebs/minji.png' },
      { stage_name: 'Hanni', group_name: 'NewJeans', image_url: '/quizzes/mbti-with-kpop-stars/celebs/hanni.png' },
      { stage_name: 'Danielle', group_name: 'NewJeans', image_url: '/quizzes/mbti-with-kpop-stars/celebs/danielle.png' },
      { stage_name: 'Haerin', group_name: 'NewJeans', image_url: '/quizzes/mbti-with-kpop-stars/celebs/haerin.png' },
      { stage_name: 'Hyein', group_name: 'NewJeans', image_url: '/quizzes/mbti-with-kpop-stars/celebs/hyein.png' },
    ];
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // 각 연예인의 이미지 URL 업데이트
    for (const mapping of celebImageMappings) {
      try {
        let query = supabase
          .from('celeb_profiles')
          .update({ image_url: mapping.image_url })
          .eq('stage_name', mapping.stage_name);
        
        // group_name이 null인 경우와 아닌 경우를 다르게 처리
        if (mapping.group_name === null) {
          query = query.is('group_name', null);
        } else {
          query = query.eq('group_name', mapping.group_name);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error(`[UPDATE_CELEB_IMAGES] ${mapping.stage_name} 업데이트 실패:`, error);
          errors.push(`${mapping.stage_name}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`[UPDATE_CELEB_IMAGES] ${mapping.stage_name} 이미지 URL 업데이트 성공`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`[UPDATE_CELEB_IMAGES] ${mapping.stage_name} 처리 중 오류:`, err);
        errors.push(`${mapping.stage_name}: ${err instanceof Error ? err.message : String(err)}`);
        errorCount++;
      }
    }
    
    // 업데이트 결과 조회
    const { data: updatedCelebs, error: fetchError } = await supabase
      .from('celeb_profiles')
      .select('stage_name, group_name, mbti_code, image_url')
      .not('image_url', 'is', null)
      .order('stage_name');
    
    if (fetchError) {
      console.error('[UPDATE_CELEB_IMAGES] 업데이트 결과 조회 실패:', fetchError);
    }
    
    console.log(`[UPDATE_CELEB_IMAGES] 완료: ${updatedCount}개 성공, ${errorCount}개 실패`);
    
    return NextResponse.json({
      success: true,
      message: `연예인 이미지 URL 업데이트 완료`,
      stats: {
        updated: updatedCount,
        errors: errorCount,
        total: celebImageMappings.length
      },
      errors: errors.length > 0 ? errors : undefined,
      updatedCelebs: updatedCelebs || []
    });

  } catch (error) {
    console.error('[UPDATE_CELEB_IMAGES] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
