import { NextRequest, NextResponse } from 'next/server'

// 목업 데이터 (개발용)
const mockFeedData = [
  {
    id: '1',
    type: 'post',
    title: '한국어 학습 팁: 일상 대화에서 자주 쓰는 표현들',
    content: '안녕하세요! 오늘은 한국어를 배우는 분들을 위해 일상에서 자주 사용하는 표현들을 정리해드릴게요. "잘 먹겠습니다", "잘 먹었습니다" 같은 기본적인 인사말부터 시작해서...',
    preview: '안녕하세요! 오늘은 한국어를 배우는 분들을 위해 일상에서 자주 사용하는 표현들을 정리해드릴게요.',
    author: '김민수',
    tags: ['한국어', '언어학습', '일상대화'],
    likes: 45,
    views: 320,
    created_at: '2024-09-01T10:00:00Z'
  },
  {
    id: '2',
    type: 'story',
    title: '멕시코에서 한국으로 온 첫 여행기',
    content: 'Hola! 저는 멕시코에서 온 마리아입니다. 이번에 한국에 처음 와서 정말 많은 것을 경험했어요. 서울의 번화가부터 전통 시장까지, 한국의 매력을 직접 느낄 수 있었습니다...',
    preview: 'Hola! 저는 멕시코에서 온 마리아입니다. 이번에 한국에 처음 와서 정말 많은 것을 경험했어요.',
    author: 'Maria Garcia',
    tags: ['여행', '한국', '문화교류'],
    likes: 67,
    views: 890,
    created_at: '2024-08-30T15:30:00Z',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop&crop=center'
    ]
  },
  {
    id: '3',
    type: 'news',
    title: '한국-멕시코 문화교류 프로그램 확대',
    content: '한국과 멕시코 간의 문화교류가 더욱 활발해질 예정입니다. 양국 정부는 청년 교류 프로그램을 확대하고, 언어 학습 지원을 강화하기로 합의했습니다...',
    preview: '한국과 멕시코 간의 문화교류가 더욱 활발해질 예정입니다. 양국 정부는 청년 교류 프로그램을 확대하고...',
    author: '뉴스팀',
    tags: ['문화교류', '정책', '청년'],
    likes: 23,
    views: 456,
    created_at: '2024-08-29T09:15:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '4',
    type: 'post',
    title: '스페인어 발음 가이드: 한국인이 어려워하는 발음들',
    content: '스페인어를 배우는 한국인 분들을 위해 발음 가이드를 준비했습니다. 특히 rr 발음이나 ñ 발음처럼 한국어에 없는 소리들을 어떻게 발음하는지 자세히 설명드릴게요...',
    preview: '스페인어를 배우는 한국인 분들을 위해 발음 가이드를 준비했습니다. 특히 rr 발음이나 ñ 발음처럼...',
    author: 'Carlos Rodriguez',
    tags: ['스페인어', '발음', '언어학습'],
    likes: 34,
    views: 567,
    created_at: '2024-08-28T14:20:00Z'
  },
  {
    id: '5',
    type: 'story',
    title: '한국 드라마로 배우는 한국어',
    content: '안녕하세요! 저는 브라질에서 온 소피아입니다. 한국 드라마를 보면서 한국어를 배우고 있는데, 정말 효과적인 방법인 것 같아요. 드라마에서 나오는 실생활 표현들을...',
    preview: '안녕하세요! 저는 브라질에서 온 소피아입니다. 한국 드라마를 보면서 한국어를 배우고 있는데...',
    author: 'Sofia Silva',
    tags: ['한국드라마', '언어학습', '문화'],
    likes: 89,
    views: 1234,
    created_at: '2024-08-27T11:45:00Z',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop&crop=center'
    ]
  },
  {
    id: '6',
    type: 'news',
    title: 'BTS, 라틴아메리카 투어 성공적 마무리',
    content: '세계적인 K-POP 그룹 BTS가 라틴아메리카 투어를 성공적으로 마무리했습니다. 멕시코, 브라질, 아르헨티나에서 열린 공연에서 현지 팬들의 뜨거운 환호를 받았습니다...',
    preview: '세계적인 K-POP 그룹 BTS가 라틴아메리카 투어를 성공적으로 마무리했습니다. 멕시코, 브라질, 아르헨티나에서...',
    author: '엔터테인먼트뉴스',
    tags: ['K-POP', 'BTS', '투어', '라틴아메리카'],
    likes: 156,
    views: 2340,
    created_at: '2024-08-26T16:20:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '7',
    type: 'news',
    title: '한국 요리, 라틴아메리카에서 인기 급상승',
    content: '한국 요리가 라틴아메리카에서 큰 인기를 얻고 있습니다. 김치, 불고기, 비빔밥 등 한국 전통 요리들이 현지인들의 입맛을 사로잡고 있어요...',
    preview: '한국 요리가 라틴아메리카에서 큰 인기를 얻고 있습니다. 김치, 불고기, 비빔밥 등 한국 전통 요리들이...',
    author: '문화뉴스',
    tags: ['한국요리', '문화교류', '김치', '불고기'],
    likes: 78,
    views: 1890,
    created_at: '2024-08-25T12:30:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '8',
    type: 'story',
    title: '한국 전통문화 체험기: 한복 입고 사진 찍기',
    content: '안녕하세요! 저는 콜롬비아에서 온 카밀라입니다. 한국에 와서 가장 기억에 남는 경험 중 하나는 한복을 입고 사진을 찍은 것이에요. 한복의 아름다움과 우아함에 완전히 매료되었습니다...',
    preview: '안녕하세요! 저는 콜롬비아에서 온 카밀라입니다. 한국에 와서 가장 기억에 남는 경험 중 하나는 한복을 입고...',
    author: 'Camila Rodriguez',
    tags: ['한복', '전통문화', '체험', '사진'],
    likes: 123,
    views: 2100,
    created_at: '2024-08-24T14:15:00Z',
    images: [
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=300&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center'
    ]
  },
  {
    id: '9',
    type: 'story',
    title: '한국 카페 문화 탐방기',
    content: 'Hola! 저는 아르헨티나에서 온 루시아입니다. 한국의 카페 문화가 정말 특별하다는 것을 발견했어요. 각 카페마다 독특한 분위기와 맛있는 음료들이 있어서 매일 새로운 곳을 찾아다니는 재미가 있어요...',
    preview: 'Hola! 저는 아르헨티나에서 온 루시아입니다. 한국의 카페 문화가 정말 특별하다는 것을 발견했어요...',
    author: 'Lucia Fernandez',
    tags: ['카페', '문화', '여행', '음료'],
    likes: 95,
    views: 1670,
    created_at: '2024-08-23T10:30:00Z',
    images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center'
    ]
  },
  {
    id: '10',
    type: 'story',
    title: '한국어 공부하면서 만난 친구들',
    content: '안녕하세요! 저는 페루에서 온 디에고입니다. 한국어를 공부하면서 정말 많은 좋은 친구들을 만났어요. 서로의 문화를 공유하고 언어를 가르쳐주면서 정말 소중한 시간을 보내고 있습니다...',
    preview: '안녕하세요! 저는 페루에서 온 디에고입니다. 한국어를 공부하면서 정말 많은 좋은 친구들을 만났어요...',
    author: 'Diego Morales',
    tags: ['한국어', '친구', '문화교류', '언어학습'],
    likes: 78,
    views: 1450,
    created_at: '2024-08-22T16:45:00Z',
    images: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&crop=center'
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'latest'
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    console.log('[FEED API] 목업 데이터를 반환합니다.')
    
    let filteredData = [...mockFeedData]
    
    // 타입 필터
    if (type) {
      filteredData = filteredData.filter(item => item.type === type)
    }
    
    // 태그 필터
    if (tag) {
      filteredData = filteredData.filter(item => 
        item.tags.some(t => t.includes(tag))
      )
    }
    
    // 정렬
    switch (sort) {
      case 'latest':
        filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'popular':
        filteredData.sort((a, b) => (b.likes * 3 + b.views * 0.2) - (a.likes * 3 + a.views * 0.2))
        break
      case 'recommended':
        // 추천은 인기순과 동일하게 처리
        filteredData.sort((a, b) => (b.likes * 3 + b.views * 0.2) - (a.likes * 3 + a.views * 0.2))
        break
    }
    
    const paginatedData = filteredData.slice(offset, offset + limit)
    
    return NextResponse.json({
      data: paginatedData,
      page,
      limit,
      hasMore: filteredData.length > offset + limit
    })
  } catch (error) {
    console.error('[FEED API] 오류:', error)
    return NextResponse.json(
      { error: '피드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[FEED API] POST 요청:', body)
    
    // 주간 하이라이트 목업 데이터
    const mockHighlights = [
      {
        id: '1',
        ref_type: 'post',
        ref_id: '1',
        period: 'weekly',
        posts: {
          id: '1',
          type: 'post',
          title: '한국어 학습 팁: 일상 대화에서 자주 쓰는 표현들',
          content: '안녕하세요! 오늘은 한국어를 배우는 분들을 위해 일상에서 자주 사용하는 표현들을 정리해드릴게요.',
          author: '김민수',
          tags: ['한국어', '언어학습', '일상대화'],
          likes: 45,
          views: 320,
          created_at: '2024-09-01T10:00:00Z'
        }
      },
      {
        id: '2',
        ref_type: 'story',
        ref_id: '2',
        period: 'weekly',
        stories: {
          id: '2',
          type: 'story',
          title: '멕시코에서 한국으로 온 첫 여행기',
          content: 'Hola! 저는 멕시코에서 온 마리아입니다. 이번에 한국에 처음 와서 정말 많은 것을 경험했어요.',
          author: 'Maria Garcia',
          tags: ['여행', '한국', '문화교류'],
          likes: 67,
          views: 890,
          created_at: '2024-08-30T15:30:00Z'
        }
      },
      {
        id: '3',
        ref_type: 'news',
        ref_id: '3',
        period: 'weekly',
        news: {
          id: '3',
          type: 'news',
          title: '한국-멕시코 문화교류 프로그램 확대',
          content: '한국과 멕시코 간의 문화교류가 더욱 활발해질 예정입니다.',
          author: '뉴스팀',
          tags: ['문화교류', '정책', '청년'],
          likes: 23,
          views: 456,
          created_at: '2024-08-29T09:15:00Z'
        }
      }
    ]
    
    return NextResponse.json({
      highlights: mockHighlights
    })
  } catch (error) {
    console.error('[FEED API] POST 오류:', error)
    return NextResponse.json(
      { error: '피드 데이터 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
