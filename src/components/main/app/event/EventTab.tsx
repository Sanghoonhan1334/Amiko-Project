'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  Gift, 
  Star, 
  Trophy, 
  Zap,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface AttendanceRecord {
  date: string
  streak: number
  points: number
  stamps: number
}

export default function EventTab() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [isStampAnimating, setIsStampAnimating] = useState(false)
  const [stampSize, setStampSize] = useState(1)

  // 출석체크 보상 시스템
  const rewards = {
    3: { coupons: 0, points: 20, label: '3일 연속' },
    7: { coupons: 1, points: 30, label: '7일 연속' },
    14: { coupons: 2, points: 40, label: '14일 연속' },
    30: { coupons: 3, points: 50, label: '30일 연속' }
  }

  useEffect(() => {
    loadAttendanceData()
  }, [])

  const loadAttendanceData = () => {
    // 실제로는 API에서 데이터를 가져올 것
    const mockData = {
      currentStreak: 5,
      totalPoints: 120,
      records: [
        { date: '2024-01-15', streak: 1, points: 0, stamps: 1 },
        { date: '2024-01-16', streak: 2, points: 0, stamps: 1 },
        { date: '2024-01-17', streak: 3, points: 20, stamps: 1 },
        { date: '2024-01-18', streak: 4, points: 0, stamps: 1 },
        { date: '2024-01-19', streak: 5, points: 0, stamps: 1 },
      ]
    }
    
    setCurrentStreak(mockData.currentStreak)
    setTotalPoints(mockData.totalPoints)
    setAttendanceRecords(mockData.records)
    
    // 연속 출석일수에 따른 도장 크기 계산
    setStampSize(Math.min(1 + (mockData.currentStreak * 0.1), 2))
  }

  const handleAttendanceCheck = async () => {
    if (isStampAnimating) return

    setIsStampAnimating(true)
    
    // 도장 소리 효과 (웹 오디오 API)
    playStampSound()
    
    // 진동 피드백 (모바일)
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }

    // 도장 찍기 애니메이션
    setTimeout(() => {
      setIsStampAnimating(false)
      
      // 출석체크 완료 처리
      const newRecord = {
        date: new Date().toISOString().split('T')[0],
        streak: currentStreak + 1,
        points: 0,
        stamps: 1
      }
      
      setAttendanceRecords(prev => [...prev, newRecord])
      setCurrentStreak(prev => prev + 1)
      
      // 보상 확인
      checkRewards(currentStreak + 1)
      
    }, 800)
  }

  const playStampSound = () => {
    // 간단한 도장 소리 효과
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const checkRewards = (streak: number) => {
    if (streak in rewards) {
      const reward = rewards[streak as keyof typeof rewards]
      // 보상 지급 로직
      console.log(`보상 획득! ${reward.label}: 상담쿠폰 ${reward.coupons}개, 포인트 ${reward.points}점`)
    }
  }

  const getNextReward = () => {
    const milestones = Object.keys(rewards).map(Number).sort((a, b) => a - b)
    return milestones.find(milestone => milestone > currentStreak) || null
  }

  const nextReward = getNextReward()

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-6 shadow-lg">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
          출석체크 이벤트
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          매일 출석체크하고 도장을 모아보세요!
          <br />
          <span className="text-red-600 font-medium">연속 출석</span>에 따른 특별 보상을 받을 수 있습니다.
        </p>
      </div>

      {/* 현재 상태 */}
      <Card className="bg-gradient-to-br from-white to-red-50 border border-red-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Trophy className="h-6 w-6 text-red-500" />
            현재 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl border border-red-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
                {currentStreak}일
              </div>
              <div className="text-sm text-gray-600 font-medium">연속 출석</div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-red-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
                {totalPoints}점
              </div>
              <div className="text-sm text-gray-600 font-medium">총 포인트</div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-red-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2">
                {attendanceRecords.length}개
              </div>
              <div className="text-sm text-gray-600 font-medium">수집한 도장</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 출석체크 버튼 */}
      <Card className="bg-gradient-to-br from-white to-pink-50 border border-pink-100 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="relative mb-6">
              <Button
                onClick={handleAttendanceCheck}
                disabled={isStampAnimating}
                className={`bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-12 py-6 text-xl rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                  isStampAnimating ? 'animate-pulse' : ''
                }`}
                style={{
                  transform: `scale(${stampSize})`,
                  transition: 'transform 0.3s ease-in-out'
                }}
              >
                {isStampAnimating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    도장 찍는 중...
                  </>
                ) : (
                  <>
                    <Calendar className="w-6 h-6 mr-3" />
                    오늘 출석체크 하기
                  </>
                )}
              </Button>
              
              {/* 도장 애니메이션 효과 */}
              {isStampAnimating && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 bg-red-500 rounded-full opacity-50 animate-ping"></div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">
              매일 출석체크하고 연속 출석 보상을 받아보세요!
            </p>
            
            {nextReward && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                <p className="text-sm text-gray-700 mb-2">
                  다음 보상까지 <span className="font-bold text-orange-600">{nextReward - currentStreak}일</span> 남았어요!
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">
                    {rewards[nextReward as keyof typeof rewards].label}: 
                    상담쿠폰 {rewards[nextReward as keyof typeof rewards].coupons}개 + 
                    포인트 {rewards[nextReward as keyof typeof rewards].points}점
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 보상 시스템 */}
      <Card className="bg-gradient-to-br from-white to-purple-50 border border-purple-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Award className="h-6 w-6 text-purple-500" />
            보상 시스템
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(rewards).map(([days, reward]) => (
              <div 
                key={days}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  currentStreak >= parseInt(days)
                    ? 'bg-green-50 border-green-200 shadow-md'
                    : currentStreak >= parseInt(days) - 2
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    currentStreak >= parseInt(days)
                      ? 'text-green-600'
                      : currentStreak >= parseInt(days) - 2
                      ? 'text-yellow-600'
                      : 'text-gray-400'
                  }`}>
                    {days}일
                  </div>
                  <div className="space-y-2">
                    {reward.coupons > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <Gift className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">쿠폰 {reward.coupons}개</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">포인트 {reward.points}점</span>
                    </div>
                  </div>
                  {currentStreak >= parseInt(days) && (
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 출석 기록 */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Clock className="h-6 w-6 text-blue-500" />
            출석 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.slice(-7).reverse().map((record, index) => (
              <div 
                key={record.date}
                className="flex items-center justify-between p-4 bg-white border border-blue-100 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      📅
                    </div>
                    {record.streak >= 3 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">★</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('ko-KR', { 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      연속 {record.streak}일째
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {record.points > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      +{record.points}점
                    </Badge>
                  )}
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
