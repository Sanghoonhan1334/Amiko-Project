'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Video, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface MeetingData {
  id: string
  meet_url: string
  start_time: string
  duration: number
  topic: string
  status: string
}

export default function CallMeetingPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const meetingId = params.meetingId as string
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(20 * 60) // 20분 = 1200초
  const [hasJoined, setHasJoined] = useState(false)
  
  // 예약 정보 조회
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/bookings/${meetingId}`)
        if (response.ok) {
          const data = await response.json()
          setMeeting(data.booking)
          
          // 예약 시간 계산
          const startTime = new Date(data.booking.start_at)
          const now = new Date()
          const diffSeconds = Math.max(0, (startTime.getTime() - now.getTime()) / 1000)
          
          setTimeRemaining(data.booking.duration * 60)
        } else {
          alert('예약 정보를 불러올 수 없습니다.')
          router.push('/main')
        }
      } catch (error) {
        console.error('Error fetching meeting:', error)
        alert('예약 정보를 불러오는 중 오류가 발생했습니다.')
        router.push('/main')
      } finally {
        setLoading(false)
      }
    }
    
    if (meetingId && user) {
      fetchMeeting()
    } else if (!user) {
      router.push('/login')
    }
  }, [meetingId, user, router])
  
  // 20분 타이머
  useEffect(() => {
    if (!hasJoined || !meeting) return
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          // 20분 후 피드백 페이지로 이동
          router.push(`/feedback/${meetingId}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [hasJoined, meeting, meetingId, router])
  
  const handleJoinMeet = () => {
    if (!meeting?.meet_url) {
      alert('Google Meet 링크가 없습니다.')
      return
    }
    
    setHasJoined(true)
    // 새 탭에서 Google Meet 링크 열기
    window.open(meeting.meet_url, '_blank')
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (!meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">예약 정보를 찾을 수 없습니다.</p>
            <Button onClick={() => router.push('/main')}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // 예약 시간 체크
  const startTime = new Date(meeting.start_time || meeting.start_at)
  const now = new Date()
  const canJoin = now >= startTime
  const isPast = now > new Date(startTime.getTime() + meeting.duration * 60 * 1000)
  
  if (isPast) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">상담이 종료되었습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <p className="text-gray-600">
              예약 시간이 지났습니다.
              <br />
              피드백을 남겨주세요!
            </p>
            <Button 
              onClick={() => router.push(`/feedback/${meetingId}`)}
              className="w-full"
            >
              피드백 작성하기
            </Button>
            <Button 
              onClick={() => router.push('/main')}
              variant="outline"
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!canJoin) {
    const waitSeconds = Math.ceil((startTime.getTime() - now.getTime()) / 1000)
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">예약 시간까지 대기 중</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Clock className="w-16 h-16 mx-auto text-blue-500" />
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {formatTime(waitSeconds)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                예약된 시간: {startTime.toLocaleString('ko-KR')}
              </p>
            </div>
            <p className="text-gray-600">
              시간이 되면 참여하기 버튼이 활성화됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">화상 상담</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 상담 정보 */}
          <div className="space-y-2">
            <p className="font-semibold">상담 주제</p>
            <p className="text-gray-600">{meeting.topic || '상담'}</p>
          </div>
          
          {/* Google Meet 참여 버튼 */}
          {!hasJoined ? (
            <div className="space-y-4">
              <Button 
                onClick={handleJoinMeet}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Video className="w-5 h-5 mr-2" />
                Google Meet 참여하기
              </Button>
              <p className="text-sm text-gray-500 text-center">
                버튼을 클릭하면 Google Meet가 새 창에서 열립니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                <p className="font-semibold text-green-700">상담 진행 중</p>
              </div>
              
              {/* 타이머 */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">남은 시간</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {formatTime(timeRemaining)}
                </p>
              </div>
              
              <Button 
                onClick={() => router.push(`/feedback/${meetingId}`)}
                variant="outline"
                className="w-full"
              >
                상담 종료 및 피드백 작성
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

