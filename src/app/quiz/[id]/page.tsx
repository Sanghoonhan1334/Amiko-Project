'use client'

import { redirect } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

interface QuizByIdPageProps {
  params: Promise<{ id: string }>
}

export default function QuizByIdPage({ params }: QuizByIdPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const resolvedParams = use(params)

  useEffect(() => {
    const handleRouting = async () => {
      // 사용자가 실수로 /quiz/idol-position 을 /quiz/[id]로 치고 들어온 경우도 커버
      if (resolvedParams.id === 'idol-position') {
        redirect('/quiz/idol-position')
        return
      }

      try {
        // DB에서 퀴즈 조회
        const response = await fetch(`/api/quizzes/${resolvedParams.id}`)
        if (!response.ok) {
          // 퀴즈를 찾을 수 없는 경우
          router.push('/community/tests')
          return
        }

        const responseData = await response.json()
        console.log('[QUIZ_ROUTING] API 응답:', responseData)
        
        if (!responseData.success) {
          console.log('[QUIZ_ROUTING] API 응답 실패:', responseData.error)
          router.push('/community/tests')
          return
        }

        const quiz = responseData.data?.quiz || responseData.data
        
        // 이 퀴즈가 slug형 전용 페이지 대상이면 안전하게 리다이렉트
        if (quiz.slug === 'idol-position') {
          redirect('/quiz/idol-position')
          return
        }

        // slug가 있는 경우 slug 기반으로 리다이렉트
        if (quiz.slug) {
          router.push(`/quiz/${quiz.slug}`)
          return
        }

        // slug가 없는 경우 기존 ID 기반 페이지로 처리
        // 여기서는 기본적으로 커뮤니티 테스트 목록으로 리다이렉트
        router.push('/community/tests')
        
      } catch (error) {
        console.error('퀴즈 조회 오류:', error)
        router.push('/community/tests')
      } finally {
        setIsLoading(false)
      }
    }

    handleRouting()
  }, [resolvedParams.id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return null
}
