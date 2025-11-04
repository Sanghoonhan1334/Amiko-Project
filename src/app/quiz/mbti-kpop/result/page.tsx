'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Users, Heart, Star, X, Share2, RotateCcw, List } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'

function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      {/* Header skeleton */}
    </header>
  )
}

interface TestResult {
  mbti: string
  myType: {
    male: any
    female: any
  }
  bestMatch: {
    male: any
    female: any
  }
  bestMatchMbti: string
  compatibility: {
    note_ko: string
    note_es: string
  }
}

function ResultPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCeleb, setSelectedCeleb] = useState<any>(null)

  useEffect(() => {
    const mbtiType = searchParams.get('mbti')
    
    if (!mbtiType) {
      router.push('/quiz/mbti-kpop')
      return
    }

    // API로 MBTI 타입에 대한 결과 조회
    const fetchResult = async () => {
      try {
        const response = await fetch('/api/mbti-kpop-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            answers: [], // 더미 답변 (MBTI 타입만 필요)
            mbtiType: mbtiType // 직접 MBTI 타입 전달
          })
        })

        const data = await response.json()
        
        if (data.success) {
          setResult({ ...data.data, mbti: mbtiType })
        } else {
          router.push('/quiz/mbti-kpop')
        }
      } catch (error) {
        console.error('결과 로딩 오류:', error)
        router.push('/quiz/mbti-kpop')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [searchParams, router])

  const handleShare = async () => {
    if (!result) return
    
    try {
      const isLocalhost = window.location.hostname === 'localhost'
      const baseUrl = isLocalhost ? 'https://helloamiko.com' : window.location.origin
      const shareUrl = `${baseUrl}/quiz/mbti-kpop/result?mbti=${result.mbti}`
      
      // 내 타입 연예인들
      const myTypeCelebs = []
      if (result.myType.male) myTypeCelebs.push(result.myType.male.stage_name)
      if (result.myType.female) myTypeCelebs.push(result.myType.female.stage_name)
      const myTypeCelebsText = myTypeCelebs.length > 0 ? myTypeCelebs.join(' y ') : ''
      
      // 궁합 좋은 연예인들
      const bestMatchCelebs = []
      if (result.bestMatch.male) bestMatchCelebs.push(result.bestMatch.male.stage_name)
      if (result.bestMatch.female) bestMatchCelebs.push(result.bestMatch.female.stage_name)
      const bestMatchCelebsText = bestMatchCelebs.length > 0 ? bestMatchCelebs.join(' y ') : ''
      
      let shareText = `¡Mi tipo MBTI es ${result.mbti}!`
      
      if (myTypeCelebsText) {
        shareText += `\n¡Me parezco a ${myTypeCelebsText}!`
      }
      
      if (result.bestMatchMbti && bestMatchCelebsText) {
        shareText += `\n\nTipo compatible: ${result.bestMatchMbti} (${bestMatchCelebsText})`
      }
      
      shareText += `\n\n${shareUrl}`
      
      if (navigator.share) {
        await navigator.share({
          title: `Mi tipo MBTI: ${result.mbti}`,
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
      console.error('Error al compartir:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-blue-100 flex items-center justify-center">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <div className="text-center">
          <p className="text-gray-600 mb-4">No se pudo cargar el resultado</p>
          <Button onClick={() => router.push('/quiz/mbti-kpop')}>
            Volver al test
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-blue-100">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      <div className="pt-32 pb-8 px-2">
        <div className="max-w-4xl mx-auto px-2">
          {/* 뒤로가기 버튼 */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quiz/mbti-kpop')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 결과 헤더 */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              ¡Tu tipo es {result.mbti}!
            </h1>
            <p className="text-sm text-gray-600">
              ¡Encuentra celebridades de tu tipo MBTI y tipos compatibles contigo!
            </p>
          </div>

          {/* 나와 같은 유형의 셀럽 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Celebridades de mi tipo
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {result.myType.male && (
                <CelebCard celeb={result.myType.male} language={language} onClick={() => setSelectedCeleb(result.myType.male)} />
              )}
              {result.myType.female && (
                <CelebCard celeb={result.myType.female} language={language} onClick={() => setSelectedCeleb(result.myType.female)} />
              )}
            </div>
          </div>

          {/* 궁합이 좋은 유형 */}
          {result.bestMatchMbti && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Tipo compatible: {result.bestMatchMbti}
              </h2>
              {result.compatibility && (
                <p className="text-sm text-gray-600 mb-3 p-2 bg-blue-50 rounded-lg">
                  {result.compatibility.note_es}
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {result.bestMatch.male && (
                  <CelebCard celeb={result.bestMatch.male} language={language} onClick={() => setSelectedCeleb(result.bestMatch.male)} />
                )}
                {result.bestMatch.female && (
                  <CelebCard celeb={result.bestMatch.female} language={language} onClick={() => setSelectedCeleb(result.bestMatch.female)} />
                )}
              </div>
            </div>
          )}

          {/* 주의사항 */}
          <Card className="p-3 bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ Emparejamiento no oficial para entretenimiento. La información de MBTI y celebridades puede variar según el momento y la fuente.
            </p>
          </Card>

          {/* 액션 버튼들 */}
          <div className="flex flex-col gap-3 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => router.push('/community/tests')}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <List className="w-4 h-4" />
                Ver Tests
              </Button>
              
              <Button
                onClick={handleShare}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </div>
            
            <Button
              onClick={() => router.push('/quiz/mbti-kpop/questions')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Hacer test de nuevo
            </Button>
          </div>
        </div>
      </div>

      {/* 연예인 이미지 확대 모달 */}
      {selectedCeleb && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedCeleb(null)}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                {selectedCeleb.image_url ? (
                  <img 
                    src={selectedCeleb.image_url} 
                    alt={selectedCeleb.stage_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {selectedCeleb.stage_name}
                {selectedCeleb.group_name && (
                  <span className="text-gray-500 ml-2">({selectedCeleb.group_name})</span>
                )}
              </h3>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  {selectedCeleb.mbti_code}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedCeleb.gender === 'male' ? 'Hombre' : 'Mujer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 셀럽 카드 컴포넌트
function CelebCard({ celeb, language, onClick }: { celeb: any, language: string, onClick?: () => void }) {
  return (
    <Card className="p-3 bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3">
        {/* 프로필 이미지 */}
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
          {celeb.image_url ? (
            <img 
              src={celeb.image_url} 
              alt={celeb.stage_name}
              className="w-full h-full rounded-full object-cover hover:scale-105 transition-transform"
            />
          ) : (
            <Users className="w-12 h-12 text-gray-500" />
          )}
        </div>
        
        {/* 정보 */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">
            {celeb.stage_name}
            {celeb.group_name && (
              <span className="text-xs text-gray-500 ml-1">({celeb.group_name})</span>
            )}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {celeb.mbti_code}
            </span>
            <span className="text-xs text-gray-500">
              {celeb.gender === 'male' ? 'Hombre' : 'Mujer'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function MBTIKpopResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  )
}

