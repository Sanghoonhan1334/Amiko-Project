'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  TrendingUp, 
  Brain, 
  Newspaper, 
  Activity,
  Heart,
  MessageSquare,
  Eye,
  Clock,
  Users,
  Star
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'

interface RecentStory {
  id: string
  title: string
  content: string
  author: string
  likes: number
  comments: number
  createdAt: string
  image?: string
}

interface PopularPost {
  id: string
  title: string
  content: string
  author: string
  likes: number
  comments: number
  views: number
  createdAt: string
  category: string
}

interface PopularTest {
  id: string
  title: string
  description: string
  participants: number
  image: string
  category: string
  rating: number
}

interface KoreanNews {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  category: string
  readTime: number
}

interface RecentActivity {
  id: string
  type: 'post' | 'test' | 'comment' | 'like'
  title: string
  user: string
  createdAt: string
}

export default function CommunityTabNew() {
  const { t, language } = useLanguage()
  const router = useRouter()
  
  const [recentStories, setRecentStories] = useState<RecentStory[]>([])
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([])
  const [popularTests, setPopularTests] = useState<PopularTest[]>([])
  const [koreanNews, setKoreanNews] = useState<KoreanNews[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 실제 API 호출로 대체 예정
        setTimeout(() => {
          setRecentStories([
            {
              id: '1',
              title: '한국에서의 첫 여행 경험',
              content: '서울 여행에서 겪은 재미있는 에피소드들을 공유합니다...',
              author: 'Maria_Seoul',
              likes: 45,
              comments: 12,
              createdAt: '1시간 전',
              image: '/community.jpeg'
            },
            {
              id: '2',
              title: '한국어 배우기 팁',
              content: '한국어를 배우면서 느낀 점들과 유용한 방법들을...',
              author: 'Carlos_Kpop',
              likes: 32,
              comments: 8,
              createdAt: '3시간 전'
            }
          ])
          
          setPopularPosts([
            {
              id: '1',
              title: '한국 드라마 추천 좀 해주세요',
              content: '로맨스 장르 좋아하는데 어떤 드라마가 인기인가요?',
              author: 'Ana_Drama',
              likes: 89,
              comments: 45,
              views: 1234,
              createdAt: '2시간 전',
              category: '문화'
            },
            {
              id: '2',
              title: '한국 음식 레시피 공유',
              content: '김치찌개 만드는 방법을 알고 싶어요',
              author: 'Luis_Food',
              likes: 67,
              comments: 23,
              views: 892,
              createdAt: '5시간 전',
              category: '음식'
            },
            {
              id: '3',
              title: 'K-POP 아이돌 추천',
              content: '처음 K-POP 들어보는데 어떤 그룹부터 시작하면 좋을까요?',
              author: 'Sofia_Kpop',
              likes: 156,
              comments: 78,
              views: 2156,
              createdAt: '1일 전',
              category: '음악'
            }
          ])
          
          setPopularTests([
            {
              id: '1',
              title: '내가 가장 잘 맞는 K-POP 아이돌은?',
              description: '성격으로 알아보는 나의 아이돌',
              participants: 1250,
              image: '/celebs/bts.webp',
              category: 'meme',
              rating: 4.8
            },
            {
              id: '2',
              title: '한국어 실력 테스트',
              description: '나의 한국어 수준은?',
              participants: 890,
              image: '/celebs/jennie.png',
              category: 'culture',
              rating: 4.6
            },
            {
              id: '3',
              title: '내 성격은 어떤 한국 드라마 주인공?',
              description: '성격으로 알아보는 드라마 캐릭터',
              participants: 634,
              image: '/celebs/iu.png',
              category: 'personality',
              rating: 4.7
            }
          ])
          
          setKoreanNews([
            {
              id: '1',
              title: '한국의 새로운 K-컬처 정책 발표',
              summary: '정부가 K-컬처 확산을 위한 새로운 지원 정책을 발표했습니다.',
              source: '연합뉴스',
              publishedAt: '2시간 전',
              category: '문화',
              readTime: 3
            },
            {
              id: '2',
              title: '한국 전통 음식의 세계적 인기 상승',
              summary: '김치와 한식이 전 세계적으로 인기를 끌고 있습니다.',
              source: '문화일보',
              publishedAt: '4시간 전',
              category: '음식',
              readTime: 5
            },
            {
              id: '3',
              title: '한국어 학습자 급증, 온라인 교육 시장 확대',
              summary: '해외 한국어 학습자가 급증하면서 온라인 교육 시장이 확대되고 있습니다.',
              source: '교육뉴스',
              publishedAt: '6시간 전',
              category: '교육',
              readTime: 4
            }
          ])
          
          setRecentActivities([
            {
              id: '1',
              type: 'post',
              title: '새 게시글: 한국 여행 추천',
              user: 'Maria_Seoul',
              createdAt: '10분 전'
            },
            {
              id: '2',
              type: 'test',
              title: '심리테스트 완료: 내가 가장 잘 맞는 K-POP 아이돌',
              user: 'Carlos_Kpop',
              createdAt: '25분 전'
            },
            {
              id: '3',
              type: 'comment',
              title: '댓글 작성: 한국 드라마 추천 게시글',
              user: 'Ana_Drama',
              createdAt: '1시간 전'
            },
            {
              id: '4',
              type: 'like',
              title: '좋아요: 한국 음식 레시피 게시글',
              user: 'Luis_Food',
              createdAt: '2시간 전'
            }
          ])
          
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('데이터 로딩 오류:', error)
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'test': return <Brain className="w-4 h-4 text-purple-500" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-500" />
      case 'like': return <Heart className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {/* 최근 스토리 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 인기 게시글 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 인기 심리테스트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* 인기 한국 뉴스 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 최근 활동 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* 최근 스토리 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.recentStories')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/stories')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentStories.map((story) => (
            <Card key={story.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {story.image && (
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                      {story.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {story.author}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {story.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {story.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {story.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 인기 게시글 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.popularPosts')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/free-board')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {popularPosts.map((post) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    {formatNumber(post.views)}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>by {post.author}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comments}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.createdAt}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 인기 심리테스트 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.popularTests')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/tests')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {popularTests.map((test) => (
            <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3 flex items-center justify-center">
                  <img
                    src={test.image}
                    alt={test.title}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
                  {test.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                  {test.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{formatNumber(test.participants)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-500">{test.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 인기 한국 뉴스 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.popularNews')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/news')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {koreanNews.map((news) => (
            <Card key={news.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {news.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {news.readTime}분
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{news.source}</span>
                  <span>{news.publishedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('home.community.recentActivities')}
          </h2>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-2">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {activity.user} • {activity.createdAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
