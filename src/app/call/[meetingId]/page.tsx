'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Video, CheckCircle, DoorClosed, DoorOpen, Bell } from 'lucide-react'
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
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [notificationSent, setNotificationSent] = useState(false)
  
  // 예약 정보 조회
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/bookings/${meetingId}`)
        if (response.ok) {
          const data = await response.json()
          setMeeting(data.booking)
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

  // 실시간 카운트다운 (대기 중일 때)
  useEffect(() => {
    if (!meeting || hasJoined) return
    
    const timer = setInterval(() => {
      const now = new Date()
      const startTime = meeting.date && meeting.start_time 
        ? new Date(`${meeting.date}T${meeting.start_time}`)
        : new Date(meeting.start_time || meeting.start_at)
      const diff = Math.ceil((startTime.getTime() - now.getTime()) / 1000)
      setWaitSeconds(Math.max(0, diff))

      // 3분 전 알림 (180초 = 3분) - 입장 가능 시점
      if (diff <= 180 && diff > 179 && !notificationSent && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('화상 상담 입장 가능!', {
          body: '이제 입장할 수 있습니다! 미리 들어가서 준비하세요.',
          icon: '/favicon.png'
        })
        setNotificationSent(true)
      }

      // 알림 권한 요청 (3분 전 시점에)
      if (diff <= 180 && diff > 179 && !notificationSent) {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('화상 상담 입장 가능!', {
                body: '이제 입장할 수 있습니다! 미리 들어가서 준비하세요.',
                icon: '/favicon.png'
              })
              setNotificationSent(true)
            }
          })
        }
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [meeting, hasJoined, notificationSent])

  // 20분 타이머 (참여 후)
  useEffect(() => {
    if (!hasJoined || !meeting) return
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
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
    window.open(meeting.meet_url, '_blank')
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatMinutes = (seconds: number) => {
    return Math.ceil(seconds / 60)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
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
  const startTime = meeting.date && meeting.start_time 
    ? new Date(`${meeting.date}T${meeting.start_time}`)
    : new Date(meeting.start_time || meeting.start_at)
  const now = new Date()
  // 3분 전부터 입장 가능 (180초)
  const canJoin = now >= new Date(startTime.getTime() - 3 * 60 * 1000)
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

  // 카운트다운 표시 로직
  const minutesRemaining = formatMinutes(waitSeconds)
  const showCountdown = waitSeconds <= 600 && waitSeconds > 0 // 10분 이하일 때만
  const showDoorClosed = !canJoin // 문이 닫혀있음
  const showDoorOpen = canJoin && !hasJoined // 문이 열려있음
  
  if (!canJoin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="max-w-md w-full shadow-2xl border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-800">
              상담 대기 중
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* 닫힌 문 아이콘 */}
            <div className="flex justify-center">
              <div className="relative">
                <div className={`transform transition-all duration-500 ${showCountdown ? 'scale-110' : 'scale-100'}`}>
                  <DoorClosed className={`w-32 h-32 ${showCountdown ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
                </div>
                {showCountdown && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bell className="w-12 h-12 text-orange-500 animate-bounce" />
                  </div>
                )}
              </div>
            </div>

            {/* 10분 이하일 때 카운트다운 */}
            {showCountdown ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-xl p-6">
                  <p className="text-sm text-orange-700 font-semibold mb-2">⚠️ 곧 시작합니다!</p>
                  <p className="text-5xl font-bold text-orange-600">
                    {minutesRemaining}분 남음
                  </p>
                </div>
                {waitSeconds <= 120 && (
                  <p className="text-sm text-red-600 font-semibold animate-pulse">
                    🎯 거의 다 왔어요! 준비하세요!
                  </p>
                )}
                {waitSeconds <= 60 && waitSeconds > 30 && (
                  <p className="text-lg text-red-600 font-bold animate-bounce">
                    🔥 1분 남았습니다!
                  </p>
                )}
                {waitSeconds <= 180 && waitSeconds > 30 && (
                  <p className="text-xl text-green-600 font-bold animate-pulse">
                    ✅ 3분 전! 이제 입장 가능합니다!
                  </p>
                )}
                {waitSeconds <= 30 && (
                  <p className="text-2xl text-green-600 font-extrabold animate-bounce">
                    🚀 곧 시작합니다! 지금 참여하세요!
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-6">
                <Clock className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <p className="text-sm text-gray-600 mb-2">잠시만 기다려주세요</p>
                <p className="text-3xl font-bold text-gray-700">
                  {formatTime(waitSeconds)}
                </p>
              </div>
            )}

            {/* 상세 정보 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">예약된 시간</p>
              <p className="font-semibold text-gray-900">
                {startTime.toLocaleString('ko-KR')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                상담 주제: {meeting.topic || '상담'}
              </p>
            </div>

            {!showCountdown && (
              <p className="text-sm text-gray-500">
                ⏰ 10분 전부터 카운트다운이 시작되며, 3분 전부터 입장 가능합니다
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // 참여 가능한 상태 (문이 열린 상태)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Card className="max-w-md w-full shadow-2xl border-2 border-green-300">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">
            상담 참여
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* 열린 문 아이콘 */}
          <div className="flex justify-center">
            <div className="relative">
              <DoorOpen className="w-32 h-32 text-green-500 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
          </div>

          {/* 상담 정보 */}
          <div className="space-y-2">
            <p className="font-semibold text-lg">상담 주제</p>
            <p className="text-gray-600">{meeting.topic || '상담'}</p>
          </div>
          
          {/* Google Meet 참여 버튼 */}
          {!hasJoined ? (
            <div className="space-y-4">
              <Button 
                onClick={handleJoinMeet}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                size="lg"
              >
                <Video className="w-6 h-6 mr-2" />
                <span className="text-lg font-bold">Google Meet 참여하기</span>
              </Button>
              <p className="text-sm text-green-700 font-semibold">
                ✨ 입장 가능! 3분 전부터 미리 들어가서 준비할 수 있습니다
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                <p className="font-semibold text-green-700 text-lg">상담 진행 중</p>
              </div>
              
              {/* 타이머 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
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
                className="w-full border-2"
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
