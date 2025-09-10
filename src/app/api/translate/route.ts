import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { translateText, initializeTranslationService } from '@/lib/translation'
import crypto from 'crypto'

// 번역 서비스 초기화
initializeTranslationService()

export async function POST(request: NextRequest) {
  try {
    const { refType, refId, original, targetLang } = await request.json()

    // 입력 검증
    if (!refType || !refId || !original || !targetLang) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['post', 'story', 'news'].includes(refType)) {
      return NextResponse.json(
        { error: '잘못된 refType입니다.' },
        { status: 400 }
      )
    }

    if (!['ko', 'es'].includes(targetLang)) {
      return NextResponse.json(
        { error: '지원하지 않는 언어입니다.' },
        { status: 400 }
      )
    }

    // 소스 해시 생성
    const sourceHash = crypto
      .createHash('sha256')
      .update(`${original}:${targetLang}`)
      .digest('hex')

    // 개발 환경에서는 목업 번역 반환
    if (!supabaseServer) {
      console.log('[TRANSLATE API] Supabase 서버 클라이언트가 없어 목업 번역을 반환합니다.')
      
      // 간단한 목업 번역 (실제로는 더 정교한 번역이 필요)
      const mockTranslations: Record<string, string> = {
        // 제목 번역
        'K-pop 스타들과 함께하는 스페인어 학습 팁': 'Consejos para aprender español con estrellas de K-pop',
        '마드리드에서 만난 한국인 친구들': 'Amigos coreanos que conocí en Madrid',
        '한국-스페인 문화교류 페스티벌 개최': 'Festival de intercambio cultural Corea-España',
        '스페인어 발음 연습하는 재미있는 방법': 'Métodos divertidos para practicar la pronunciación del español',
        '바르셀로나에서의 첫 스페인어 대화': 'Mi primera conversación en español en Barcelona',
        
        // 내용 번역 (한국어 → 스페인어)
        '안녕하세요! 오늘은 K-pop을 통해 스페인어를 배우는 재미있는 방법을 공유해드릴게요. BLACKPINK의 스페인어 인터뷰를 분석해보면서 자연스러운 표현들을 배워봅시다.': '¡Hola! Hoy compartiré contigo una forma divertida de aprender español a través del K-pop. Analicemos las entrevistas en español de BLACKPINK y aprendamos expresiones naturales.',
        '지난 주 마드리드 여행 중에 우연히 만난 한국인 친구들과의 특별한 순간들을 담은 스토리입니다. 현지 스페인어를 사용하면서 느낀 문화적 교류의 즐거움을 나누고 싶어요.': 'Esta es una historia sobre momentos especiales con amigos coreanos que conocí por casualidad durante mi viaje a Madrid la semana pasada. Quiero compartir la alegría del intercambio cultural que sentí al usar español local.',
        '올해 3월 서울에서 개최되는 한국-스페인 문화교류 페스티벌에 대한 소식입니다. K-pop 공연부터 스페인 전통 음식까지 다양한 프로그램이 준비되어 있어요.': 'Noticias sobre el Festival de Intercambio Cultural Corea-España que se celebrará en Seúl en marzo de este año. Hay varios programas preparados, desde actuaciones de K-pop hasta comida tradicional española.',
        '스페인어 발음을 연습할 때 사용할 수 있는 재미있는 방법들을 소개합니다. 노래를 부르면서, 영화를 보면서 자연스럽게 발음을 익힐 수 있어요.': 'Te presento métodos divertidos que puedes usar para practicar la pronunciación del español. Puedes aprender la pronunciación de forma natural cantando canciones y viendo películas.',
        '바르셀로나 여행 중에 처음으로 스페인어로 대화를 나눈 경험을 담았습니다. 긴장했지만 현지인들의 따뜻한 반응에 감동받은 순간이었어요.': 'Comparto mi experiencia de tener mi primera conversación en español durante mi viaje a Barcelona. Estaba nervioso pero me conmovió la cálida respuesta de los locales.',
        
        // 내용 번역 (스페인어 → 한국어)
        '¡Hola! Hoy compartiré contigo una forma divertida de aprender español a través del K-pop. Analicemos las entrevistas en español de BLACKPINK y aprendamos expresiones naturales.': '안녕하세요! 오늘은 K-pop을 통해 스페인어를 배우는 재미있는 방법을 공유해드릴게요. BLACKPINK의 스페인어 인터뷰를 분석해보면서 자연스러운 표현들을 배워봅시다.',
        'Esta es una historia sobre momentos especiales con amigos coreanos que conocí por casualidad durante mi viaje a Madrid la semana pasada. Quiero compartir la alegría del intercambio cultural que sentí al usar español local.': '지난 주 마드리드 여행 중에 우연히 만난 한국인 친구들과의 특별한 순간들을 담은 스토리입니다. 현지 스페인어를 사용하면서 느낀 문화적 교류의 즐거움을 나누고 싶어요.',
        'Noticias sobre el Festival de Intercambio Cultural Corea-España que se celebrará en Seúl en marzo de este año. Hay varios programas preparados, desde actuaciones de K-pop hasta comida tradicional española.': '올해 3월 서울에서 개최되는 한국-스페인 문화교류 페스티벌에 대한 소식입니다. K-pop 공연부터 스페인 전통 음식까지 다양한 프로그램이 준비되어 있어요.',
        'Te presento métodos divertidos que puedes usar para practicar la pronunciación del español. Puedes aprender la pronunciación de forma natural cantando canciones y viendo películas.': '스페인어 발음을 연습할 때 사용할 수 있는 재미있는 방법들을 소개합니다. 노래를 부르면서, 영화를 보면서 자연스럽게 발음을 익힐 수 있어요.',
        'Comparto mi experiencia de tener mi primera conversación en español durante mi viaje a Barcelona. Estaba nervioso pero me conmovió la cálida respuesta de los locales.': '바르셀로나 여행 중에 처음으로 스페인어로 대화를 나눈 경험을 담았습니다. 긴장했지만 현지인들의 따뜻한 반응에 감동받은 순간이었어요.'
      }
      
      const translated = mockTranslations[original] || `[번역됨] ${original}`
      
      return NextResponse.json({
        translated: translated,
        cached: false
      })
    }

    // Supabase에서 캐시 확인
    const { data: cachedTranslation, error: cacheError } = await supabaseServer!
      .from('translations')
      .select('translated')
      .eq('source_hash', sourceHash)
      .eq('target_lang', targetLang)
      .single()

    if (cachedTranslation) {
      return NextResponse.json({
        translated: (cachedTranslation as any).translated,
        cached: true
      })
    }

    // 캐시에 없으면 번역 실행
    const translated = await translateText(original, targetLang as 'ko' | 'es')

    // 번역 결과를 캐시에 저장
    const { error: insertError } = await supabaseServer!
      .from('translations')
      .insert({
        ref_type: refType,
        ref_id: refId,
        source_hash: sourceHash,
        target_lang: targetLang,
        translated: translated
      } as any)

    if (insertError) {
      console.error('[TRANSLATE API] 캐시 저장 실패:', insertError)
      // 캐시 저장 실패해도 번역 결과는 반환
    }

    return NextResponse.json({
      translated: translated,
      cached: false
    })

  } catch (error) {
    console.error('[TRANSLATE API] 오류:', error)
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceHash = searchParams.get('sourceHash')
    const targetLang = searchParams.get('targetLang')

    if (!sourceHash || !targetLang) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 캐시에서 번역 결과 조회
    const { data: cachedTranslation, error } = await supabaseServer!
      .from('translations')
      .select('translated')
      .eq('source_hash', sourceHash)
      .eq('target_lang', targetLang)
      .single()

    if (error || !cachedTranslation) {
      return NextResponse.json(
        { error: '캐시된 번역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      translated: (cachedTranslation as any).translated,
      cached: true
    })

  } catch (error) {
    console.error('[TRANSLATE API] GET 오류:', error)
    return NextResponse.json(
      { error: '번역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
