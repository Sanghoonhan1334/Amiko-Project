'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Users,
  Star
} from 'lucide-react'

interface Question {
  id: string
  question_text: string
  quiz_options: Option[]
}

interface Option {
  id: string
  option_text: string
  result_type: string
}

const sampleQuiz = {
  id: 'sample-mbti',
  title: '🎯 간단 MBTI 테스트',
  description: '당신의 성격 유형을 간단히 알아보세요',
  category: 'personality',
  total_questions: 4,
  total_participants: 0
}

const sampleQuestions: Question[] = [
  {
    id: 'q1',
    question_text: '친구들과 모임에서 당신은?',
    quiz_options: [
      { id: 'o1a', option_text: '적극적으로 대화에 참여한다', result_type: 'E' },
      { id: 'o1b', option_text: '조용히 듣고 있을 때가 많다', result_type: 'I' }
    ]
  },
  {
    id: 'q2', 
    question_text: '새로운 환경에서는?',
    quiz_options: [
      { id: 'o2a', option_text: '빨리 다른 사람들과 어울린다', result_type: 'E' },
      { id: 'o2b', option_text: '시간이 걸리며 신중하다', result_type: 'I' }
    ]
  },
  {
    id: 'q3',
    question_text: '문제 해결 방식은?',
    quiz_options: [
      { id: 'o3a', option_text: '단계별로 차근차근 해결한다', result_type: 'S' },
      { id: 'o3b', option_text: '전체적인 그림을 먼저 파악한다', result_type: 'N' }
    ]
  },
  {
    id: 'q4',
    question_text: '중요한 결정을 내릴 때는?',
    quiz_options: [
      { id: 'o4a', option_text: '논리적이고 객관적으로 판단한다', result_type: 'T' },
      { id: 'o4b', option_text: '감정과 가치관을 고려한다', result_type: 'F' }
    ]
  }
]

const mbtiResults = {
  'INTJ': {
    title: 'INTJ - 건축가',
    description: '전략적이고 독립적인 생각의 소유자입니다.',
    characteristic: '독립적이고 목표 지향적이며 논리적이고 체계적으로 사고합니다. 완벽주의 성향이 강합니다.',
    recommendation: '독서와 자기계발을 통해 성장하고, 전략적 계획 수립을 통해 목표를 달성하세요.'
  },
  'ENFP': {
    title: 'ENFP - 운동가',
    description: '열정적이고 창의적인 영감을 주는 사람입니다.',
    characteristic: '열정적이고 창의적이며 사교적이고 진정성 있습니다. 새로운 가능성을 추구합니다.',
    recommendation: '창의적 프로젝트에 도전하고, 새로운 사람들과의 만남에서 영감을 발으세요.'
  },
  'ISTJ': {
    title: 'ISTJ - 관리자',
    description: '실용적이고 사실적인 논리주의자입니다.',
    characteristic: '실용적이고 사실적이며 책임감이 강하고 조직적입니다. 전통을 중시합니다.',
    recommendation: '구체적인 과제를 체계적으로 수행하며, 전통적인 방법을 활용하세요.'
  },
  'ESFP': {
    title: 'ESFP - 연예인',
    description: '자유롭고 활기찬 연예인입니다.',
    characteristic: '자유롭고 열정적이며 사교적이고 친근합니다. 현재 순간을 즐깁니다.',
    recommendation: '사회적 활동을 통해 에너지를 발산하고, 예술적 표현을 통해 자신을 드러내세요.'
  }
}

export default function SampleMBTIPage() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleOptionSelect = (questionId: string, optionId: string, resultType: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: resultType
    }))
  }

  const calculateMBTI = () => {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    
    Object.values(selectedOptions).forEach(resultType => {
      counts[resultType as keyof typeof counts]++
    })

    const mbti = 
      (counts.E > counts.I ? 'E' : 'I') +
      (counts.S > counts.N ? 'S' : 'N') + 
      (counts.T > counts.F ? 'T' : 'F') +
      (counts.J > counts.P ? 'J' : 'P')

    return mbti
  }

  const handleSubmit = () => {
    const mbtiType = calculateMBTI()
    const mbtiResult = mbtiResults[mbtiType as keyof typeof mbtiResults] || mbtiResults['INTJ']
    
    setResult({
      mbtiType,
      ...mbtiResult
    })
    setIsCompleted(true)
  }

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  if (isCompleted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => router.back()} 
                variant="ghost" 
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
              </Button>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>샘플 테스트</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>약 2분 소요</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 결과 카드 */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <CardTitle className="text-3xl mb-2">테스트 완료!</CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 mb-4">
                {result.mbtiType}
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{result.title}</h2>
              <p className="text-lg text-gray-600 mb-6">{result.description}</p>
              
              <div className="text-left bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-3">특징:</h3>
                <p className="text-gray-700 mb-6">{result.characteristic}</p>
                
                <h3 className="font-bold text-gray-800 mb-3">추천 활동:</h3>
                <p className="text-gray-700">{result.recommendation}</p>
              </div>

              <Button
                onClick={() => router.back()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
              >
                다른 테스트 해보기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentQuestionData = sampleQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100
  const isLastQuestion = currentQuestion === sampleQuestions.length - 1
  const isFirstQuestion = currentQuestion === 0
  const hasAnswered = selectedOptions[currentQuestionData.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => router.back()} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>샘플 테스트</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>약 2분 소요</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 퀴즈 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                성격 테스트
              </Badge>
            </div>
            <CardTitle className="text-2xl">{sampleQuiz.title}</CardTitle>
            <p className="text-gray-600">{sampleQuiz.description}</p>
          </CardHeader>
        </Card>

        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {currentQuestion + 1} / {sampleQuestions.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% 완료
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 질문 */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {currentQuestionData.question_text}
            </h2>
            
            <div className="space-y-3">
              {currentQuestionData.quiz_options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(currentQuestionData.id, option.id, option.result_type)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    selectedOptions[currentQuestionData.id] === option.result_type
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.option_text}</span>
                    {selectedOptions[currentQuestionData.id] === option.result_type && (
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!hasAnswered}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Star className="w-4 h-4 mr-2" />
              결과 보기
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="bg-purple-600 hover:bg-purple-700"
            >
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
