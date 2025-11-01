'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
  Play,
  Palette,
  Image as ImageIcon,
  ChevronRight,
  MessageCircle
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  description: string
  image: string
  bannerMobile?: string
  bannerDesktop?: string
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
  category?: string
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
  likes?: number
}

interface GalleryPost {
  id: string
  title: string
  image: string
  likes: number
  createdAt: string
}

interface ChatRoom {
  id: string
  title: string
  image?: string
  memberCount: number
  lastMessageAt?: string
}

interface Poll {
  id: string
  title: string
  image?: string
  totalVotes: number
  createdAt: string
}

interface NewsItem {
  id: string
  title: string
  createdAt: string
  likes: number
  comments: number
  views: number
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
  const [fanArtPosts, setFanArtPosts] = useState<GalleryPost[]>([])
  const [idolPhotoPosts, setIdolPhotoPosts] = useState<GalleryPost[]>([])
  const [hotChatRooms, setHotChatRooms] = useState<ChatRoom[]>([])
  const [currentPolls, setCurrentPolls] = useState<Poll[]>([])
  const [kNoticiaNews, setKNoticiaNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isAutoSliding, setIsAutoSliding] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  
  // 스토리 뷰어 상태
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [viewerStories, setViewerStories] = useState<RecentStory[]>([])
  

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
          id: 'event-2',
          title: language === 'ko' ? 'ACU-POINT 화장품 이벤트' : 'Evento de Cosméticos ACU-POINT',
          description: language === 'ko' ? '가장 많이 사용한 사람에게 매월 선크림 + 마스크팩 세트를 공짜로 드립니다!' : '¡La persona que más use la comunidad recibe un set mensual de protector solar + mascarilla GRATIS!',
          image: '/misc/event-title.png',
          bannerMobile: '/banners/gran-lanzamiento-mobile.png',
          bannerDesktop: '/banners/gran-lanzamiento-desktop.png',
          date: language === 'ko' ? '1월부터 매달 진행' : 'Mensual desde enero - ¡GRATIS!',
          participants: 156
        },
        {
          id: 'event-1',
          title: language === 'ko' ? '한국 비행기 티켓 추첨 이벤트' : 'Evento de Sorteo de Boletos de Avión a Corea',
          description: language === 'ko' ? '커뮤니티에 참여하고 한국 비행기 티켓을 받아가세요!' : '¡Participa en la comunidad y gana boletos de avión a Corea!',
          image: '/misc/event-title.png',
          bannerMobile: '/banners/evento-apartura-mobile.png',
          bannerDesktop: '/banners/evento-apartura-desktop.png',
          date: language === 'ko' ? '2026년 말' : 'Fin de año de 2026',
          participants: 324
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
      const response = await fetch('/api/galleries/freeboard/posts?sort=views&limit=5')
      
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
          category: data.gallery?.name_ko || (language === 'ko' ? '자유게시판' : 'Libre')
        }))
        
        console.log('Setting hot posts:', formattedPosts)
        // 5개로 제한
        setHotPosts(formattedPosts.slice(0, 5))
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
      // API에서 실제 퀴즈 데이터 가져오기
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          const formattedTests = data.data
            .map((quiz: any) => ({
              id: quiz.slug || quiz.id,
              title: quiz.title,
              description: quiz.description,
              participants: quiz.total_participants || 0,
              image: quiz.thumbnail_url || '/misc/placeholder.png',
              category: quiz.category,
              route: `/quiz/${quiz.slug || quiz.id}`
            }))
            // 참여자 순으로 정렬
            .sort((a: any, b: any) => b.participants - a.participants)
          
          // 1줄(3개)만 표시
          setPopularTests(formattedTests.slice(0, 3))
        } else {
          setPopularTests([])
        }
      } else {
        setPopularTests([])
      }
    } catch (error) {
      console.error('인기 테스트 로딩 실패:', error)
      setPopularTests([])
    }
  }

  const loadOnlineUsers = async () => {
    try {
      // 온라인 사용자 API 호출
      const response = await fetch('/api/users/online')
      
      if (!response.ok) {
        console.error('온라인 사용자 API 응답 오류:', response.status)
        setOnlineUsers([])
        return
      }

      const data = await response.json()
      const users = data.users || []

      // API에서 받은 실제 데이터 사용
      setOnlineUsers(users)
      
      console.log('온라인 사용자 로딩 완료:', users)
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
      
      if (data.stories && data.stories.length > 0) {
        setRecentStories(data.stories)
      } else {
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
      return language === 'ko' ? `${days}일 전` : `hace ${days} días`
    }
  }

  const loadGalleryPosts = async () => {
    try {
      // 팬아트 포스트 로드 (fan_art 테이블)
      const fanArtResponse = await fetch('/api/fanart?sort=popular')
      if (fanArtResponse.ok) {
        const fanArtData = await fanArtResponse.json()
        if (fanArtData && Array.isArray(fanArtData)) {
          const formattedPosts = fanArtData.slice(0, 4).map((post: any) => ({
            id: post.id,
            title: post.title || '',
            image: post.image_url || '/misc/placeholder.png',
            likes: post.likes_count || 0,
            createdAt: formatTimeAgo(post.created_at)
          }))
          setFanArtPosts(formattedPosts)
        }
      }

      // 아이돌 사진 포스트 로드 (idol_memes 테이블)
      const idolResponse = await fetch('/api/idol-photos?sort=popular')
      if (idolResponse.ok) {
        const idolData = await idolResponse.json()
        if (idolData && Array.isArray(idolData)) {
          const formattedPosts = idolData.slice(0, 4).map((post: any) => ({
            id: post.id,
            title: post.title || '',
            image: post.media_url || post.thumbnail_url || '/misc/placeholder.png',
            likes: post.likes_count || 0,
            createdAt: formatTimeAgo(post.created_at)
          }))
          setIdolPhotoPosts(formattedPosts)
        }
      }
    } catch (error) {
      console.error('갤러리 포스트 로딩 실패:', error)
    }
  }

  const loadHotChatRoomsAndPolls = async () => {
    try {
      // 채팅방 데이터 로드
      const chatRoomResponse = await fetch('/api/chat/rooms?type=country')
      if (chatRoomResponse.ok) {
        const chatRoomData = await chatRoomResponse.json()
        if (chatRoomData.success && chatRoomData.rooms && chatRoomData.rooms.length > 0) {
          // 참여자 수를 함께 가져오기 위해 별도 처리 필요
          const formattedChatRooms = chatRoomData.rooms.slice(0, 4).map((room: any) => ({
            id: room.id,
            title: room.name || '',
            image: room.thumbnail_url || '/misc/placeholder.png',
            memberCount: 0, // TODO: 실제 참여자 수 가져오기
            lastMessageAt: room.updated_at ? formatTimeAgo(room.updated_at) : undefined
          }))
          setHotChatRooms(formattedChatRooms)
        }
      }

      // 투표 데이터 로드
      const pollResponse = await fetch('/api/polls?status=active&limit=10')
      if (pollResponse.ok) {
        const pollData = await pollResponse.json()
        if (pollData.polls && pollData.polls.length > 0) {
          const formattedPolls = pollData.polls
            .filter((poll: any) => (poll.total_votes || 0) >= 1) // 조회수 1 이상만
            .slice(0, 4)
            .map((poll: any) => ({
              id: poll.id,
              title: poll.question || poll.title,
              image: poll.image_url || poll.options?.[0]?.image_url,
              totalVotes: poll.total_votes || 0,
              createdAt: formatTimeAgo(poll.created_at)
            }))
          setCurrentPolls(formattedPolls)
        }
      }
    } catch (error) {
      console.error('채팅방/투표 로딩 실패:', error)
    }
  }

  const loadKNoticiaNews = async () => {
    try {
      const response = await fetch('/api/news?limit=5')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.newsItems && data.newsItems.length > 0) {
          const formattedNews = data.newsItems.map((news: any) => ({
            id: news.id,
            title: language === 'ko' ? news.title : (news.title_es || news.title),
            createdAt: formatTimeAgo(news.created_at),
            likes: news.like_count || 0,
            comments: news.comment_count || 0,
            views: news.view_count || 0
          }))
          setKNoticiaNews(formattedNews)
        }
      }
    } catch (error) {
      console.error('K-Noticia 뉴스 로딩 실패:', error)
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
        loadNotices(),
        loadGalleryPosts(),
        loadHotChatRoomsAndPolls(),
        loadKNoticiaNews()
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

  const shortenCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      '자유게시판': language === 'ko' ? '자유' : 'Libre',
      'Foro Libre': 'Libre',
      'Libre': 'Libre',
      'K-POP': 'K-POP',
      'Foro K-POP': 'K-POP',
      'K-Drama': 'Drama',
      'Foro K-Drama': 'Drama',
      '뷰티': language === 'ko' ? '뷰티' : 'Beauty',
      'Foro de Belleza': 'Beauty',
      '한국어': language === 'ko' ? '한국어' : 'Coreano',
      'Foro de Coreano': 'Coreano',
      '스페인어': language === 'ko' ? '스페인어' : 'Español',
      'Foro de Español': 'Español'
    }
    return categoryMap[category] || category.substring(0, 6)
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
                      onClick={() => {
                        if (event.id === 'event-2') {
                          router.push('/main?tab=event&show=acu-point-sunscreen')
                        } else {
                          router.push('/main?tab=event')
                        }
                      }}
                    >
                      {/* 모바일 배너 */}
                      <img 
                        src={event.bannerMobile || event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover block min-[430px]:hidden pointer-events-none"
                        draggable={false}
                      />
                      
                      {/* 데스크톱 배너 (430px 이상) */}
                      <img 
                        src={event.bannerDesktop || event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover hidden min-[430px]:block pointer-events-none"
                        draggable={false}
                      />
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

      {/* 공지사항 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500">📢</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('home.sections.announcements')}
          </h2>
        </div>
        
        {/* 공지사항 목록 */}
        <div className="space-y-2">
          {/* 공지사항 1 */}
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push('/community/post?id=notice-1')}>
            <CardContent className="py-1 px-3">
              <div className="flex md:flex-row flex-col md:items-center gap-2 md:gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Badge className="bg-green-100 text-green-700 border-0 px-2 py-0.5 font-medium text-xs">
                    {t('home.sections.announcement')}
                  </Badge>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {language === 'ko' ? 'AMIKO 커뮤니티 이용 안내(필독)' : 'AMIKO Community Guide (Required Reading)'}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>1</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>69</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-gray-500">{language === 'ko' ? '24일 전' : 'hace 24 días'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 공지사항 2 */}
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push('/community/post?id=notice-2')}>
            <CardContent className="py-1 px-3">
              <div className="flex md:flex-row flex-col md:items-center gap-2 md:gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Badge className="bg-green-100 text-green-700 border-0 px-2 py-0.5 font-medium text-xs">
                    {t('home.sections.announcement')}
                  </Badge>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {language === 'ko' ? 'AMIKO 개발 일정 관련 공지사항' : 'AMIKO Development Schedule Announcement'}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>1</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>69</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-gray-500">{language === 'ko' ? '24일 전' : 'hace 24 días'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
        
        {hotPosts.length > 0 ? (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-0">
              <div className="divide-y">
                {hotPosts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-1"
                    onClick={() => router.push('/community/freeboard')}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-700 border-0 px-1.5 py-0.5 font-medium text-[10px] whitespace-nowrap">
                        {shortenCategoryName(post.category || 'Libre')}
                      </Badge>
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span>{post.comments}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(post.views)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                  <span>{formatNumber(test.participants)}{language === 'ko' ? '명' : ''}</span>
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

      {/* 팬아트 & 아이돌 사진 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 팬아트 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/icons/Fan art.png" 
                alt="팬아트" 
                className="w-8 h-8 object-contain"
              />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t('home.sections.fanArt')}
              </h2>
            </div>
            <button 
              onClick={() => router.push('/community/fanart')}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
            >
              <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {fanArtPosts.length > 0 ? (
                  fanArtPosts.slice(0, 4).map((post) => (
                    <div 
                      key={post.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/community/fanart/${post.id}`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span>{post.likes} · {post.createdAt}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4">
                    <img 
                      src="/icons/Fan art.png" 
                      alt="팬아트" 
                      className="w-8 h-8 mx-auto mb-2 opacity-40"
                    />
                    <p className="text-gray-500 text-xs">
                      {language === 'ko' ? '팬아트가 없습니다' : 'No hay fan art'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 아이돌 사진 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/icons/Foto de idol.png" 
                alt="아이돌 사진" 
                className="w-8 h-8 object-contain"
              />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t('home.sections.idolPhotos')}
              </h2>
            </div>
            <button 
              onClick={() => router.push('/community/idol-photos')}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
            >
              <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {idolPhotoPosts.length > 0 ? (
                  idolPhotoPosts.slice(0, 4).map((post) => (
                    <div 
                      key={post.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/community/idol-photos/${post.id}`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span>{post.likes} · {post.createdAt}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4">
                    <img 
                      src="/icons/Foto de idol.png" 
                      alt="아이돌 사진" 
                      className="w-8 h-8 mx-auto mb-2 opacity-40"
                    />
                    <p className="text-gray-500 text-xs">
                      {language === 'ko' ? '아이돌 사진이 없습니다' : 'No hay fotos de ídolos'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 화상채팅 온라인 인원 - 모바일 버전 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.sections.videoChatOnline')}
            </h2>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {onlineUsers.length}{language === 'ko' ? '명' : ''}
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user) => (
                  <div key={user.id} className="flex flex-col items-center min-w-16">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-semibold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                      {user.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full py-4 text-sm text-gray-400">
                  {language === 'ko' ? '현재 온라인 사용자가 없습니다' : 'No hay usuarios en línea'}
                </div>
              )}
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

      {/* 지금 핫 한 채팅방 & 지금 투표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 지금 핫 한 채팅방 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/icons/Zona de K-Cultura.png" 
                alt="K-Culture Zone" 
                className="w-5 h-5 object-contain"
              />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t('home.sections.hotChatRooms')}
              </h2>
            </div>
            <button 
              onClick={() => router.push('/community/k-chat')}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
            >
              <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {hotChatRooms.length > 0 ? (
                  hotChatRooms.slice(0, 4).map((room) => (
                    <div 
                      key={room.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/community/k-chat`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                        <img
                          src={room.image || '/misc/placeholder.png'}
                          alt={room.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {room.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{room.memberCount} · {room.lastMessageAt || '지금'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4">
                    <img 
                      src="/icons/Zona de K-Cultura.png" 
                      alt="K-Culture Zone" 
                      className="w-8 h-8 mx-auto mb-2 opacity-40"
                    />
                    <p className="text-gray-500 text-xs">
                      {language === 'ko' ? '핫 한 채팅방이 없습니다' : 'No hay chats calientes'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 지금 투표 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/icons/Zona de K-Cultura.png" 
                alt="K-Culture Zone" 
                className="w-5 h-5 object-contain"
              />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t('home.sections.currentPolls')}
              </h2>
            </div>
            <button 
              onClick={() => router.push('/community/polls')}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
            >
              <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {currentPolls.length > 0 ? (
                  currentPolls.slice(0, 4).map((poll) => (
                    <div 
                      key={poll.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/community/polls`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                        {poll.image ? (
                          <img
                            src={poll.image}
                            alt={poll.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                            <img
                              src="/icons/Encuestas.png"
                              alt="Poll"
                              className="w-16 h-16 object-contain opacity-60"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {poll.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp className="w-3 h-3" />
                        <span>{poll.totalVotes} · {poll.createdAt}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4">
                    <img 
                      src="/icons/Zona de K-Cultura.png" 
                      alt="K-Culture Zone" 
                      className="w-8 h-8 mx-auto mb-2 opacity-40"
                    />
                    <p className="text-gray-500 text-xs">
                      {language === 'ko' ? '진행 중인 투표가 없습니다' : 'No hay votaciones activas'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 오늘의 K-Noticia - 모바일 버전 */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-center">
          <img 
            src="/icons/k-magazine.png" 
            alt="K-Noticia" 
            className="w-5 h-5 object-contain mr-2"
          />
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t('home.sections.kNoticia')}
          </h2>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {kNoticiaNews.length > 0 ? (
                kNoticiaNews.map((news) => (
                  <div 
                    key={news.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-1"
                    onClick={() => router.push(`/community/news/${news.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-700 border-0 px-1.5 py-0.5 font-medium text-[10px] whitespace-nowrap">
                        {t('home.sections.news')}
                      </Badge>
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                        {news.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span>{news.likes}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span>{news.comments}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(news.views)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <img 
                    src="/icons/k-magazine.png" 
                    alt="K-Noticia" 
                    className="w-8 h-8 mx-auto mb-2 opacity-40"
                  />
                  <p className="text-gray-500 text-xs">
                    {language === 'ko' ? '뉴스가 없습니다' : 'No hay noticias'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 스토리 - 그리드 레이아웃 */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-center">
          <img 
            src="/icons/story.png" 
            alt="Stories" 
            className="w-5 h-5 object-contain mr-2"
          />
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t('home.sections.recentStories')}
          </h2>
        </div>

        <Card>
          <CardContent className="p-3">
            {recentStories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {recentStories.slice(0, 8).map((story, idx) => (
                  <div 
                    key={story.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      const userStories = recentStories.filter(s => s.user_name === story.user_name)
                      if (userStories.length > 0) {
                        setViewerStories(userStories)
                        setSelectedStoryIndex(userStories.findIndex(s => s.id === story.id))
                        setShowStoryViewer(true)
                      }
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                      {story.image_url ? (
                        <img
                          src={story.image_url}
                          alt={story.user_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">
                            {story.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 mb-1 line-clamp-1">
                      {story.user_name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span>{story.likes || 0}</span>
                      <span className="text-gray-400">·</span>
                      <span>{formatTimeAgo(story.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <img 
                  src="/icons/story.png" 
                  alt="Stories" 
                  className="w-8 h-8 mx-auto mb-2 opacity-40"
                />
                <p className="text-gray-500 text-xs">
                  {language === 'ko' ? '스토리가 없습니다' : 'No hay historias'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AMIKO 최근 영상 */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('home.sections.recentVideos')}
            </h2>
          </div>
          <button 
            onClick={() => router.push('/about')}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
          >
            <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-3">
              {/* 두 번 표시 */}
              <div 
                className="cursor-pointer group"
                onClick={() => router.push('/about')}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                  <img
                    src="https://img.youtube.com/vi/do4aDyGZmgM/maxresdefault.jpg"
                    alt="AMIKO Introduction"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
                    <div className="text-white text-[8px] font-bold">
                      {language === 'ko' ? 'AMIKO는 어떤 플랫폼인가요?' : 'QUÉ TIPO DE PLATAFORMA ES AMIKO?'}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[6px] px-1 rounded">
                    3:29
                  </div>
                </div>
              </div>
              
              <div 
                className="cursor-pointer group"
                onClick={() => router.push('/about')}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                  <img
                    src="https://img.youtube.com/vi/do4aDyGZmgM/maxresdefault.jpg"
                    alt="AMIKO Introduction"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
                    <div className="text-white text-[8px] font-bold">
                      {language === 'ko' ? 'AMIKO는 어떤 플랫폼인가요?' : 'QUÉ TIPO DE PLATAFORMA ES AMIKO?'}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[6px] px-1 rounded">
                    3:29
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AMIKO 제휴사 */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('home.sections.partners')}
            </h2>
          </div>
          <button 
            onClick={() => router.push('/community/partners')}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
          >
            <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-3">
              <div 
                className="cursor-pointer group"
                onClick={() => router.push('/community/partners')}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <img
                    src="/logos/para-fans-logo.jpg"
                    alt="Para Fans"
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                    draggable={false}
                  />
                </div>
              </div>
              
              <div 
                className="cursor-pointer group"
                onClick={() => router.push('/community/partners')}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <img
                    src="/logos/acu-point-logo.jpg"
                    alt="Acu-Point"
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                    draggable={false}
                  />
                </div>
              </div>

              <div 
                className="cursor-pointer group"
                onClick={() => router.push('/community/partners')}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <img
                    src="/logos/socios-placeholder.jpg"
                    alt="Partner"
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

        {/* 데스크톱 버전 - 한 줄 세로 레이아웃 */}
        <div className="hidden md:block max-w-4xl mx-auto p-6 pt-20 pb-4">
          <div className="space-y-4">
            
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
                            onClick={() => {
                              if (event.id === 'event-2') {
                                router.push('/main?tab=event&show=acu-point-sunscreen')
                              } else {
                                router.push('/main?tab=event')
                              }
                            }}
                          >
                            {/* 배너 이미지 (430px 기준으로 변경) */}
                            <img 
                              src={event.bannerDesktop || event.image} 
                              alt={event.title}
                              className="w-full h-full object-cover rounded-lg hidden min-[430px]:block pointer-events-none"
                              draggable={false}
                            />
                            <img 
                              src={event.bannerMobile || event.image} 
                              alt={event.title}
                              className="w-full h-full object-cover rounded-lg block min-[430px]:hidden pointer-events-none"
                              draggable={false}
                            />
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

            {/* 공지사항 - 데스크톱 버전 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-green-500">📢</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {language === 'ko' ? '공지' : '공지'}
                </h2>
              </div>
              
              <div className="space-y-2">
                {/* 공지사항 1 */}
                <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push('/community/post?id=notice-1')}>
                  <CardContent className="py-1 px-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-700 border-0 px-2 py-0.5 font-medium text-xs">
                        {language === 'ko' ? '공지' : '공지'}
                      </Badge>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                        {language === 'ko' ? 'AMIKO 커뮤니티 이용 안내(필독)' : 'AMIKO Community Guide (Required Reading)'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span>1</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>69</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-gray-500">{language === 'ko' ? '24일 전' : 'hace 24 días'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 공지사항 2 */}
                <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push('/community/post?id=notice-2')}>
                  <CardContent className="py-1 px-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-700 border-0 px-2 py-0.5 font-medium text-xs">
                        {language === 'ko' ? '공지' : '공지'}
                      </Badge>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                        {language === 'ko' ? 'AMIKO 개발 일정 관련 공지사항' : 'AMIKO Development Schedule Announcement'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span>1</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>69</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-gray-500">{language === 'ko' ? '24일 전' : 'hace 24 días'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {hotPosts.map((post, index) => (
                        <div 
                          key={post.id} 
                          className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-1"
                          onClick={() => router.push('/community/freeboard')}
                        >
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gray-100 text-gray-700 border-0 px-2 py-0.5 font-medium text-xs">
                              {post.category || 'Libre'}
                            </Badge>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <span>{post.comments}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{formatNumber(post.views)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-gray-500">{post.createdAt}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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

            {/* 인기 심리테스트 */}
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

            {/* 팬아트 & 아이돌 사진 - 데스크톱 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 팬아트 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/icons/Fan art.png" 
                      alt="팬아트" 
                      className="w-8 h-8 object-contain"
                    />
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      팬아트
                    </h2>
                  </div>
                  <button 
                    onClick={() => router.push('/community/fanart')}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
                  >
                    <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {fanArtPosts.length > 0 ? (
                        fanArtPosts.slice(0, 4).map((post) => (
                          <div 
                            key={post.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/community/fanart/${post.id}`)}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Heart className="w-3 h-3" />
                              <span>{post.likes} · {post.createdAt}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4">
                          <img 
                            src="/icons/Fan art.png" 
                            alt="팬아트" 
                            className="w-8 h-8 mx-auto mb-2 opacity-40"
                          />
                          <p className="text-gray-500 text-xs">
                            {language === 'ko' ? '팬아트가 없습니다' : 'No hay fan art'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 아이돌 사진 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/icons/Foto de idol.png" 
                      alt="아이돌 사진" 
                      className="w-8 h-8 object-contain"
                    />
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      아이돌 사진
                    </h2>
                  </div>
                  <button 
                    onClick={() => router.push('/community/idol-photos')}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
                  >
                    <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {idolPhotoPosts.length > 0 ? (
                        idolPhotoPosts.slice(0, 4).map((post) => (
                          <div 
                            key={post.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/community/idol-photos/${post.id}`)}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Heart className="w-3 h-3" />
                              <span>{post.likes} · {post.createdAt}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4">
                          <img 
                            src="/icons/Foto de idol.png" 
                            alt="아이돌 사진" 
                            className="w-8 h-8 mx-auto mb-2 opacity-40"
                          />
                          <p className="text-gray-500 text-xs">
                            {language === 'ko' ? '아이돌 사진이 없습니다' : 'No hay fotos de ídolos'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 화상채팅 온라인 인원 - 데스크톱 전용 사이드바 */}
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
                    {onlineUsers.length > 0 ? (
                      onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                          <div className="relative">
                            <Avatar className="w-12 h-12 shadow-md border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform">
                              <AvatarImage src={user.profileImage} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm font-semibold">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                              <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">{t('home.community.online')}</p>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center py-4 text-sm text-gray-400">
                        {language === 'ko' ? '현재 온라인 사용자가 없습니다' : 'No hay usuarios en línea'}
                      </div>
                    )}
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

            {/* 지금 핫 한 채팅방 & 지금 투표 - 데스크톱 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 지금 핫 한 채팅방 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {language === 'ko' ? '지금 핫 한 채팅방!' : '¡Chats Calientes!'}
                    </h2>
                  </div>
                  <button 
                    onClick={() => router.push('/main?tab=community')}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
                  >
                    <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {hotChatRooms.length > 0 ? (
                        hotChatRooms.slice(0, 4).map((room) => (
                          <div 
                            key={room.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/main?tab=community&room=${room.id}`)}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                              <img
                                src={room.image || '/misc/placeholder.png'}
                                alt={room.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {room.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" />
                              <span>{room.memberCount} · {room.lastMessageAt || '지금'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4">
                          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">
                            {language === 'ko' ? '핫 한 채팅방이 없습니다' : 'No hay chats calientes'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 지금 투표 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {language === 'ko' ? '지금 투표!' : '¡Vota Ahora!'}
                    </h2>
                  </div>
                  <button 
                    onClick={() => router.push('/main?tab=community')}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
                  >
                    <span>{language === 'ko' ? '더 보기' : 'Ver Más'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {currentPolls.length > 0 ? (
                        currentPolls.slice(0, 4).map((poll) => (
                          <div 
                            key={poll.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/main?tab=community&poll=${poll.id}`)}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                              <img
                                src={poll.image || '/misc/placeholder.png'}
                                alt={poll.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {poll.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <TrendingUp className="w-3 h-3" />
                              <span>{poll.totalVotes} · {poll.createdAt}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4">
                          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">
                            {language === 'ko' ? '진행 중인 투표가 없습니다' : 'No hay votaciones activas'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* 스토리 뷰어 모달 */}
        <Dialog open={showStoryViewer} onOpenChange={setShowStoryViewer}>
          <DialogContent className="max-w-sm w-[320px] max-h-[500px] bg-black border-none p-0 rounded-2xl overflow-hidden">
            <DialogTitle className="sr-only">Story Viewer</DialogTitle>
            <DialogDescription className="sr-only">
              Viewing story from {viewerStories[selectedStoryIndex]?.user_name || 'User'}
            </DialogDescription>
            {viewerStories.length > 0 && (
              <>
                {/* 진행 바 */}
                <div className="absolute top-0 left-0 right-0 z-[10005] p-3 flex gap-1">
                  {viewerStories.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div
                        className={`h-full transition-all duration-500 ${
                          index < selectedStoryIndex
                            ? 'bg-white'
                            : index === selectedStoryIndex
                            ? 'bg-white animate-pulse'
                            : 'bg-white/30'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* 스토리 이미지 */}
                {viewerStories[selectedStoryIndex] && (
                  <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: '9/16', minHeight: '320px' }}>
                    <img
                      src={viewerStories[selectedStoryIndex].image_url || '/icons/default-avatar.png'}
                      alt={viewerStories[selectedStoryIndex].user_name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 사용자 정보 */}
                    <div className="absolute top-12 left-3 flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                        {viewerStories[selectedStoryIndex].user_profile_image ? (
                          <img
                            src={viewerStories[selectedStoryIndex].user_profile_image}
                            alt={viewerStories[selectedStoryIndex].user_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {viewerStories[selectedStoryIndex].user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{viewerStories[selectedStoryIndex].user_name}</p>
                      </div>
                    </div>
                    
                    {/* 텍스트 컨텐츠 */}
                    {viewerStories[selectedStoryIndex].text_content && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-sm">{viewerStories[selectedStoryIndex].text_content}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 닫기 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20 z-[10006]"
                  onClick={() => setShowStoryViewer(false)}
                >
                  <span className="text-2xl">×</span>
                </Button>

                {/* 좌우 네비게이션 */}
                {selectedStoryIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-[10006] w-10 h-10"
                    onClick={() => setSelectedStoryIndex(selectedStoryIndex - 1)}
                  >
                    ‹
                  </Button>
                )}
                {selectedStoryIndex < viewerStories.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-[10006] w-10 h-10"
                    onClick={() => setSelectedStoryIndex(selectedStoryIndex + 1)}
                  >
                    ›
                  </Button>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
    </>
  )
}
