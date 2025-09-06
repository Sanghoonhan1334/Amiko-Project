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

    // 이미 오늘 출석체크를 했는지 확인
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = attendanceRecords.find(record => record.date === today)
    
    if (todayRecord) {
      alert('오늘은 이미 출석체크를 완료했습니다!')
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
        date: today,
        streak: currentStreak + 1,
        points: 0,
        stamps: 1
      }
      
      setAttendanceRecords(prev => [...prev, newRecord])
      setCurrentStreak(prev => prev + 1)
      setTotalPoints(prev => prev + 10) // 기본 포인트 10점
      
      // 보상 확인
      checkRewards(currentStreak + 1)
      
      // 성공 메시지
      alert(`출석체크 완료! 🎉\n연속 출석: ${currentStreak + 1}일\n포인트 +10점`)
      
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

      {/* 도장 찍기 판 */}
      <Card className="bg-gradient-to-br from-white to-pink-50 border border-pink-100 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            {/* 출석체크 도장판 */}
            <div className="relative mb-8">
              {/* 바인더 형태의 도장판 */}
              <div className="mx-auto w-96 h-80 relative">
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
                  
                  {/* 도장 자리들 - 2행 4열 */}
                  <div className="absolute inset-0 flex items-center justify-center pt-16 pb-8">
                    <div className="grid grid-cols-4 gap-8 w-full h-full px-8">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-center">
                          <div className="relative">
                            {attendanceRecords.length > index ? (
                              <div className="relative">
                                {/* 도장이 찍힌 자리 */}
                                <div className="w-16 h-16 bg-red-500 rounded-full border-4 border-red-600 shadow-lg flex items-center justify-center text-white font-bold text-lg animate-bounce">
                                  😊
                                </div>
                                {/* 출석완료 리본 */}
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  출석완료
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                {/* 빈 도장 자리 */}
                                <div className="w-16 h-16 border-4 border-dashed border-gray-400 rounded-full flex items-center justify-center text-gray-400 text-lg hover:border-gray-500 hover:text-gray-500 transition-all duration-200">
                                  😐
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
              
              {/* 도장판 설명 */}
              <div className="mt-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  📋 출석체크 도장판
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  오른쪽의 <span className="text-red-600 font-bold">📅 도장</span>을 눌러서 매일 출석체크하세요!
                  <br />
                  <span className="text-red-600 font-bold text-xl">8개 도장</span>을 모두 모으면 특별 보상을 받을 수 있어요! ✨
                </p>
                
                {/* 진행률 표시 - 더 예쁘게 */}
                <div className="bg-gradient-to-r from-white to-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">📋 출석체크 진행률</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                        {attendanceRecords.length}/8
                      </span>
                      <span className="text-red-500 text-xl">😊</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-red-400 via-pink-400 to-red-500 h-4 rounded-full transition-all duration-700 shadow-lg"
                      style={{ width: `${(attendanceRecords.length / 8) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-sm text-gray-600">
                      {attendanceRecords.length === 8 ? 
                        '🎉 축하합니다! 모든 출석체크를 완료했어요!' : 
                        `${8 - attendanceRecords.length}개 더 출석하면 완성!`
                      }
                    </span>
                  </div>
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
