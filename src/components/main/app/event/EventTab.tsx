'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Gift, 
  Star, 
  Trophy, 
  Zap,
  CheckCircle
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
  const { t, language } = useLanguage()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [isStampAnimating, setIsStampAnimating] = useState(false)
  const [stampSize, setStampSize] = useState(1)
  const [clickedDay, setClickedDay] = useState<number | null>(null)
  const [userType, setUserType] = useState<'local' | 'korean'>('local') // 기본값: 현지인
  
  // 포인트 데이터 상태
  const [pointsData, setPointsData] = useState({
    total: 0,
    attendance: 0,
    community: 0,
    coupons: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 포인트 데이터 가져오기
  useEffect(() => {
    const fetchPointsData = async () => {
      if (!user?.id) {
        // 로그인하지 않은 사용자에게는 기본값 표시
        setPointsData({
          total: 0,
          attendance: 0,
          community: 0,
          coupons: 0
        })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 포인트 API 호출
        const response = await fetch(`/api/points?userId=${user.id}`)
        
        if (!response.ok) {
          // API 에러 시 기본값 사용
          console.warn('[EventTab] 포인트 API 호출 실패, 기본값 사용')
          setPointsData({
            total: 35,
            attendance: 10,
            community: 25,
            coupons: 0
          })
          return
        }

        const result = await response.json()

        // 포인트 데이터 설정
        const totalPoints = result.points?.total_points || 0
        setPointsData({
          total: totalPoints,
          attendance: Math.floor(totalPoints * 0.3), // 출석 포인트 추정
          community: Math.floor(totalPoints * 0.7), // 커뮤니티 포인트 추정
          coupons: Math.floor(totalPoints / 100) // 100점마다 쿠폰 1개
        })

      } catch (error) {
        console.error('[EventTab] 포인트 데이터 로드 실패:', error)
        
        // 네트워크 에러나 기타 에러 시 기본값 설정
        setPointsData({
          total: 35,
          attendance: 10,
          community: 25,
          coupons: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPointsData()
  }, [user?.id])

  // 언어에 따른 요일 배열
  const daysOfWeek = language === 'es' 
    ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    : ['일', '월', '화', '수', '목', '금', '토']

  // 사용자 타입 감지 (실제로는 사용자 프로필에서 가져올 것)
  const detectUserType = () => {
    // 임시로 브라우저 언어 설정으로 판단 (실제로는 사용자 프로필 기반)
    const browserLang = navigator.language.toLowerCase()
    const isKorean = browserLang.includes('ko') || browserLang.includes('kr')
    return isKorean ? 'korean' : 'local'
  }

  // 현재 날짜 정보
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDay = today.getDate()

  // 출석체크 보상 시스템 (연속 출석 기준)
  const getRewards = () => {
    const consecutiveDaysText = (days: number) => {
      if (language === 'es') {
        return `${days} días consecutivos`
      } else {
        return `${days}일 연속`
      }
    }

    return {
      3: { points: 20, label: consecutiveDaysText(3) },
      7: { points: 30, label: consecutiveDaysText(7) },
      10: { points: 40, label: consecutiveDaysText(10) },
      15: { points: 60, label: consecutiveDaysText(15) },
      22: { points: 70, label: consecutiveDaysText(22) },
      25: { points: 80, label: consecutiveDaysText(25) },
      30: { points: 100, label: consecutiveDaysText(30) }
    }
  }
  
  const rewards = getRewards()

  useEffect(() => {
    loadAttendanceData()
    loadPointsData()
    // 사용자가 로그인된 경우에만 쿠폰 지급 확인
    if (user?.id) {
      checkFirstTimeUser()
    }
  }, [user?.id])

  // 포인트 데이터 로드
  const loadPointsData = () => {
    // 출석체크 포인트 (자동 10점, 접속 시 자동 반영)
    const attendancePoints = 10 // 기본 접속 포인트

    // 커뮤니티 포인트 (새로운 체계)
    const communityPoints = 25 // 예시: 질문 2개(10) + 답변 2개(10) + 스토리 1개(5)

    const total = attendancePoints + communityPoints

    setPointsData({
      attendance: attendancePoints,
      community: communityPoints,
      total: total,
      coupons: Math.floor(total / 100) // 100점마다 쿠폰 1개
    })
  }

  // 최초 가입자 확인 및 쿠폰 지급 (로그인된 사용자만)
  const checkFirstTimeUser = () => {
    // 로그인된 사용자만 쿠폰 지급
    if (!user?.id) {
      return
    }
    
    const isFirstTime = !localStorage.getItem('hasReceivedWelcomeCoupon')
    if (isFirstTime) {
      // 최초 가입자에게 쿠폰 1개 지급
      localStorage.setItem('hasReceivedWelcomeCoupon', 'true')
      
      // 쿠폰 지급 알림
      alert('🎉 가입을 축하합니다!\n쿠폰 1개가 지급되었습니다!')
      
      // 포인트도 추가
      const currentPoints = parseInt(localStorage.getItem('totalPoints') || '0')
      const newPoints = currentPoints + 50 // 가입 축하 포인트
      setTotalPoints(newPoints)
      localStorage.setItem('totalPoints', newPoints.toString())
    }
  }

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
        points: 0, // 기본 출석 포인트는 0점 (연속 출석 보상만)
        stamps: 1
      }
      
      const updatedRecords = [...attendanceRecords, newRecord]
      setAttendanceRecords(updatedRecords)
      
      // localStorage에 출석체크 기록 저장
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords))
      
      // 실제 출석체크 기록을 기반으로 연속 일수 업데이트
      const actualStreak = updatedRecords.length
      setCurrentStreak(actualStreak)
      
      // 연속 출석 보상 확인 (기본 출석 포인트는 없음)
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
      
      // 보상 지급 로직 (연속 출석 보상만)
      setTotalPoints(prev => prev + reward.points)
      localStorage.setItem('totalPoints', (totalPoints + reward.points).toString())
      
      // 보상 알림
      let rewardMessage = `🎉 축하합니다! ${reward.label} 달성!\n`
      rewardMessage += `포인트 +${reward.points}점`
      
      alert(rewardMessage)
      console.log(`보상 획득! ${reward.label}: 포인트 ${reward.points}점`)
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
      {/* 특별 이벤트 */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Gift className="h-6 w-6 text-blue-500" />
            {t('eventTab.attendanceCheck.specialEvents.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 현지인용 특별 이벤트 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  <img 
                    src="/airport.jpeg" 
                    alt="Airport" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-800">{t('eventTab.attendanceCheck.specialEvents.localEvent.title')}</h3>
                  <p className="text-sm text-blue-600">{t('eventTab.attendanceCheck.specialEvents.localEvent.description')}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div className="font-semibold text-gray-800">{t('eventTab.attendanceCheck.specialEvents.localEvent.firstPrize')}</div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• 한국 왕복 항공권</div>
                    <div>• 가이드 서비스</div>
                    <div>• 숙소 제공 (2주)</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  🏆 {t('eventTab.attendanceCheck.specialEvents.localEvent.period')}
                </p>
              </div>
            </div>

            {/* 한국인용 특별 이벤트 */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-green-800 mb-2">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.title')}</h3>
                <p className="text-sm text-green-600">스페인어 실력 향상을 위한 시험 지원</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">DELE</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">DELE 시험 응시료 지원</div>
                    <div className="text-sm text-gray-600">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">SIELE</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">SIELE 시험 응시료 지원</div>
                    <div className="text-sm text-gray-600">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* 포인트 시스템 상세 정보 */}
          <div className="mt-6 space-y-6">

            {/* 보상 체계 */}
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
              <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                보상 체계
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 랭킹 보상 */}
                <div className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">누적 점수 랭킹 1위</div>
                      <div className="text-sm text-orange-600 font-bold">비행기 티켓 리워드</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    전체 사용자 중 누적 점수 1위 달성 시
                  </div>
                </div>

                {/* 쿠폰 지급 */}
                <div className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">100점 달성 시</div>
                      <div className="text-sm text-green-600 font-bold">쿠폰 1개 자동 지급</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    100점을 달성할 때마다 쿠폰이 자동으로 지급됩니다
                  </div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* 간소화된 포인트 시스템 안내 */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 font-['Inter']">포인트 규칙</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* 자동 출석체크 */}
            <div className="flex-1 p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-green-800 font-['Inter']">자동 출석체크</h4>
                  <p className="text-sm text-green-600 font-['Inter']">접속 시 자동으로 10점 지급</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 font-['Inter']">
                별도의 출석체크 버튼 없이 앱에 접속하면 자동으로 포인트가 지급됩니다.
              </div>
            </div>

            {/* 커뮤니티 활동 */}
            <div className="flex-1 p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">💬</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-blue-800 font-['Inter']">커뮤니티 활동</h4>
                  <p className="text-sm text-blue-600 font-['Inter']">하루 최대 20점 획득 가능</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600 font-['Inter']">
                <div>• 질문 작성: +5점</div>
                <div>• 답변 작성: +5점</div>
                <div>• 스토리 작성: +5점</div>
                <div>• 자유게시판: +2점</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내 포인트 섹션 */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">
                포인트 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 font-['Inter']">내 포인트</h3>
            <div className="px-3 py-1 bg-blue-500 rounded-full">
              {loading ? (
                <span className="text-lg font-bold text-white font-['Inter']">...</span>
              ) : error ? (
                <span className="text-lg font-bold text-white font-['Inter']">오류</span>
              ) : (
                <span className="text-lg font-bold text-white font-['Inter']">{pointsData.total}</span>
              )}
            </div>
          </div>


          {/* 포인트 세부 내역 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 출석 포인트 */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl">📅</span>
              </div>
              <h5 className="font-bold text-green-800 mb-3 text-lg">출석 포인트</h5>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {loading ? '...' : error ? '오류' : pointsData.attendance}
              </p>
              <p className="text-sm text-gray-600">자동 지급</p>
            </div>

            {/* 커뮤니티 포인트 */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl">💬</span>
              </div>
              <h5 className="font-bold text-blue-800 mb-3 text-lg">커뮤니티 활동</h5>
              <p className="text-2xl font-bold text-blue-600 mb-2">
                {loading ? '...' : error ? '오류' : pointsData.community}
              </p>
              <p className="text-sm text-gray-600">포인트</p>
            </div>

            {/* 쿠폰 */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h5 className="font-bold text-orange-800 mb-3 text-lg">보유 쿠폰</h5>
              <p className="text-2xl font-bold text-orange-600 mb-2">
                {loading ? '...' : error ? '오류' : `${pointsData.coupons}개`}
              </p>
              <p className="text-sm text-gray-600">100점마다 지급</p>
            </div>
          </div>

          {/* 포인트 랭킹 */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <h4 className="font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-xl">포인트 랭킹 TOP 10</span>
            </h4>
            <div className="space-y-2">
              {[
                { rank: 1, name: '김민수', points: 1250, isCurrentUser: false },
                { rank: 2, name: '이지은', points: 1180, isCurrentUser: false },
                { rank: 3, name: '박서준', points: 1100, isCurrentUser: false },
                { rank: 4, name: '최유진', points: 980, isCurrentUser: false },
                { rank: 5, name: '정호영', points: 920, isCurrentUser: false },
                { rank: 6, name: '한소영', points: 850, isCurrentUser: false },
                { rank: 7, name: '윤태현', points: 780, isCurrentUser: false },
                { rank: 8, name: '강미래', points: 720, isCurrentUser: false },
                { rank: 9, name: '조성민', points: 680, isCurrentUser: false },
                { rank: 10, name: '나현재', points: 650, isCurrentUser: true }
              ].map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    user.isCurrentUser
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.rank <= 3 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {user.rank}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-800">
                        {user.name}
                        {user.isCurrentUser && <span className="ml-2 text-blue-600 text-sm">(나)</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.points.toLocaleString()}점
                      </div>
                    </div>
                  </div>
                  {user.rank <= 3 && (
                    <div className="text-3xl">
                      {user.rank === 1 && '🥇'}
                      {user.rank === 2 && '🥈'}
                      {user.rank === 3 && '🥉'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
