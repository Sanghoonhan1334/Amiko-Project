'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Share2, 
  Star,
  Users,
  Heart,
  Music,
  Camera,
  Trophy,
  X
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface MBTIResult {
  mbtiType: string
  title: string
  description: string
  celebrities: Celebrity[]
}

interface Celebrity {
  id: string
  stage_name: string
  group_name?: string
  mbti_code: string
  profile_image_url?: string
  image_url?: string
  source_url?: string
  source_note?: string
  is_verified: boolean
}

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  total_participants: number
}

const mbtiDescriptions: { [key: string]: { title: string; description: string } } = {
  'INTJ': {
    title: 'INTJ - 건축가',
    description: '독립적이고 전략적인 사고를 가진 당신은 혁신적인 아이디어로 세상을 바꾸는 것을 꿈꿉니다. 체계적이고 논리적인 접근으로 복잡한 문제를 해결하는 것을 좋아하며, 장기적인 비전을 가지고 계획을 세웁니다.'
  },
  'INTP': {
    title: 'INTP - 논리학자',
    description: '호기심이 많고 분석적인 당신은 지식과 이론에 대한 깊은 탐구를 즐깁니다. 복잡한 개념을 이해하고 새로운 아이디어를 개발하는 것을 좋아하며, 논리적이고 객관적인 사고를 중시합니다.'
  },
  'ENTJ': {
    title: 'ENTJ - 통솔자',
    description: '리더십이 강하고 목표 지향적인 당신은 효율성과 성과를 중시합니다. 체계적이고 전략적인 사고로 조직을 이끌어가며, 도전적인 목표를 설정하고 달성하는 것을 좋아합니다.'
  },
  'ENTP': {
    title: 'ENTP - 변론가',
    description: '창의적이고 혁신적인 당신은 새로운 아이디어와 가능성에 열려있습니다. 토론과 논쟁을 즐기며, 다양한 관점에서 문제를 바라보는 것을 좋아합니다.'
  },
  'INFJ': {
    title: 'INFJ - 옹호자',
    description: '이상주의적이고 통찰력이 뛰어난 당신은 깊이 있는 인간관계를 중시합니다. 다른 사람들의 감정을 잘 이해하고 공감하며, 의미 있는 변화를 만들어내고 싶어합니다.'
  },
  'INFP': {
    title: 'INFP - 중재자',
    description: '창의적이고 이상주의적인 당신은 자신만의 가치관과 신념을 중요하게 생각합니다. 진정성과 의미를 추구하며, 다른 사람들을 도우려는 마음이 큽니다.'
  },
  'ENFJ': {
    title: 'ENFJ - 주인공',
    description: '카리스마 있고 리더십이 강한 당신은 다른 사람들의 성장과 발전을 돕는 것을 좋아합니다. 공감능력이 뛰어나고 의사소통을 잘하며, 팀워크와 협력을 중시합니다.'
  },
  'ENFP': {
    title: 'ENFP - 활동가',
    description: '열정적이고 창의적인 당신은 새로운 경험과 가능성에 열려있습니다. 사람들과의 교류를 즐기며, 영감을 주고받는 것을 좋아합니다.'
  },
  'ISTJ': {
    title: 'ISTJ - 논리주의자',
    description: '신뢰할 수 있고 책임감이 강한 당신은 체계적이고 꼼꼼한 접근을 선호합니다. 전통과 규칙을 중시하며, 안정적이고 예측 가능한 환경에서 최고의 성과를 냅니다.'
  },
  'ISFJ': {
    title: 'ISFJ - 수호자',
    description: '따뜻하고 배려심이 깊은 당신은 다른 사람들을 돌보는 것을 좋아합니다. 책임감이 강하고 신뢰할 수 있으며, 조화로운 환경을 만들려고 노력합니다.'
  },
  'ESTJ': {
    title: 'ESTJ - 경영자',
    description: '리더십이 강하고 조직력이 뛰어난 당신은 효율성과 성과를 중시합니다. 체계적이고 논리적인 접근으로 목표를 달성하며, 전통과 질서를 중요하게 생각합니다.'
  },
  'ESFJ': {
    title: 'ESFJ - 집정관',
    description: '사교적이고 배려심이 깊은 당신은 다른 사람들과의 관계를 중시합니다. 협력과 팀워크를 좋아하며, 조화로운 환경을 만들려고 노력합니다.'
  },
  'ISTP': {
    title: 'ISTP - 만능재주꾼',
    description: '실용적이고 논리적인 당신은 문제 해결에 뛰어난 능력을 가지고 있습니다. 독립적이고 유연하며, 실질적인 해결책을 찾는 것을 좋아합니다.'
  },
  'ISFP': {
    title: 'ISFP - 모험가',
    description: '예술적이고 감성적인 당신은 자신만의 가치관과 신념을 중요하게 생각합니다. 유연하고 적응력이 뛰어나며, 조화로운 환경을 선호합니다.'
  },
  'ESTP': {
    title: 'ESTP - 사업가',
    description: '활동적이고 현실적인 당신은 즉흥적이고 유연한 접근을 선호합니다. 에너지가 넘치고 사교적이며, 새로운 경험과 도전을 좋아합니다.'
  },
  'ESFP': {
    title: 'ESFP - 연예인',
    description: '열정적이고 사교적인 당신은 사람들과의 교류를 즐기며, 즐거운 분위기를 만드는 것을 좋아합니다. 유연하고 적응력이 뛰어나며, 새로운 경험에 열려있습니다.'
  }
}

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const [result, setResult] = useState<MBTIResult | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(null)

  const quizId = params.id as string
  const mbtiType = searchParams.get('mbti')

  useEffect(() => {
    if (quizId && mbtiType) {
      loadResult()
    }
  }, [quizId, mbtiType])

  const loadResult = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[RESULT] 로드 시작:', { quizId, mbtiType })

      // 퀴즈 정보 조회
      const quizResponse = await fetch(`/api/quizzes/${quizId}`)
      if (quizResponse.ok) {
        const quizResult = await quizResponse.json()
        if (quizResult.success) {
          setQuiz(quizResult.data.quiz)
        }
      }

      // 연예인 정보 조회
      const celebResponse = await fetch(`/api/celebrities?mbti=${mbtiType}`)
      let celebrities: Celebrity[] = []
      
      if (celebResponse.ok) {
        const celebResult = await celebResponse.json()
        if (celebResult.success) {
          celebrities = celebResult.data
        }
      }

      console.log('[RESULT] MBTI 타입 확인:', { mbtiType, availableTypes: Object.keys(mbtiDescriptions) })

      // MBTI 설명 가져오기
      const mbtiInfo = mbtiDescriptions[mbtiType || '']
      if (!mbtiInfo) {
        console.error('[RESULT] MBTI 타입을 찾을 수 없음:', mbtiType)
        throw new Error(`알 수 없는 MBTI 타입입니다: ${mbtiType}`)
      }

      setResult({
        mbtiType: mbtiType || '',
        title: mbtiInfo.title,
        description: mbtiInfo.description,
        celebrities
      })

    } catch (error) {
      console.error('결과 로드 오류:', error)
      setError(error instanceof Error ? error.message : '결과를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const shareText = `나의 MBTI는 ${result?.mbtiType}입니다! K-POP 스타와 매칭해보세요 🎵`
    const shareUrl = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MBTI K-POP 스타 매칭 결과',
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        console.log('공유 취소됨')
      }
    } else {
      // 클립보드에 복사
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        toast.success('결과가 클립보드에 복사되었습니다!')
      } catch (error) {
        toast.error('공유에 실패했습니다.')
      }
    }
  }

  const handleRetake = () => {
    router.push(`/quiz/${quizId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결과를 분석하는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error || '결과를 찾을 수 없습니다.'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => router.push('/main?tab=community')} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              커뮤니티로
            </Button>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                공유하기
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 결과 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            테스트 완료! 🎉
          </h1>
          <p className="text-gray-600">
            당신의 MBTI와 매칭되는 K-POP 스타를 찾았습니다
          </p>
        </div>

        {/* MBTI 결과 */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                {result.mbtiType}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{result.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-center leading-relaxed">
              {result.description}
            </p>
          </CardContent>
        </Card>

        {/* 매칭된 K-POP 스타 */}
        {result.celebrities.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                같은 MBTI를 가진 K-POP 스타
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.celebrities.map((celebrity) => (
                  <div
                    key={celebrity.id}
                    className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedCelebrity(celebrity)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-400">
                        {celebrity.image_url ? (
                          <img 
                            src={celebrity.image_url} 
                            alt={celebrity.stage_name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <Music className="w-12 h-12 text-white" style={{ display: celebrity.image_url ? 'none' : 'block' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{celebrity.stage_name}</h3>
                        {celebrity.group_name && (
                          <p className="text-sm text-gray-600">{celebrity.group_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {celebrity.mbti_code}
                      </Badge>
                      {celebrity.is_verified && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          검증됨
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 퀴즈 정보 */}
        {quiz && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{quiz.title}</h3>
                  <p className="text-sm text-gray-600">{quiz.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                    <Users className="w-4 h-4" />
                    <span>{quiz.total_participants}명 참여</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {quiz.category === 'celebrity' ? 'K-POP 스타 매칭' : '성격 테스트'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-center gap-4">
          <Button onClick={handleRetake} variant="outline" size="lg">
            다시 테스트하기
          </Button>
          <Button 
            onClick={() => router.push('/main?tab=community')} 
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            커뮤니티로 돌아가기
          </Button>
        </div>
      </div>

      {/* 연예인 이미지 확대 모달 */}
      {selectedCelebrity && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedCelebrity(null)}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                {selectedCelebrity.image_url ? (
                  <img 
                    src={selectedCelebrity.image_url} 
                    alt={selectedCelebrity.stage_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {selectedCelebrity.stage_name}
                {selectedCelebrity.group_name && (
                  <span className="text-gray-500 ml-2">({selectedCelebrity.group_name})</span>
                )}
              </h3>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">
                  {selectedCelebrity.mbti_code}
                </Badge>
                {selectedCelebrity.is_verified && (
                  <Badge variant="outline" className="text-sm text-green-600 border-green-600">
                    검증됨
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}