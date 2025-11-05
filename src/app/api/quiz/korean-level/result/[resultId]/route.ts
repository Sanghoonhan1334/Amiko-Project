import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const { resultId } = await params

    if (!resultId) {
      return NextResponse.json(
        { error: 'Result ID is required' },
        { status: 400 }
      )
    }

    console.log('[KOREAN_LEVEL_RESULT] 조회:', resultId)

    // 결과 조회
    const { data: result, error } = await supabaseServer
      .from('user_korean_level_results')
      .select('*')
      .eq('id', resultId)
      .single()

    if (error || !result) {
      console.error('[KOREAN_LEVEL_RESULT] 조회 실패:', error)
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    // 결과에 맞는 설명 및 추천사항 생성
    const descriptions = {
      'Básico': {
        ko: '한국어 기초를 잘 알고 있습니다! 한글 읽기와 기본적인 표현들을 잘 이해하고 있어요.',
        es: '¡Conoces pautas básicas del coreano! Entiendes bien la lectura de hangul y expresiones básicas.'
      },
      'Intermedio': {
        ko: '한국어 중급 실력을 가지고 있습니다! 일상 대화와 기본 문법을 잘 사용할 수 있어요.',
        es: '¡Tienes un nivel intermedio de coreano! Puedes usar bien las conversaciones cotidianas y gramática básica.'
      },
      'Avanzado': {
        ko: '한국어 고급 실력을 가지고 있습니다! 복잡한 문장과 고급 어휘를 잘 이해하고 있어요.',
        es: '¡Tienes un nivel avanzado de coreano! Entiendes bien oraciones complejas y vocabulario avanzado.'
      }
    }

    const details = {
      'Básico': {
        ko: '기초 한글, 인사말, 숫자, 기본 어휘를 잘 알고 있습니다. 더 많은 어휘를 학습하면 중급으로 올라갈 수 있어요!',
        es: 'Conoces bien el hangul básico, saludos, números y vocabulario básico. ¡Con más vocabulario puedes llegar al nivel intermedio!'
      },
      'Intermedio': {
        ko: '일상 대화, 기본 문법, 중급 어휘를 잘 알고 있습니다. 더 복잡한 문장 구조를 학습하면 고급으로 올라갈 수 있어요!',
        es: 'Conoces bien las conversaciones cotidianas, gramática básica y vocabulario intermedio. ¡Con estructuras más complejas puedes llegar al nivel avanzado!'
      },
      'Avanzado': {
        ko: '고급 문법, 복잡한 어휘, 문화적 표현을 잘 알고 있습니다. 거의 원어민 수준에 가까워요!',
        es: 'Conoces bien la gramática avanzada, vocabulario complejo y expresiones culturales. ¡Estás cerca del nivel nativo!'
      }
    }

    const recommendations = {
      'Básico': {
        ko: [
          '더 많은 한국어 단어를 학습하세요',
          '한국 드라마나 영화를 자막과 함께 보세요',
          '기본 문법을 더 공부하세요'
        ],
        es: [
          'Aprende más vocabulario coreano',
          'Ve dramas o películas coreanas con subtítulos',
          'Estudia más gramática básica'
        ]
      },
      'Intermedio': {
        ko: [
          '고급 문법과 표현을 학습하세요',
          '한국 뉴스나 팟캐스트를 들어보세요',
          '한국인과 실제 대화를 해보세요'
        ],
        es: [
          'Aprende gramática y expresiones avanzadas',
          'Escucha noticias o podcasts coreanos',
          'Practica conversaciones reales con coreanos'
        ]
      },
      'Avanzado': {
        ko: [
          '한국 문학 작품을 읽어보세요',
          '한국 문화와 역사를 더 깊이 공부하세요',
          '한국어로 글쓰기 연습을 하세요'
        ],
        es: [
          'Lee obras literarias coreanas',
          'Estudia más profundamente la cultura e historia coreana',
          'Practica escribir en coreano'
        ]
      }
    }

    const levelData = descriptions[result.level as keyof typeof descriptions]
    const detailData = details[result.level as keyof typeof details]
    const recommendationData = recommendations[result.level as keyof typeof recommendations]

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        description: levelData,
        details: detailData,
        recommendations: recommendationData
      }
    })
  } catch (error: any) {
    console.error('[KOREAN_LEVEL_RESULT] 에러:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
