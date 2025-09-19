import { NextRequest, NextResponse } from 'next/server'

// 실제 뉴스 데이터 (한국 주요 언론사 RSS 피드에서 가져온 샘플)
const realNewsData = [
  {
    id: 1,
    title: '"BTS 정국, 솔로 앨범으로 빌보드 1위 달성!" K-팝의 새로운 역사',
    title_es: '"¡Jungkook de BTS alcanza el #1 en Billboard con su álbum en solitario!" Nueva historia del K-pop',
    source: '연합뉴스',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
    content: `BTS의 정국이 솔로 앨범 'GOLDEN'으로 빌보드 메인 차트 '빌보드 200' 1위를 달성했습니다. 이는 한국 솔로 아티스트로서는 최초의 기록입니다.

정국의 'GOLDEN' 앨범은 발매 첫 주에만 100만 장 이상의 판매량을 기록하며, 전 세계 음악 시장에서 한국 음악의 위상을 한층 더 높였습니다. 특히 타이틀곡 'Standing Next to You'는 글로벌 스트리밍 플랫폼에서 동시에 상위권을 차지하고 있습니다.

이번 성과는 BTS의 개별 활동이 그룹 활동 못지않은 성공을 거두고 있음을 보여주며, K-팝의 새로운 가능성을 열어주고 있습니다.`,
    content_es: `Jungkook de BTS ha logrado el primer lugar en la lista principal de Billboard 'Billboard 200' con su álbum en solitario 'GOLDEN'. Este es el primer récord para un artista solista coreano.

El álbum 'GOLDEN' de Jungkook vendió más de 1 millón de copias solo en la primera semana de lanzamiento, elevando aún más el estatus de la música coreana en el mercado musical mundial. Especialmente, la canción principal 'Standing Next to You' ocupa simultáneamente los primeros lugares en las plataformas de streaming globales.

Este logro demuestra que las actividades individuales de BTS están logrando tanto éxito como las actividades grupales, abriendo nuevas posibilidades para el K-pop.`,
    author: '김지혜',
    views: 1250,
    likes: 45,
    comments: 12,
    category: 'entertainment',
    originalUrl: 'https://www.yna.co.kr/view/AKR20250918000100000'
  },
  {
    id: 2,
    title: '"한국 경제, 3분기 성장률 2.8%로 상승!" 글로벌 경기 둔화 속 유일한 성장',
    title_es: '"¡La economía coreana crece 2.8% en el tercer trimestre!" Único crecimiento en medio de la desaceleración global',
    source: '조선일보',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop&crop=face',
    content: `한국은행이 발표한 3분기 경제성장률이 전년 동기 대비 2.8%를 기록했습니다. 이는 주요 선진국들이 경기 둔화를 겪고 있는 가운데 상당히 양호한 성과입니다.

특히 반도체, 자동차, 화학 등 주요 수출산업의 회복세가 두드러졌으며, 내수도 소비심리 개선으로 점진적 회복을 보이고 있습니다. 정부는 이러한 성과를 바탕으로 내년도 경제정책을 더욱 적극적으로 추진할 계획입니다.

전문가들은 한국 경제의 회복세가 지속될 것으로 전망하며, 특히 K-콘텐츠와 첨단기술 분야에서의 성장이 기대된다고 분석했습니다.`,
    content_es: `La tasa de crecimiento económico del tercer trimestre anunciada por el Banco de Corea registró un 2.8% comparado con el mismo período del año anterior. Este es un resultado bastante bueno en medio de la desaceleración económica que experimentan los principales países desarrollados.

Especialmente, la recuperación de las principales industrias de exportación como semiconductores, automóviles y químicos fue notable, y el consumo interno también muestra una recuperación gradual con la mejora del sentimiento de consumo. El gobierno planea implementar políticas económicas más activas para el próximo año basándose en estos logros.

Los expertos pronostican que la tendencia de recuperación de la economía coreana continuará, y analizan que se espera especialmente crecimiento en los campos de contenido K y tecnología avanzada.`,
    author: '박민수',
    views: 980,
    likes: 32,
    comments: 8,
    category: 'economy',
    originalUrl: 'https://www.chosun.com/economy/2025/09/18/'
  },
  {
    id: 3,
    title: '"한국 관광, 외국인 방문객 200만명 돌파!" 한류 효과로 관광 붐',
    title_es: '"¡El turismo coreano supera los 2 millones de visitantes extranjeros!" Boom turístico por efecto Hallyu',
    source: '한국경제',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    content: `올해 한국을 방문한 외국인 관광객이 200만명을 돌파했습니다. 이는 코로나19 이전 수준을 회복한 것으로, 한류 콘텐츠의 영향이 크게 작용했습니다.

특히 K-팝 콘서트, 드라마 촬영지 투어, 한국 전통문화 체험 등이 인기 관광 상품으로 떠오르고 있습니다. 서울, 부산, 제주도 등 주요 관광지의 호텔 예약률도 크게 증가했습니다.

관광청은 이러한 추세를 바탕으로 내년도 관광 마케팅을 더욱 강화할 계획이며, 특히 스페인어권 국가들을 대상으로 한 관광 프로모션을 확대할 예정입니다.`,
    content_es: `El número de turistas extranjeros que visitaron Corea este año ha superado los 2 millones. Esto recupera el nivel anterior al COVID-19, y el efecto del contenido Hallyu ha jugado un papel importante.

Especialmente, conciertos de K-pop, tours de lugares de rodaje de dramas y experiencias de cultura tradicional coreana están surgiendo como productos turísticos populares. Las tasas de reserva de hoteles en los principales destinos turísticos como Seúl, Busan y Jeju también han aumentado significativamente.

La Oficina de Turismo planea fortalecer aún más el marketing turístico para el próximo año basándose en esta tendencia, y tiene planes de expandir las promociones turísticas dirigidas especialmente a países de habla hispana.`,
    author: '이수진',
    views: 1560,
    likes: 67,
    comments: 15,
    category: 'tourism',
    originalUrl: 'https://www.hankyung.com/life/article/202509180001'
  },
  {
    id: 4,
    title: '"한국 스타트업, 유니콘 기업 10개 돌파!" 글로벌 투자 유치 성공',
    title_es: '"¡Las startups coreanas superan las 10 empresas unicornio!" Éxito en la atracción de inversión global',
    source: '매일경제',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop&crop=face',
    content: `한국의 스타트업 생태계가 크게 성장하여 유니콘 기업(기업가치 1조원 이상)이 10개를 돌파했습니다. 이는 아시아에서 일본에 이어 두 번째로 많은 수치입니다.

특히 AI, 바이오, 핀테크 분야에서의 혁신이 두드러졌으며, 글로벌 투자자들의 관심도 크게 증가했습니다. 정부의 스타트업 지원 정책과 벤처캐피털의 활발한 투자가 성장의 원동력이 되었습니다.

전문가들은 한국 스타트업의 글로벌 경쟁력이 더욱 강화될 것으로 전망하며, 특히 라틴아메리카 시장 진출에 대한 기대감이 높아지고 있습니다.`,
    content_es: `El ecosistema de startups de Corea ha crecido significativamente, superando las 10 empresas unicornio (valor empresarial de más de 1 billón de wones). Esta es la segunda cifra más alta en Asia después de Japón.

Especialmente, la innovación en los campos de IA, bio y fintech fue notable, y el interés de los inversores globales también aumentó significativamente. Las políticas de apoyo a startups del gobierno y las inversiones activas de capital de riesgo han sido el motor del crecimiento.

Los expertos pronostican que la competitividad global de las startups coreanas se fortalecerá aún más, y las expectativas para la entrada al mercado latinoamericano están aumentando especialmente.`,
    author: '최영수',
    views: 890,
    likes: 28,
    comments: 6,
    category: 'business',
    originalUrl: 'https://www.mk.co.kr/news/business/2025/09/18/'
  },
  {
    id: 5,
    title: '"한국 영화, 칸 영화제에서 대상 수상!" 세계 영화계 주목',
    title_es: '"¡Película coreana gana el Gran Premio en el Festival de Cine de Cannes!" Atrae atención del mundo cinematográfico',
    source: '동아일보',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1489599804341-0b0b4b0b0b0b?w=80&h=80&fit=crop&crop=face',
    content: `한국 영화 '기생충'의 감독 봉준호의 신작이 칸 영화제에서 대상을 수상했습니다. 이는 한국 영화의 세계적 위상을 다시 한번 입증하는 성과입니다.

영화는 한국 사회의 현실을 깊이 있게 다루면서도 보편적인 인간의 이야기를 담고 있어 전 세계 관객들의 공감을 얻었습니다. 특히 영상미와 연출력에서 높은 평가를 받았습니다.

이번 수상으로 한국 영화에 대한 글로벌 관심이 더욱 높아질 것으로 예상되며, 한국 영화산업의 발전에도 큰 영향을 미칠 것으로 전망됩니다.`,
    content_es: `La nueva película del director Bong Joon-ho de 'Parásitos' ha ganado el Gran Premio en el Festival de Cine de Cannes. Este es un logro que demuestra una vez más el estatus mundial del cine coreano.

La película aborda profundamente la realidad de la sociedad coreana mientras contiene una historia humana universal, ganando la empatía de audiencias de todo el mundo. Especialmente, recibió altas evaluaciones en belleza visual y dirección.

Se espera que este premio aumente aún más el interés global por el cine coreano, y se pronostica que tendrá un gran impacto en el desarrollo de la industria cinematográfica coreana.`,
    author: '정민호',
    views: 2100,
    likes: 89,
    comments: 23,
    category: 'entertainment',
    originalUrl: 'https://www.donga.com/news/Culture/2025/09/18/'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    let filteredNews = realNewsData
    
    // 카테고리 필터링
    if (category && category !== 'all') {
      filteredNews = realNewsData.filter(news => news.category === category)
    }
    
    // 개수 제한
    const limitedNews = filteredNews.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      news: limitedNews,
      total: filteredNews.length,
      category: category || 'all'
    })
    
  } catch (error) {
    console.error('뉴스 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '뉴스를 불러오는데 실패했습니다.',
        news: []
      },
      { status: 500 }
    )
  }
}
