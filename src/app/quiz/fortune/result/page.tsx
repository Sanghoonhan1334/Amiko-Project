'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw, Share2 } from 'lucide-react'
import Header from '@/components/layout/Header'

interface FortuneResult {
  luckIndex: number
  title: string
  description: string[]
  luckyItem: {
    name: string
    emoji: string
    description: string
  }
}

// 운세 결과 데이터
const fortuneResults: FortuneResult[] = [
  {
    luckIndex: 85,
    title: "¡Un día muy afortunado!",
    description: [
      "Todo saldrá mejor de lo que esperas hoy.",
      "Es el momento perfecto para tomar decisiones importantes.",
      "Tu energía positiva atraerá buenas oportunidades."
    ],
    luckyItem: {
      name: "Collar de oro",
      emoji: "👑",
      description: "Te traerá prosperidad y buena fortuna."
    }
  },
  {
    luckIndex: 65,
    title: "Un día equilibrado",
    description: [
      "Las cosas irán bien si mantienes la calma.",
      "Es buen momento para planificar el futuro.",
      "Confía en tu intuición para tomar decisiones."
    ],
    luckyItem: {
      name: "Cristal azul",
      emoji: "💎",
      description: "Te ayudará a mantener la serenidad."
    }
  },
  {
    luckIndex: 45,
    title: "Un día de reflexión",
    description: [
      "Es un buen momento para descansar y pensar.",
      "No te preocupes por las cosas que no puedes controlar.",
      "Disfruta de las pequeñas cosas de la vida."
    ],
    luckyItem: {
      name: "Libro de sabiduría",
      emoji: "📚",
      description: "Te guiará hacia la claridad mental."
    }
  },
  {
    luckIndex: 25,
    title: "Un día de paciencia",
    description: [
      "Las cosas pueden ser más lentas de lo esperado.",
      "Mantén la paciencia y no te desanimes.",
      "Es momento de ser más cuidadoso en tus decisiones."
    ],
    luckyItem: {
      name: "Velas aromáticas",
      emoji: "🕯️",
      description: "Te ayudarán a relajarte y encontrar paz."
    }
  }
]

export default function FortuneResultPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<FortuneResult | null>(null)

  useEffect(() => {
    // 답변 데이터 가져오기
    const answers = JSON.parse(localStorage.getItem('fortune_answers') || '{}')
    
    // 답변을 기반으로 운세 결과 계산
    const calculateFortune = () => {
      const answerCount = Object.keys(answers).length
      const positiveAnswers = Object.values(answers).filter((answer: string) => 
        answer.includes('positive') || answer.includes('energetic') || answer.includes('exciting')
      ).length
      
      const luckScore = (positiveAnswers / answerCount) * 100
      
      // 운세 결과 선택
      if (luckScore >= 70) return fortuneResults[0]
      if (luckScore >= 50) return fortuneResults[1]
      if (luckScore >= 30) return fortuneResults[2]
      return fortuneResults[3]
    }

    setTimeout(() => {
      const fortuneResult = calculateFortune()
      setResult(fortuneResult)
      setLoading(false)
    }, 2000)
  }, [])

  const handleBack = () => {
    router.push('/community/tests')
  }

  const handleRetake = () => {
    localStorage.removeItem('fortune_answers')
    router.push('/quiz/fortune/start')
  }

  const handleShare = async () => {
    try {
      // 프로덕션 URL 사용
      const isLocalhost = window.location.hostname === 'localhost'
      const baseUrl = isLocalhost 
        ? 'https://helloamiko.com'
        : window.location.origin
      
      const shareUrl = `${baseUrl}/quiz/fortune`
      const shareText = `Mi índice de fortuna es ${result?.luckIndex}% - ${result?.title}\n\n¡Descubre tu fortuna también!\n${shareUrl}`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Mi Resultado de Fortuna',
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert('¡Texto copiado!')
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return
      }
      
      try {
        const isLocalhost = window.location.hostname === 'localhost'
        const baseUrl = isLocalhost ? 'https://helloamiko.com' : window.location.origin
        const shareUrl = `${baseUrl}/quiz/fortune`
        const shareText = `Mi índice de fortuna es ${result?.luckIndex}% - ${result?.title}\n\n¡Descubre tu fortuna también!\n${shareUrl}`
        await navigator.clipboard.writeText(shareText)
        alert('¡Texto copiado!')
      } catch (clipboardError) {
        console.error('Error al compartir:', clipboardError)
        alert('Error al compartir.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Analizando tu fortuna...
          </p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#FDF4E6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Error al cargar el resultado
          </p>
          <Button onClick={handleBack} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF4E6]">
      <Header />
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 행운지수 섹션 */}
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-4 text-center">
            <h2 className="text-3xl font-bold text-black mb-2">
              Índice de Fortuna {result.luckIndex}
            </h2>
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="text-2xl">🥠</span>
              <span className="text-2xl">☁️</span>
              <span className="text-2xl">☀️</span>
            </div>
          </div>

          {/* 설명 섹션 */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-6 mb-4">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              {result.title}
            </h3>
            <div className="space-y-2">
              {result.description.map((desc, index) => (
                <p key={index} className="text-black text-sm">
                  • {desc}
                </p>
              ))}
            </div>
          </div>

          {/* 행운아이템 섹션 */}
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              Artículo de la Suerte
            </h3>
            <div className="text-center">
              <div className="text-6xl mb-3">{result.luckyItem.emoji}</div>
              <p className="text-black font-semibold mb-2">{result.luckyItem.name}</p>
              <p className="text-black text-sm">{result.luckyItem.description}</p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Repetir Test
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
