'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Eye, 
  Clock,
  Heart,
  MessageSquare,
  Brain,
  Newspaper,
  Activity
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  description: string
  image: string
  date: string
  participants: number
}

interface HotPost {
  id: string
  title: string
  content: string
  author: string
  likes: number
  comments: number
  views: number
  createdAt: string
}

interface PopularTest {
  id: string
  title: string
  description: string
  participants: number
  image: string
  category: string
}

interface OnlineUser {
  id: string
  name: string
  profileImage: string
  isOnline: boolean
}

export default function HomeTab() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  
  const [currentEvents, setCurrentEvents] = useState<Event[]>([])
  const [hotPosts, setHotPosts] = useState<HotPost[]>([])
  const [popularTests, setPopularTests] = useState<PopularTest[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)

  // 이벤트 자동 슬라이드
  useEffect(() => {
    if (currentEvents.length > 1) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentEvents.length])

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 실제 API 호출로 대체 예정
        // 현재는 더미 데이터
        setTimeout(() => {
          setCurrentEvents([
            {
              id: '1',
              title: '한국 문화 체험 이벤트',
              description: '전통 한복 체험과 한국 음식 시식',
              image: '/event-title.png',
              date: '2024-01-15',
              participants: 150
            },
            {
              id: '2',
              title: 'K-POP 댄스 챌린지',
              description: '인기 K-POP 곡으로 댄스 배우기',
              image: '/event-title.png',
              date: '2024-01-20',
              participants: 89
            }
          ])
          
          setHotPosts([
            {
              id: '1',
              title: '한국 여행 가이드 추천해주세요!',
              content: '첫 한국 여행인데 꼭 가봐야 할 곳들이 있나요?',
              author: 'Maria_Seoul',
              likes: 45,
              comments: 23,
              views: 234,
              createdAt: '2시간 전'
            },
            {
              id: '2',
              title: '한국 드라마 추천 좀 해주세요',
              content: '로맨스 장르 좋아하는데 어떤 드라마가 인기인가요?',
              author: 'Carlos_Kpop',
              likes: 32,
              comments: 18,
              views: 189,
              createdAt: '4시간 전'
            }
          ])
          
          setPopularTests([
            {
              id: '1',
              title: '내가 가장 잘 맞는 K-POP 아이돌은?',
              description: '성격으로 알아보는 나의 아이돌',
              participants: 1250,
              image: '/celebs/bts.webp',
              category: 'meme'
            },
            {
              id: '2',
              title: '한국어 실력 테스트',
              description: '나의 한국어 수준은?',
              participants: 890,
              image: '/celebs/jennie.png',
              category: 'culture'
            }
          ])
          
          setOnlineUsers([
            {
              id: '1',
              name: '김민수',
              profileImage: '/celebs/jimin.png',
              isOnline: true
            },
            {
              id: '2',
              name: '이지은',
              profileImage: '/celebs/iu.png',
              isOnline: true
            },
            {
              id: '3',
              name: '박서준',
              profileImage: '/celebs/jungkook.png',
              isOnline: true
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

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {/* 이벤트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        
        {/* 온라인 사용자 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <div className="flex space-x-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-12 rounded-full" />
            ))}
          </div>
        </div>
        
        {/* 핫 포스트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 인기 테스트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* 현재 진행 이벤트 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('home.sections.currentEvents')}
          </h2>
        </div>
        
        {currentEvents.length > 0 ? (
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-32">
                {currentEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className={`absolute inset-0 transition-all duration-500 ${
                      index === currentEventIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-between p-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-1">{event.title}</h3>
                        <p className="text-white/90 text-sm mb-2">{event.description}</p>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            <Users className="w-3 h-3 mr-1" />
                            {formatNumber(event.participants)}명 참여
                          </Badge>
                          <span className="text-white/80 text-xs">{event.date}</span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 이벤트 인디케이터 */}
              {currentEvents.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {currentEvents.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentEventIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentEventIndex(index)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {language === 'ko' ? '진행 중인 이벤트가 없습니다' : 'No hay eventos en curso'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 화상채팅 온라인 인원 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.sections.videoChatOnline')}
            </h2>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {onlineUsers.length}명
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex flex-col items-center min-w-16">
                  <div className="relative">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                    {user.name}
                  </span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => router.push('/main?tab=meet')}
              >
                <Users className="w-4 h-4 mr-1" />
                {t('home.community.seeMore')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 지금 커뮤니티에서 핫한 글 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.sections.hotPosts')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/main?tab=community')}
          >
            {language === 'ko' ? '더 보기' : 'Ver Más'}
          </Button>
        </div>
        
        <div className="space-y-3">
          {hotPosts.map((post) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.views)}
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
              {t('home.sections.popularTests')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/tests')}
          >
            {language === 'ko' ? '더 보기' : 'Ver Más'}
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
                  <Badge variant="secondary" className="text-xs">
                    {formatNumber(test.participants)}명
                  </Badge>
                  <span className="text-xs text-gray-500">{test.category}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}