'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  User, 
  Clock, 
  Star,
  Eye,
  Target,
  ImageIcon,
  Camera
} from 'lucide-react'
import CommunityMain from './CommunityMain'
import BoardList from './BoardList'
import NewsDetail from './NewsDetail'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import AuthConfirmDialog from '@/components/common/AuthConfirmDialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { toast } from 'sonner'
import QuizzesTab from './QuizzesTab'

// 포인트 시스템 정의
const pointSystem = {
  korean: {
    question: 5,
    answer: 5,
    story: 5,
    freeboard: 2,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  },
  latin: {
    question: 5,
    answer: 5,
    story: 5,
    freeboard: 2,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  }
}

// 카테고리 정의 함수
const getCategories = (t: (key: string) => string) => [
  { id: 'free', name: t('communityTab.categories.free'), icon: '💬', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'kpop', name: 'K-POP게시판', icon: '🎵', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'kdrama', name: 'K-Drama게시판', icon: '📺', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'beauty', name: t('communityTab.categories.beauty'), icon: '💄', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'korean', name: '한국어', icon: '🇰🇷', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'spanish', name: '스페인어', icon: '🇪🇸', color: 'bg-red-100 text-red-700 border-red-300' }
]

// 목업 데이터 - 질문
const mockQuestions = [
  {
    id: 1,
    title: '한국 화장품 브랜드 추천해주세요!',
    preview: '한국에 처음 와서 화장품을 사려고 하는데, 어떤 브랜드가 좋을까요? 피부가 민감해서...',
    author: '마리아',
    authorType: 'latin',
    category: 'beauty',
    tags: ['화장품', '민감성피부', '추천'],
    upvotes: 12,
    answers: 5,
    views: 89,
    createdAt: '2024-01-15T10:30:00Z',
    isSolved: false
  },
  {
    id: 2,
    title: '서울에서 데이트하기 좋은 곳',
    preview: '여자친구와 서울에서 데이트할 계획인데, 로맨틱하고 특별한 장소가 있을까요?',
    author: '카를로스',
    authorType: 'latin',
    category: 'travel',
    tags: ['데이트', '서울', '로맨틱'],
    upvotes: 8,
    answers: 3,
    views: 67,
    createdAt: '2024-01-15T09:15:00Z',
    isSolved: true
  },
  {
    id: 3,
    title: '한국 전통 음식 맛집 추천',
    preview: '한국의 전통 음식을 제대로 맛볼 수 있는 맛집을 찾고 있어요. 특히 비빔밥과 김치찌개...',
    author: '김민지',
    authorType: 'korean',
    category: 'culture',
    tags: ['전통음식', '맛집', '비빔밥', '김치찌개'],
    upvotes: 15,
    answers: 7,
    views: 124,
    createdAt: '2024-01-15T08:45:00Z',
    isSolved: false
  },
  {
    id: 4,
    title: '한국 패션 트렌드 2024',
    preview: '올해 한국에서 유행하는 패션 아이템이나 스타일이 궁금해요. 어떤 것이 핫할까요?',
    author: '소피아',
    authorType: 'latin',
    category: 'fashion',
    tags: ['패션', '트렌드', '2024', '한국스타일'],
    upvotes: 6,
    answers: 2,
    views: 45,
    createdAt: '2024-01-15T07:20:00Z',
    isSolved: false
  }
]

// 목업 데이터 - 답변
const mockAnswers = [
  {
    id: 1,
    questionId: 1,
    content: '민감성 피부라면 에뛰드하우스나 이니스프리가 좋아요! 특히 알로에 성분이 들어간 제품들이...',
    author: '김수진',
    authorType: 'korean',
    upvotes: 8,
    isAccepted: false,
    createdAt: '2024-01-15T11:00:00Z'
  },
  {
    id: 2,
    questionId: 1,
    content: '닥터벨벳도 추천해요. 약국에서 파는 브랜드라서 성분이 안전하고 피부에 자극이 적어요.',
    author: '박지영',
    authorType: 'korean',
    upvotes: 5,
    isAccepted: true,
    createdAt: '2024-01-15T11:30:00Z'
  }
]

// 목업 데이터 - 오늘의 활동
const mockTodayActivity = {
  questions: 2,
  answers: 5,
  points: 18,
  upvotes: 3
}

interface CommunityTabProps {
  onViewChange?: (view: string) => void
}

export default function CommunityTab({ onViewChange }: CommunityTabProps = {}) {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  
  // 운영진 상태 관리
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // 운영자 권한 확인 함수
  const checkAdminStatus = () => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    
    // 운영자 이메일 목록 (실제 운영자 이메일로 변경 필요)
    const adminEmails = [
      'admin@amiko.com',
      'editor@amiko.com',
      'manager@amiko.com'
    ]
    
    // 운영자 ID 목록 (실제 운영자 ID로 변경 필요)
    const adminIds = [
      '66623263-4c1d-4dce-85a7-cc1b21d01f70' // 현재 사용자 ID
    ]
    
    const isAdminUser = adminEmails.includes(user.email) || adminIds.includes(user.id)
    setIsAdmin(isAdminUser)
    
    console.log('운영자 권한 확인:', {
      userId: user.id,
      email: user.email,
      isAdmin: isAdminUser
    })
  }
  const router = useRouter()
  
  // 언어 설정 디버깅
  console.log('현재 언어 설정:', language)
  console.log('스토리 번역:', t('community.story'))

  // 운영진 상태 확인
  useEffect(() => {
    checkAdminStatus()
  }, [user])

  // 임시 디버깅: 운영진 상태 출력
  console.log('CommunityTab 현재 운영진 상태:', isAdmin)
  
  // 사용자 상태 디버깅
  console.log('사용자 상태:', { 
    user: !!user, 
    userId: user?.id, 
    token: !!token 
  })
  const searchParams = useSearchParams()
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('freeboard')
  const [currentView, setCurrentView] = useState('home') // 'home', 'freeboard', 'news', 'qa', 'tests'
  // 내부 커뮤니티 탭 URL 파라미터 (cTab) 사용
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showAnswerDrawer, setShowAnswerDrawer] = useState(false)
  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [showNewsDetail, setShowNewsDetail] = useState(false)
  const [showSpanishNews, setShowSpanishNews] = useState(false) // 뉴스 번역 상태
  const [isTranslating, setIsTranslating] = useState(false) // 번역 중 상태
  
  // 글쓰기 모달 상태
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeCategory, setWriteCategory] = useState('free')
  const [writeLoading, setWriteLoading] = useState(false)
  
  // 언어 변경 시 자동 번역 처리
  useEffect(() => {
    if (language === 'es' && !showSpanishNews) {
      // 스페인어로 변경되었고 현재 한국어 뉴스가 표시 중이면 자동 번역 시작
      setIsTranslating(true)
      
      // 번역 시뮬레이션 (실제로는 API 호출)
      setTimeout(() => {
        setShowSpanishNews(true)
        setIsTranslating(false)
      }, 1500) // 1.5초 후 번역 완료
    } else if (language === 'ko' && showSpanishNews) {
      // 한국어로 변경되었고 현재 스페인어 뉴스가 표시 중이면 한국어로 복원
      setShowSpanishNews(false)
      setIsTranslating(false)
    }
  }, [language, showSpanishNews])
  
  // 글쓰기 함수
  const handleWritePost = async () => {
    if (!writeTitle.trim() || !writeContent.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    const currentUser = user
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      window.location.href = '/sign-in'
      return
    }

    setWriteLoading(true)
    try {
      // 토큰 가져오기 - 여러 방법 시도
      let currentToken = null
      
      try {
        // 방법 1: 직접 토큰
        currentToken = localStorage.getItem('token')
        
        // 방법 2: 세션에서 토큰 추출
        if (!currentToken) {
          const storedSession = localStorage.getItem('amiko_session')
          if (storedSession) {
            const sessionData = JSON.parse(storedSession)
            currentToken = sessionData.access_token || sessionData.token
          }
        }
        
        // 방법 3: Supabase 세션에서 토큰 추출
        if (!currentToken && (user as any)?.access_token) {
          currentToken = (user as any).access_token
        }
        
        console.log('토큰 확인:', { 
          hasToken: !!currentToken, 
          tokenLength: currentToken?.length,
          userId: user?.id,
          userEmail: user?.email,
          userFullName: user?.user_metadata?.full_name
        })
        
      } catch (error) {
        console.error('토큰 가져오기 실패:', error)
      }

      if (!currentToken && !isAdmin) {
        alert('로그인이 필요합니다.')
        return
      }

      // 운영자 권한이 있으면 토큰 없이도 요청 가능
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (currentToken) {
        headers['Authorization'] = `Bearer ${encodeURIComponent(currentToken)}`
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gallery_id: 'free', // 자유게시판 갤러리 ID 또는 slug
          title: writeTitle,
          content: writeContent,
          images: [],
          admin_override: isAdmin ? 'admin@amiko.com' : undefined, // 운영자 권한 확인
          user_id: user?.id // 실제 사용자 ID 추가
        })
      })

      if (response.ok) {
        alert('게시글이 작성되었습니다!')
        setShowWriteModal(false)
        setWriteTitle('')
        setWriteContent('')
        setWriteCategory('free')
        // 게시글 목록 새로고침
        setRefreshTrigger(prev => prev + 1)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('게시글 작성 실패:', errorData)
        alert(errorData.error || '게시글 작성에 실패했습니다.' + (errorData.details ? `\n상세: ${errorData.details}` : ''))
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error)
      alert('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setWriteLoading(false)
    }
  }
  
  // 뉴스 탭 활성화 시 실제 뉴스 로드
  useEffect(() => {
    if (currentView === 'news' && newsData.length === 0) {
      fetchRealNews()
    }
  }, [currentView])
  const [showStoryUploadModal, setShowStoryUploadModal] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storyText, setStoryText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedStory, setSelectedStory] = useState<any>(null)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedStoryForComment, setSelectedStoryForComment] = useState<any>(null)
  const [commentText, setCommentText] = useState('')
  
  // 뉴스 작성 모달 상태
  const [showNewsWriteModal, setShowNewsWriteModal] = useState(false)
  const [showNewsEditModal, setShowNewsEditModal] = useState(false)
  const [editingNews, setEditingNews] = useState<any>(null)
  const [newsWriteForm, setNewsWriteForm] = useState({
    title: '',
    title_es: '',
    content: '',
    content_es: '',
    source: '',
    author: '',
    category: 'entertainment'
  })
  const [newsWriteLoading, setNewsWriteLoading] = useState(false)
  
  // 이미지 관련 상태
  const [uploadedImages, setUploadedImages] = useState<Array<{url: string, name: string}>>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')
  
  // 뉴스 데이터 상태
  const [newsData, setNewsData] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  
  // 실제 뉴스 데이터 (임시 - API 호출로 대체 예정)
  const tempNewsData = [
    {
      id: 1,
      title: '"한국 문화가 세계를 휩쓸고 있다!" 글로벌 K-콘텐츠 열풍',
      title_es: '"¡La cultura coreana está arrasando el mundo!" Torbellino global de contenido K',
      source: 'NewsWA',
      date: '2025.09.18',
      thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
      content: `한국의 전통문화와 현대문화가 조화롭게 발전하고 있습니다. K-팝, K-드라마, K-푸드 등 한국 문화 콘텐츠가 전 세계적으로 큰 인기를 얻고 있으며, 이를 통해 한국의 문화적 가치가 더욱 널리 알려지고 있습니다.

최근 넷플릭스에서 한국 드라마가 상위권을 차지하고 있고, BTS, 뉴진스 등 K-팝 아티스트들이 빌보드 차트를 휩쓸고 있습니다. 또한 김치, 비빔밥 등 한국 음식도 전 세계인의 입맛을 사로잡고 있습니다.

이러한 한국 문화의 글로벌 확산은 단순한 트렌드를 넘어서 한국의 소프트 파워를 강화하고 있으며, 문화적 교류와 이해를 증진시키는 중요한 역할을 하고 있습니다.`,
      content_es: `La cultura tradicional y moderna de Corea se está desarrollando de manera armoniosa. El contenido cultural coreano como K-pop, K-drama, K-food está ganando gran popularidad en todo el mundo, y a través de esto, los valores culturales de Corea se están dando a conocer más ampliamente.

Recientemente, los dramas coreanos han ocupado los primeros lugares en Netflix, y artistas de K-pop como BTS, NewJeans están arrasando en las listas de Billboard. Además, la comida coreana como kimchi y bibimbap también está conquistando el paladar de personas de todo el mundo.

Esta expansión global de la cultura coreana va más allá de una simple tendencia, fortaleciendo el poder blando de Corea y desempeñando un papel importante en la promoción del intercambio cultural y la comprensión.`,
      author: '김지혜',
      views: 1250,
      likes: 45,
      comments: 12
    },
    {
      id: 2,
      title: '"김치가 세계를 정복했다!" K-푸드 열풍의 숨겨진 비밀',
      source: '서울En',
      date: '2025.09.18',
      thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop&crop=face',
      content: `한국 음식의 세계적 인기가 계속해서 높아지고 있습니다. 김치, 비빔밥, 불고기 등 전통 한국 요리뿐만 아니라 한국식 치킨, 떡볶이, 라면 등 간식류도 해외에서 큰 사랑을 받고 있습니다.

특히 김치는 세계 5대 건강식품으로 선정되면서 전 세계인의 관심을 받고 있습니다. 발효 과정에서 생성되는 유익한 박테리아들이 건강에 도움이 된다는 연구 결과가 나오면서 더욱 주목받고 있습니다.

한국 정부도 K-푸드의 글로벌 확산을 위해 다양한 정책을 추진하고 있으며, 해외 한국 식당의 수가 급증하고 있습니다.`,
      author: '박민수',
      views: 980,
      likes: 32,
      comments: 8
    },
    {
      id: 3,
      title: '"한국이 다시 핫하다!" 외국인 관광객 몰려드는 충격 현황',
      source: 'NewsWA',
      date: '2025.09.18',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      content: `한국 관광산업이 코로나19 이후 빠르게 회복되고 있습니다. 서울, 부산, 제주도 등 주요 관광지에 외국인 관광객들이 다시 찾아오고 있으며, 한국의 아름다운 자연과 문화를 경험하고자 하는 관심이 높아지고 있습니다.

특히 한류 콘텐츠를 통해 한국에 관심을 갖게 된 젊은 관광객들이 크게 증가하고 있습니다. K-팝 콘서트, 드라마 촬영지 투어, 한국 전통문화 체험 등이 인기 관광 상품으로 떠오르고 있습니다.

정부는 관광 인프라 확충과 다양한 관광 상품 개발에 힘쓰고 있으며, 앞으로도 한국 관광산업의 성장이 기대됩니다.`,
      author: '이수진',
      views: 1560,
      likes: 67,
      comments: 15
    },
    {
      id: 4,
      title: '"한국 기술이 세계 1위다!" 삼성·LG가 세계를 뒤흔드는 이유',
      source: '서울En',
      date: '2025.09.18',
      thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      content: `한국의 기술 혁신이 세계를 선도하고 있습니다. 반도체, 배터리, 디스플레이 등 첨단 기술 분야에서 한국 기업들의 경쟁력이 더욱 강화되고 있으며, AI, 자율주행, 로봇 등 미래 기술 개발에도 적극적으로 투자하고 있습니다.

삼성전자는 메모리 반도체 분야에서 세계 1위를 유지하고 있으며, LG에너지솔루션은 전기차 배터리 시장에서 강력한 경쟁력을 보이고 있습니다. 또한 SK하이닉스, 현대자동차 등도 각 분야에서 혁신적인 기술을 선보이고 있습니다.

정부는 반도체, 배터리, 디스플레이를 3대 핵심 기술로 지정하고 집중 투자하고 있으며, 한국의 기술력이 더욱 발전할 것으로 기대됩니다.`,
      author: '최영호',
      views: 2100,
      likes: 89,
      comments: 23
    },
    {
      id: 5,
      title: '"한국 배우들이 할리우드를 휩쓴다!" K-드라마 열풍의 진실',
      source: 'NewsWA',
      date: '2025.09.18',
      thumbnail: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face',
      content: `한국 드라마와 영화가 전 세계에서 큰 인기를 얻고 있습니다. 넷플릭스, 디즈니+ 등 글로벌 플랫폼에서 한국 콘텐츠가 상위권을 차지하고 있으며, 한국 배우들의 해외 진출도 활발해지고 있습니다.

최근 '오징어 게임', '기생충' 등이 아카데미상과 에미상을 수상하면서 한국 콘텐츠의 위상이 더욱 높아졌습니다. 또한 송강호, 이정재, 박해진 등 한국 배우들이 할리우드에서 활발하게 활동하고 있습니다.

한국 드라마의 성공 요인으로는 뛰어난 스토리텔링, 세련된 연출, 탄탄한 연기력 등이 꼽히고 있으며, 앞으로도 한국 콘텐츠의 글로벌 확산이 지속될 것으로 예상됩니다.`,
      author: '정미영',
      views: 1890,
      likes: 76,
      comments: 19
    },
    {
      id: 6,
      title: '"BTS 다음은 누구?" K-팝 4세대 아이돌들의 충격적인 성과',
      source: '서울En',
      date: '2025.09.18',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
      content: `K-팝 4세대 아이돌들이 전 세계적으로 큰 인기를 얻고 있습니다. 뉴진스, IVE, (여자)아이들 등이 빌보드 차트에 진입하며 한국 음악의 위상을 더욱 높이고 있습니다.

특히 뉴진스는 'Attention', 'Hype Boy' 등으로 전 세계적인 인기를 얻었고, IVE는 'Love Dive', 'After LIKE' 등으로 차트를 휩쓸었습니다. 또한 (여자)아이들, aespa, ITZY 등도 각각의 독특한 컨셉으로 해외 팬들의 사랑을 받고 있습니다.

이들의 성공은 BTS, 블랙핑크 등 선배 그룹들이 쌓아온 K-팝의 글로벌 인지도를 바탕으로 하고 있으며, 앞으로도 더 많은 한국 아티스트들이 세계 무대에서 활약할 것으로 기대됩니다.`,
      author: '한지민',
      views: 2340,
      likes: 112,
      comments: 28
    }
  ]
  
  // 실제 뉴스 API 호출 함수
  const fetchRealNews = async () => {
    setNewsLoading(true)
    setNewsError(null)
    
    try {
      const response = await fetch('/api/news?category=entertainment&limit=5')
      const data = await response.json()
      
      if (data.success) {
        // 고정된 뉴스를 먼저, 그 다음 최신순으로 정렬
        const sortedNews = data.newsItems.sort((a: any, b: any) => {
          // 고정된 뉴스가 먼저
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          // 같은 고정 상태면 최신순
          return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
        })
        setNewsData(sortedNews)
        console.log('실제 뉴스 로드 성공:', sortedNews.length, '개')
      } else {
        throw new Error(data.error || '뉴스를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 API 오류:', error)
      setNewsError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      // 오류 시 임시 데이터 사용
      setNewsData(tempNewsData)
    } finally {
      setNewsLoading(false)
    }
  }
  
  // 뉴스 클릭 핸들러
  const handleNewsClick = (news: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('뉴스 클릭:', news)
    if (news && news.id) {
      setSelectedNews(news)
      setShowNewsDetail(true)
    } else {
      console.error('뉴스 데이터가 올바르지 않습니다:', news)
    }
  }
  
  // 데이터 상태 관리
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 좋아요 상태 관리
  const [likedAnswers, setLikedAnswers] = useState<Set<number>>(new Set())
  
  // 질문 작성 폼 상태
  const [questionForm, setQuestionForm] = useState({
    title: '',
    content: '',
    category: 'free',
    tags: ''
  })

  // 답변 작성 폼 상태
  const [answerForm, setAnswerForm] = useState({
    content: ''
  })

  // 실제 사용자 프로필 사용
  const currentProfile = user

  // URL 파라미터와 탭 상태 동기화 (cTab = story|qa|freeboard|news|tests)
  useEffect(() => {
    const tabParam = searchParams.get('cTab')
    if (tabParam && ['story', 'qa', 'freeboard', 'news', 'tests'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // 데이터 로딩 함수들
  const loadQuestions = async () => {
    console.log('loadQuestions 호출됨 - 더미 데이터 사용')
    
    // 임시로 더미 질문 데이터 설정
    const dummyQuestions = [
      {
        id: 1,
        title: '한국어 학습에 도움이 되는 앱 추천해주세요!',
        content: '한국어를 배우고 있는데 좋은 앱이 있을까요?',
        author: '김학생',
        createdAt: '2025-09-18',
        upvotes: 5,
        answers: 3
      },
      {
        id: 2,
        title: '한국 문화에 대해 궁금한 점이 있어요',
        content: '한국의 전통 문화와 현대 문화의 차이점이 궁금합니다.',
        author: '박문화',
        createdAt: '2025-09-17',
        upvotes: 8,
        answers: 7
      },
      {
        id: 3,
        title: '한국 여행 계획 도움 요청',
        content: '첫 한국 여행인데 어디를 가야 할지 모르겠어요.',
        author: '이여행',
        createdAt: '2025-09-16',
        upvotes: 12,
        answers: 15
      }
    ]
    
    setQuestions(dummyQuestions)
    console.log('더미 질문 데이터 설정 완료:', dummyQuestions.length, '개')
  }

  const loadAnswers = async (questionId: string) => {
    console.log('loadAnswers 호출됨 - 더미 데이터 사용:', questionId)
    
    // 임시로 더미 답변 데이터 설정
    const dummyAnswers = [
      {
        id: 1,
        content: '한국어 학습에는 "듀오링고"나 "헬로톡" 같은 앱이 좋아요!',
        author: '한국어선생님',
        createdAt: '2025-09-18',
        upvotes: 3,
        isAccepted: false
      },
      {
        id: 2,
        content: '저는 "토픽" 앱을 사용하고 있는데 정말 도움이 됩니다.',
        author: '학습자',
        createdAt: '2025-09-18',
        upvotes: 2,
        isAccepted: false
      }
    ]
    
    setAnswers(dummyAnswers)
    console.log('더미 답변 데이터 설정 완료:', dummyAnswers.length, '개')
  }

  // 스토리 로딩 함수
  const loadStories = async () => {
    console.log('loadStories 호출됨')
    
    try {
      // 토큰이 없어도 공개 스토리는 조회 가능하도록 수정
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${encodeURIComponent(token)}`
      }
      
      // 타임아웃 설정으로 무한 대기 방지
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃
      
      const baseUrl = window.location.origin
      const response = await fetch(`${baseUrl}/api/stories?isPublic=true&limit=10`, {
        method: 'GET',
        headers,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('스토리 API 응답:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })
      
      if (!response.ok) {
        // 404나 다른 에러의 경우 빈 배열로 처리
        if (response.status === 404) {
          console.log('스토리 API가 아직 구현되지 않음, 빈 배열 사용')
          setStories([])
          return
        }
        
        // 응답이 HTML인지 확인 (JSON 파싱 오류 방지)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          console.log('스토리 API가 HTML 응답을 반환함, 빈 배열 사용')
          setStories([])
          return
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('스토리 API 에러 응답:', errorData)
        throw new Error(errorData.error || `스토리를 불러오는데 실패했습니다. (${response.status})`)
      }
      
      const data = await response.json()
      console.log('스토리 조회 응답:', { 
        data,
        storiesCount: data.stories?.length || 0
      })
      
      // 스토리 데이터 변환 (API 응답을 컴포넌트에서 사용하는 형태로 변환)
      const convertedStories = (data.stories || []).map((story: any) => ({
        ...story,
        user: {
          full_name: story.user_name || '익명'
        }
      }))
      
      setStories(convertedStories)
      console.log('스토리 목록 설정 완료:', convertedStories.length, '개')
    } catch (err) {
      console.error('스토리 로딩 실패:', err)
      
      // AbortError인 경우 타임아웃으로 처리
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('스토리 로딩 타임아웃, 빈 배열 사용')
      }
      
      // 네트워크 오류나 기타 에러의 경우 빈 배열로 설정
      setStories([])
      
      // 개발 환경에서만 에러 메시지 표시
      if (process.env.NODE_ENV === 'development') {
        console.warn('스토리 로딩 중 오류 발생, 빈 목록으로 대체:', err)
      }
    }
  }


  // 답변 작성 함수
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedQuestion) return
    
    setLoading(true)
    
    try {
      const token = localStorage.getItem('amiko_session')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(JSON.parse(token).access_token)}`
        },
        body: JSON.stringify({
          postId: selectedQuestion.id,
          content: answerForm.content,
          language: t('language')
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '답변 작성에 실패했습니다.')
      }

      // 성공 시 폼 초기화 및 답변 목록 새로고침
      setAnswerForm({ content: '' })
      await loadAnswers(selectedQuestion.id)
      
      toast.success('답변이 성공적으로 작성되었습니다!')
    } catch (err) {
      console.error('답변 작성 실패:', err)
      toast.error(err instanceof Error ? err.message : '답변 작성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 질문 클릭 시 답변 로딩
  const handleQuestionClick = async (question: any) => {
    setSelectedQuestion(question)
    setShowAnswerDrawer(true)
    await loadAnswers(question.id)
  }

  // 초기 데이터 로딩
  useEffect(() => {
    console.log('초기 데이터 로딩 useEffect:', { user: !!user, token: !!token, activeTab })
    if ((user || token) && activeTab === 'qa') {
      console.log('초기 데이터 로딩 시작')
      loadQuestions()
    }
    
    // 스토리는 항상 로딩 시도 (에러가 발생해도 앱이 중단되지 않도록)
    loadStories().catch((error) => {
      console.error('스토리 로딩 중 예외 발생:', error)
      // 에러가 발생해도 빈 배열로 설정하여 앱이 정상 작동하도록 함
      setStories([])
    })
  }, [user, token, activeTab, activeCategory])

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    // 상위 메인 탭은 community로 고정
    params.set('tab', 'community')
    params.set('cTab', tab)
    router.push(`/main?${params.toString()}`, { scroll: false })
  }

  // 새로운 뷰 변경 핸들러
  const handleViewChange = (view: string) => {
    setCurrentView(view)
    setActiveTab(view)
    onViewChange?.(view) // 상위 컴포넌트에 뷰 변경 알림
  }

  // 커뮤니티 홈으로 돌아가기
  const goToHome = () => {
    setCurrentView('home')
    setActiveTab('freeboard')
    onViewChange?.('home') // 상위 컴포넌트에 홈으로 돌아가기 알림
  }

  // 커뮤니티 홈으로 돌아가기 이벤트 리스너
  useEffect(() => {
    const handleGoToHome = () => {
      goToHome()
    }
    
    window.addEventListener('goToHome', handleGoToHome)
    
    return () => {
      window.removeEventListener('goToHome', handleGoToHome)
    }
  }, [goToHome])

  // 필터링된 질문 목록
  const filteredQuestions = questions.filter(question => {
    const matchesCategory = activeCategory === 'all' || question.category === activeCategory
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  console.log('질문 목록 상태:', { 
    totalQuestions: questions.length, 
    filteredQuestions: filteredQuestions.length, 
    activeCategory, 
    searchTerm 
  })
  
  console.log('스토리 목록 상태:', { 
    totalStories: stories.length, 
    stories: stories.map(s => ({ id: s.id, text: s.text?.substring(0, 20) + '...', user: s.user?.full_name }))
  })

  // 질문 작성 처리
  const handleSubmitQuestion = async () => {
    if (!questionForm.title.trim() || !questionForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      // 토큰 확인 및 가져오기
      let currentToken = token
      
      if (!currentToken) {
        // localStorage에서 토큰 가져오기 시도
        try {
          const storedSession = localStorage.getItem('amiko_session')
          if (storedSession) {
            const sessionData = JSON.parse(storedSession)
            currentToken = sessionData.access_token
          }
        } catch (error) {
          console.error('토큰 파싱 실패:', error)
        }
      }
      
      if (!currentToken) {
        alert('로그인이 필요합니다.')
        return
      }

      console.log('질문 작성 시도:', { title: questionForm.title, token: !!currentToken })

      // 게시물 생성 API 호출
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(currentToken)}`
        },
        body: JSON.stringify({
          title: questionForm.title,
          content: questionForm.content,
          category_name: '자유게시판', // 질문은 자유게시판에 작성
          is_notice: false,
          is_survey: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('게시물 생성 API 오류:', response.status, errorData)
        
        // 데이터베이스 연결 문제인 경우 사용자 친화적인 메시지 표시
        if (response.status === 500) {
          // 빈 객체이거나 데이터베이스 관련 에러인 경우
          if (!errorData.error || errorData.error.includes('데이터베이스') || errorData.error.includes('연결')) {
            alert('시스템 점검 중입니다. 잠시 후 다시 시도해주세요.')
            return
          }
        }
        
        throw new Error(`게시물 생성에 실패했습니다. (${response.status}: ${errorData.error || 'Unknown error'})`)
      }

      const result = await response.json()
      console.log('새 질문 작성:', result.post)

      // 포인트 획득 시도
      if (user?.id) {
        console.log('포인트 획득 시도:', { userId: user.id, postId: result.post.id })
        
        const pointsResponse = await fetch('/api/community/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            activityType: 'question_post',
            postId: result.post.id,
            title: questionForm.title
          })
        })

        console.log('포인트 API 응답:', { status: pointsResponse.status, statusText: pointsResponse.statusText })

        if (pointsResponse.ok) {
          const pointsResult = await pointsResponse.json()
          console.log('포인트 획득 성공:', pointsResult)
          alert(`질문이 등록되었습니다! +${pointsResult.points}점 획득!`)
          
          // 질문 목록 새로고침
          await loadQuestions()
          
          // 포인트 업데이트 이벤트 발생
          window.dispatchEvent(new CustomEvent('pointsUpdated', {
            detail: {
              points: pointsResult.totalPoints,
              dailyPoints: pointsResult.dailyPoints
            }
          }))
        } else {
          const errorData = await pointsResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('포인트 획득 실패:', errorData)
          alert('질문이 등록되었습니다! (포인트 획득 실패)')
          
          // 포인트 획득 실패해도 질문은 등록되었으므로 목록 새로고침
          await loadQuestions()
        }
      } else {
        console.log('사용자 ID가 없어서 포인트 획득 건너뜀')
        alert('질문이 등록되었습니다!')
        console.log('질문 작성 후 목록 새로고침 시작')
        // 토큰이 있으면 목록 새로고침
        if (token) {
          await loadQuestions()
          console.log('질문 작성 후 목록 새로고침 완료')
        } else {
          console.log('토큰이 없어서 목록 새로고침 건너뜀')
        }
      }

      // 폼 초기화
      setQuestionForm({
        title: '',
        content: '',
        category: 'free',
        tags: ''
      })
      
      setShowQuestionModal(false)
      
    } catch (error) {
      console.error('질문 작성 실패:', error)
      alert('질문 작성에 실패했습니다.')
    }
  }

  // 질문 선택 및 답변 drawer 열기 (이미 위에서 정의됨)
  // const handleQuestionClick = async (question: any) => {
  //   setSelectedQuestion(question)
  //   setShowAnswerDrawer(true)
  //   await loadAnswers(question.id)
  // }

  // 업보트 처리
  const handleUpvote = (questionId: number) => {
    // 여기서 실제 API 호출
    console.log('업보트:', questionId)
    alert('업보트가 반영되었습니다!')
  }

  // 답변 좋아요 숫자 관리
  const [answerUpvotes, setAnswerUpvotes] = useState<{ [key: number]: number }>(() => {
    // mockAnswers의 upvotes 값으로 초기화
          const initialUpvotes: { [key: number]: number } = {}
    mockAnswers.forEach(answer => {
      initialUpvotes[answer.id] = answer.upvotes
    })
    return initialUpvotes
  })

  // 이미지 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('파일 선택 이벤트 발생:', { file: !!file, fileName: file?.name, fileSize: file?.size, fileType: file?.type })
    
    if (file) {
      console.log('파일 선택됨:', file.name, file.size, file.type)
      
      // 파일 크기 검증 (10MB 제한으로 증가)
      if (file.size > 10 * 1024 * 1024) {
        console.log('파일 크기 초과:', file.size)
        toast.error('파일 크기는 10MB 이하로 선택해주세요.')
        return
      }
      
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        console.log('이미지 파일이 아님:', file.type)
        toast.error('이미지 파일만 업로드 가능합니다.')
        return
      }
      
      console.log('파일 검증 통과, 미리보기 생성 시작')
      
      setSelectedFile(file)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('미리보기 생성 완료')
        setImagePreview(e.target?.result as string)
      }
      reader.onerror = (e) => {
        console.error('미리보기 생성 실패:', e)
        toast.error('이미지 미리보기 생성에 실패했습니다.')
      }
      reader.readAsDataURL(file)
      
      console.log('파일 상태 설정 완료')
    } else {
      console.log('선택된 파일이 없음')
    }
    
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = ''
  }

  // 이미지 제거 핸들러
  const clearImage = () => {
    setImagePreview(null)
    setSelectedFile(null)
  }

  // 스토리 업로드 함수
  const handleStoryUpload = async () => {
    console.log('스토리 업로드 시작')
    console.log('사용자 상태:', { user: !!user, userId: user?.id })
    console.log('선택된 파일:', { selectedFile: !!selectedFile, fileName: selectedFile?.name })
    console.log('스토리 텍스트:', { text: storyText, length: storyText.length })
    console.log('모바일 환경 감지:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    
    if (isUploading) {
      console.log('이미 업로드 중')
      return
    }
    
    // 사용자 정보 확인
    const currentUser = user
    if (!currentUser) {
      console.log('사용자 로그인 필요')
      toast.error('로그인이 필요합니다.')
      return
    }

    // 토큰 검증 제거 (임시)
    // if (!token) {
    //   console.log('인증 토큰 없음')
    //   toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
    //   return
    // }

    if (!selectedFile) {
      console.log('입력 검증 실패: 사진이 필요합니다')
      toast.error('사진을 선택해주세요.')
      return
    }
    
    if (!storyText.trim()) {
      console.log('입력 검증 실패: 스토리 내용이 비어있습니다')
      toast.error('스토리 내용을 입력해주세요.')
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = ''
      
      // 실제 이미지 파일이 있는 경우 Supabase Storage에 업로드
      if (selectedFile) {
        console.log('이미지 파일 업로드 시작:', selectedFile.name)
        
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        const baseUrl = window.location.origin
        const uploadResponse = await fetch(`${baseUrl}/api/upload/image`, {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          imageUrl = uploadResult.imageUrl
          console.log('이미지 업로드 성공:', imageUrl)
        } else {
          const errorData = await uploadResponse.json()
          console.error('이미지 업로드 실패:', errorData)
          toast.error(`이미지 업로드에 실패했습니다: ${errorData.error}`)
          return
        }
      } else {
        console.log('선택된 파일이 없음, 기본 이미지 사용')
        imageUrl = 'https://picsum.photos/400/600'
      }
      
      console.log('API 요청 데이터 준비:', { imageUrl, text: storyText.trim(), userId: currentUser.id })
      
      console.log('스토리 API 요청 시작')
      const baseUrl = window.location.origin
      const response = await fetch(`${baseUrl}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl,
          text: storyText.trim(),
          isPublic: true,
          userId: currentUser.id
        })
      })

      console.log('API 응답 상태:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('스토리 업로드 성공:', result)
        toast.success('스토리가 업로드되었습니다!')
        
        // 스토리 목록 새로고침
        await loadStories()
        
        // 상태 초기화
        setShowStoryUploadModal(false)
        setStoryText('')
        clearImage()
      } else {
        const errorData = await response.json()
        console.error('스토리 업로드 실패:', { status: response.status, error: errorData })
        
        // 인증 오류인 경우 에러 메시지만 표시
        if (response.status === 401) {
          toast.error('로그인이 필요합니다. 페이지를 새로고침해주세요.')
          return
        }
        
        toast.error(`스토리 업로드 실패: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('스토리 업로드 에러:', error)
      toast.error('스토리 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 포인트 시스템 상태 관리
  const [userPoints, setUserPoints] = useState(100) // 초기 포인트
  const [dailyPoints, setDailyPoints] = useState(0) // 오늘 획득한 포인트
  const [pointHistory, setPointHistory] = useState<Array<{
    id: string
    activity: string
    points: number
    timestamp: Date
    description: string
  }>>([])

  // 답변 좋아요 토글 처리
  const handleAnswerLike = (answerId: number) => {
    const isCurrentlyLiked = likedAnswers.has(answerId)
    
    if (isCurrentlyLiked) {
      // 좋아요 취소
      setLikedAnswers(prev => {
        const newLiked = new Set(prev)
        newLiked.delete(answerId)
        return newLiked
      })
      
      setAnswerUpvotes(prevUpvotes => ({
        ...prevUpvotes,
        [answerId]: Math.max(0, prevUpvotes[answerId] - 1)
      }))
    } else {
      // 좋아요 추가
      setLikedAnswers(prev => {
        const newLiked = new Set(prev)
        newLiked.add(answerId)
        return newLiked
      })
      
      setAnswerUpvotes(prevUpvotes => ({
        ...prevUpvotes,
        [answerId]: prevUpvotes[answerId] + 1
      }))
      
      // 좋아요 시 포인트 획득
      earnPoints('reaction')
    }
  }

  // 포인트 획득 함수
  const earnPoints = (activity: 'question' | 'answer' | 'story' | 'freeboard' | 'reaction' | 'consultation') => {
    if (!currentProfile) return
    const userType = (currentProfile as any).is_korean ? 'korean' : 'latin'
    const points = pointSystem[userType][activity]
    const dailyLimit = pointSystem[userType].dailyLimit
    
    if (dailyPoints + points <= dailyLimit) {
      setUserPoints(prev => prev + points)
      setDailyPoints(prev => prev + points)
      
      // 포인트 히스토리에 기록
      const newHistoryItem = {
        id: Date.now().toString(),
        activity,
        points,
        timestamp: new Date(),
        description: getActivityDescription(activity, points)
      }
      
      setPointHistory(prev => [newHistoryItem, ...prev])
      
      console.log(`${getActivityDescription(activity, points)} +${points}점 획득!`)
      return true
    } else {
      alert(`오늘 포인트 한도를 초과했습니다. (일일 최대 ${dailyLimit}점)`)
      return false
    }
  }

  // 활동 설명 생성 함수
  const getActivityDescription = (activity: string, points: number) => {
    const descriptions: Record<string, string> = {
      question: '질문 작성',
      answer: '답변 작성', 
      story: '스토리 작성',
      freeboard: '자유게시판 작성',
      reaction: '좋아요/댓글',
      consultation: '상담 참여'
    }
    return `${descriptions[activity] || '활동'} (+${points}점)`
  }

  // 답변 등록 처리
  const handleSubmitAnswer = async () => {
    if (!answerForm.content.trim()) {
      alert('답변 내용을 입력해주세요.')
      return
    }

    if (!selectedQuestion) {
      alert('질문이 선택되지 않았습니다.')
      return
    }

    try {
      // 토큰 확인 및 가져오기
      let currentToken = token
      
      if (!currentToken) {
        // localStorage에서 토큰 가져오기 시도
        try {
          const storedSession = localStorage.getItem('amiko_session')
          if (storedSession) {
            const sessionData = JSON.parse(storedSession)
            currentToken = sessionData.access_token
          }
        } catch (error) {
          console.error('토큰 파싱 실패:', error)
        }
      }
      
      if (!currentToken) {
        alert('로그인이 필요합니다.')
        return
      }

      console.log('답변 작성 시도:', { questionId: selectedQuestion.id, token: !!currentToken })

      // 댓글 생성 API 호출
      const response = await fetch(`/api/posts/${selectedQuestion.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(currentToken)}`
        },
        body: JSON.stringify({
          content: answerForm.content
        })
      })

      if (!response.ok) {
        throw new Error('답변 생성에 실패했습니다.')
      }

      const result = await response.json()
      console.log('새 답변 작성:', result.comment)

      // 포인트 획득 시도
      if (user?.id) {
        const pointsResponse = await fetch('/api/community/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            activityType: 'question_answer',
            postId: result.comment.id,
            title: `질문 "${selectedQuestion.title}"에 대한 답변`
          })
        })

        if (pointsResponse.ok) {
          const pointsResult = await pointsResponse.json()
          alert(`답변이 등록되었습니다! +${pointsResult.points}점 획득!`)
          
          // 답변 목록 새로고침
          await loadAnswers(selectedQuestion.id)
          
          // 포인트 업데이트 이벤트 발생
          window.dispatchEvent(new CustomEvent('pointsUpdated', {
            detail: {
              points: pointsResult.totalPoints,
              dailyPoints: pointsResult.dailyPoints
            }
          }))
        }
      } else {
        // 포인트 획득 실패해도 답변은 등록되었으므로 목록 새로고침
        alert('답변이 등록되었습니다!')
        await loadAnswers(selectedQuestion.id)
      }

      // 폼 초기화
      setAnswerForm({ content: '' })
      
    } catch (error) {
      console.error('답변 작성 실패:', error)
      alert('답변 작성에 실패했습니다.')
    }
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    return `${Math.floor(diffInHours / 24)}일 전`
  }

  // 스토리 좋아요 토글
  const toggleStoryLike = (storyId: string) => {
    setLikedStories(prev => {
      const newLiked = new Set(prev)
      if (newLiked.has(storyId)) {
        newLiked.delete(storyId)
      } else {
        newLiked.add(storyId)
        // 첫 클릭 시에만 애니메이션 표시
        setShowHeartAnimation(storyId)
        setTimeout(() => setShowHeartAnimation(null), 1000) // 1초 후 애니메이션 제거
      }
      return newLiked
    })
  }

  // 댓글 작성
  const handleCommentSubmit = () => {
    if (!commentText.trim()) return
    
    // 여기서 실제 댓글 API 호출
    console.log('댓글 작성:', { storyId: selectedStoryForComment.id, comment: commentText })
    
    // 성공 시 모달 닫기
    setShowCommentModal(false)
    setCommentText('')
    setSelectedStoryForComment(null)
    
    toast.success('댓글이 작성되었습니다!')
  }

  // 이미지 업로드 함수
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '이미지 업로드에 실패했습니다.')
      }

      const data = await response.json()
      return data.imageUrl
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      // 업로드 실패 시 임시 Data URL 사용
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          resolve(imageUrl)
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // 이미지 삽입 함수
  const insertImageToContent = async (file: File, isKorean: boolean = true) => {
    try {
      const imageUrl = await handleImageUpload(file)
      const imageName = file.name.split('.')[0] // 확장자 제거
      
      // 업로드된 이미지 목록에 추가
      setUploadedImages(prev => [...prev, { url: imageUrl, name: imageName }])
      
      // 마크다운 형태로 이미지 삽입
      const imageMarkdown = `![${imageName}](${imageUrl})`
      
      if (isKorean) {
        setNewsWriteForm(prev => ({
          ...prev,
          content: prev.content + '\n\n' + imageMarkdown
        }))
      } else {
        setNewsWriteForm(prev => ({
          ...prev,
          content_es: prev.content_es + '\n\n' + imageMarkdown
        }))
      }
      
      toast.success('이미지가 삽입되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    }
  }

  // 뉴스 편집 함수
  const handleNewsEdit = async () => {
    const hasTitle = newsWriteForm.title.trim() || newsWriteForm.title_es.trim()
    if (!hasTitle) {
      toast.error('제목을 한국어 또는 스페인어로 입력해주세요.')
      return
    }
    
    const hasContent = newsWriteForm.content.trim() || newsWriteForm.content_es.trim()
    if (!hasContent) {
      toast.error('내용을 한국어 또는 스페인어로 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setNewsWriteLoading(true)
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingNews.id,
          title: newsWriteForm.title,
          title_es: newsWriteForm.title_es,
          content: newsWriteForm.content,
          content_es: newsWriteForm.content_es,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          category: newsWriteForm.category,
          thumbnail: selectedThumbnail || null
        })
      })

      if (response.ok) {
        toast.success('뉴스가 수정되었습니다!')
        setShowNewsEditModal(false)
        setEditingNews(null)
        setNewsWriteForm({
          title: '',
          title_es: '',
          content: '',
          content_es: '',
          source: '',
          author: '',
          category: 'entertainment'
        })
        setUploadedImages([])
        setSelectedThumbnail('')
        // 뉴스 목록 새로고침
        await fetchRealNews()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || '뉴스 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 수정 오류:', error)
      toast.error('뉴스 수정 중 오류가 발생했습니다.')
    } finally {
      setNewsWriteLoading(false)
    }
  }

  // 뉴스 작성 함수
  const handleNewsWrite = async () => {
    const hasTitle = newsWriteForm.title.trim() || newsWriteForm.title_es.trim()
    if (!hasTitle) {
      toast.error('제목을 한국어 또는 스페인어로 입력해주세요.')
      return
    }
    
    const hasContent = newsWriteForm.content.trim() || newsWriteForm.content_es.trim()
    if (!hasContent) {
      toast.error('내용을 한국어 또는 스페인어로 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setNewsWriteLoading(true)
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newsWriteForm.title,
          title_es: newsWriteForm.title_es,
          content: newsWriteForm.content,
          content_es: newsWriteForm.content_es,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          category: newsWriteForm.category,
          thumbnail: selectedThumbnail || null, // 썸네일이 선택되지 않으면 null
        })
      })

      if (response.ok) {
        toast.success('뉴스가 작성되었습니다!')
        setShowNewsWriteModal(false)
        setNewsWriteForm({
          title: '',
          title_es: '',
          content: '',
          content_es: '',
          source: '',
          author: '',
          category: 'entertainment'
        })
        setUploadedImages([])
        setSelectedThumbnail('')
        // 뉴스 목록 새로고침
        await fetchRealNews()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || '뉴스 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 작성 오류:', error)
      toast.error('뉴스 작성 중 오류가 발생했습니다.')
    } finally {
      setNewsWriteLoading(false)
    }
  }

  // 댓글 모달 열기
  const openCommentModal = (story: any) => {
    setSelectedStoryForComment(story)
    setShowCommentModal(true)
  }









  return (
    <div className="flex flex-col lg:flex-row gap-6 p-0 sm:p-1">
      {/* 메인 컨텐츠 */}
      <div className="flex-1 space-y-6">



      {/* 오늘의 스토리 섹션 - 홈에서만 표시 */}
      {currentView === 'home' && (
      <div className="mt-0 mb-6 max-w-full overflow-hidden border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📸</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 font-['Inter']">{t('communityTab.story')}</h2>
            {stories.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full hidden sm:inline">
                  ← 좌우로 슬라이드 (마우스 휠/드래그)
                </span>
                <span className="text-xs text-blue-500 font-medium">
                  {stories.length} {t('communityTab.story')}
                </span>
              </div>
            )}
          </div>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-sm font-['Inter'] whitespace-nowrap"
            onClick={async () => {
              console.log('헤더 스토리 올리기 버튼 클릭됨')
              
              // 로그인 체크
              const currentUser = user
              if (!currentUser) {
                console.log('로그인 필요 - 로그인 페이지로 이동')
                window.location.href = '/sign-in'
                return
              }
              
              // 운영자는 인증 건너뛰기
              if (isAdmin) {
                console.log('운영자 - 인증 건너뛰고 업로드 모달 표시')
                setShowStoryUploadModal(true)
                return
              }
              
              // 인증 상태 확인 (헤더와 동일한 로직 사용)
              try {
                const baseUrl = window.location.origin
                const response = await fetch(`${baseUrl}/api/auth/status?userId=${currentUser.id}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })
                if (response.ok) {
                  const data = await response.json()
                  console.log('스토리 업로드 인증 상태 확인:', data)
                  
                  // 헤더와 동일한 조건: emailVerified 또는 smsVerified가 true인 경우
                  if (data.success && (data.emailVerified || data.smsVerified)) {
                    console.log('인증 완료 - 업로드 모달 표시')
                    setShowStoryUploadModal(true)
                  } else {
                    // 인증 안 된 경우 인증 다이얼로그 표시
                    console.log('인증 필요 - 인증 다이얼로그 표시')
                    setShowAuthDialog(true)
                  }
                } else {
                  // API 오류 시 안전하게 인증 다이얼로그 표시
                  console.log('API 오류 - 인증 다이얼로그 표시')
                  setShowAuthDialog(true)
                }
              } catch (error) {
                console.error('인증 상태 확인 오류:', error)
                setShowAuthDialog(true)
              }
            }}
          >
            <span className="hidden sm:inline">+ {t('communityTab.uploadStory')}</span>
            <span className="sm:hidden">+ {t('buttons.upload')}</span>
          </Button>
        </div>
        
        {/* 인스타그램 감성 카드 스타일 스토리 */}
        <div className="w-full relative overflow-hidden" style={{ maxWidth: '100%' }}>
          {stories.length > 0 ? (
            /* 스토리가 있을 때 - 인스타그램 감성 카드 */
            <div className="relative">
              
              <div 
                className={`overflow-x-auto scrollbar-hide scroll-smooth scroll-snap-x ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  width: '100%',
                  maxWidth: '100%'
                }}
                onWheel={(e) => {
                  e.preventDefault()
                  const container = e.currentTarget
                  const scrollAmount = e.deltaY > 0 ? 200 : -200
                  container.scrollLeft += scrollAmount
                }}
                onMouseDown={(e) => {
                  setIsDragging(true)
                  setStartX(e.pageX - e.currentTarget.offsetLeft)
                  setScrollLeft(e.currentTarget.scrollLeft)
                }}
                onMouseLeave={() => setIsDragging(false)}
                onMouseUp={() => setIsDragging(false)}
                onMouseMove={(e) => {
                  if (!isDragging) return
                  e.preventDefault()
                  const x = e.pageX - e.currentTarget.offsetLeft
                  const walk = (x - startX) * 2
                  e.currentTarget.scrollLeft = scrollLeft - walk
                }}
              >
                <div className="flex gap-3 pb-4 overflow-x-auto story-container">
                {stories.map((story, index) => (
                  <div 
                    key={story.id} 
                    className="relative overflow-hidden flex-shrink-0 cursor-pointer group w-48 h-64 sm:w-56 sm:h-72 md:w-60 md:h-80" 
                    style={{ 
                      scrollSnapAlign: 'start'
                    }}
                  >
                    {/* 전체 화면 스토리 카드 - 이중 카드 구조 제거 */}
                    <div className="w-full h-full rounded-2xl overflow-hidden">
                      {/* 메인 이미지 영역 - 화면에 꽉차게 */}
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                        {story.image_url && (
                          <img 
                            src={story.image_url} 
                            alt="스토리 이미지" 
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* 상단 사용자 정보 오버레이 */}
                        <div className="absolute top-4 left-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-0.5">
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100">
                                {story.image_url ? (
                                  <img 
                                    src={story.image_url} 
                                    alt="프로필" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {story.user?.full_name?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm drop-shadow-lg">
                              {story.user?.full_name || '익명'}
                            </p>
                            <p className="text-white/80 text-xs drop-shadow-lg">
                              {formatTime(story.created_at)}
                            </p>
                          </div>
                        </div>
                      
                        {/* 좋아요 하트 애니메이션 */}
                        {showHeartAnimation === story.id && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg
                              className="w-20 h-20 text-red-500 fill-current animate-pulse"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </div>
                        )}

                        {/* 하단 그라데이션 오버레이 - 안개 효과 제거 */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent">
                          {/* 스토리 텍스트 */}
                          {story.text && (
                            <div className="absolute bottom-16 left-4 right-4">
                              <p className="text-white text-sm leading-relaxed font-medium drop-shadow-lg">
                                {story.text}
                              </p>
                            </div>
                          )}

                          {/* 하단 액션 버튼들 */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleStoryLike(story.id)
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                              >
                                <svg
                                  className={`w-4 h-4 transition-all duration-200 ${
                                    likedStories.has(story.id)
                                      ? 'text-red-500 fill-current'
                                      : 'text-gray-400 hover:text-red-400'
                                  }`}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openCommentModal(story)
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                              >
                                <svg
                                  className="w-4 h-4 transition-all duration-200 text-gray-400 hover:text-blue-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (navigator.share) {
                                    navigator.share({
                                      title: 'Amiko 스토리',
                                      text: story.text || '재미있는 스토리를 확인해보세요!',
                                      url: window.location.href
                                    })
                                  } else {
                                    navigator.clipboard.writeText(window.location.href)
                                    alert('링크가 클립보드에 복사되었습니다!')
                                  }
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                              >
                                <svg
                                  className="w-4 h-4 transition-all duration-200 text-gray-400 hover:text-green-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                  <polyline points="16,6 12,2 8,6"/>
                                  <line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                              </button>
                            </div>

                            {/* 좋아요 수 표시 */}
                            <div className="flex items-center gap-1">
                              <span className="text-white text-sm font-medium drop-shadow-lg">
                                {story.likes_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* 스토리 클릭 시 전체 보기 모달 (좋아요 버튼 제외) */}
                    <div 
                      className="absolute inset-0 z-10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedStory(story)
                        setShowStoryModal(true)
                      }}
                      style={{ 
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 60px), 0 calc(100% - 60px))'
                      }}
                    ></div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📸</span>
                </div>
                <p className="text-lg font-medium">{t('communityTab.noStories')}</p>
                <p className="text-sm text-gray-400">{t('communityTab.uploadFirstStory')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* 커뮤니티 홈 메뉴 - 큰 버튼 4개 */}
      {currentView === 'home' && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleViewChange('freeboard')}
            className="bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border-2 border-pink-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                📝
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('community.freeBoard')}</h3>
              <p className="text-sm text-gray-600 text-center">{t('community.freeBoardDescription')}</p>
            </div>
          </button>

          <button
            onClick={() => handleViewChange('news')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                📰
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('community.koreanNews')}</h3>
              <p className="text-sm text-gray-600 text-center">{t('community.koreanNewsDescription')}</p>
            </div>
          </button>

          <button
            onClick={() => handleViewChange('qa')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                💬
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('community.qa')}</h3>
              <p className="text-sm text-gray-600 text-center">{t('community.qaDescription')}</p>
            </div>
          </button>

          <button
            onClick={() => handleViewChange('tests')}
            className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg group"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                🎯
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('tests.title')}</h3>
              <p className="text-sm text-gray-600 text-center">{t('tests.description')}</p>
            </div>
          </button>
        </div>
      )}

      {/* 탭 컨텐츠 */}

      {currentView === 'qa' && (
        <div className="w-full">





      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
          <Input
            placeholder={t('communityTab.searchQuestions')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-20 w-64 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </div>
        
        {/* 질문하기 버튼 - 오른쪽 끝 */}
        <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('communityTab.askQuestion')}
            </Button>
          </DialogTrigger>
            
            <DialogContent className="max-w-2xl bg-white border-2 border-gray-200 shadow-xl">
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">{t('communityTab.newQuestion')}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('communityTab.title')}</label>
                  <Input
                    placeholder={t('communityTab.titlePlaceholder')}
                    value={questionForm.title}
                    onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                    className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('communityTab.category')}</label>
                  <select
                    value={questionForm.category}
                    onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                  >
                    {getCategories(t).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('communityTab.tags')}</label>
                  <Input
                    placeholder={t('communityTab.tagsPlaceholder')}
                    value={questionForm.tags}
                    onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                    className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('communityTab.questionContent')}</label>
                  <Textarea
                    placeholder={t('communityTab.questionContentPlaceholder')}
                    value={questionForm.content}
                    onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                    rows={6}
                    className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                  />
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowQuestionModal(false)}>
                    {t('buttons.cancel')}
                  </Button>
                  <Button onClick={handleSubmitQuestion}>
                    {t('communityTab.registerQuestion')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {/* 질문 목록 */}
      <div className="mt-8">
          {/* 질문 카드 리스트 */}
          <div className="space-y-8">
            {filteredQuestions.map((question, index) => (
              <div key={question.id}>
                {/* 데스크톱: 카드 스타일 */}
                <Card 
                  className="hidden md:block p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white hover:bg-purple-50/30 cursor-pointer !opacity-100 !transform-none"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleQuestionClick(question)
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* 업보트 영역 */}
                    <div className="flex flex-col items-center gap-2 min-w-[60px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-purple-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpvote(question.id)
                        }}
                      >
                        <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                      </Button>
                      <span className="text-lg font-semibold text-purple-600">{question.upvotes}</span>
                    </div>
                    
                    {/* 질문 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">{question.title}</h3>
                        {question.isSolved && (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <Target className="w-3 h-3 mr-1" />
                            해결됨
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{question.preview}</p>
                      
                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{question.author?.full_name || question.author || '익명'}</span>
                            <Badge className={`ml-2 text-xs ${
                              question.authorType === 'korean' 
                                ? 'bg-purple-100 text-purple-700 border-purple-300' 
                                : 'bg-pink-100 text-pink-700 border-pink-300'
                            }`}>
                              {question.authorType === 'korean' ? '한국인' : '라틴'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{question.answers} 답변</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{question.views} 조회</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(question.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* 운영자 전용 버튼들 */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (confirm('정말로 이 질문을 삭제하시겠습니까?')) {
                                  // 질문 삭제 로직 (나중에 구현)
                                  console.log('질문 삭제:', question.id)
                                  toast.success('질문이 삭제되었습니다.')
                                }
                              }}
                            >
                              🗑️
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 모바일: 리스트 스타일 */}
                <div 
                  className="block md:hidden py-3 px-4 border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleQuestionClick(question)
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 truncate flex-1 mr-2">{question.title}</h3>
                    <div className="flex items-center gap-1 text-purple-600">
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-sm font-medium">{question.upvotes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{question.author?.full_name || question.author || '익명'}</span>
                      <Badge className={`text-xs px-1 py-0 ${
                        question.authorType === 'korean' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {question.authorType === 'korean' ? '한국인' : '라틴'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{question.answers} 답변</span>
                      <span>{formatTime(question.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 결과 없음 */}
          {filteredQuestions.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('chargingTab.search.noResults')}</h3>
              <p className="text-gray-600 mb-4">
                {t('chargingTab.search.adjustFilters')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setActiveCategory('all')
                }}
              >
                {t('chargingTab.search.resetFilters')}
              </Button>
            </Card>
          )}
      </div>
        </div>
      )}

      {currentView === 'freeboard' && (
        <div className="w-full">
          <BoardList 
            onPostSelect={(post) => {
              console.log('게시글 선택:', post)
              // 게시글 상세 보기 로직
            }}
            onWritePost={() => {
              setShowWriteModal(true)
            }}
            refreshTrigger={refreshTrigger}
            showHeader={false}
          />
        </div>
      )}

      {currentView === 'news' && (
        <div className="w-full">
          {showNewsDetail && selectedNews ? (
            // 뉴스 상세 내용 (전체 영역)
            <NewsDetail 
              news={selectedNews} 
              onBack={() => {
                setShowNewsDetail(false)
                setSelectedNews(null)
              }}
              showSpanish={showSpanishNews}
              isAdmin={isAdmin}
              onEdit={(news) => {
                setShowNewsDetail(false)
                setSelectedNews(null)
                setEditingNews(news)
                setShowNewsEditModal(true)
                // 편집 폼에 기존 데이터 설정
                setNewsWriteForm({
                  title: news.title || '',
                  title_es: news.title_es || '',
                  content: news.content || '',
                  content_es: news.content_es || '',
                  source: news.source || '',
                  author: news.author || '',
                  category: news.category || 'entertainment'
                })
                setSelectedThumbnail(news.thumbnail || '')
              }}
              onDelete={(newsId) => {
                // 뉴스 목록에서 삭제된 뉴스 제거
                setNewsData(prev => prev.filter(news => news.id !== newsId))
                toast.success('뉴스가 삭제되었습니다.')
              }}
              onPin={(newsId, isPinned) => {
                // 뉴스 목록에서 고정 상태 업데이트
                setNewsData(prev => prev.map(news => 
                  news.id === newsId ? { ...news, is_pinned: isPinned } : news
                ))
              }}
            />
          ) : (
            // 뉴스 목록
            <div className="space-y-6">
              <div className="flex items-center justify-end">
                {/* 번역 버튼 */}
                <div className="flex items-center gap-2">
                  {/* 번역 버튼 */}
                  <Button 
                    variant={showSpanishNews ? "default" : "outline"} 
                    size="sm"
                    onClick={() => {
                      if (!isTranslating) {
                        setIsTranslating(true)
                        setTimeout(() => {
                          setShowSpanishNews(!showSpanishNews)
                          setIsTranslating(false)
                        }, 1000)
                      }
                    }}
                    disabled={isTranslating}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm">
                      {isTranslating ? '⏳' : '🌐'}
                    </span>
                    <span>
                      {isTranslating ? '번역중...' : (showSpanishNews ? 'ES' : 'KO')}
                    </span>
                  </Button>
                  
                  {/* 운영진 전용 버튼들 */}
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      onClick={() => setShowNewsWriteModal(true)}
                    >
                      ➕ 뉴스 작성
                    </Button>
                  )}
                </div>
              </div>
                  
                {/* 뉴스 목록 */}
                <div className="space-y-0">
                  {newsLoading ? (
                    // 뉴스 로딩 중
                    <div className="space-y-4">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border-b border-gray-200">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                            <div className="flex items-center gap-3">
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-purple-600">
                          <span className="animate-spin">📰</span>
                          <span>{t('community.loadingNews')}</span>
                        </div>
                      </div>
                    </div>
                  ) : newsError ? (
                    // 뉴스 로딩 오류
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-4">
                        <span className="text-2xl">⚠️</span>
                        <p className="mt-2">{newsError}</p>
                      </div>
                      <Button onClick={fetchRealNews} variant="outline">
                        다시 시도
                      </Button>
                    </div>
                  ) : isTranslating ? (
                    // 번역 중 스켈레톤 로딩
                    <div className="space-y-4">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border-b border-gray-200">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                            <div className="flex items-center gap-3">
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-purple-600">
                          <span className="animate-spin">⏳</span>
                          <span>번역 중...</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {newsData.map((news, index) => (
                        <div 
                          key={news.id}
                          className="flex items-start gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={(e) => handleNewsClick(news, e)}
                        >
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {news.thumbnail ? (
                              <img 
                                src={news.thumbnail} 
                                alt="뉴스 썸네일" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                                <div className="text-center">
                                  <div className="text-2xl mb-1">📰</div>
                                  <span className="text-blue-600 text-xs font-medium">뉴스</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-gray-900 text-base leading-tight line-clamp-2">
                                {showSpanishNews && news.title_es ? news.title_es : news.title}
                              </h4>
                              {news.is_pinned && (
                                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
                                  📌 고정
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{news.source}</span>
                                <span>{news.date}</span>
                                <span>댓글 {news.comments}</span>
                              </div>
                              
                              {/* 운영진 전용 버튼들 */}
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 px-2 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setEditingNews(news)
                                      setShowNewsEditModal(true)
                                      // 편집 폼에 기존 데이터 설정
                                      setNewsWriteForm({
                                        title: news.title || '',
                                        title_es: news.title_es || '',
                                        content: news.content || '',
                                        content_es: news.content_es || '',
                                        source: news.source || '',
                                        author: news.author || '',
                                        category: news.category || 'entertainment'
                                      })
                                      setSelectedThumbnail(news.thumbnail || '')
                                    }}
                                  >
                                    ✏️
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className={`h-6 px-2 text-xs ${
                                      news.is_pinned 
                                        ? 'text-yellow-600 border-yellow-400 bg-yellow-50 hover:bg-yellow-100' 
                                        : 'text-orange-600 border-orange-300 hover:bg-orange-50'
                                    }`}
                                    onClick={async (e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      try {
                                        const response = await fetch('/api/news', {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            id: news.id,
                                            is_pinned: !news.is_pinned
                                          })
                                        })
                                        if (response.ok) {
                                          toast.success(news.is_pinned ? '고정이 해제되었습니다.' : '뉴스가 고정되었습니다.')
                                          // 뉴스 목록에서 고정 상태 업데이트
                                          setNewsData(prev => prev.map(n => 
                                            n.id === news.id ? { ...n, is_pinned: !news.is_pinned } : n
                                          ))
                                        } else {
                                          const errorData = await response.json().catch(() => ({}))
                                          console.error('고정 상태 변경 실패:', errorData)
                                          toast.error(errorData.error || '고정 상태 변경에 실패했습니다.')
                                        }
                                      } catch (error) {
                                        console.error('뉴스 고정 오류:', error)
                                        toast.error('고정 상태 변경 중 오류가 발생했습니다.')
                                      }
                                    }}
                                  >
                                    {news.is_pinned ? '🔒' : '📌'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={async (e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      if (!confirm('정말로 이 뉴스를 삭제하시겠습니까?')) {
                                        return
                                      }
                                      try {
                                        const response = await fetch(`/api/news?id=${news.id}`, {
                                          method: 'DELETE'
                                        })
                                        if (response.ok) {
                                          toast.success('뉴스가 삭제되었습니다.')
                                          // 뉴스 목록에서 삭제된 뉴스 제거
                                          setNewsData(prev => prev.filter(n => n.id !== news.id))
                                        } else {
                                          toast.error('뉴스 삭제에 실패했습니다.')
                                        }
                                      } catch (error) {
                                        console.error('뉴스 삭제 오류:', error)
                                        toast.error('뉴스 삭제 중 오류가 발생했습니다.')
                                      }
                                    }}
                                  >
                                    🗑️
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 더 많은 뉴스 보기 버튼 */}
                      <div className="text-center pt-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" className="bg-white hover:bg-gray-50">
                            {t('community.viewMoreNews')}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
            </div>
          )}
        </div>
      )}














      {/* 답변 보기 Drawer */}
      <Drawer open={showAnswerDrawer} onOpenChange={setShowAnswerDrawer}>
        <DrawerContent className="!opacity-100 !bg-white">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="text-left">
                {selectedQuestion?.title}
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="p-6 space-y-6">
              {/* 질문 상세 */}
              {selectedQuestion && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg !opacity-100">
                    <p className="text-gray-700 mb-3">{selectedQuestion.preview}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{selectedQuestion.author?.full_name || selectedQuestion.author || '익명'}</span>
                      <span>{formatTime(selectedQuestion.createdAt)}</span>
                      <span>{selectedQuestion.views} 조회</span>
                    </div>
                  </div>
                  
                  {/* 답변 목록 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      답변 ({mockAnswers.filter(a => a.questionId === selectedQuestion.id).length})
                    </h4>
                    
                    {mockAnswers
                      .filter(answer => answer.questionId === selectedQuestion.id)
                      .map((answer) => (
                        <Card key={answer.id} className="p-4 !opacity-100 !bg-white">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1 min-w-[50px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-purple-50"
                                onClick={() => handleAnswerLike(answer.id)}
                              >
                                <ThumbsUp className={`w-3 h-3 ${likedAnswers.has(answer.id) ? 'text-red-500 fill-current' : 'text-purple-500'}`} />
                              </Button>
                              <span className="text-sm font-medium text-purple-600">
                                {answerUpvotes[answer.id] !== undefined ? answerUpvotes[answer.id] : answer.upvotes}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <p className="text-gray-700 mb-2">{answer.content}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{answer.author || '익명'}</span>
                                <span>{formatTime(answer.createdAt)}</span>
                                {answer.isAccepted && (
                                  <Badge className="bg-green-100 text-green-700 border-green-300">
                                    채택됨
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                  
                  {/* 답변 작성 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">답변 작성</h4>
                    <Textarea
                      placeholder="답변을 입력하세요..."
                      rows={4}
                      className="w-full"
                      value={answerForm.content}
                      onChange={(e) => setAnswerForm({ content: e.target.value })}
                    />
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setShowAnswerDrawer(false)}>
                        취소
                      </Button>
                      <Button onClick={handleSubmitAnswer}>답변 등록</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

        {/* 추후 연동 포인트 주석 */}
        {/* 
        TODO: Supabase posts/comments/votes 테이블로 교체
        TODO: 포인트 시스템 연동
        TODO: 이미지 업로드 기능
        TODO: 실시간 알림
        */}
      </div>

      {/* 스토리 업로드 모달 */}
      <Dialog open={showStoryUploadModal} onOpenChange={(open) => {
        setShowStoryUploadModal(open)
        if (!open) {
          clearImage() // 모달이 닫힐 때 이미지 상태 초기화
          setStoryText('') // 스토리 텍스트도 초기화
        }
      }}>
        <DialogContent className="max-w-md w-full mx-4 bg-white border-2 border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">새 스토리 작성</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                사진 업로드
              </Label>
              
              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className="mb-3 relative">
                  <img 
                    src={imagePreview} 
                    alt="미리보기" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* 파일 선택 버튼들 */}
              <div className="space-y-2">
                {/* 갤러리에서 선택 */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadGallery"
                    multiple={false}
                    capture={undefined}
                  />
                  <label
                    htmlFor="imageUploadGallery"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {imagePreview ? '다른 사진 선택' : '📱 갤러리에서 선택'}
                      </span>
                    </div>
                  </label>
                </div>
                
                {/* 카메라로 촬영 */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadCamera"
                    capture="environment"
                    multiple={false}
                  />
                  <label
                    htmlFor="imageUploadCamera"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        📷 카메라로 촬영
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                스토리 내용
              </Label>
              <Textarea
                placeholder="오늘의 이야기를 공유해보세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStoryUploadModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  console.log('업로드 버튼 클릭됨')
                  handleStoryUpload()
                }}
                disabled={isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
              >
                {isUploading ? '업로드 중...' : '업로드'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 스토리 전체 보기 모달 */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="max-w-4xl w-full h-full max-h-screen bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>스토리 전체 보기</DialogTitle>
          </DialogHeader>
          
          {selectedStory && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl w-full max-w-2xl">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100">
                      {selectedStory.image_url ? (
                        <img
                          src={selectedStory.image_url}
                          alt="프로필"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {selectedStory.user?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedStory.user?.full_name || '익명'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(selectedStory.created_at)}
                  </p>
                </div>
              </div>
              
              {/* 스토리 이미지 */}
              <div className="relative w-full max-w-2xl h-96 mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-2xl overflow-hidden shadow-2xl">
                {selectedStory.image_url && (
                  <img
                    src={selectedStory.image_url}
                    alt="스토리 이미지"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* 스토리 텍스트 내용 */}
              {(selectedStory.text_content || selectedStory.text) && (
                <div className="w-full max-w-2xl mb-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">스토리 내용</h3>
                  <p className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                    {selectedStory.text_content || selectedStory.text}
                  </p>
                </div>
              )}
              
              {/* 액션 버튼들 */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => toggleStoryLike(selectedStory.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                    likedStories.has(selectedStory.id) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg 
                    className={`w-6 h-6 transition-all duration-200 ${
                      likedStories.has(selectedStory.id) 
                        ? 'text-white fill-current' 
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => {
                    setShowStoryModal(false)
                    openCommentModal(selectedStory)
                  }}
                  className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <svg 
                    className="w-6 h-6 transition-all duration-200 text-gray-400 hover:text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
              
              {/* 닫기 버튼 */}
              <Button
                onClick={() => setShowStoryModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
              >
                닫기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 댓글 작성 모달 */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">댓글 작성</DialogTitle>
          </DialogHeader>
          
          {selectedStoryForComment && (
            <div className="space-y-4">
              {/* 스토리 미리보기 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100">
                      {selectedStoryForComment.image_url ? (
                        <img 
                          src={selectedStoryForComment.image_url} 
                          alt="프로필" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {selectedStoryForComment.user?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedStoryForComment.user?.full_name || '익명'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedStoryForComment.text?.substring(0, 30)}...
                  </p>
                </div>
              </div>
              
              {/* 댓글 입력 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  댓글 내용
                </Label>
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentModal(false)
                    setCommentText('')
                    setSelectedStoryForComment(null)
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  댓글 작성
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 글쓰기 모달 */}
      <Dialog open={showWriteModal} onOpenChange={setShowWriteModal}>
        <DialogContent className="max-w-2xl bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {language === 'ko' ? '게시글 작성' : 'Write Post'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 카테고리 선택 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {language === 'ko' ? '카테고리' : 'Category'}
              </Label>
              <Select value={writeCategory} onValueChange={setWriteCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{language === 'ko' ? '자유게시판' : 'Free Board'}</SelectItem>
                  <SelectItem value="kpop">{language === 'ko' ? 'K-POP게시판' : 'K-POP Board'}</SelectItem>
                  <SelectItem value="kdrama">{language === 'ko' ? 'K-Drama게시판' : 'K-Drama Board'}</SelectItem>
                  <SelectItem value="beauty">{language === 'ko' ? '뷰티' : 'Beauty'}</SelectItem>
                  <SelectItem value="korean">{language === 'ko' ? '한국어' : 'Korean'}</SelectItem>
                  <SelectItem value="spanish">{language === 'ko' ? '스페인어' : 'Spanish'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 제목 입력 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {language === 'ko' ? '제목' : 'Title'}
              </Label>
              <Input
                placeholder={language === 'ko' ? '제목을 입력하세요' : 'Enter title'}
                value={writeTitle}
                onChange={(e) => setWriteTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* 내용 입력 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {language === 'ko' ? '내용' : 'Content'}
              </Label>
              <Textarea
                placeholder={language === 'ko' ? '내용을 입력하세요' : 'Enter content'}
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
                className="mt-1 min-h-[200px]"
              />
            </div>

            {/* 버튼들 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowWriteModal(false)}
                disabled={writeLoading}
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </Button>
              <Button
                onClick={handleWritePost}
                disabled={writeLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {writeLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {language === 'ko' ? '작성 중...' : 'Writing...'}
                  </>
                ) : (
                  language === 'ko' ? '작성하기' : 'Write'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 인증 확인 다이얼로그 */}
      <AuthConfirmDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="인증이 필요합니다"
        description="스토리 업로드를 위해 인증이 필요합니다. 인증센터로 이동하시겠습니까?"
        confirmText="인증센터로 이동"
        cancelText="취소"
      />

      {/* 뉴스 작성 모달 */}
      <Dialog open={showNewsWriteModal} onOpenChange={setShowNewsWriteModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">뉴스 작성</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                </Label>
                <Input
                  placeholder="예: NewsWA, 서울En"
                  value={newsWriteForm.source}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">작성자</Label>
                <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="작성자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amiko">Amiko</SelectItem>
                    <SelectItem value="Amiko 편집팀">Amiko 편집팀</SelectItem>
                    <SelectItem value="Amiko 뉴스팀">Amiko 뉴스팀</SelectItem>
                    <SelectItem value="Amiko 관리자">Amiko 관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 카테고리 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">카테고리</Label>
              <Select value={newsWriteForm.category} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, category: value })}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">엔터테인먼트</SelectItem>
                  <SelectItem value="culture">문화</SelectItem>
                  <SelectItem value="technology">기술</SelectItem>
                  <SelectItem value="lifestyle">라이프스타일</SelectItem>
                  <SelectItem value="food">음식</SelectItem>
                  <SelectItem value="travel">여행</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">제목 (한국어)</Label>
              <Input
                placeholder="한국어 제목을 입력하세요"
                value={newsWriteForm.title}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">제목 (스페인어)</Label>
              <Input
                placeholder="스페인어 제목을 입력하세요"
                value={newsWriteForm.title_es}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title_es: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">내용 (한국어)</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) insertImageToContent(file, true)
                    }}
                    className="hidden"
                    id="koreanImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('koreanImageUpload')?.click()}
                    className="text-xs"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="한국어 내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={newsWriteForm.content}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                rows={8}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">내용 (스페인어)</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) insertImageToContent(file, false)
                    }}
                    className="hidden"
                    id="spanishImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('spanishImageUpload')?.click()}
                    className="text-xs"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="스페인어 내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={newsWriteForm.content_es}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content_es: e.target.value })}
                rows={8}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>

            {/* 썸네일 선택 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">썸네일 선택</Label>
              <Select value={selectedThumbnail} onValueChange={setSelectedThumbnail}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="썸네일로 사용할 이미지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {uploadedImages.length > 0 ? (
                    uploadedImages.map((image, index) => (
                      <SelectItem key={index} value={image.url}>
                        <div className="flex items-center gap-2">
                          <img src={image.url} alt={image.name} className="w-8 h-8 object-cover rounded" />
                          <span>{image.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-images" disabled>
                      <span className="text-gray-400">먼저 이미지를 삽입해주세요</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {uploadedImages.length > 0 
                  ? "본문에 삽입된 이미지 중에서 썸네일로 사용할 이미지를 선택하세요."
                  : "본문에 이미지를 삽입하면 썸네일로 선택할 수 있습니다."
                }
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowNewsWriteModal(false)}
                disabled={newsWriteLoading}
                className="px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleNewsWrite}
                disabled={newsWriteLoading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {newsWriteLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    작성 중...
                  </>
                ) : (
                  '뉴스 작성'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 뉴스 편집 모달 */}
      <Dialog open={showNewsEditModal} onOpenChange={setShowNewsEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">뉴스 편집</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                </Label>
                <Input
                  placeholder="예: NewsWA, 서울En"
                  value={newsWriteForm.source}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">작성자</Label>
                <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="작성자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amiko">Amiko</SelectItem>
                    <SelectItem value="Amiko 편집팀">Amiko 편집팀</SelectItem>
                    <SelectItem value="Amiko 뉴스팀">Amiko 뉴스팀</SelectItem>
                    <SelectItem value="Amiko 관리자">Amiko 관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 카테고리 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">카테고리</Label>
              <Select value={newsWriteForm.category} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, category: value })}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">엔터테인먼트</SelectItem>
                  <SelectItem value="politics">정치</SelectItem>
                  <SelectItem value="economy">경제</SelectItem>
                  <SelectItem value="sports">스포츠</SelectItem>
                  <SelectItem value="technology">기술</SelectItem>
                  <SelectItem value="culture">문화</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">제목 (한국어)</Label>
                <Input
                  placeholder="한국어 제목을 입력하세요"
                  value={newsWriteForm.title}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">제목 (스페인어)</Label>
                <Input
                  placeholder="Título en español"
                  value={newsWriteForm.title_es}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title_es: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* 내용 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">내용 (한국어)</Label>
                <div className="relative">
                  <Textarea
                    placeholder="한국어 내용을 입력하세요"
                    value={newsWriteForm.content}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[200px] resize-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) insertImageToContent(file, true)
                      }
                      input.click()
                    }}
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">내용 (스페인어)</Label>
                <div className="relative">
                  <Textarea
                    placeholder="Contenido en español"
                    value={newsWriteForm.content_es}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content_es: e.target.value })}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[200px] resize-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) insertImageToContent(file, false)
                      }
                      input.click()
                    }}
                  >
                    📷 Insertar imagen
                  </Button>
                </div>
              </div>
            </div>

            {/* 썸네일 선택 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">썸네일 선택</Label>
              <Select value={selectedThumbnail} onValueChange={setSelectedThumbnail}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="썸네일로 사용할 이미지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {uploadedImages.length > 0 ? (
                    uploadedImages.map((image, index) => (
                      <SelectItem key={index} value={image.url}>
                        <div className="flex items-center gap-2">
                          <img src={image.url} alt={image.name} className="w-8 h-8 object-cover rounded" />
                          <span>{image.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-images" disabled>
                      <span className="text-gray-400">먼저 이미지를 삽입해주세요</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {uploadedImages.length > 0
                  ? "본문에 삽입된 이미지 중에서 썸네일로 사용할 이미지를 선택하세요."
                  : "본문에 이미지를 삽입하면 썸네일로 선택할 수 있습니다."
                }
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowNewsEditModal(false)}
                disabled={newsWriteLoading}
                className="px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleNewsEdit}
                disabled={newsWriteLoading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {newsWriteLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    수정 중...
                  </>
                ) : (
                  '뉴스 수정'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tests 탭 */}
      {currentView === 'tests' && (
        <div className="w-full">
          <QuizzesTab />
        </div>
      )}

    </div>
  )
}
