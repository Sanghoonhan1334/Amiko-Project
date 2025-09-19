'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/context/LanguageContext'
import NewsDetail from './NewsDetail'
import { 
  Search, 
  Eye, 
  MessageSquare, 
  ThumbsUp,
  TrendingUp,
  Globe,
  Users,
  Star,
  Heart,
  Zap
} from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  title_es?: string
  content: string
  content_es?: string
  thumbnail: string
  source: string
  date: string
  category: string
  viewCount: number
  commentCount: number
  likeCount: number
  celebrity?: string
  originalUrl?: string
}

interface KoreanNewsProps {
  onBackToCommunity?: () => void
}

export default function KoreanNews({ onBackToCommunity }: KoreanNewsProps) {
  const { t, language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('entertainment') // 기본값을 연예로 변경
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSpanish, setShowSpanish] = useState(false) // 스페인어 표시 토글
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null) // 선택된 뉴스

  // 카테고리 정의
  const categories = [
    { id: 'all', name: '전체', icon: Globe },
    { id: 'entertainment', name: '연예', icon: Star },
    { id: 'sports', name: '스포츠', icon: TrendingUp },
    { id: 'politics', name: '정치·사회', icon: Users },
    { id: 'economy', name: '경제·산업', icon: TrendingUp },
    { id: 'culture', name: '문화·생활', icon: Heart },
    { id: 'tech', name: 'IT·게임', icon: Zap },
    { id: 'international', name: '국제', icon: Globe }
  ]

  // 연예인 뉴스 데이터 (한국어 + 스페인어 번역)
  const sampleNews: NewsItem[] = [
    {
      id: '1',
      title: 'BTS 정국, 솔로 앨범 발매 예정...글로벌 팬들 열광',
      title_es: 'Jungkook de BTS lanzará álbum en solitario...fans globales emocionados',
      content: 'BTS 멤버 정국이 솔로 앨범을 발매한다고 발표했다. 이번 앨범은 전 세계 팬들의 기대를 모으고 있다.',
      content_es: 'El miembro de BTS Jungkook anunció que lanzará un álbum en solitario. Este álbum está generando expectativas entre los fans de todo el mundo.',
      thumbnail: '/api/placeholder/200/150',
      source: '뉴스패치',
      date: '2025.09.18',
      category: 'entertainment',
      viewCount: 1250,
      commentCount: 45,
      likeCount: 89,
      celebrity: 'BTS 정국',
      originalUrl: 'https://news.naver.com/entertainment/article/123456'
    },
    {
      id: '2',
      title: 'BLACKPINK 지수, 영화 데뷔작 화제...연기력 호평',
      title_es: 'Jisoo de BLACKPINK debuta en película...actuación elogiada',
      content: 'BLACKPINK 지수가 영화 데뷔작으로 연기력을 인정받고 있다. 팬들은 그녀의 새로운 도전을 응원하고 있다.',
      content_es: 'Jisoo de BLACKPINK está siendo reconocida por su actuación en su debut cinematográfico. Los fans están apoyando su nuevo desafío.',
      thumbnail: '/api/placeholder/200/150',
      source: '스포츠조선',
      date: '2025.09.18',
      category: 'entertainment',
      viewCount: 2100,
      commentCount: 156,
      likeCount: 234,
      celebrity: 'BLACKPINK 지수',
      originalUrl: 'https://sports.chosun.com/entertainment/news/123456'
    },
    {
      id: '3',
      title: 'NewJeans, 빌보드 차트 진입...K-POP 신예의 돌풍',
      title_es: 'NewJeans entra en Billboard Chart...torbellino de novatos K-POP',
      content: 'NewJeans가 빌보드 차트에 진입하며 K-POP 신예로서의 위력을 보여주고 있다.',
      content_es: 'NewJeans está ingresando a Billboard Chart, mostrando su poder como novatos del K-POP.',
      thumbnail: '/api/placeholder/200/150',
      source: '일간스포츠',
      date: '2025.09.18',
      category: 'entertainment',
      viewCount: 1800,
      commentCount: 89,
      likeCount: 167,
      celebrity: 'NewJeans',
      originalUrl: 'https://isplus.com/entertainment/news/123456'
    },
    {
      id: '4',
      title: '송혜교, 새 드라마 출연 확정...복귀작 기대감',
      title_es: 'Song Hye-kyo confirma aparición en nuevo drama...expectativas por su regreso',
      content: '송혜교가 새 드라마 출연을 확정했다. 그녀의 복귀작에 대한 기대감이 높아지고 있다.',
      content_es: 'Song Hye-kyo confirmó su aparición en un nuevo drama. Las expectativas por su obra de regreso están aumentando.',
      thumbnail: '/api/placeholder/200/150',
      source: '텐아시아',
      date: '2025.09.18',
      category: 'entertainment',
      viewCount: 1456,
      commentCount: 78,
      likeCount: 123,
      celebrity: '송혜교',
      originalUrl: 'https://tenasia.hankyung.com/entertainment/article/123456'
    },
    {
      id: '5',
      title: 'LE SSERAFIM, 월드투어 성공적 마무리...글로벌 인기 입증',
      title_es: 'LE SSERAFIM termina exitosamente gira mundial...demuestra popularidad global',
      content: 'LE SSERAFIM이 월드투어를 성공적으로 마무리했다. 그들의 글로벌 인기를 다시 한번 입증했다.',
      content_es: 'LE SSERAFIM terminó exitosamente su gira mundial. Una vez más demostró su popularidad global.',
      thumbnail: '/api/placeholder/200/150',
      source: '스타뉴스',
      date: '2025.09.18',
      category: 'entertainment',
      viewCount: 2100,
      commentCount: 134,
      likeCount: 189,
      celebrity: 'LE SSERAFIM',
      originalUrl: 'https://star.mt.co.kr/view/stview.php/123456'
    },
    {
      id: '6',
      title: '현빈, 새 영화 촬영 시작...액션 연기 도전',
      title_es: 'Hyun Bin inicia rodaje de nueva película...desafío de actuación de acción',
      content: '현빈이 새 영화 촬영을 시작했다. 이번 작품에서 액션 연기에 도전한다고 밝혔다.',
      content_es: 'Hyun Bin comenzó el rodaje de una nueva película. Reveló que desafiará la actuación de acción en esta obra.',
      thumbnail: '/api/placeholder/200/150',
      source: '마이데일리',
      date: '2025.09.18',
      category: 'entertainment',
      viewCount: 1678,
      commentCount: 92,
      likeCount: 145,
      celebrity: '현빈',
      originalUrl: 'https://mydaily.co.kr/new_yk/html/read.php/123456'
    }
  ]

  useEffect(() => {
    // 실제로는 API에서 뉴스 데이터를 가져옴
    setNewsItems(sampleNews)
    setLoading(false)
  }, [])

  const filteredNews = newsItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const formatTimeAgo = (date: string) => {
    // 실제로는 현재 시간과 비교해서 계산
    return '2시간 전'
  }

  const handleNewsClick = (news: NewsItem) => {
    console.log('뉴스 클릭:', news)
    setSelectedNews(news)
  }

  const handleBackToList = () => {
    setSelectedNews(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">한국 뉴스</h1>
              {onBackToCommunity && (
                <Button
                  onClick={onBackToCommunity}
                  variant="outline"
                  size="sm"
                >
                  ← 커뮤니티로
                </Button>
              )}
            </div>
            
            {/* 검색바 */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant={showSpanish ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowSpanish(!showSpanish)}
                className="flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>{showSpanish ? 'ES' : 'KO'}</span>
              </Button>
              <Button variant="outline" size="sm">디시인사이드</Button>
              <Button variant="outline" size="sm">갤러리</Button>
              <Button variant="outline" size="sm">D</Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 네비게이션 */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 py-3">
            <Button variant="ghost" className="text-white hover:bg-blue-700">
              팬
            </Button>
            <Button variant="ghost" className="text-white hover:bg-blue-700">
              투표
            </Button>
            <Button variant="ghost" className="text-white hover:bg-blue-700">
              기념&응원
            </Button>
            <Button variant="ghost" className="text-white hover:bg-blue-700">
              스타마켓
            </Button>
            <Button variant="ghost" className="text-white hover:bg-blue-700 bg-blue-700">
              뉴스
            </Button>
          </div>
        </div>
      </div>

      {/* 서브 네비게이션 */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-6 py-2">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-blue-900 ${
                    selectedCategory === category.id ? 'bg-blue-900' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <IconComponent className="w-4 h-4 mr-1" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 뉴스 리스트 또는 상세 내용 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {selectedNews ? (
          // 뉴스 상세 내용
          <NewsDetail 
            news={selectedNews} 
            onBack={handleBackToList}
            showSpanish={showSpanish}
          />
        ) : (
          // 뉴스 목록
          <>
            {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-32 h-24 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNewsClick(item)
              }}>
                <div className="flex space-x-4">
                  {/* 썸네일 */}
                  <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc1IiByPSIyMCIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxMDAiIHk9IjEyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj7wn5GAPC90ZXh0Pgo8L3N2Zz4K'
                      }}
                    />
                  </div>

                  {/* 뉴스 내용 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {showSpanish && item.title_es ? item.title_es : item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {showSpanish && item.content_es ? item.content_es : item.content}
                    </p>
                    {item.celebrity && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.celebrity}
                        </Badge>
                      </div>
                    )}
                    
                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{item.source}</span>
                        <span>{item.date}</span>
                        <span>{formatTimeAgo(item.date)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{item.viewCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{item.commentCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{item.likeCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

            {filteredNews.length === 0 && !loading && (
              <Card className="p-8 text-center">
                <div className="text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">뉴스를 찾을 수 없습니다</p>
                  <p className="text-sm">다른 검색어나 카테고리를 시도해보세요.</p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
