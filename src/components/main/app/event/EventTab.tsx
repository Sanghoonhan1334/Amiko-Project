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

    // 현재 날짜 계산
    const today = new Date()
    const currentDay = today.getDate()
    
    // 이미 오늘 출석체크를 했는지 확인
    const todayRecord = attendanceRecords.find(record => record.day === currentDay)
    
    if (todayRecord) {
      alert('오늘은 이미 출석체크를 완료했습니다!')
      return
    }

    // 출석체크 시간 확인 (12:05 AM ~ 11:59 PM)
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    const currentTime = currentHour * 60 + currentMinute
    const startTime = 0 * 60 + 5 // 12:05 AM
    const endTime = 23 * 60 + 59 // 11:59 PM
    
    if (currentTime < startTime || currentTime > endTime) {
      alert('출석체크 시간이 아닙니다!\n출석시간: 오전 12시 05분 ~ 오후 11시 59분')
      return
    }

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
        day: currentDay,
        date: today.toISOString().split('T')[0],
        streak: currentStreak + 1,
        points: 100, // 기본 출석 포인트 100점
        stamps: 1
      }
      
      setAttendanceRecords(prev => [...prev, newRecord])
      setCurrentStreak(prev => prev + 1)
      setTotalPoints(prev => prev + 100) // 기본 포인트 100점
      
      // 개근상 보상 확인 (5일마다 500점)
      if ((currentStreak + 1) % 5 === 0) {
        setTotalPoints(prev => prev + 500)
        alert(`개근상 보상! 🎉\n${currentStreak + 1}일 연속 출석\n추가 포인트 +500점`)
      }
      
      // 보상 확인
      checkRewards(currentStreak + 1)
      
      // 성공 메시지
      alert(`${currentDay}일 출석체크 완료! 🎉\n연속 출석: ${currentStreak + 1}일\n포인트 +100점`)
      
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
      setTotalPoints(prev => prev + reward.points)
      
      // 보상 알림
      let rewardMessage = `🎉 축하합니다! ${reward.label} 달성!\n`
      rewardMessage += `포인트 +${reward.points}점`
      
      if (reward.coupons > 0) {
        rewardMessage += `\n상담쿠폰 +${reward.coupons}개`
      }
      
      alert(rewardMessage)
      
      console.log(`보상 획득! ${reward.label}: 상담쿠폰 ${reward.coupons}개, 포인트 ${reward.points}점`)
    }
  }

  const getNextReward = () => {
    const milestones = Object.keys(rewards).map(Number).sort((a, b) => a - b)
    return milestones.find(milestone => milestone > currentStreak) || null
  }

  // 각 날짜별 보상 아이템 생성
  const getRewardItems = (dayNumber: number) => {
    const rewardPatterns = [
      ['💎', '⭐'], // 1일차
      ['🍯', '💰'], // 2일차
      ['🌹', '💎'], // 3일차
      ['🥩', '⭐'], // 4일차
      ['🍇', '💰'], // 5일차
      ['🐒', '💎'], // 6일차
      ['💎', '💎', '💎'], // 7일차
      ['📜', '⭐'], // 8일차
      ['🍩', '💰'], // 9일차
      ['🌹', '💎'], // 10일차
      ['🥩', '⭐'], // 11일차
      ['🍇', '💰'], // 12일차
      ['🐒', '🐒'], // 13일차
      ['💎', '💎', '💎'], // 14일차
      ['📜', '⭐'], // 15일차
      ['🍩', '💰'], // 16일차
      ['🌹', '💎'], // 17일차
      ['🥩', '⭐'], // 18일차
      ['🍇', '💰'], // 19일차
      ['🐒', '🐒'], // 20일차
      ['🎒', '💎'], // 21일차
      ['📜', '⭐'], // 22일차
      ['🍩', '💰'], // 23일차
      ['🌹', '💎'], // 24일차
      ['🥩', '⭐'], // 25일차
      ['🍇', '💰'], // 26일차
      ['🛡️', '💎'], // 27일차
      ['📜', '⭐'], // 28일차
    ]
    
    return rewardPatterns[(dayNumber - 1) % rewardPatterns.length] || ['⭐']
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


      {/* 도장 찍기 판 */}
      <Card className="bg-gradient-to-br from-white to-pink-50 border border-pink-100 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            {/* 출석체크 도장판 */}
            <div className="relative mb-8">
              {/* 바인더 형태의 도장판 */}
              <div className="mx-auto w-full max-w-5xl h-[500px] relative">
                {/* 바인더 고리 */}
                <div className="absolute -left-2 top-8 w-4 h-64 bg-gray-400 rounded-full shadow-lg"></div>
                <div className="absolute -left-1 top-6 w-2 h-68 bg-gray-300 rounded-full"></div>
                
                {/* 종이 도장판 */}
                <div className="w-full h-full bg-white border-2 border-gray-300 shadow-2xl relative overflow-hidden">
                  {/* 종이 질감 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white opacity-50"></div>
                  
                  {/* 출석체크 제목 */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <h3 className="text-2xl font-bold text-gray-800">출석체크</h3>
                  </div>
                  
                  {/* 달력 그리드 */}
                  <div className="absolute inset-0 flex items-center justify-center pt-16 pb-8">
                    <div className="grid grid-cols-7 gap-2 w-full h-full px-6">
                      {/* 달력 헤더 (요일) */}
                      <div className="col-span-7 grid grid-cols-7 gap-2 mb-2">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                          <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* 달력 날짜들 */}
                      {Array.from({ length: 35 }).map((_, index) => {
                        const dayNumber = index + 1
                        const today = new Date()
                        const currentMonth = today.getMonth()
                        const currentYear = today.getFullYear()
                        const firstDay = new Date(currentYear, currentMonth, 1).getDay()
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
                        
                        // 실제 날짜 계산
                        const actualDay = dayNumber - firstDay + 1
                        const isValidDay = actualDay > 0 && actualDay <= daysInMonth
                        
                        if (!isValidDay) {
                          return <div key={`empty-${index}`} className="h-16"></div>
                        }
                        
                        const record = attendanceRecords.find(r => r.day === actualDay)
                        const isCompleted = !!record
                        const isToday = actualDay === today.getDate()
                        
                        return (
                          <div key={`day-${actualDay}`} className="flex flex-col items-center justify-center">
                            {/* 날짜 번호 */}
                            <div className={`text-sm font-bold mb-1 ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>
                              {actualDay}
                            </div>
                            
                            {/* 출석/결석 도장 */}
                            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm">
                              {isCompleted ? (
                                <div className="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white">
                                  출석
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                                  결석
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* 도장 찍기 버튼 - 오른쪽에 도장 모양 */}
                  <div className="absolute top-1/2 -right-16 transform -translate-y-1/2">
                    <Button
                      onClick={handleAttendanceCheck}
                      disabled={isStampAnimating}
                      className={`w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:-rotate-12 ${
                        isStampAnimating ? 'animate-pulse scale-125 rotate-6' : ''
                      }`}
                      style={{
                        transform: `scale(${stampSize})`,
                        transition: 'transform 0.3s ease-in-out'
                      }}
                      title="출석체크 하기"
                    >
                      {isStampAnimating ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      ) : (
                        <div className="text-center">
                          <div className="text-2xl">📅</div>
                        </div>
                      )}
                    </Button>
                    
                    {/* 도장 찍기 안내 텍스트 */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium whitespace-nowrap">
                      클릭해서 출석체크!
                    </div>
                    
                    {/* 도장 주변 별 효과 */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-2 -left-2 text-yellow-400 text-lg animate-ping">⭐</div>
                      <div className="absolute -top-1 -right-3 text-yellow-400 text-sm animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
                      <div className="absolute -bottom-2 -left-1 text-yellow-400 text-sm animate-ping" style={{ animationDelay: '1s' }}>✨</div>
                      <div className="absolute -bottom-1 -right-2 text-yellow-400 text-lg animate-ping" style={{ animationDelay: '1.5s' }}>⭐</div>
                    </div>
                  </div>
                  
                  {/* 도장 찍기 애니메이션 효과 */}
                  {isStampAnimating && (
                    <div className="absolute inset-0 pointer-events-none z-20">
                      <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
                        <div className="w-32 h-32 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                      </div>
                      <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
                        <div className="w-20 h-20 bg-pink-500 rounded-full opacity-40 animate-ping" style={{ animationDelay: '0.1s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
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
                key={`attendance-${record.date}-${index}`}
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
