'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Star, CheckCircle } from 'lucide-react'

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const meetingId = params.meetingId as string
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rating) {
      alert('평점을 선택해주세요.')
      return
    }
    
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: meetingId,
          rating,
          feedback
        })
      })
      
      if (response.ok) {
        setSubmitted(true)
      } else {
        const error = await response.json()
        alert(error.error || '피드백 제출에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('피드백 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }
  
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRating(star)}
        className={`transition-all ${
          star <= rating
            ? 'text-yellow-400 scale-110'
            : 'text-gray-300 hover:text-yellow-200'
        }`}
      >
        <Star 
          className={`w-8 h-8 ${
            star <= rating ? 'fill-current' : ''
          }`}
        />
      </button>
    ))
  }
  
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">피드백 감사합니다!</h2>
            <p className="text-gray-600">
              소중한 의견을 주셔서 감사합니다.
              <br />
              더 나은 서비스를 위해 노력하겠습니다.
            </p>
            <Button 
              onClick={() => router.push('/main')}
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">상담 피드백</CardTitle>
          <CardDescription className="text-center">
            상담은 어떠셨나요? 소중한 의견을 남겨주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 평점 */}
            <div>
              <Label className="block mb-3">만족도</Label>
              <div className="flex justify-center gap-2">
                {renderStars()}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {rating}점 선택됨
                </p>
              )}
            </div>
            
            {/* 피드백 내용 */}
            <div>
              <Label htmlFor="feedback">의견 (선택사항)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="상담에 대한 자유로운 의견을 남겨주세요..."
                rows={5}
                className="mt-2"
              />
            </div>
            
            {/* 제출 버튼 */}
            <Button
              type="submit"
              disabled={!rating || submitting}
              className="w-full"
            >
              {submitting ? '제출 중...' : '피드백 제출'}
            </Button>
            
            {/* 건너뛰기 */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/main')}
              className="w-full"
            >
              건너뛰기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

