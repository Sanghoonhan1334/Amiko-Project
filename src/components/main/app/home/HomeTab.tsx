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

  // 실제 데이터 로딩 함수들
  const loadCurrentEvents = async () => {
    try {
      // 이벤트 API가 없으므로 임시로 뉴스에서 이벤트성 콘텐츠 가져오기
      const response = await fetch('/api/news?limit=3')
      const data = await response.json()
      
      const events = (data.newsItems || []).map((news: any, index: number) => ({
        id: `event-${news.id}`,
        title: language === 'ko' ? news.title : news.title_es || news.title,
        description: language === 'ko' ? news.content?.substring(0, 50) + '...' : news.content_es?.substring(0, 50) + '...',
        image: news.thumbnail || '/event-title.png',
        date: news.date || news.created_at?.split('T')[0],
        participants: Math.floor(Math.random() * 200) + 50 // 임시 참여자 수
      }))
      
      setCurrentEvents(events)
    } catch (error) {
      console.error('이벤트 로딩 실패:', error)
      setCurrentEvents([])
    }
  }

  const loadHotPosts = async () => {
    try {
      const response = await fetch('/api/posts/popular?filter=hot&limit=3')
      const data = await response.json()
      
      const posts = (data.posts || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content?.substring(0, 100) + '...',
        author: post.user?.full_name || post.user?.nickname || '익명',
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        views: post.view_count || 0,
        createdAt: formatTimeAgo(post.created_at)
      }))
      
      setHotPosts(posts)
    } catch (error) {
      console.error('핫 포스트 로딩 실패:', error)
      setHotPosts([])
    }
  }

  const loadPopularTests = async () => {
    try {
      const response = await fetch('/api/quizzes?limit=4')
      const data = await response.json()
      
      const tests = (data.data || []).map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || '심리테스트',
        participants: Math.floor(Math.random() * 1000) + 100, // 임시 참여자 수
        image: quiz.thumbnail_url || '/celebs/bts.webp',
        category: quiz.category || 'test'
      }))
      
      setPopularTests(tests)
    } catch (error) {
      console.error('인기 테스트 로딩 실패:', error)
      setPopularTests([])
    }
  }

  const loadOnlineUsers = async () => {
    try {
      // 온라인 사용자 API가 없으므로 임시 데이터
      // 실제로는 사용자 상태 API가 필요함
      const mockUsers = [
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
      ]
      
      setOnlineUsers(mockUsers)
    } catch (error) {
      console.error('온라인 사용자 로딩 실패:', error)
      setOnlineUsers([])
    }
  }

  // 유틸리티 함수
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return language === 'ko' ? `${diffInMinutes}분 전` : `hace ${diffInMinutes} min`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return language === 'ko' ? `${hours}시간 전` : `hace ${hours}h`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return language === 'ko' ? `${days}일 전` : `hace ${days}d`
    }
  }

  // 모든 데이터 로딩
  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadCurrentEvents(),
        loadHotPosts(),
        loadPopularTests(),
        loadOnlineUsers()
      ])
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 데이터 로딩
  useEffect(() => {
    loadAllData()
  }, [language])

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
              <div className="relative h-32 overflow-hidden">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentEventIndex * 100}%)` }}
                >
                  {currentEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="w-full flex-shrink-0"
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
          {hotPosts.length > 0 ? (
            hotPosts.map((post) => (
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
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {language === 'ko' ? '핫한 게시글이 없습니다' : 'No hay posts populares'}
                </p>
              </CardContent>
            </Card>
          )}
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
        
        {popularTests.length > 0 ? (
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
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {language === 'ko' ? '인기 테스트가 없습니다' : 'No hay tests populares'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}