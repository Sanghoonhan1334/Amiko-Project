'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  User, 
  Clock, 
  Tag,
  Award,
  TrendingUp,
  Star,
  Zap,
  Heart,
  Eye,
  Calendar,
  Target
} from 'lucide-react'
import VerificationGuard from '@/components/common/VerificationGuard'
import StoryCarousel from './StoryCarousel'
import { useLanguage } from '@/context/LanguageContext'

// 포인트 시스템 정의
const pointSystem = {
  korean: {
    question: 5,
    answer: 5,
    reaction: 2,
    consultation: 30,
    dailyLimit: 20
  },
  latin: {
    question: 2,
    answer: 2,
    reaction: 1,
    consultation: 30,
    dailyLimit: 20
  }
}

// 카테고리 정의 함수
const getCategories = (t: any) => [
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
  const { t } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<typeof mockQuestions[0] | null>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showAnswerDrawer, setShowAnswerDrawer] = useState(false)
  
  // 좋아요 상태 관리
  const [likedAnswers, setLikedAnswers] = useState<Set<string>>(new Set())
  
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

  // Mock user profile for testing verification guard
  const mockUserProfile = {
    id: 'user-1',
    kakao_linked_at: null,
    wa_verified_at: null,
    sms_verified_at: null,
    email_verified_at: null,
    is_korean: false,
    country: 'BR'
  }

  // Mock verified user profile for testing success state
  const mockVerifiedUserProfile = {
    id: 'user-2',
    kakao_linked_at: null,
    wa_verified_at: '2024-01-15T10:00:00Z',
    sms_verified_at: null,
    email_verified_at: null,
    is_korean: false,
    country: 'BR'
  }

  // Toggle between verified and unverified for testing
  const [useVerifiedProfile, setUseVerifiedProfile] = useState(false)
  const currentProfile = useVerifiedProfile ? mockVerifiedUserProfile : mockUserProfile

  // 필터링된 질문 목록
  const filteredQuestions = mockQuestions.filter(question => {
    const matchesCategory = activeCategory === 'all' || question.category === activeCategory
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  // 질문 작성 처리
  const handleSubmitQuestion = () => {
    if (!questionForm.title.trim() || !questionForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    // 포인트 획득 시도
    const pointsEarned = earnPoints('question')
    
    if (pointsEarned) {
      // 여기서 실제 API 호출
      console.log('새 질문 작성:', questionForm)
      
      // 폼 초기화
      setQuestionForm({
        title: '',
        content: '',
        category: 'free',
        tags: ''
      })
      
      setShowQuestionModal(false)
      const userType = currentProfile.is_korean ? 'korean' : 'latin'
      const points = pointSystem[userType].question
      alert(`질문이 등록되었습니다! +${points}점 획득!`)
    }
  }

  // 질문 선택 및 답변 drawer 열기
  const handleQuestionClick = (question: typeof mockQuestions[0]) => {
    setSelectedQuestion(question)
    setShowAnswerDrawer(true)
  }

  // 업보트 처리
  const handleUpvote = (questionId: number) => {
    // 여기서 실제 API 호출
    console.log('업보트:', questionId)
    alert('업보트가 반영되었습니다!')
  }

  // 답변 좋아요 숫자 관리
  const [answerUpvotes, setAnswerUpvotes] = useState<{ [key: string]: number }>(() => {
    // mockAnswers의 upvotes 값으로 초기화
    const initialUpvotes: { [key: string]: number } = {}
    mockAnswers.forEach(answer => {
      initialUpvotes[answer.id] = answer.upvotes
    })
    return initialUpvotes
  })

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
  const handleAnswerLike = (answerId: string) => {
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
  const earnPoints = (activity: 'question' | 'answer' | 'reaction' | 'consultation') => {
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
    const descriptions = {
      question: '질문 작성',
      answer: '답변 작성', 
      reaction: '좋아요/댓글',
      consultation: '상담 참여'
    }
    return `${descriptions[activity]} (+${points}점)`
  }

  // 답변 등록 처리
  const handleSubmitAnswer = () => {
    if (!answerForm.content.trim()) {
      alert('답변 내용을 입력해주세요.')
      return
    }

    // 포인트 획득 시도
    const pointsEarned = earnPoints('answer')
    
    if (pointsEarned) {
      // 여기서 실제 API 호출
      console.log('새 답변 작성:', answerForm.content)
      
      // 폼 초기화
      setAnswerForm({ content: '' })
      alert('답변이 등록되었습니다! +2점 획득!')
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

  // 탭 변경 감지 함수
  const handleTabChange = () => {
    // 스토리 섹션의 상태를 리셋하기 위한 콜백
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 인증 가드 - 커뮤니티 활동 */}
      <VerificationGuard 
        profile={currentProfile} 
        requiredFeature="community_posting"
        className="mb-6"
      />

      {/* 스토리 섹션 */}
      <StoryCarousel onTabChange={handleTabChange} />

      {/* 포인트 규칙 안내 배너 */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer !opacity-100 !transform-none">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-800">{t('communityTab.pointRules')}</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium text-yellow-700 whitespace-nowrap">🇰🇷 {t('communityTab.koreans')}</span>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">{t('communityTab.question')} +5 / {t('communityTab.answer')} +5</Badge>
                </div>
                <p className="text-yellow-600 text-xs">{t('communityTab.dailyLimit')}, {t('communityTab.adoptionLikeBonus')}</p>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium text-yellow-700 whitespace-nowrap">🌎 {t('communityTab.latinUsers')}</span>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">{t('communityTab.question')} +2 / {t('communityTab.answer')} +2</Badge>
                </div>
                <p className="text-yellow-600 text-xs">{t('communityTab.adoptionLikeBonus')}, {t('communityTab.spamCooldown')}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 포인트 현황 카드 */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer !opacity-100 !transform-none">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-800">{t('pointStatus.title')}</h4>
              <Badge className={`px-3 py-1 text-sm ${
                currentProfile.is_korean ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-mint-100 text-mint-700 border-mint-300'
              }`}>
                {currentProfile.is_korean ? t('pointStatus.korean') : t('pointStatus.local')}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userPoints}</div>
                <div className="text-sm text-blue-600">{t('pointStatus.totalPoints')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dailyPoints}</div>
                <div className="text-sm text-green-600">{t('pointStatus.acquiredToday')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {pointSystem[currentProfile.is_korean ? 'korean' : 'latin'].dailyLimit - dailyPoints}
                </div>
                <div className="text-sm text-orange-600">{t('pointStatus.remainingLimit')}</div>
              </div>
            </div>
            
            {/* 포인트 히스토리 (최근 3개) */}
            {pointHistory.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-blue-700 text-sm">{t('pointStatus.recentPointEarnings')}</h5>
                <div className="space-y-1">
                  {pointHistory.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-white/60 rounded px-2 py-1">
                      <span className="text-blue-600">{item.description}</span>
                      <span className="text-blue-500">
                        {item.timestamp.toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 오늘의 활동 카드 */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-mint-50 to-brand-50 border border-mint-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer !opacity-100 !transform-none">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-mint-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-mint-600" />
          </div>
          <h4 className="font-semibold text-gray-800">{t('communityTab.todayActivity')}</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-600">{mockTodayActivity.questions}</div>
            <div className="text-sm text-gray-600">{t('communityTab.myQuestions')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-mint-600">{mockTodayActivity.answers}</div>
            <div className="text-sm text-gray-600">{t('communityTab.myAnswers')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{mockTodayActivity.points}</div>
            <div className="text-sm text-gray-600">{t('communityTab.pointsAcquired')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{mockTodayActivity.upvotes}</div>
            <div className="text-sm text-gray-600">{t('communityTab.upvotesReceived')}</div>
          </div>
        </div>
      </Card>

      {/* 상단 컨트롤 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 테스트용 인증 상태 토글 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVerifiedProfile(!useVerifiedProfile)}
            className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            {useVerifiedProfile ? '🔒 인증됨' : '❌ 미인증'} ({t('communityTab.unverified')})
          </Button>
          
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('communityTab.searchQuestions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* 질문하기 버튼 */}
        <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
          <DialogTrigger asChild>
            <Button className="bg-brand-500 hover:bg-brand-600 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              {t('communityTab.askQuestion')}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl bg-white border-2 border-gray-200 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">새로운 질문 작성</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">제목</label>
                <Input
                  placeholder="질문의 제목을 입력하세요"
                  value={questionForm.title}
                  onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                  className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">카테고리</label>
                <select
                  value={questionForm.category}
                  onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                  className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-200 bg-white"
                >
                  {getCategories(t).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">태그 (쉼표로 구분)</label>
                <Input
                  placeholder="예: 화장품, 민감성피부, 추천"
                  value={questionForm.tags}
                  onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                  className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">질문 내용</label>
                <Textarea
                  placeholder="질문의 자세한 내용을 입력하세요..."
                  value={questionForm.content}
                  onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  rows={6}
                  className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 resize-none"
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowQuestionModal(false)}>
                  취소
                </Button>
                <Button onClick={handleSubmitQuestion}>
                  질문 등록
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 카테고리 탭 */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-8">
          <TabsTrigger value="all" className="flex items-center gap-1 text-xs sm:text-sm">
            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            {t('communityTab.categories.all')}
          </TabsTrigger>
          {getCategories(t).map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1 text-xs sm:text-sm">
              <span>{category.icon}</span>
              <span className="truncate">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} className="mt-12">
          {/* 질문 카드 리스트 */}
          <div className="space-y-8">
            {filteredQuestions.map((question) => (
              <Card 
                key={question.id} 
                className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-brand-200 cursor-pointer !opacity-100 !transform-none"
                onClick={() => handleQuestionClick(question)}
              >
                <div className="flex items-start gap-4">
                  {/* 업보트 영역 */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-brand-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpvote(question.id)
                      }}
                    >
                      <ThumbsUp className="w-4 h-4 text-brand-500" />
                    </Button>
                    <span className="text-lg font-semibold text-brand-600">{question.upvotes}</span>
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
                    
                    {/* 태그 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-brand-200 text-brand-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* 메타 정보 */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{question.author}</span>
                        <Badge className={`ml-2 text-xs ${
                          question.authorType === 'korean' 
                            ? 'bg-brand-100 text-brand-700 border-brand-300' 
                            : 'bg-mint-100 text-mint-700 border-mint-300'
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
            ))}
          </div>
          
          {/* 결과 없음 */}
          {filteredQuestions.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                검색어나 카테고리를 조정해보세요
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
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
                      <span>{selectedQuestion.author}</span>
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
                                className="h-6 w-6 p-0 hover:bg-brand-50"
                                onClick={() => handleAnswerLike(answer.id)}
                              >
                                <ThumbsUp className={`w-3 h-3 ${likedAnswers.has(answer.id) ? 'text-red-500 fill-current' : 'text-brand-500'}`} />
                              </Button>
                              <span className="text-sm font-medium text-brand-600">
                                {answerUpvotes[answer.id] !== undefined ? answerUpvotes[answer.id] : answer.upvotes}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <p className="text-gray-700 mb-2">{answer.content}</p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{answer.author}</span>
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
  )
}
