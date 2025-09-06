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
  const [currentDay, setCurrentDay] = useState(new Date().getDate())
  const [clickedDay, setClickedDay] = useState<number | null>(null)
  const [userType, setUserType] = useState<'local' | 'korean'>('local') // 기본값: 현지인

  // 사용자 타입 감지 (실제로는 사용자 프로필에서 가져올 것)
  const detectUserType = () => {
    // 임시로 브라우저 언어 설정으로 판단 (실제로는 사용자 프로필 기반)
    const browserLang = navigator.language.toLowerCase()
    const isKorean = browserLang.includes('ko') || browserLang.includes('kr')
    return isKorean ? 'korean' : 'local'
  }

  // 출석체크 보상 시스템 (한 달 전체 기준)
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  // 월별 비례 보상 계산
  const getRewards = () => {
    const quarter = Math.floor(daysInMonth / 4)
    const half = Math.floor(daysInMonth / 2)
    const threeQuarter = Math.floor(daysInMonth * 3 / 4)
    
    return {
      [quarter]: { coupons: 0, points: 20, label: `${quarter}일 연속` },
      [half]: { coupons: 1, points: 30, label: `${half}일 연속` },
      [threeQuarter]: { coupons: 2, points: 40, label: `${threeQuarter}일 연속` },
      [daysInMonth]: { coupons: 5, points: 80, label: `${daysInMonth}일 연속 (한 달 완주)` }
    }
  }
  
  const rewards = getRewards()

  useEffect(() => {
    loadAttendanceData()
  }, [])

  const loadAttendanceData = () => {
    // localStorage에서 실제 출석체크 기록 불러오기
    const savedRecords = localStorage.getItem('attendanceRecords')
    const savedPoints = localStorage.getItem('totalPoints')
    
    if (savedRecords) {
      const records = JSON.parse(savedRecords)
      setAttendanceRecords(records)
      
      // 실제 출석체크 기록을 기반으로 연속 일수 계산
      const actualStreak = records.length
      setCurrentStreak(actualStreak)
      
      // 연속 출석일수에 따른 도장 크기 계산
      setStampSize(Math.min(1 + (actualStreak * 0.1), 2))
    } else {
      // 처음 사용하는 경우 빈 배열로 시작
      setAttendanceRecords([])
      setCurrentStreak(0)
      setStampSize(1)
    }
    
    if (savedPoints) {
      setTotalPoints(parseInt(savedPoints))
    } else {
      setTotalPoints(0)
    }
  }

  const handleDayClick = async (dayNumber: number) => {
    if (isStampAnimating) return

    // 해당 날짜의 출석체크 기록 확인
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const dayDate = new Date(currentYear, currentMonth, dayNumber).toISOString().split('T')[0]
    const existingRecord = attendanceRecords.find(record => record.date === dayDate)
    
    if (existingRecord) {
      return
    }

    setIsStampAnimating(true)
    setClickedDay(dayNumber)
    
    // 도장 소리 효과 (웹 오디오 API)
    playStampSound()
    
    // 진동 피드백 (모바일)
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }

    // 도장 찍기 애니메이션
    setTimeout(() => {
      setIsStampAnimating(false)
      setClickedDay(null)
      
      // 출석체크 완료 처리
      const newRecord = {
        day: dayNumber,
        date: dayDate,
        streak: attendanceRecords.length + 1,
        points: 100, // 기본 출석 포인트 100점
        stamps: 1
      }
      
      const updatedRecords = [...attendanceRecords, newRecord]
      setAttendanceRecords(updatedRecords)
      
      // localStorage에 출석체크 기록 저장
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords))
      
      // 실제 출석체크 기록을 기반으로 연속 일수 업데이트
      const actualStreak = updatedRecords.length
      setCurrentStreak(actualStreak)
      
      const newTotalPoints = totalPoints + 100
      setTotalPoints(newTotalPoints)
      
      // 개근상 보상 확인 (5일마다 500점)
      if (actualStreak % 5 === 0) {
        const bonusPoints = newTotalPoints + 500
        setTotalPoints(bonusPoints)
        localStorage.setItem('totalPoints', bonusPoints.toString())
      } else {
        localStorage.setItem('totalPoints', newTotalPoints.toString())
      }
      
      // 보상 확인
      checkRewards(actualStreak)
      
      // 성공 메시지 제거
      
    }, 200)
  }

  const handleAttendanceCheck = async () => {
    await handleDayClick(currentDay)
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
          <span className="text-red-600 font-medium">한 달 완주</span>에 따른 특별 보상을 받을 수 있습니다.
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
                    <h3 className="text-2xl font-bold text-gray-800">
                      {currentYear}년 {currentMonth + 1}월 출석체크
                    </h3>
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
                        
                        const dayDate = new Date(currentYear, currentMonth, actualDay).toISOString().split('T')[0]
                        const record = attendanceRecords.find(r => r.date === dayDate)
                        const isCompleted = !!record
                        const isToday = actualDay === currentDay
                        
                        return (
                          <div key={`day-${actualDay}`} className="flex flex-col items-center justify-center">
                            {/* 날짜 번호 */}
                            <div className={`text-sm font-bold mb-1 ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>
                              {actualDay}
                            </div>
                            
                            {/* 도장 찍기 버튼 - 모든 날짜 클릭 가능 */}
                            <button
                              onClick={() => handleDayClick(actualDay)}
                              disabled={isStampAnimating}
                              className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-110"
                            >
                              {isCompleted ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  {/* 빨간 도장 (회색 틀보다 조금 더 큼) */}
                                  <div 
                                    className="absolute bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      border: '2px solid rgba(255,255,255,0.3)',
                                      boxShadow: `
                                        inset 0 0 0 1px rgba(255,255,255,0.2),
                                        0 0 0 1px rgba(255,255,255,0.1),
                                        0 0 0 2px rgba(255,255,255,0.05),
                                        0 0 0 3px rgba(255,255,255,0.03),
                                        0 0 0 4px rgba(255,255,255,0.02),
                                        0 0 0 5px rgba(255,255,255,0.01),
                                        inset 0 0 0 1px rgba(0,0,0,0.1),
                                        0 2px 4px rgba(0,0,0,0.1),
                                        0 4px 8px rgba(0,0,0,0.05)
                                      `,
                                      background: `
                                        radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 0%, transparent 50%),
                                        #ef4444
                                      `
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-red-600 opacity-20 rounded-full"></div>
                                    <span className="relative z-10 transform rotate-12 text-xs font-bold">출석</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs">
                                  ?
                                </div>
                              )}
                            </button>
                            
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                </div>
              </div>
              
            </div>
            
            {/* 보상 시스템 */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                보상 시스템
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(rewards).map(([days, reward]) => (
                  <div 
                    key={days}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 relative ${
                      currentStreak >= parseInt(days)
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg ring-2 ring-green-200'
                        : currentStreak >= parseInt(days) - 2
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* 달성 시 특별 효과 */}
                    {currentStreak >= parseInt(days) && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-2 ${
                        currentStreak >= parseInt(days)
                          ? 'text-green-600 animate-bounce'
                          : currentStreak >= parseInt(days) - 2
                          ? 'text-yellow-600'
                          : 'text-gray-400'
                      }`}>
                        {days}일
                        {currentStreak >= parseInt(days) && (
                          <span className="ml-1 text-lg">🎉</span>
                        )}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 항시 이벤트 */}
      <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Gift className="h-6 w-6 text-blue-500" />
            항시 이벤트
          </CardTitle>
          <CardDescription>
            특별한 보상을 받을 수 있는 항시 진행 이벤트입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 현지인용 특별 이벤트 */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✈️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">현지인 특별 이벤트</h3>
                  <p className="text-sm text-green-600">한국 여행의 꿈을 이루세요!</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">1등 상품</div>
                    <div className="text-sm text-gray-600">한국 왕복 비행기 티켓</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🎯</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">특별 혜택</div>
                    <div className="text-sm text-gray-600">운영자가 직접 한국 가이드</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  💡 매월 출석체크 완주자 중 추첨을 통해 선정됩니다!
                </p>
              </div>
            </div>

            {/* 한국인용 특별 이벤트 */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📚</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-800">한국인 특별 이벤트</h3>
                  <p className="text-sm text-purple-600">영어 실력 향상의 기회!</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">TOEIC</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">토익 시험 지원</div>
                    <div className="text-sm text-gray-600">시험 응시료 전액 지원</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">TOEFL</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">토플 시험 지원</div>
                    <div className="text-sm text-gray-600">시험 응시료 전액 지원</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">
                  💡 매월 출석체크 완주자 중 추첨을 통해 선정됩니다!
                </p>
              </div>
            </div>
          </div>
          
          {/* 참여 방법 안내 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <h4 className="font-bold text-blue-800 mb-2">🎯 참여 방법</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                <span className="text-blue-700">매일 출석체크 완료</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <span className="text-blue-700">한 달 완주 달성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                <span className="text-blue-700">추첨을 통한 당첨</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
