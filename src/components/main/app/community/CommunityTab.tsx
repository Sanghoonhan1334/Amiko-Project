'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
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
  Camera,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ArrowLeft,
  BookOpen,
  TrendingUp,
  Brain,
  Newspaper,
  Activity
} from 'lucide-react'
import CommunityMain from './CommunityMain'
import NewsDetail from './NewsDetail'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import AuthConfirmDialog from '@/components/common/AuthConfirmDialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { toast } from 'sonner'

// 퀴즈 관련 인터페이스 및 설정
interface Quiz {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  total_questions: number
  total_participants: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 카테고리 아이콘 및 색상 매핑
const categoryConfig: { [key: string]: { icon: string; color: string; bgColor: string } } = {
  personality: {
    icon: '🎭',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  celebrity: {
    icon: '⭐',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  knowledge: {
    icon: '🧠',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  fun: {
    icon: '🎉',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100'
  }
}

// 포인트 시스템 정의
const pointSystem = {
  korean: {
    question: 5,
    answer: 5,
    story: 5,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  },
  latin: {
    question: 5,
    answer: 5,
    story: 5,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  }
}

// 카테고리 정의 함수
const getCategories = (t: (key: string) => string) => [
  { id: 'free', name: t('communityTab.categories.free'), icon: '', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'kpop', name: 'K-POP', icon: '', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'kdrama', name: 'K-Drama', icon: '', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'beauty', name: t('communityTab.categories.beauty'), icon: '', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'korean', name: '한국어', icon: '', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'spanish', name: '스페인어', icon: '', color: 'bg-red-100 text-red-700 border-red-300' }
]


interface CommunityTabProps {
  onViewChange?: (view: string) => void
  verificationStatus?: 'loading' | 'verified' | 'unverified'
}

// CommunityTab.tsx - 메인 커뮤니티 탭 컴포넌트
// 뷰 시스템 매핑:
// 'home' → 홈 화면 (큰 버튼 4개)
// 'news' → 뉴스 시스템
// 'qa' → Q&A 시스템  
// 'tests' → 퀴즈 시스템
export default function CommunityTab({ onViewChange }: CommunityTabProps = {}) {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  
  // 네비게이션 핸들러 - 즉시 스켈레톤 표시
  const handleNavigation = useCallback(async (path: string) => {
    if (isNavigating) return // 중복 클릭 방지
    
    // 즉시 로딩 상태 표시
    setIsNavigating(true)
    
    // 다음 틱에서 네비게이션 실행 (UI 업데이트 후)
    setTimeout(() => {
      router.push(path)
    }, 0)
    
    // 로딩 상태는 페이지 전환 후 자동으로 해제됨
  }, [router, isNavigating])
  
  // 🚀 최적화: 인증 상태는 Header에서 관리하므로 중복 제거
  // AuthContext에서 이미 관리되고 있으므로 별도 상태 불필요


  // 뒤로가기 함수
  const handleBack = () => {
    router.push('/main')
  }
  
  // 운영진 상태 관리
  const [isAdmin, setIsAdmin] = useState(false)
  
  // 테스트 작성 모달 상태
  const [showTestWriteModal, setShowTestWriteModal] = useState(false)
  const [testFormData, setTestFormData] = useState({
    title: '',
    description: '',
    category: 'fun',
    thumbnail_url: ''
  })
  
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
  
  // 언어 설정 디버깅
  console.log('현재 언어 설정:', language)
  console.log('스토리 번역:', t('communityTab.story'))

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
  const [activeTab, setActiveTab] = useState('story')
  const [currentView, setCurrentView] = useState('home') // 'home', 'news', 'qa', 'tests'
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
  
  // 이미지 업로드 상태
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  // 퀴즈 관련 상태
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
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

  // 퀴즈 목록 불러오기
  useEffect(() => {
    if (currentView === 'tests') {
      fetchQuizzes()
    }
  }, [selectedCategory, currentView])

  const fetchQuizzes = async () => {
    try {
      console.log('CommunityTab: fetchQuizzes 호출됨, 카테고리:', selectedCategory)
      setQuizzesLoading(true)
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''
      const url = `/api/quizzes${categoryParam}`
      console.log('퀴즈 API 호출 URL:', url)
      
      const response = await fetch(url)
      console.log('퀴즈 API 응답:', response.status, response.ok)
      
      if (!response.ok) {
        throw new Error('퀴즈 목록 조회 실패')
      }

      const data = await response.json()
      console.log('퀴즈 API 데이터:', data)
      const allQuizzes = data.data || data.quizzes || []
      
      // 문제가 있는 UUID 테스트들을 제외
      const filteredQuizzes = allQuizzes.filter((quiz: any) => 
        !quiz.id.includes('-00') && 
        !quiz.id.includes('-01-') && 
        quiz.id !== '268caf0b-0031-4e58-9245-606e3421f1fd'
      )
      
      console.log('필터링된 퀴즈:', filteredQuizzes.length, '개 (전체:', allQuizzes.length, '개)')
      setQuizzes(filteredQuizzes)
    } catch (error) {
      console.error('퀴즈 목록 불러오기 실패:', error)
      toast.error(t('tests.errorLoading'))
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  const handleQuizClick = (quizId: string) => {
    console.log('퀴즈 클릭:', quizId)
    // 임베디드 퀴즈인 경우 특별 페이지로 이동
    if (quizId.startsWith('sample-mbti') || quizId.startsWith('embedded-mbti')) {
      router.push('/quiz/sample-mbti')
    } else {
      router.push(`/quiz/${quizId}`)
    }
  }
  
  // 이미지 업로드 함수
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // 이미지 파일만 필터링
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      toast.error('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name}은(는) 5MB를 초과합니다.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // 최대 5개 이미지 제한
    if (uploadedImages.length + validFiles.length > 5) {
      toast.error('최대 5개까지 이미지를 업로드할 수 있습니다.')
      return
    }

    setUploadingImages(true)

    try {
      // 토큰 가져오기
      if (!token) {
        throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
      }

      // 각 이미지 파일을 Supabase Storage에 업로드
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'community-posts')

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(token)}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '이미지 업로드에 실패했습니다.')
        }

        const result = await response.json()
        return result.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...uploadedUrls])

      // 미리보기 이미지 추가
      validFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })

      console.log('이미지 업로드 완료:', uploadedUrls)
      toast.success(`${uploadedUrls.length}개 이미지가 업로드되었습니다.`)

    } catch (err) {
      console.error('이미지 업로드 오류:', err)
      toast.error(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

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
        currentToken = localStorage.getItem('amiko_token')
        
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
          images: uploadedImages, // 업로드된 이미지 URL들
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
        setUploadedImages([])
        setImagePreviews([])
        // 게시글 목록 새로고침
        // 🚀 최적화: 새로고침 트리거 제거 (불필요한 리렌더링 방지)
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
    if (currentView === 'news') {
      fetchRealNews()
    }
  }, [currentView])
  const [showStoryUploadModal, setShowStoryUploadModal] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 화면 크기 체크
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    const timer = setTimeout(() => {
      checkScreenSize()
    }, 100)
    
    window.addEventListener('resize', checkScreenSize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storyText, setStoryText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedStory, setSelectedStory] = useState<any>(null)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const storyContainerRef = useRef<HTMLDivElement>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isScrollingRef = useRef(false)
  const loadStoriesAbortControllerRef = useRef<AbortController | null>(null)
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
    date: '',
    category: 'entertainment'
  })
  const [newsWriteLoading, setNewsWriteLoading] = useState(false)
  
    // 이미지 관련 상태
    const [newsUploadedImages, setNewsUploadedImages] = useState<Array<{url: string, name: string}>>([])
    const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')
  
  // 게시글 상세 페이지 상태 (더 이상 사용하지 않음 - 새로운 페이지로 이동)
  
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
      const response = await fetch('/api/news?limit=5')
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
      onViewChange?.('news-detail')
    } else {
      console.error('뉴스 데이터가 올바르지 않습니다:', news)
    }
  }
  
  // 데이터 상태 관리
  const [questions, setQuestions] = useState<any[]>([])
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(true)
  const [answers, setAnswers] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [storiesLoading, setStoriesLoading] = useState<boolean | null>(true)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [newsData, setNewsData] = useState<any[]>([])
  
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

  // URL 파라미터와 탭 상태 동기화 (cTab = story|qa|news|tests)
  useEffect(() => {
    const tabParam = searchParams.get('cTab')
    if (tabParam && ['story', 'qa', 'news', 'tests'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // 데이터 로딩 함수들
  const loadQuestions = useCallback(async () => {
    console.log('loadQuestions 호출됨 - 실제 API 호출')
    setQuestionsLoading(true)
    
    try {
      const response = await fetch('/api/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 질문을 불러오는데 실패했습니다`)
      }
      
      const data = await response.json()
      console.log('질문 데이터 로딩 성공:', data.questions?.length || 0, '개')
      
      // API 응답을 프론트엔드 형식으로 변환
      const transformedQuestions = (data.questions || []).map((q: any) => ({
        ...q,
        createdAt: new Date(q.created_at),
        upvotes: q.like_count || 0,
        answers: q.comment_count || 0,
        views: q.view_count || 0,
        authorType: 'korean', // 기본값으로 설정 (실제로는 사용자 정보에서 판단해야 함)
        isSolved: false, // 기본값
        preview: q.content?.substring(0, 100) + (q.content?.length > 100 ? '...' : ''),
        category: 'all' // 기본 카테고리
      }))
      
      console.log('변환된 질문 데이터:', transformedQuestions)
      console.log('🔥 setQuestions 호출 전 - questionsLoading:', questionsLoading)
      setQuestions(transformedQuestions)
      console.log('🔥 setQuestions 호출 후 - 질문 데이터 설정 완료')
    } catch (error) {
      console.error('질문 로딩 오류:', error)
      setQuestions([])
      console.log('오류 발생, 로딩 상태 해제')
    } finally {
      console.log('🔥 finally 블록 시작 - questionsLoading을 false로 설정')
      setQuestionsLoading(false)
      console.log('🔥 questionsLoading을 false로 설정 완료')
    }
  }, [token])

  const loadAnswers = async (questionId: string) => {
    console.log('loadAnswers 호출됨 - 실제 API 호출:', questionId)
    
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 답변을 불러오는데 실패했습니다`)
      }
      
      const data = await response.json()
      console.log('답변 데이터 로딩 성공:', data.answers?.length || 0, '개')
      setAnswers(data.answers || [])
    } catch (error) {
      console.error('답변 로딩 오류:', error)
      setAnswers([])
    }
  }

  // 스토리 로딩 함수 (실제 API 호출)
  const loadStories = async () => {
    // 이미 로딩 중인 경우 중복 호출 방지 (단, 초기 로딩은 제외)
    if (storiesLoading === true && stories.length > 0) {
      console.log('스토리 로딩 중복 호출 방지')
      return
    }
    
    // 이전 요청이 있다면 취소
    if (loadStoriesAbortControllerRef.current) {
      console.log('이전 스토리 로딩 요청 취소')
      loadStoriesAbortControllerRef.current.abort()
    }
    
    console.log('loadStories 호출됨 - 실제 API 호출')
    
    // 스켈레톤을 보여주기 위한 최소 지연 시간
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 타임아웃 설정으로 무한 대기 방지
    const controller = new AbortController()
    loadStoriesAbortControllerRef.current = controller
    const timeoutId = setTimeout(() => {
      console.log('스토리 로딩 타임아웃')
      controller.abort()
    }, 30000) // 30초 타임아웃
    
    try {
      // 토큰이 없어도 공개 스토리는 조회 가능하도록 수정
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${encodeURIComponent(token)}`
      }
      
      const baseUrl = window.location.origin
      console.log('스토리 API 호출:', `${baseUrl}/api/stories?isPublic=true&limit=20`)
      
      const response = await fetch(`${baseUrl}/api/stories?isPublic=true&limit=20`, {
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
        
        // 빈 객체나 유효하지 않은 응답 처리
        const errorMessage = errorData?.error || 
                           (typeof errorData === 'object' && Object.keys(errorData).length === 0 ? 'Empty response' : 'Unknown error')
        
        throw new Error(errorMessage || `스토리를 불러오는데 실패했습니다. (${response.status})`)
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
          id: story.user_id,
          full_name: story.user_name || '익명',
          profile_image_url: story.user_profile_image || null
        }
      }))
      
      setStories(convertedStories)
      console.log('스토리 목록 설정 완료:', convertedStories.length, '개')
    } catch (err) {
      clearTimeout(timeoutId) // 타임아웃 정리
      
      // AbortError인 경우 타임아웃으로 처리 (에러 로그 없이)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('스토리 로딩 타임아웃, 빈 배열 사용')
        setStories([])
        return
      }
      
      // 실제 에러인 경우에만 로그 출력
      console.error('스토리 로딩 실패:', err)
      
      // 네트워크 오류나 기타 에러의 경우 빈 배열로 설정
      setStories([])
      
      // 개발 환경에서만 에러 메시지 표시
      if (process.env.NODE_ENV === 'development') {
        console.warn('스토리 로딩 중 오류 발생, 빈 목록으로 대체:', err)
      }
    } finally {
      // 컨트롤러 참조 정리
      if (loadStoriesAbortControllerRef.current === controller) {
        loadStoriesAbortControllerRef.current = null
      }
      setStoriesLoading(false)
      console.log('스토리 로딩 상태를 false로 설정')
    }
  }


  // 답변 작성 함수
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedQuestion) return
    
    // 🚀 최적화: 로딩 상태 제거 (불필요한 상태 관리 방지)
    
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
      // 🚀 최적화: 로딩 상태 제거
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
    
    // 스토리 로딩 시도 (커뮤니티 홈에서 항상 표시되므로 항상 로딩)
    console.log('커뮤니티 홈 로딩, 스토리 로딩 시작')
    loadStories().catch((error) => {
      console.error('스토리 로딩 중 예외 발생:', error)
      // 에러가 발생해도 빈 배열로 설정하여 앱이 정상 작동하도록 함
      setStories([])
      setStoriesLoading(false) // 에러 시에도 로딩 상태 해제
    })
  }, [user, token, activeTab, loadQuestions])

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
    console.log('CommunityTab: handleViewChange 호출됨:', view)
    setCurrentView(view)
    setActiveTab(view)
    onViewChange?.(view) // 상위 컴포넌트에 뷰 변경 알림
    // CustomEvent도 전달 (메인 페이지에서 헤더 업데이트용)
    window.dispatchEvent(new CustomEvent('communityViewChanged', { detail: view }))
  }

  // 상위 컴포넌트에서 뷰 변경 시 내부 상태 동기화
  useEffect(() => {
    if (onViewChange) {
      // 상위 컴포넌트의 communityView 변경을 감지하여 내부 currentView 동기화
      const handleParentViewChange = (event: CustomEvent) => {
        const newView = event.detail
        console.log('CommunityTab: 외부 뷰 변경 감지:', newView)
        if (newView === 'home') {
          setCurrentView('home')
        } else if (newView === 'tests') {
          setCurrentView('tests')
          setActiveTab('tests')
        }
      }
      
      window.addEventListener('communityViewChanged', handleParentViewChange as EventListener)
      
      return () => {
        window.removeEventListener('communityViewChanged', handleParentViewChange as EventListener)
      }
    }
  }, [onViewChange])

  // 커뮤니티 홈으로 돌아가기
  const goToHome = () => {
    setCurrentView('home')
    setActiveTab('story')
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

  // 컴포넌트 마운트 시 currentView를 'home'으로 리셋 (URL 파라미터가 없을 때만)
  useEffect(() => {
    const tabParam = searchParams.get('cTab')
    if (!tabParam) {
      setCurrentView('home')
    }
  }, [searchParams])

  // 컴포넌트 언마운트 시 스크롤 인터벌 및 abort controller 정리
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
      if (loadStoriesAbortControllerRef.current) {
        loadStoriesAbortControllerRef.current.abort()
        loadStoriesAbortControllerRef.current = null
      }
    }
  }, [])

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

      // Q&A 질문 생성 API 호출
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(currentToken)}`
        },
        body: JSON.stringify({
          title: questionForm.title,
          content: questionForm.content
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
      console.log('새 질문 작성:', result.question)

      // 포인트 획득 시도
      if (user?.id) {
        console.log('포인트 획득 시도:', { userId: user.id, postId: result.question.id })
        
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
  const [answerUpvotes, setAnswerUpvotes] = useState<{ [key: number]: number }>({})

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
      
      // 실제 이미지 파일을 Base64로 변환하여 사용
      if (selectedFile) {
        console.log('이미지 파일을 Base64로 변환 시작:', selectedFile.name)
        
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(selectedFile)
          })
          
          imageUrl = base64
          console.log('Base64 변환 성공, 길이:', base64.length)
        } catch (error) {
          console.error('Base64 변환 실패:', error)
          toast.error('이미지 처리에 실패했습니다.')
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
  const earnPoints = (activity: 'question' | 'answer' | 'story' | 'reaction' | 'consultation') => {
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

  // 스토리 네비게이션 함수들
  const scrollToStory = (index: number) => {
    if (storyContainerRef.current) {
      const container = storyContainerRef.current
      const storyWidth = 200 // 고정된 스토리 카드 너비 (gap 포함)
      const scrollLeft = index * storyWidth
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
      setCurrentStoryIndex(index)
    }
  }

  const startContinuousScroll = (direction: 'left' | 'right') => {
    if (isScrollingRef.current) return
    
    isScrollingRef.current = true
    scrollIntervalRef.current = setInterval(() => {
      if (storyContainerRef.current) {
        const container = storyContainerRef.current
        const scrollAmount = 50 // 스크롤 속도
        const currentScroll = container.scrollLeft
        
        if (direction === 'left') {
          container.scrollLeft = Math.max(0, currentScroll - scrollAmount)
        } else {
          container.scrollLeft = Math.min(
            container.scrollWidth - container.clientWidth,
            currentScroll + scrollAmount
          )
        }
      }
    }, 50) // 50ms마다 스크롤
  }

  const stopContinuousScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
    isScrollingRef.current = false
  }

  const scrollToPrevious = () => {
    console.log('scrollToPrevious 호출됨')
    if (storyContainerRef.current) {
      const container = storyContainerRef.current
      console.log('컨테이너 찾음:', container)
      const scrollAmount = 200 // 한 번에 스크롤할 거리
      const newScrollLeft = Math.max(0, container.scrollLeft - scrollAmount)
      
      console.log('현재 스크롤:', container.scrollLeft, '새 스크롤:', newScrollLeft)
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    } else {
      console.log('storyContainerRef.current가 null')
    }
  }

  const scrollToNext = () => {
    console.log('scrollToNext 호출됨')
    if (storyContainerRef.current) {
      const container = storyContainerRef.current
      console.log('컨테이너 찾음:', container)
      const scrollAmount = 200 // 한 번에 스크롤할 거리
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      const newScrollLeft = Math.min(maxScrollLeft, container.scrollLeft + scrollAmount)
      
      console.log('현재 스크롤:', container.scrollLeft, '새 스크롤:', newScrollLeft)
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    } else {
      console.log('storyContainerRef.current가 null')
    }
  }

  // 스토리 스크롤 이벤트 핸들러
  const handleStoryScroll = () => {
    if (storyContainerRef.current) {
      const container = storyContainerRef.current
      const storyWidth = 200 // 고정된 스토리 카드 너비
      const newIndex = Math.round(container.scrollLeft / storyWidth)
      setCurrentStoryIndex(newIndex)
    }
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

  // 뉴스 이미지 업로드 함수
  const handleNewsImageUpload = async (file: File): Promise<string> => {
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
      const imageUrl = await handleNewsImageUpload(file)
      const imageName = file.name.split('.')[0] // 확장자 제거
      
      // 업로드된 이미지 목록에 추가
      setNewsUploadedImages(prev => [...prev, { url: imageUrl, name: imageName }])
      
      // 간단한 이미지 플레이스홀더 삽입
      const imagePlaceholder = `[이미지: ${imageName}]`
      
      if (isKorean) {
        setNewsWriteForm(prev => ({
          ...prev,
          content: prev.content + '\n\n' + imagePlaceholder
        }))
      } else {
        setNewsWriteForm(prev => ({
          ...prev,
          content_es: prev.content_es + '\n\n' + imagePlaceholder
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
    if (!newsWriteForm.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
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
          title_es: newsWriteForm.title, // 한국어 제목을 스페인어 제목으로도 사용
          content: newsWriteForm.content,
          content_es: newsWriteForm.content, // 한국어 내용을 스페인어 내용으로도 사용
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          category: 'entertainment', // 기본 카테고리 설정
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
          date: '',
          category: 'entertainment'
        })
        setNewsUploadedImages([])
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

  // 테스트 생성 함수
  const handleCreateTest = async () => {
    if (!testFormData.title.trim()) {
      toast.error('테스트 제목을 입력해주세요.')
      return
    }
    
    if (!testFormData.description.trim()) {
      toast.error('테스트 설명을 입력해주세요.')
      return
    }

    try {
      console.log('테스트 생성 요청 데이터:', testFormData)

      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testFormData.title,
          description: testFormData.description,
          category: testFormData.category,
          thumbnail_url: testFormData.thumbnail_url || null,
        })
      })

      if (response.ok) {
        toast.success('테스트가 생성되었습니다!')
        setShowTestWriteModal(false)
        setTestFormData({
          title: '',
          description: '',
          category: 'fun',
          thumbnail_url: ''
        })
        // 테스트 목록 새로고침
        await fetchQuizzes()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('테스트 생성 실패:', errorData)
        toast.error(errorData.error || '테스트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('테스트 생성 오류:', error)
      toast.error('테스트 생성 중 오류가 발생했습니다.')
    }
  }

  // 뉴스 작성 함수
  const handleNewsWrite = async () => {
    if (!newsWriteForm.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setNewsWriteLoading(true)
    try {
      console.log('뉴스 작성 요청 데이터:', {
        title: newsWriteForm.title,
        content: newsWriteForm.content,
        source: newsWriteForm.source,
        author: newsWriteForm.author,
        selectedThumbnail: selectedThumbnail,
        thumbnailLength: selectedThumbnail?.length
      })

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newsWriteForm.title,
          title_es: newsWriteForm.title, // 한국어 제목을 스페인어 제목으로도 사용
          content: newsWriteForm.content,
          content_es: newsWriteForm.content, // 한국어 내용을 스페인어 내용으로도 사용
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: 'entertainment', // 기본 카테고리 설정
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
          date: '',
          category: 'entertainment'
        })
        setNewsUploadedImages([])
        setSelectedThumbnail('')
        // 뉴스 목록 새로고침
        await fetchRealNews()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('뉴스 작성 실패:', errorData)
        console.error('응답 상태:', response.status)
        console.error('응답 헤더:', Object.fromEntries(response.headers.entries()))
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
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-2 md:px-6 bg-white dark:bg-gray-900" style={{ paddingTop: isMobile ? '0px' : '0px', paddingBottom: isMobile ? '20px' : '48px' }}>
      {/* 테스트 요소 - 컴포넌트가 렌더링되는지 확인 */}
      {/* 메인 컨텐츠 */}
      <div className="w-full space-y-6">



      {/* 모바일 전용 커뮤니티 제목 - 제거됨 */}
      {/* <div className="md:hidden mb-4">
        <h1 className="text-2xl font-bold text-gray-800">커뮤니티</h1>
      </div> */}

      {/* 스토리 섹션 제거됨 - 이제 아이콘으로 대체 */}

      {/* 커뮤니티 홈 메뉴 - 제목과 5개 아이콘 */}
      {currentView === 'home' && (
            <div className="w-full">
               {/* 제목 섹션 */}
               <div className="text-center mb-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0s', animationFillMode: 'forwards' }}>
                 <div className="flex justify-center mb-3">
                   <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
                     <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                   </div>
                 </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-['Inter']">{t('mainPage.title')}</h2>
                <div className="w-16 h-1 bg-purple-300 mx-auto rounded-full"></div>
        </div>
        
                 {/* 5개 아이콘 - 모든 화면에서 한 줄 배치 */}
                 <div className="w-full flex flex-row items-center justify-center gap-2 md:gap-4 overflow-x-auto px-2 mb-0 animate-fade-in-up opacity-0" style={{ animationDelay: '0.05s', animationFillMode: 'forwards' }}>
                   {/* 주제별 게시판 */}
                   <button
                     onClick={() => handleNavigation('/community/freeboard')}
                     disabled={isNavigating}
                     className={`flex flex-col items-center p-2 transition-all duration-300 hover:scale-105 group flex-shrink-0 overflow-visible ${
                       isNavigating ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                   >
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-1 md:mb-2 overflow-hidden">
                      <img src="/topic-board.png" alt="주제별 게시판" className="w-8 h-8 md:w-10 md:h-10 object-contain" loading="eager" decoding="async" />
                    </div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 text-center leading-tight" style={{ fontSize: '10px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.1' }}>{t('community.freeBoard')}</h3>
                   </button>

                   {/* K-매거진 */}
                   <button
                     onClick={() => handleNavigation('/community/news')}
                     disabled={isNavigating}
                     className={`flex flex-col items-center p-2 transition-all duration-300 hover:scale-105 group flex-shrink-0 overflow-visible ${
                       isNavigating ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                   >
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-1 md:mb-2 overflow-hidden">
                       <img src="/k-magazine.png" alt="K-매거진" className="w-8 h-8 md:w-10 md:h-10 object-contain" loading="eager" decoding="async" />
                     </div>
                     <h3 className="font-medium text-gray-700 dark:text-gray-300 text-center leading-tight" style={{ fontSize: '10px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.1' }}>{t('community.koreanNews')}</h3>
                   </button>
                   
                   {/* Q&A */}
                   <button
                     onClick={() => handleNavigation('/community/qa')}
                     disabled={isNavigating}
                     className={`flex flex-col items-center p-2 transition-all duration-300 hover:scale-105 group flex-shrink-0 overflow-visible ${
                       isNavigating ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                   >
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-1 md:mb-2 overflow-hidden">
                       <img src="/qa.png" alt="Q&A" className="w-8 h-8 md:w-10 md:h-10 object-contain" loading="eager" decoding="async" />
                     </div>
                     <h3 className="font-medium text-gray-700 dark:text-gray-300 text-center leading-tight" style={{ fontSize: '10px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.1' }}>{t('community.qa')}</h3>
                   </button>
                   
                   {/* 심리테스트 */}
                   <button
                     onClick={() => handleNavigation('/community/tests')}
                     disabled={isNavigating}
                     className={`flex flex-col items-center p-2 transition-all duration-300 hover:scale-105 group flex-shrink-0 overflow-visible ${
                       isNavigating ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                   >
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-1 md:mb-2 overflow-hidden">
                       <img src="/psychology-test.png" alt="심리테스트" className="w-8 h-8 md:w-10 md:h-10 object-contain" loading="eager" decoding="async" />
                     </div>
                     <h3 className="font-medium text-gray-700 dark:text-gray-300 text-center leading-tight" style={{ fontSize: '10px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.1' }}>{t('tests.title')}</h3>
                   </button>

                   {/* 스토리 */}
                   <button
                     onClick={() => handleNavigation('/community/stories')}
                     disabled={isNavigating}
                     className={`flex flex-col items-center p-2 transition-all duration-300 hover:scale-105 group flex-shrink-0 overflow-visible ${
                       isNavigating ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                   >
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-1 md:mb-2 overflow-hidden">
                       <img src="/story.png" alt="스토리" className="w-8 h-8 md:w-10 md:h-10 object-contain" loading="eager" decoding="async" />
                     </div>
                     <h3 className="font-medium text-gray-700 dark:text-gray-300 text-center leading-tight" style={{ fontSize: '10px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.1' }}>{t('community.story')}</h3>
                   </button>
                 </div>

                 {/* 새로운 섹션들 - 아이콘 아래 */}
                 <div className="w-full space-y-4 mt-6">
                   {/* 최근 스토리, 인기 게시글, 인기 심리테스트, 인기 한국 뉴스, 최근 활동 */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                     {/* 최근 스토리 */}
                     <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 shadow-lg border border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-slide-in-left opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <BookOpen className="w-5 h-5 text-white" />
                         </div>
                         <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                           {t('home.community.recentStories')}
                         </h3>
                       </div>
                       <div className="space-y-3">
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                             {language === 'ko' ? '한국에서의 첫 여행...' : 'Mi primer viaje a Corea...'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                             <Eye className="w-3 h-3" />
                             <span>1.2k</span>
                           </div>
                         </div>
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                             {language === 'ko' ? '한국어 배우기 팁' : 'Consejos para aprender coreano'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                             <ThumbsUp className="w-3 h-3" />
                             <span>856</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* 인기 게시글 */}
                     <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-5 shadow-lg border border-red-200 dark:border-red-700 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-slide-in-right opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <TrendingUp className="w-5 h-5 text-white" />
                         </div>
                         <h3 className="font-bold text-red-900 dark:text-red-100 text-sm">
                           {t('home.community.popularPosts')}
                         </h3>
                       </div>
                       <div className="space-y-3">
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                             {language === 'ko' ? '한국 드라마 추천' : 'Recomendaciones de dramas'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
                             <Star className="w-3 h-3" />
                             <span>2.1k</span>
                           </div>
                         </div>
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                             {language === 'ko' ? '한국 음식 레시피' : 'Recetas de comida coreana'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
                             <MessageSquare className="w-3 h-3" />
                             <span>1.5k</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* 인기 심리테스트 */}
                     <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl p-5 shadow-lg border border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-slide-in-left opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <Brain className="w-5 h-5 text-white" />
                         </div>
                         <h3 className="font-bold text-purple-900 dark:text-purple-100 text-sm">
                           {t('home.community.popularTests')}
                         </h3>
                       </div>
                       <div className="space-y-3">
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                             {language === 'ko' ? '내가 가장 잘 맞는...' : 'Mi K-POP favorito...'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300">
                             <Target className="w-3 h-3" />
                             <span>3.4k</span>
                           </div>
                         </div>
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                             {language === 'ko' ? '한국어 실력 테스트' : 'Test de nivel de coreano'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300">
                             <Sparkles className="w-3 h-3" />
                             <span>2.8k</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* 인기 한국 뉴스 */}
                     <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-5 shadow-lg border border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-slide-in-right opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <Newspaper className="w-5 h-5 text-white" />
                         </div>
                         <h3 className="font-bold text-green-900 dark:text-green-100 text-sm">
                           {t('home.community.popularNews')}
                         </h3>
                       </div>
                       <div className="space-y-3">
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                             {language === 'ko' ? '한국의 새로운 K-컬처...' : 'Nueva política K-cultura...'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-300">
                             <Clock className="w-3 h-3" />
                             <span>2h ago</span>
                           </div>
                         </div>
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                             {language === 'ko' ? '한국 전통 음식 인기...' : 'Popularidad de comida...'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-300">
                             <Eye className="w-3 h-3" />
                             <span>1.9k</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* 최근 활동 */}
                     <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-5 shadow-lg border border-orange-200 dark:border-orange-700 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-slide-in-left opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                       <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <Activity className="w-5 h-5 text-white" />
                         </div>
                         <h3 className="font-bold text-orange-900 dark:text-orange-100 text-sm">
                           {t('home.community.recentActivities')}
                         </h3>
                       </div>
                       <div className="space-y-3">
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-1">
                             {language === 'ko' ? '새 게시글 작성됨' : 'Nueva publicación creada'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-300">
                             <User className="w-3 h-3" />
                             <span>5분 전</span>
                           </div>
                         </div>
                         <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200">
                           <div className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-1">
                             {language === 'ko' ? '심리테스트 완료' : 'Test psicológico completado'}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-300">
                             <Star className="w-3 h-3" />
                             <span>12분 전</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
            </div>
      )}

      {/* 탭 컨텐츠 */}
      {currentView === 'qa' && (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 md:p-6">





      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between gap-2 pt-4 md:pt-0">
        <div className="relative flex-1">
          <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
          <Input
            placeholder={t('communityTab.searchQuestions')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 sm:pl-20 w-full bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </div>
        
        {/* 질문하기 버튼 - 오른쪽 끝 */}
        <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 text-white whitespace-nowrap">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('communityTab.askQuestion')}</span>
            </Button>
          </DialogTrigger>
            
            <DialogContent className="max-w-2xl bg-white border-2 border-gray-200 shadow-xl">
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">{t('communityTab.newQuestion')}</DialogTitle>
                <DialogDescription className="sr-only">새로운 질문을 작성하는 모달입니다.</DialogDescription>
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
          {questionsLoading ? (
            // 로딩 중 스켈레톤
            <div className="space-y-8">
              {[1, 2, 3].map((index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="h-6 w-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-purple-600 mb-4">
                  <span className="animate-spin">❓</span>
                  <span>질문을 불러오는 중...</span>
                </div>
                <Button 
                  onClick={() => {
                    console.log('🚨 강제 로딩 해제 버튼 클릭')
                    setQuestionsLoading(false)
                  }}
                  variant="outline"
                  className="text-sm"
                >
                  🚨 강제로 로딩 해제 (버전 2)
                </Button>
              </div>
            </div>
          ) : (
            // 질문 카드 리스트
            <div className="space-y-8">
              {filteredQuestions.map((question, index) => (
              <div key={question.id}>
                {/* 데스크톱: 카드 스타일 */}
                <Card 
                  className="hidden md:block p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-700 hover:bg-purple-50/30 dark:hover:bg-purple-900/20 cursor-pointer !opacity-100 !transform-none"
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
                  className="block md:hidden py-3 px-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-all duration-300 shadow-md"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleQuestionClick(question)
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 mr-2">{question.title}</h3>
                    <div className="flex items-center gap-1 text-purple-600">
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-sm font-medium">{question.upvotes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
              
              {/* 결과 없음 */}
              {filteredQuestions.length === 0 && (
            <Card className="p-12 text-center shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              {questions.length === 0 ? (
                // 질문이 아예 없는 경우
                <>
                  <div className="text-4xl mb-4">❓</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">아직 질문이 없습니다</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    궁금한 점이 있으시면 첫 번째 질문을 작성해보세요!
                  </p>
                  <Button 
                    onClick={() => setQuestionForm(prev => ({ ...prev, show: true }))}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    질문 작성하기
                  </Button>
                </>
              ) : (
                // 검색/필터 결과가 없는 경우
                <>
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    다른 키워드나 카테고리로 검색해보세요
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('')
                      setActiveCategory('all')
                    }}
                  >
                    필터 초기화
                  </Button>
                </>
              )}
            </Card>
          )}
            </div>
          )}
      </div>
        </div>
      )}


      {currentView === 'news' && (
        <div className="w-full">
          {showNewsDetail && selectedNews ? (
            // 뉴스 상세 내용 (전체 영역)
            <div className="space-y-4">
              {/* 목록으로 돌아가기 버튼 */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowNewsDetail(false)
                    setSelectedNews(null)
                    onViewChange?.('news')
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-medium">목록으로 돌아가기</span>
                </button>
              </div>
            <NewsDetail 
              news={selectedNews} 
              onBack={() => {
                setShowNewsDetail(false)
                setSelectedNews(null)
                onViewChange?.('news')
              }}
              showSpanish={showSpanishNews}
              isAdmin={isAdmin}
              onEdit={(news) => {
                setShowNewsDetail(false)
                setSelectedNews(null)
                onViewChange?.('news')
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
                  date: news.date || '',
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
            </div>
          ) : (
            // 뉴스 목록
            <div className="space-y-6">
              <div className="flex items-center justify-end">
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
                                        date: news.date || '',
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
                      답변 ({answers.length})
                    </h4>
                    
                    {answers.map((answer) => (
                        <Card key={answer.id} className="p-4 !opacity-100 !bg-white dark:!bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600">
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
            <DialogDescription className="sr-only">새로운 스토리를 작성하는 모달입니다.</DialogDescription>
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
                    ref={(el) => {
                      if (el) (window as any).imageUploadGalleryRef = el
                    }}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadGallery"
                    multiple={false}
                    capture={undefined}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('imageUploadGallery') as HTMLInputElement
                      input?.click()
                    }}
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {imagePreview ? '다른 사진 선택' : '📱 갤러리에서 선택'}
                      </span>
                    </div>
                  </button>
                </div>
                
                {/* 카메라로 촬영 */}
                <div className="flex gap-2">
                  <input
                    ref={(el) => {
                      if (el) (window as any).imageUploadCameraRef = el
                    }}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadCamera"
                    capture="environment"
                    multiple={false}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('imageUploadCamera') as HTMLInputElement
                      input?.click()
                    }}
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        📷 카메라로 촬영
                      </span>
                    </div>
                  </button>
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
            <DialogDescription>스토리를 전체 화면으로 보는 모달입니다.</DialogDescription>
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
            <DialogDescription className="sr-only">스토리에 댓글을 작성하는 모달입니다.</DialogDescription>
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
      <Dialog open={showWriteModal} onOpenChange={(open) => {
        setShowWriteModal(open)
        if (!open) {
          // 모달이 닫힐 때 상태 초기화
          setWriteTitle('')
          setWriteContent('')
          setWriteCategory('free')
          setUploadedImages([])
          setImagePreviews([])
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl mx-4">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {language === 'ko' ? '게시글 작성' : 'Write Post'}
            </DialogTitle>
            <DialogDescription className="sr-only">새로운 게시글을 작성하는 모달입니다.</DialogDescription>
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
                  <SelectItem value="kpop">{language === 'ko' ? 'K-POP' : 'K-POP Board'}</SelectItem>
                  <SelectItem value="kdrama">{language === 'ko' ? 'K-Drama' : 'K-Drama Board'}</SelectItem>
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

            {/* 이미지 업로드 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {language === 'ko' ? '이미지 첨부' : 'Image Upload'}
              </Label>
              
              {/* 이미지 업로드 버튼 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="community-image-upload"
                  disabled={uploadingImages}
                />
                <label
                  htmlFor="community-image-upload"
                  className={`px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors text-center ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingImages ? '업로드 중...' : '📷 이미지 선택'}
                </label>
                <span className="text-sm text-gray-500 text-center sm:text-left">
                  JPG, PNG, GIF (최대 5MB, 최대 5개)
                </span>
              </div>
              
              {/* 업로드된 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    업로드된 이미지 ({imagePreviews.length}/5)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`첨부 이미지 ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            <DialogDescription className="sr-only">새로운 뉴스를 작성하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
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
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">게시 날짜</Label>
                <Input
                  type="date"
                  value={newsWriteForm.date}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>


            {/* 제목 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">제목</Label>
              <Input
                placeholder="제목을 입력하세요"
                value={newsWriteForm.title}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">내용</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) insertImageToContent(file, true)
                    }}
                    className="hidden"
                    id="contentImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('contentImageUpload')?.click()}
                    className="text-xs"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={newsWriteForm.content}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
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
                  {newsUploadedImages.length > 0 ? (
                    newsUploadedImages.map((image, index) => (
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
                {newsUploadedImages.length > 0 
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
            <DialogDescription className="sr-only">기존 뉴스를 편집하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
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


            {/* 제목 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">제목</Label>
              <Input
                placeholder="제목을 입력하세요"
                value={newsWriteForm.title}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">내용</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) insertImageToContent(file, true)
                    }}
                    className="hidden"
                    id="editContentImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('editContentImageUpload')?.click()}
                    className="text-xs"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={newsWriteForm.content}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
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
                  {newsUploadedImages.length > 0 ? (
                    newsUploadedImages.map((image, index) => (
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
        <div className="w-full max-w-none bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 md:p-6">
          <div className="space-y-6 w-full">
            {/* 카테고리 필터 및 버튼들 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
                {[
                  { id: 'all', name: t('tests.categories.all') },
                  { id: 'personality', name: t('tests.categories.personality') },
                  { id: 'celebrity', name: t('tests.categories.celebrity') },
                  { id: 'knowledge', name: t('tests.categories.knowledge') },
                  { id: 'fun', name: t('tests.categories.fun') }
                ].map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap flex-1"
                  >
                    {category.name}
                  </Button>
                ))}
        </div>
              
              {/* 이전 버튼과 운영진 전용 테스트 작성 버튼 */}
              <div className="flex gap-2">
                {/* 이전 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 bg-white text-xs px-2 py-1 h-7 relative z-50"
                >
                  <ArrowLeft className="w-3 h-3" />
                  이전
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="whitespace-nowrap"
                  onClick={async () => {
                    try {
                      // 간단한 샘플 테스트 데이터 생성 (임시로)
                      const sampleQuiz = {
                        id: 'embedded-mbti-' + Date.now(),
                        title: '🎯 간단 MBTI 테스트',
                        description: '당신의 성격 유형을 간단히 알아보세요',
                        category: 'personality',
                        thumbnail_url: null,
                        total_questions: 4,
                        total_participants: 0,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      };
                      
                      // 기존 퀴즈 목록에 추가
                      setQuizzes(prev => [...prev, sampleQuiz]);
                      toast.success('샘플 테스트가 성공적으로 생성되었습니다!');
                      
                      // 실제 API 호출도 시도해보긴...
                      try {
                        const response = await fetch('/api/admin/create-sample-test-simple', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        const result = await response.json();
                        if (result.success) {
                          console.log('API로도 생성 완료');
                        }
                      } catch (apiError) {
                        console.log('API 생성 실패했지만 로컬 데이터로 표시:', apiError);
                      }
                    } catch (error) {
                      toast.error('샘플 테스트 생성에 실패했습니다.');
                    }
                  }}
                >
                  📋 샘플 테스트 생성
                </Button>
                {isAdmin && (
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                    onClick={() => setShowTestWriteModal(true)}
                  >
                    ➕ 테스트 작성
                  </Button>
                )}
              </div>
            </div>

            {/* 퀴즈 목록 */}
            {quizzesLoading ? (
              // 로딩 상태
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              // 빈 상태
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium">{t('tests.noPosts')}</p>
                  <p className="text-sm text-gray-400">{t('tests.beFirst')}</p>
                </div>
              </div>
            ) : (
              // 퀴즈 카드 목록
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 w-full">
                {quizzes.map((quiz) => {
                  const config = categoryConfig[quiz.category] || categoryConfig.fun
                  
                  return (
                    <div
                      key={quiz.id}
                      className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
                      onClick={() => handleQuizClick(quiz.id)}
                    >
                      {/* 카테고리 배지 */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          <span className="mr-1">{config.icon}</span>
                          {t(`tests.categories.${quiz.category}`)}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>

                      {/* 제목 */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {quiz.title}
                      </h3>

                      {/* 설명 */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {quiz.description}
                      </p>

                      {/* 정보 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          <span>{quiz.total_questions} {t('tests.questions')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.ceil(quiz.total_questions * 0.5)} {t('tests.minutes')}</span>
                        </div>
                      </div>

                      {/* 시작 버튼 */}
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuizClick(quiz.id)
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('tests.startButton')}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 테스트 작성 모달 */}
      <Dialog open={showTestWriteModal} onOpenChange={setShowTestWriteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              새 테스트 작성
            </DialogTitle>
            <DialogDescription>
              새로운 테스트를 작성하여 커뮤니티에 공유해보세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="test-title" className="text-sm font-medium text-gray-700">
                테스트 제목 *
              </Label>
              <Input
                id="test-title"
                placeholder="예: 나는 어떤 성격일까?"
                value={testFormData.title}
                onChange={(e) => setTestFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="test-description" className="text-sm font-medium text-gray-700">
                테스트 설명 *
              </Label>
              <Textarea
                id="test-description"
                placeholder="테스트에 대한 간단한 설명을 작성해주세요."
                value={testFormData.description}
                onChange={(e) => setTestFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[100px]"
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label htmlFor="test-category" className="text-sm font-medium text-gray-700">
                카테고리 *
              </Label>
              <Select 
                value={testFormData.category} 
                onValueChange={(value) => setTestFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personality">성격</SelectItem>
                  <SelectItem value="celebrity">연예인</SelectItem>
                  <SelectItem value="knowledge">지식</SelectItem>
                  <SelectItem value="fun">재미</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 썸네일 URL */}
            <div className="space-y-2">
              <Label htmlFor="test-thumbnail" className="text-sm font-medium text-gray-700">
                썸네일 이미지 URL (선택사항)
              </Label>
              <Input
                id="test-thumbnail"
                placeholder="https://example.com/image.jpg"
                value={testFormData.thumbnail_url}
                onChange={(e) => setTestFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                className="w-full"
              />
              {testFormData.thumbnail_url && (
                <div className="mt-2">
                  <img 
                    src={testFormData.thumbnail_url} 
                    alt="썸네일 미리보기" 
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowTestWriteModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateTest}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                disabled={!testFormData.title.trim() || !testFormData.description.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                테스트 생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 네비게이션 로딩 스켈레톤 */}
      {isNavigating && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <div className="space-y-6">
              {/* 헤더 스켈레톤 */}
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              
              {/* 콘텐츠 스켈레톤 */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
              
              {/* 카드 그리드 스켈레톤 */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              
              {/* 하단 텍스트 */}
              <div className="text-center">
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
