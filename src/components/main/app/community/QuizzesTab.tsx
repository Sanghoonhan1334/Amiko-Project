'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Users, 
  Clock, 
  ChevronRight,
  Target
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { toast } from 'sonner'

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  total_questions: number
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

export default function QuizzesTab() {
  const { t } = useLanguage()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 퀴즈 목록 불러오기
  useEffect(() => {
    fetchQuizzes()
  }, [selectedCategory])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''
      const response = await fetch(`/api/quizzes${categoryParam}`)
      
      if (!response.ok) {
        throw new Error('퀴즈 목록 조회 실패')
      }

      const data = await response.json()
      setQuizzes(data.quizzes || [])
    } catch (error) {
      console.error('퀴즈 목록 불러오기 실패:', error)
      toast.error(t('tests.errorLoading'))
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuizClick = (quizId: string) => {
    router.push(`/quiz/${quizId}`)
  }

  const categories = [
    { id: 'all', name: t('tests.categories.all') },
    { id: 'personality', name: t('tests.categories.personality') },
    { id: 'celebrity', name: t('tests.categories.celebrity') },
    { id: 'knowledge', name: t('tests.categories.knowledge') },
    { id: 'fun', name: t('tests.categories.fun') }
  ]

  return (
    <div className="space-y-6">
      {/* 카테고리 필터 - 카드 밖으로 이동 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* 퀴즈 목록 */}
      {loading ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => {
            const config = categoryConfig[quiz.category] || categoryConfig.fun
            
            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl p-6 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-300"
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
  )
}

