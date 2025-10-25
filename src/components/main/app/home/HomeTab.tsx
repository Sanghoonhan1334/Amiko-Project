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
  Activity,
  Play
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
  route?: string
}

interface OnlineUser {
  id: string
  name: string
  profileImage: string
  isOnline: boolean
}

interface RecentStory {
  id: string
  user_name: string
  user_profile_image?: string
  image_url?: string
  text_content?: string
  created_at: string
}

export default function HomeTab() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  
  const [currentEvents, setCurrentEvents] = useState<Event[]>([])
  const [hotPosts, setHotPosts] = useState<HotPost[]>([])
  const [popularTests, setPopularTests] = useState<PopularTest[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [recentStories, setRecentStories] = useState<RecentStory[]>([])
  const [notices, setNotices] = useState<HotPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isAutoSliding, setIsAutoSliding] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)

  // 이벤트 자동 슬라이드
  useEffect(() => {
    if (currentEvents.length > 1 && isAutoSliding) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentEvents.length, isAutoSliding])

  // 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartY(e.clientY)
    setIsAutoSliding(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStartX
    const deltaY = Math.abs(e.clientY - dragStartY)
    
    // 수직 드래그가 수평 드래그보다 크면 무시 (페이지 스크롤 방지)
    if (deltaY > Math.abs(deltaX)) {
      setIsDragging(false)
      setTimeout(() => setIsAutoSliding(true), 3000)
      return
    }
    
    if (Math.abs(deltaX) > 50) { // 최소 드래그 거리
      if (deltaX > 0) {
        // 오른쪽으로 드래그 - 이전 이벤트
        setCurrentEventIndex((prev) => (prev - 1 + currentEvents.length) % currentEvents.length)
      } else {
        // 왼쪽으로 드래그 - 다음 이벤트
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length)
      }
    }
    
    setIsDragging(false)
    setTimeout(() => setIsAutoSliding(true), 3000)
  }

  // 터치 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setDragStartX(touch.clientX)
    setDragStartY(touch.clientY)
    setIsAutoSliding(false)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - dragStartX
    const deltaY = Math.abs(touch.clientY - dragStartY)
    
    // 수직 스와이프가 수평 스와이프보다 크면 무시
    if (deltaY > Math.abs(deltaX)) {
      setTimeout(() => setIsAutoSliding(true), 3000)
      return
    }
    
    if (Math.abs(deltaX) > 50) { // 최소 스와이프 거리
      if (deltaX > 0) {
        // 오른쪽으로 스와이프 - 이전 이벤트
        setCurrentEventIndex((prev) => (prev - 1 + currentEvents.length) % currentEvents.length)
      } else {
        // 왼쪽으로 스와이프 - 다음 이벤트
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length)
      }
    }
    
    setTimeout(() => setIsAutoSliding(true), 3000)
  }

  // 실제 데이터 로딩 함수들
  const loadCurrentEvents = async () => {
    try {
      // 임시 하드코딩된 이벤트 데이터
      const mockEvents = [
        {
          id: 'event-1',
          title: language === 'ko' ? '한국 비행기 티켓 추첨 이벤트' : 'Evento de Sorteo de Boletos de Avión a Corea',
          description: language === 'ko' ? '커뮤니티에 참여하고 한국 비행기 티켓을 받아가세요!' : '¡Participa en la comunidad y gana boletos de avión a Corea!',
          image: '/misc/event-title.png',
          date: language === 'ko' ? '2026년 말' : 'Fin de año de 2026',
          participants: 324
        },
        {
          id: 'event-2',
          title: language === 'ko' ? 'ACU-POINT 화장품 이벤트' : 'Evento de Cosméticos ACU-POINT',
          description: language === 'ko' ? '가장 많이 사용한 사람에게 매월 선크림 + 마스크팩 세트를 공짜로 드립니다!' : '¡La persona que más use la comunidad recibe un set mensual de protector solar + mascarilla GRATIS!',
          image: '/misc/event-title.png',
          date: language === 'ko' ? '1월부터 매달 진행' : 'Mensual desde enero - ¡GRATIS!',
          participants: 156
        }
      ]
      
      setCurrentEvents(mockEvents)
    } catch (error) {
      console.error('이벤트 로딩 실패:', error)
      setCurrentEvents([])
    }
  }

  const loadHotPosts = async () => {
    try {
      console.log('Loading hot posts from database...')
      
      // 실제 데이터베이스에서 조회수가 높은 게시물 가져오기
      const response = await fetch('/api/galleries/freeboard/posts?sort=views&limit=3')
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Failed to fetch hot posts')
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success && data.posts) {
        // 데이터 포맷팅
        const formattedPosts = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          author: '익명', // 임시로 익명 처리
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          views: post.view_count || 0,
          createdAt: formatTimeAgo(post.created_at),
          category: '자유게시판'
        }))
        
        console.log('Setting hot posts:', formattedPosts)
        // 3개로 제한
        setHotPosts(formattedPosts.slice(0, 3))
      } else {
        console.log('No posts found or API failed')
        setHotPosts([])
      }
      
    } catch (error) {
      console.error('핫 포스트 로딩 실패:', error)
      setHotPosts([])
    }
  }

  const loadPopularTests = async () => {
    try {
      // 실제 심리테스트 데이터
      const actualTests = [
        {
          id: 'mbti-kpop',
          title: language === 'ko' ? 'Test de MBTI con Estrellas K-POP' : 'Test de MBTI con Estrellas K-POP',
          description: language === 'ko' ? 'Descubre tu tipo MBTI y la estrella K-POP que más te representa' : 'Descubre tu tipo MBTI y la estrella K-POP que más te representa',
          participants: 1247,
          image: '/quizzes/mbti-with-kpop-stars/cover/cover.png',
          category: 'personality',
          route: '/quiz/mbti-kpop'
        },
        {
          id: 'idol-position',
          title: language === 'ko' ? '¿Qué posición de idol te queda mejor?' : '¿Qué posición de idol te queda mejor?',
          description: language === 'ko' ? 'Descubre qué posición de ídolo te queda mejor según tu personalidad' : 'Descubre qué posición de ídolo te queda mejor según tu personalidad',
          participants: 892,
          image: '/quizzes/idol-position/thumbnail.png',
          category: 'personality',
          route: '/quiz/idol-position'
        },
        {
          id: 'fortune',
          title: language === 'ko' ? 'Test de Fortuna Personalizada' : 'Test de Fortuna Personalizada',
          description: language === 'ko' ? 'Descubre tu fortuna de hoy basada en tu estado emocional' : 'Descubre tu fortuna de hoy basada en tu estado emocional',
          participants: 567,
          image: '/quizzes/fortune/cover/cover.png',
          category: 'fortune',
          route: '/quiz/fortune'
        },
        {
          id: 'korean-level',
          title: language === 'ko' ? 'Test de Nivel de Coreano' : 'Test de Nivel de Coreano',
          description: language === 'ko' ? 'Prueba tu nivel de coreano desde básico hasta avanzado' : 'Prueba tu nivel de coreano desde básico hasta avanzado',
          participants: 743,
          image: '/quizzes/korean-level/cover/cover.png',
          category: 'language',
          route: '/quiz/korean-level'
        }
      ]
      
      setPopularTests(actualTests)
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
          profileImage: '/quizzes/mbti-with-kpop-stars/celebs/jimin.png',
          isOnline: true
        },
        {
          id: '2',
          name: '이지은',
          profileImage: '/quizzes/mbti-with-kpop-stars/celebs/iu.png',
          isOnline: true
        },
        {
          id: '3',
          name: '박서준',
          profileImage: '/quizzes/mbti-with-kpop-stars/celebs/jungkook.png',
          isOnline: true
        }
      ]
      
      setOnlineUsers(mockUsers)
    } catch (error) {
      console.error('온라인 사용자 로딩 실패:', error)
      setOnlineUsers([])
    }
  }

  const loadRecentStories = async () => {
    try {
      console.log('Loading recent stories...')
      
      const response = await fetch('/api/stories?isPublic=true&limit=6')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Stories data:', data)
      
      if (data.stories && data.stories.length > 0) {
        setRecentStories(data.stories)
      } else {
        console.log('No stories found')
        setRecentStories([])
      }
      
    } catch (error) {
      console.error('최근 스토리 로딩 실패:', error)
      setRecentStories([])
    }
  }

  const loadNotices = async () => {
    try {
      console.log('Loading notices from topic board...')
      
      // 주제별게시판에서 공지사항 가져오기 (공지사항은 보통 제목에 [공지] 또는 특별한 카테고리로 구분)
      const response = await fetch('/api/galleries/freeboard/posts?sort=created_at&limit=10')
      
      if (!response.ok) {
        throw new Error('Failed to fetch notices')
      }
      
      const data = await response.json()
      
      if (data.success && data.posts) {
        // 공지사항 필터링 (제목에 [공지] 포함된 것들)
        const noticePosts = data.posts.filter((post: any) => 
          post.title.includes('[공지]') || 
          post.title.includes('[Notice]') ||
          post.title.includes('[ANUNCIO]') ||
          post.category === '공지사항'
        )
        
        // 데이터 포맷팅
        const formattedNotices = noticePosts.slice(0, 3).map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          author: '관리자', // 공지사항은 관리자가 작성
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          views: post.view_count || 0,
          createdAt: formatTimeAgo(post.created_at),
          category: '공지사항'
        }))
        
        console.log('Setting notices:', formattedNotices)
        setNotices(formattedNotices)
      } else {
        console.log('No notices found')
        setNotices([])
      }
      
    } catch (error) {
      console.error('공지사항 로딩 실패:', error)
      setNotices([])
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
        loadOnlineUsers(),
        loadRecentStories(),
        loadNotices()
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
    <>
      {/* 모바일 버전 - 기존 그대로 */}
      <div className="md:hidden space-y-6 p-4">
      
      {/* 공지사항 - 맨 위에 배치 */}
      {notices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📢</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {language === 'ko' ? '공지사항' : 'Avisos'}
              </h2>
            </div>
            <button
              onClick={() => router.push('/community/freeboard')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {language === 'ko' ? '더보기' : 'Ver Más'}
            </button>
          </div>
          
          <div className="space-y-3">
            {notices.map((notice) => (
              <Card key={notice.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {notice.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {notice.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <span>👁️</span>
                            <span>{notice.views}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>💬</span>
                            <span>{notice.comments}</span>
                          </span>
                        </div>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{notice.createdAt}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 현재 진행 이벤트 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('home.sections.currentEvents')}
          </h2>
        </div>
        
        {currentEvents.length > 0 ? (
          <Card className="relative overflow-hidden rounded-lg">
            <CardContent className="p-0">
              <div 
                id="event-container"
                className="relative h-40 md:h-32 overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentEventIndex * 100}%)` }}
                >
                  {currentEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="w-full flex-shrink-0 cursor-pointer"
                      onClick={() => router.push('/main?tab=event')}
                    >
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-between p-4 md:p-4 hover:shadow-lg transition-shadow rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-base md:text-lg mb-2 md:mb-1">{event.title}</h3>
                          <p className="text-white/90 text-xs md:text-sm mb-3 md:mb-2">{event.description}</p>
                          <div className="flex items-center gap-4">
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

      {/* 최근 스토리 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {language === 'ko' ? '최근 스토리' : 'Historias Recientes'}
            </h2>
          </div>
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            {recentStories.length}개
          </Badge>
        </div>
        
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {recentStories.length > 0 ? (
                recentStories.map((story) => (
                  <div key={story.id} className="flex flex-col items-center min-w-16">
                    <div className="relative">
                      <img
                        src={story.user_profile_image || '/icons/default-avatar.png'}
                        alt={story.user_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center max-w-16 truncate">
                      {story.user_name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center w-full py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-400 text-xl">📸</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ko' ? '아직 스토리가 없습니다' : 'No hay historias aún'}
                  </p>
                </div>
              )}
            </div>
            
            {/* 반투명 모자이크 효과와 더보기 텍스트 */}
            <div className="absolute top-0 right-0 bottom-0 w-16 flex flex-col items-end justify-center pointer-events-none">
              {/* 반투명 모자이크 배경 */}
              <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm"></div>
              
              {/* 더보기 텍스트 - 모자이크 위에 배치, 완전 끝으로 */}
              <span 
                className="relative z-10 text-xs font-medium text-gray-700 dark:text-gray-300 transform rotate-90 whitespace-nowrap cursor-pointer pointer-events-auto hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                onClick={() => router.push('/community/stories')}
              >
                {language === 'ko' ? '더보기' : 'Ver Más'}
              </span>
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
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/community/freeboard')}
              >
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
          <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {popularTests.map((test) => (
              <div 
                key={test.id} 
                className="cursor-pointer group"
                onClick={() => router.push(test.route || '/community/tests')}
              >
                <div className="relative mb-3">
                  <img
                    src={test.image}
                    alt={test.title}
                    className="w-full h-32 md:h-48 lg:h-56 xl:h-64 object-contain rounded-lg"
                  />
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2">
                  {test.title}
                </h3>
                
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <Play className="w-3 h-3" />
                  <span>{formatNumber(test.participants)}명</span>
                </div>
              </div>
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

      {/* 화상채팅 온라인 인원 - 모바일 버전 */}
      {onlineUsers.length > 0 && (
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
      )}
    </div>

        {/* 데스크톱 버전 - 적당한 크기로 조정 */}
        <div className="hidden md:block max-w-6xl mx-auto p-6 pt-20 pb-4">
          <div className="grid grid-cols-12 gap-6">
            {/* 왼쪽 컬럼 (8/12) */}
            <div className="col-span-8 space-y-4">
            
            {/* 공지사항 - 데스크톱 버전 */}
            {notices.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <span className="text-lg">📢</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {language === 'ko' ? '공지사항' : 'Avisos'}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/community/freeboard')}
                  >
                    {language === 'ko' ? '더보기' : 'Ver Más'}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <Card key={notice.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {notice.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                              {notice.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <span>👁️</span>
                                  <span>{notice.views}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>💬</span>
                                  <span>{notice.comments}</span>
                                </span>
                              </div>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{notice.createdAt}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 현재 진행 이벤트 - 데스크톱 전용 대형 슬라이드 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('home.sections.currentEvents')}
                </h2>
              </div>
              
              <Card className="relative shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden bg-transparent border-none rounded-lg">
                <CardContent className="p-0 bg-transparent">
                  <div 
                    id="event-container-desktop"
                    className="relative h-56 overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {currentEvents.length > 0 ? (
                      <div 
                        className="flex transition-transform duration-1000 ease-in-out"
                        style={{ transform: `translateX(-${currentEventIndex * 100}%)` }}
                      >
                        {currentEvents.map((event, index) => (
                          <div
                            key={event.id}
                            className="w-full flex-shrink-0 cursor-pointer"
                            onClick={() => router.push('/main?tab=event')}
                          >
                            <div className="h-full bg-gradient-to-r from-blue-600 via-purple-700 to-pink-600 flex items-center justify-between p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300 rounded-lg">
                              {/* 배경 장식 */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                              
                              <div className="flex-1 relative z-10">
                                <h3 className="text-white font-bold text-lg mb-3 leading-tight">{event.title}</h3>
                                <p className="text-white/90 text-sm mb-4 max-w-2xl leading-relaxed">{event.description}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-white/80 text-sm bg-transparent px-3 py-1 rounded-full">{event.date}</span>
                                </div>
                              </div>
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center relative z-10 flex-shrink-0">
                                <Calendar className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full bg-gradient-to-r from-blue-600 via-purple-700 to-pink-600 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-80" />
                          <p className="text-lg font-medium">
                            {language === 'ko' ? '진행 중인 이벤트가 없습니다' : 'No ongoing events'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* 이벤트 인디케이터 */}
                    {currentEvents.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {currentEvents.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentEventIndex ? 'bg-white shadow-md' : 'bg-white/50 hover:bg-white/70'
                            }`}
                            onClick={() => setCurrentEventIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                    
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 지금 커뮤니티에서 핫한 글 - 데스크톱 전용 3열 그리드 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('home.sections.hotPosts')}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => router.push('/main?tab=community')}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {language === 'ko' ? '더 보기' : 'Ver Más'}
                </Button>
              </div>
              
              {hotPosts.length > 0 ? (
                <div className="space-y-4">
                  {hotPosts.map((post, index) => (
                    <Card 
                      key={post.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 group border-l-4 border-l-red-500 hover:border-l-red-600"
                      onClick={() => router.push('/community/freeboard')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 font-bold text-sm">🔥</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-red-500 font-medium">
                                  <Heart className="w-3 h-3" />
                                  {post.likes}
                                </span>
                                <span className="flex items-center gap-1 text-blue-500 font-medium">
                                  <MessageSquare className="w-3 h-3" />
                                  {post.comments}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 font-medium">
                                  <Eye className="w-3 h-3" />
                                  {formatNumber(post.views)}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-3 h-3" />
                                {post.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="shadow-2xl">
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-xl">
                      {language === 'ko' ? '핫한 게시글이 없습니다' : 'No hay posts populares'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

            {/* 오른쪽 컬럼 (4/12) */}
            <div className="col-span-4 space-y-4">
            {/* 인기 심리테스트 - 데스크톱 전용 사이드바 (위로 이동) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('home.sections.popularTests')}
                </h2>
              </div>
              
              {popularTests.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {popularTests.map((test) => (
                      <div 
                        key={test.id} 
                        className="cursor-pointer group"
                        onClick={() => router.push(test.route || '/community/tests')}
                      >
                        <div className="relative mb-3">
                          <img
                            src={test.image}
                            alt={test.title}
                            className="w-full h-32 md:h-48 lg:h-56 xl:h-64 object-contain rounded-lg"
                          />
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2">
                          {test.title}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Play className="w-3 h-3" />
                          <span>{formatNumber(test.participants)}명</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={() => router.push('/community/tests')}
                    >
                      {language === 'ko' ? '더 보기' : 'Ver Más'}
                    </Button>
                  </div>
                </>
              ) : (
                <Card className="shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <Brain className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {language === 'ko' ? '인기 테스트가 없습니다' : 'No hay tests populares'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 화상채팅 온라인 인원 - 데스크톱 전용 사이드바 */}
            {onlineUsers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('home.sections.videoChatOnline')}
                  </h2>
                </div>
                
                <Card className="shadow-2xl">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                          <div className="relative">
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                              <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">온라인</p>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full h-10 border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => router.push('/main?tab=meet')}
                      >
                        <Users className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-green-600 font-medium text-sm">{t('home.community.seeMore')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>


    </>
  )
}
