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
import VerificationGuard from '@/components/common/VerificationGuard'
import FreeBoard from './FreeBoard'
import { useLanguage } from '@/context/LanguageContext'
import { useUser } from '@/context/UserContext'
import { useAuth } from '@/context/AuthContext'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { toast } from 'sonner'

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
  { id: 'beauty', name: t('communityTab.categories.beauty'), icon: '💄', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'fashion', name: t('communityTab.categories.fashion'), icon: '👗', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'travel', name: t('communityTab.categories.travel'), icon: '✈️', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'culture', name: t('communityTab.categories.culture'), icon: '🏮', color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'free', name: t('communityTab.categories.free'), icon: '💬', color: 'bg-gray-100 text-gray-700 border-gray-300' }
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

export default function CommunityTab() {
  const { t, language } = useLanguage()
  const { user } = useUser()
  const { token, user: authUser } = useAuth()
  const router = useRouter()
  
  // 언어 설정 디버깅
  console.log('현재 언어 설정:', language)
  console.log('스토리 번역:', t('community.story'))
  
  // 사용자 상태 디버깅
  console.log('사용자 상태:', { 
    user: !!user, 
    userId: user?.id, 
    authUser: !!authUser,
    authUserId: authUser?.id,
    token: !!token 
  })
  const searchParams = useSearchParams()
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('freeboard')
  // 내부 커뮤니티 탭 URL 파라미터 (cTab) 사용
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showAnswerDrawer, setShowAnswerDrawer] = useState(false)
  const [showStoryUploadModal, setShowStoryUploadModal] = useState(false)
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

  // URL 파라미터와 탭 상태 동기화 (cTab = story|qa|freeboard|news)
  useEffect(() => {
    const tabParam = searchParams.get('cTab')
    if (tabParam && ['story', 'qa', 'freeboard', 'news'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // 데이터 로딩 함수들
  const loadQuestions = async () => {
    console.log('loadQuestions 호출됨:', { user: !!user, token: !!token, activeTab })
    if (!user && !token) {
      console.log('사용자와 토큰이 모두 없어서 loadQuestions 건너뜀')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // 질문 목록 조회 (자유게시판 카테고리)
      const category = encodeURIComponent('자유게시판')
      const url = `/api/posts?category=${category}&sort=latest&limit=20`
      console.log('API 호출 URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('질문 목록 API 응답:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('질문 목록 API 에러 응답:', errorData)
        throw new Error(errorData.error || `질문을 불러오는데 실패했습니다. (${response.status})`)
      }
      
      const data = await response.json()
      console.log('질문 목록 조회 응답:', { 
        data,
        postsCount: data.posts?.length || 0
      })
      
      setQuestions(data.posts || [])
      console.log('질문 목록 설정 완료:', data.posts?.length || 0, '개')
    } catch (err) {
      console.error('질문 로딩 실패:', err)
      // 네트워크 에러인 경우 더 자세한 정보 출력
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.error('네트워크 에러 - 서버 연결을 확인해주세요')
        setError('서버 연결에 실패했습니다. 네트워크를 확인해주세요.')
      } else {
        setError(err instanceof Error ? err.message : '질문을 불러오는데 실패했습니다.')
      }
      // 에러 시 빈 배열 사용
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const loadAnswers = async (questionId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/comments?postId=${questionId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '답변을 불러오는데 실패했습니다.')
      }
      
      setAnswers(data.comments || [])
    } catch (err) {
      console.error('답변 로딩 실패:', err)
      // 에러 시 빈 배열 사용
      setAnswers([])
    }
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
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/stories?isPublic=true&limit=10', {
        headers
      })
      
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
          'Authorization': `Bearer ${JSON.parse(token).access_token}`
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
    try {
    loadStories()
    } catch (error) {
      console.error('스토리 로딩 중 예외 발생:', error)
    }
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
          'Authorization': `Bearer ${currentToken}`
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
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
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
    
    if (isUploading) {
      console.log('이미 업로드 중')
      return
    }
    
    // 사용자 정보 확인 (user 또는 authUser 중 하나라도 있으면 OK)
    const currentUser = user || authUser
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
      // 이미지를 임시 URL로 변환 (실제로는 Supabase Storage에 업로드해야 함)
      const imageUrl = imagePreview || 'https://picsum.photos/400/600'
      
      console.log('API 요청 데이터 준비:', { imageUrl, text: storyText.trim(), userId: currentUser.id })
      
      console.log('API 요청 시작')
      const response = await fetch('/api/stories', {
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
    const userType = currentProfile.is_korean ? 'korean' : 'latin'
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
          'Authorization': `Bearer ${currentToken}`
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

  // 댓글 모달 열기
  const openCommentModal = (story: any) => {
    setSelectedStoryForComment(story)
    setShowCommentModal(true)
  }









  return (
    <div className="flex gap-6 p-4 sm:p-6">
      {/* 메인 컨텐츠 */}
      <div className="flex-1 space-y-6">
        {/* 인증 가드 - 커뮤니티 활동 */}
        <VerificationGuard 
          requiredFeature="community_posting"
          className="mb-6"
        >
          <div></div>
        </VerificationGuard>



      {/* 오늘의 스토리 섹션 */}
      <div className="mt-8 mb-6 max-w-full overflow-hidden border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
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
            onClick={() => {
              console.log('헤더 스토리 올리기 버튼 클릭됨')
              
              // 로그인 체크 (user 또는 authUser 중 하나라도 있으면 OK)
              const currentUser = user || authUser
              if (!currentUser) {
                console.log('로그인 필요 - 로그인 페이지로 이동')
                window.location.href = '/sign-in'
                return
              }
              
              setShowStoryUploadModal(true)
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
              {/* 왼쪽 페이드 효과 */}
              {stories.length > 1 && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              )}
              
              {/* 오른쪽 페이드 효과 */}
              {stories.length > 1 && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              )}
              
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
                    className="relative overflow-hidden flex-shrink-0 cursor-pointer group" 
                    style={{ 
                      width: '200px',
                      height: '240px',
                      scrollSnapAlign: 'start'
                    }}
                  >
                    {/* 인스타그램 스타일 카드 */}
                    <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-pink-300 group">
                      {/* 상단 사용자 정보 */}
                      <div className="flex items-center gap-2 p-2 border-b-2 border-gray-200">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-0.5">
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100">
                              {story.image_url ? (
                                <img 
                                  src={story.image_url} 
                                  alt="프로필" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {story.user?.full_name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-800">
                            {story.user?.full_name || '익명'}
                          </p>
                        </div>
                      </div>
                      
                      {/* 스토리 이미지 */}
                      <div className="relative w-full h-40 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500">
                        {story.image_url && (
                          <img 
                            src={story.image_url} 
                            alt="스토리 이미지" 
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* 시간 표시 오버레이 */}
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                          <span className="text-white text-xs font-medium">
                            {formatTime(story.created_at)}
                          </span>
                        </div>
                        
                        {/* 좋아요 하트 애니메이션 */}
                        {showHeartAnimation === story.id && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg 
                              className="w-16 h-16 text-red-500 fill-current"
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
                      </div>
                      
                      {/* 하단 정보 영역 */}
                      <div className="p-1.5 flex flex-col justify-between bg-gradient-to-t from-blue-50 to-white border-t-2 border-blue-100">
                        {/* 스토리 텍스트 */}
                        {story.text && (
                          <div className="mb-1.5 p-1 bg-white/80 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 font-medium">
                              {story.text}
                            </p>
                          </div>
                        )}
                        
                        {/* 하단 액션 */}
                        <div className="flex items-center justify-end gap-3">
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
                        </div>
                      </div>
                    </div>
                    
                    {/* 스토리 클릭 시 전체 보기 모달 (좋아요 버튼 제외) */}
                    <div 
                      className="absolute inset-0 z-10"
                      onClick={() => {
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
                <p className="text-sm text-gray-400">첫 번째 스토리를 업로드해보세요!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 세그먼트 탭 네비게이션 */}
      <div className="bg-white rounded-2xl p-1 shadow-lg mb-6">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => handleTabChange('freeboard')}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'freeboard'
                ? 'bg-pink-100 text-pink-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-base">📝</span>
              <span className="hidden sm:inline text-xs">{t('community.freeBoard')}</span>
        </div>
          </button>
          
          <button
            onClick={() => handleTabChange('news')}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'news'
                ? 'bg-pink-100 text-pink-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-base">📰</span>
              <span className="hidden sm:inline text-xs">{t('community.koreanNews')}</span>
          </div>
          </button>
          
          <button
            onClick={() => handleTabChange('qa')}
            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'qa'
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-base">💬</span>
              <span className="hidden sm:inline text-xs">{t('community.qa')}</span>
            </div>
          </button>
          </div>
          </div>

      {/* 탭 컨텐츠 */}

      {activeTab === 'qa' && (
        <div className="space-y-6">





      {/* 상단 컨트롤 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('communityTab.searchQuestions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        {/* 질문하기 버튼 */}
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

      {/* 카테고리 탭 */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-8 bg-gray-50">
          <TabsTrigger value="all" className="flex items-center gap-1 text-xs sm:text-sm bg-white data-[state=active]:bg-purple-100 data-[state=active]:shadow-sm">
            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            {t('communityTab.categories.all')}
          </TabsTrigger>
          {getCategories(t).map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1 text-xs sm:text-sm bg-white data-[state=active]:bg-purple-100 data-[state=active]:shadow-sm">
              <span>{category.icon}</span>
              <span className="truncate">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} className="mt-12">
          {/* 질문 카드 리스트 */}
          <div className="space-y-8">
            {filteredQuestions.map((question, index) => (
              <div key={question.id}>
                <Card 
                  className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white hover:bg-purple-50/30 cursor-pointer !opacity-100 !transform-none"
                  onClick={() => handleQuestionClick(question)}
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
                        <ThumbsUp className="w-4 h-4 text-purple-500" />
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
                      
                      {/* 태그 - 현재 비활성화 */}
                      {/* {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs border-purple-200 text-purple-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )} */}
                      
                      {/* 메타 정보 */}
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
                    </div>
                  </div>
                </Card>
                

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
        </TabsContent>
      </Tabs>
        </div>
      )}

      {activeTab === 'freeboard' && (
        <div className="space-y-6">
          <FreeBoard />
                  </div>
      )}

      {activeTab === 'news' && (
        <div className="space-y-6">
          {/* 한국뉴스 섹션 */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📰</span>
              </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">최신 한국 뉴스</h3>
                  <p className="text-gray-600">한국의 최신 소식과 트렌드</p>
                  </div>
                </div>
                
              {/* 뉴스 영상 목록 */}
              <div className="space-y-6">
                {/* 샘플 뉴스 영상 1 */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800 mb-1">한국 문화 소식</h4>
                    <p className="text-sm text-gray-600">최신 한국 문화 동향</p>
                    <p className="text-xs text-gray-500 mt-1">2시간 전</p>
                  </div>
                  <div className="instagram-embed-wrapper">
                    <blockquote 
                      className="instagram-media" 
                      data-instgrm-permalink="https://www.instagram.com/p/DOsXrrEEZo9/"
                      data-instgrm-version="14"
                      style={{
                        background: '#FFF',
                        border: '0',
                        borderRadius: '3px',
                        boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                        margin: '1px',
                        maxWidth: '540px',
                        minWidth: '326px',
                        padding: '0',
                        width: '99.375%'
                      }}
                    >
                      <div style={{ padding: '16px' }}>
                        <a 
                          href="https://www.instagram.com/p/DOsXrrEEZo9/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#FFFFFF',
                            lineHeight: '0',
                            padding: '0 0',
                            textAlign: 'center',
                            textDecoration: 'none',
                            width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{
                              backgroundColor: '#F4F4F4',
                              borderRadius: '50%',
                              flexGrow: '0',
                              height: '40px',
                              marginRight: '14px',
                              width: '40px'
                            }}></div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              flexGrow: '1',
                              justifyContent: 'center'
                            }}>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                marginBottom: '6px',
                                width: '100px'
                              }}></div>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                width: '60px'
                              }}></div>
                            </div>
                          </div>
                          <div style={{ padding: '19% 0' }}></div>
                          <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
                            <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1">
                              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                                  <g>
                                    <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path>
                                  </g>
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div style={{ paddingTop: '8px' }}>
                            <div style={{
                              color: '#3897f0',
                              fontFamily: 'Arial,sans-serif',
                              fontSize: '14px',
                              fontStyle: 'normal',
                              fontWeight: '550',
                              lineHeight: '18px'
                            }}>
                              Instagram에서 이 게시물 보기
                            </div>
                          </div>
                        </a>
                      </div>
                    </blockquote>
                  </div>
                </div>

                {/* 샘플 뉴스 영상 2 */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800 mb-1">한국 음식 소식</h4>
                    <p className="text-sm text-gray-600">K-푸드 관련 최신 소식</p>
                    <p className="text-xs text-gray-500 mt-1">5시간 전</p>
                  </div>
                  <div className="instagram-embed-wrapper">
                    <blockquote 
                      className="instagram-media" 
                      data-instgrm-permalink="https://www.instagram.com/p/DOsXnCkkb_y/"
                      data-instgrm-version="14"
                      style={{
                        background: '#FFF',
                        border: '0',
                        borderRadius: '3px',
                        boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                        margin: '1px',
                        maxWidth: '540px',
                        minWidth: '326px',
                        padding: '0',
                        width: '99.375%'
                      }}
                    >
                      <div style={{ padding: '16px' }}>
                        <a 
                          href="https://www.instagram.com/p/DOsXnCkkb_y/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#FFFFFF',
                            lineHeight: '0',
                            padding: '0 0',
                            textAlign: 'center',
                            textDecoration: 'none',
                            width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{
                              backgroundColor: '#F4F4F4',
                              borderRadius: '50%',
                              flexGrow: '0',
                              height: '40px',
                              marginRight: '14px',
                              width: '40px'
                            }}></div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              flexGrow: '1',
                              justifyContent: 'center'
                            }}>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                marginBottom: '6px',
                                width: '100px'
                              }}></div>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                width: '60px'
                              }}></div>
                            </div>
                          </div>
                          <div style={{ padding: '19% 0' }}></div>
                          <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
                            <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1">
                              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                                  <g>
                                    <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path>
                                  </g>
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div style={{ paddingTop: '8px' }}>
                            <div style={{
                              color: '#3897f0',
                              fontFamily: 'Arial,sans-serif',
                              fontSize: '14px',
                              fontStyle: 'normal',
                              fontWeight: '550',
                              lineHeight: '18px'
                            }}>
                              Instagram에서 이 게시물 보기
                            </div>
                          </div>
                        </a>
                      </div>
                    </blockquote>
                  </div>
                </div>

                {/* 세 번째 뉴스 영상 */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800 mb-1">한국 여행 소식</h4>
                    <p className="text-sm text-gray-600">한국 관광 관련 최신 소식</p>
                    <p className="text-xs text-gray-500 mt-1">1일 전</p>
                  </div>
                  <div className="instagram-embed-wrapper">
                    <blockquote 
                      className="instagram-media" 
                      data-instgrm-permalink="https://www.instagram.com/p/DOpNMYDE69S/"
                      data-instgrm-version="14"
                      style={{
                        background: '#FFF',
                        border: '0',
                        borderRadius: '3px',
                        boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                        margin: '1px',
                        maxWidth: '540px',
                        minWidth: '326px',
                        padding: '0',
                        width: '99.375%'
                      }}
                    >
                      <div style={{ padding: '16px' }}>
                        <a 
                          href="https://www.instagram.com/p/DOpNMYDE69S/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#FFFFFF',
                            lineHeight: '0',
                            padding: '0 0',
                            textAlign: 'center',
                            textDecoration: 'none',
                            width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{
                              backgroundColor: '#F4F4F4',
                              borderRadius: '50%',
                              flexGrow: '0',
                              height: '40px',
                              marginRight: '14px',
                              width: '40px'
                            }}></div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              flexGrow: '1',
                              justifyContent: 'center'
                            }}>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                marginBottom: '6px',
                                width: '100px'
                              }}></div>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                width: '60px'
                              }}></div>
                            </div>
                          </div>
                          <div style={{ padding: '19% 0' }}></div>
                          <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
                            <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1">
                              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                                  <g>
                                    <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path>
                                  </g>
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div style={{ paddingTop: '8px' }}>
                            <div style={{
                              color: '#3897f0',
                              fontFamily: 'Arial,sans-serif',
                              fontSize: '14px',
                              fontStyle: 'normal',
                              fontWeight: '550',
                              lineHeight: '18px'
                            }}>
                              Instagram에서 이 게시물 보기
                            </div>
                          </div>
                        </a>
                      </div>
                    </blockquote>
                  </div>
                </div>

                {/* 네 번째 뉴스 영상 */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800 mb-1">한국 기술 소식</h4>
                    <p className="text-sm text-gray-600">한국 기술 관련 최신 소식</p>
                    <p className="text-xs text-gray-500 mt-1">2일 전</p>
                  </div>
                  <div className="instagram-embed-wrapper">
                    <blockquote 
                      className="instagram-media" 
                      data-instgrm-permalink="https://www.instagram.com/p/DOpNF65k8GS/"
                      data-instgrm-version="14"
                      style={{
                        background: '#FFF',
                        border: '0',
                        borderRadius: '3px',
                        boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
                        margin: '1px',
                        maxWidth: '540px',
                        minWidth: '326px',
                        padding: '0',
                        width: '99.375%'
                      }}
                    >
                      <div style={{ padding: '16px' }}>
                        <a 
                          href="https://www.instagram.com/p/DOpNF65k8GS/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#FFFFFF',
                            lineHeight: '0',
                            padding: '0 0',
                            textAlign: 'center',
                            textDecoration: 'none',
                            width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div style={{
                              backgroundColor: '#F4F4F4',
                              borderRadius: '50%',
                              flexGrow: '0',
                              height: '40px',
                              marginRight: '14px',
                              width: '40px'
                            }}></div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              flexGrow: '1',
                              justifyContent: 'center'
                            }}>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                marginBottom: '6px',
                                width: '100px'
                              }}></div>
                              <div style={{
                                backgroundColor: '#F4F4F4',
                                borderRadius: '4px',
                                flexGrow: '0',
                                height: '14px',
                                width: '60px'
                              }}></div>
                            </div>
                          </div>
                          <div style={{ padding: '19% 0' }}></div>
                          <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
                            <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1">
                              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                                  <g>
                                    <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path>
                                  </g>
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div style={{ paddingTop: '8px' }}>
                            <div style={{
                              color: '#3897f0',
                              fontFamily: 'Arial,sans-serif',
                              fontSize: '14px',
                              fontStyle: 'normal',
                              fontWeight: '550',
                              lineHeight: '18px'
                            }}>
                              Instagram에서 이 게시물 보기
                            </div>
                          </div>
                        </a>
                      </div>
                    </blockquote>
                  </div>
                </div>

                {/* 더 많은 뉴스 보기 버튼 */}
                <div className="text-center pt-4">
                  <Button variant="outline" className="bg-white hover:bg-gray-50">
                    더 많은 한국 뉴스 보기
                  </Button>
                </div>
              </div>
            </div>
          </Card>
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
        <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-xl">
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
                  />
                  <label
                    htmlFor="imageUploadGallery"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
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
                  />
                  <label
                    htmlFor="imageUploadCamera"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-6 h-6 text-gray-400" />
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
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

    </div>
  )
}
