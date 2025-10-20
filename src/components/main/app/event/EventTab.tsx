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
  CheckCircle,
  Video
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
// 🚀 최적화: React Query hook 추가
import { useEventPoints } from '@/hooks/useEventPoints'

interface AttendanceRecord {
  date: string
  streak: number
  points: number
  stamps: number
}

export default function EventTab() {
  const { user, token } = useAuth()
  const { t, language } = useLanguage()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [isStampAnimating, setIsStampAnimating] = useState(false)
  const [stampSize, setStampSize] = useState(1)
  const [clickedDay, setClickedDay] = useState<number | null>(null)
  const [userType, setUserType] = useState<'local' | 'korean'>('local') // 기본값: 현지인
  
  
  // 🚀 최적화: React Query로 포인트 및 랭킹 데이터 관리
  const { 
    data: eventData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useEventPoints()
  
  // React Query에서 가져온 데이터 분리
  const pointsData = eventData?.pointsData || {
    total: 0,
    available: 0,
    community: 0,
    videoCall: 0
  }
  
  const rankingData = eventData?.rankingData || {
    ranking: [],
    userRank: null,
    totalUsers: 0
  }
  
  const error = queryError?.message || null

  // 🚀 최적화: 복잡한 API 호출 로직 제거 (React Query에서 처리)
  
  // 포인트 데이터가 변경될 때 totalPoints 업데이트
  useEffect(() => {
    setTotalPoints(pointsData.total)
  }, [pointsData.total])

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
    // 🚀 최적화: loadPointsData 제거됨 (React Query로 대체)
    // 사용자가 로그인된 경우에만 쿠폰 지급 확인
    if (user?.id) {
      checkFirstTimeUser()
    }
  }, [user?.id])

  // 🚀 최적화: 포인트 데이터 로드 함수 제거 (React Query에서 처리)

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
      
      // 쿠폰 지급 알림 제거 (사용자 요청)
      
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
      let rewardMessage = `🎉 ${t('eventTab.rewardAchieved')} ${reward.label}!\n`
      rewardMessage += `${t('eventTab.pointsEarned')} +${reward.points}${t('eventTab.points')}`
      
      alert(rewardMessage)
      console.log(`${t('eventTab.rewardObtained')} ${reward.label}: ${t('eventTab.points')} ${reward.points}${t('eventTab.points')}`)
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
      ['🍯', 'P'], // 2일차
      ['🌹', '💎'], // 3일차
      ['🥩', '⭐'], // 4일차
      ['🍇', 'P'], // 5일차
      ['🐒', '💎'], // 6일차
      ['💎', '💎', '💎'], // 7일차
      ['📜', '⭐'], // 8일차
      ['🍩', 'P'], // 9일차
      ['🌹', '💎'], // 10일차
      ['🥩', '⭐'], // 11일차
      ['🍇', 'P'], // 12일차
      ['🐒', '🐒'], // 13일차
      ['💎', '💎', '💎'], // 14일차
      ['📜', '⭐'], // 15일차
      ['🍩', 'P'], // 16일차
      ['🌹', '💎'], // 17일차
      ['🥩', '⭐'], // 18일차
      ['🍇', 'P'], // 19일차
      ['🐒', '🐒'], // 20일차
      ['🎒', '💎'], // 21일차
      ['📜', '⭐'], // 22일차
      ['🍩', 'P'], // 23일차
      ['🌹', '💎'], // 24일차
      ['🥩', '⭐'], // 25일차
      ['🍇', 'P'], // 26일차
      ['🛡️', '💎'], // 27일차
      ['📜', '⭐'], // 28일차
    ]
    
    return rewardPatterns[(dayNumber - 1) % rewardPatterns.length] || ['⭐']
  }

  const nextReward = getNextReward()


  return (
    <div className="space-y-6 max-w-6xl mx-auto px-0 md:px-8 py-0 sm:py-2 md:py-6 -mt-8" data-tutorial="event-section">
      {/* 특별 이벤트 제목 */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t('eventTab.attendanceCheck.specialEvents.title')}</h2>
      </div>

        {/* 데스크톱: 카드 스타일 */}
        <div className="hidden md:grid grid-cols-2 gap-4 sm:gap-6" data-tutorial="event-participation">
          {/* 현지인용 특별 이벤트 */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                <img 
                  src="/airport.jpeg" 
                  alt="Airport" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.localEvent.title')}</h3>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">{t('eventTab.attendanceCheck.specialEvents.localEvent.description')}</p>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.localEvent.firstPrize')}</div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.flightTicket')}</div>
                  <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.guideService')}</div>
                  <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.accommodation')}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                🏆 {t('eventTab.attendanceCheck.specialEvents.localEvent.period')}
              </p>
            </div>
          </div>

          {/* 한국인용 특별 이벤트 */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-700 border border-green-200 dark:border-gray-600 rounded-xl">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-gray-200 mb-2">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.title')}</h3>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.description')}</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">DELE</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.dele')}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FLEX</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.flex')}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                🏆 {t('eventTab.attendanceCheck.specialEvents.koreanEvent.period')}
              </p>
            </div>
          </div>
        </div>

        {/* 모바일: 카드 스타일 */}
        <div className="block md:hidden space-y-4 px-1" data-tutorial="event-participation">
          {/* 현지인용 특별 이벤트 카드 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl p-2 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                <img 
                  src="/airport.jpeg" 
                  alt="Airport" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.localEvent.title')}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">{t('eventTab.attendanceCheck.specialEvents.localEvent.description')}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-2 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.attendanceCheck.specialEvents.localEvent.firstPrize')}</div>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.flightTicket')}</div>
                <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.guideService')}</div>
                <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.accommodation')}</div>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg p-2">
              <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                🏆 {t('eventTab.attendanceCheck.specialEvents.localEvent.period')}
              </p>
            </div>
          </div>
          
          {/* 한국인용 특별 이벤트 카드 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-700 border border-green-200 dark:border-gray-600 rounded-xl p-2 shadow-sm">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-green-800 dark:text-gray-200 mb-1">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.title')}</h3>
              <p className="text-xs text-green-600 dark:text-green-400">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.description')}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">DELE</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.dele')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FLEX</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.flex')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg">
              <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                🏆 {t('eventTab.attendanceCheck.specialEvents.koreanEvent.period')}
              </p>
            </div>
          </div>
        </div>

      {/* 구분선 */}
      <div className="border-t-2 border-gray-300 my-8"></div>
      
      {/* 포인트 랭킹 제목 */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t('eventTab.pointRanking.title')}</h2>
      </div>

        {/* 랭킹 내용 */}
        {loading ? (
          <div className="text-center py-8 md:bg-white dark:md:bg-gray-800 md:border md:border-gray-200 dark:md:border-gray-600 md:rounded-lg md:shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('eventTab.pointRanking.loading')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 내 랭킹 */}
            {rankingData.userRank && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {rankingData.userRank.position}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">{t('eventTab.pointRanking.myRank')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('eventTab.pointRanking.totalPoints')} {rankingData.userRank.total_points}{t('eventTab.points')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {rankingData.userRank.position}{t('eventTab.pointRanking.rank')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('eventTab.pointRanking.outOf')} {rankingData.totalUsers}{t('eventTab.pointRanking.users')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 상위 랭킹 */}
            {rankingData.ranking.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm p-4" data-tutorial="leaderboard">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">🏆 {t('eventTab.pointRanking.topRanking')}</h4>
                <div className="space-y-2">
                  {rankingData.ranking.slice(0, 5).map((user: any, index: number) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {user.userName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.totalPoints}{t('eventTab.points')}
                          </div>
                        </div>
                      </div>
                      {index < 3 && (
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('eventTab.pointRanking.noData')}</p>
                <p className="text-sm">{t('eventTab.pointRanking.startActivity')}</p>
              </div>
            )}
          </div>
        )}

      {/* 구분선 */}
      <div className="border-t-2 border-gray-300 my-8"></div>
      
      {/* 포인트 시스템 제목 */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t('eventTab.pointSystem.title')}</h2>
      </div>
          
          {/* 포인트 획득 방법 */}
          <div className="p-2 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-700 border border-green-200 dark:border-gray-600 rounded-xl shadow-sm" data-tutorial="point-system">
            <div className="flex items-center gap-2 mb-3 px-2 sm:px-0">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🎯</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.title')}</h3>
                <p className="text-xs text-green-600 dark:text-green-400">{t('eventTab.pointSystem.earningMethods.subtitle')}</p>
              </div>
            </div>
            
            {/* 데스크톱: 카드 그리드 */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.questionWriting.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.questionWriting.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.questionWriting.limit')}</div>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.answerWriting.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.answerWriting.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.answerWriting.limit')}</div>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.storyUpload.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.storyUpload.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.storyUpload.limit')}</div>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.receiveLikes.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.receiveLikes.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.receiveLikes.limit')}</div>
              </div>
            </div>

            {/* 모바일: 카드 스타일 */}
            <div className="block md:hidden space-y-2 px-1">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.questionWriting.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.questionWriting.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.questionWriting.limit')}</div>
              </div>
              
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.answerWriting.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.answerWriting.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.answerWriting.limit')}</div>
              </div>
              
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.storyUpload.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.storyUpload.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.storyUpload.limit')}</div>
              </div>
              
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.receiveLikes.title')}</span>
                  <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">{t('eventTab.pointSystem.earningMethods.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.receiveLikes.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.receiveLikes.limit')}</div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mx-2 sm:mx-0">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span className='font-medium text-yellow-800 dark:text-yellow-300 text-sm'>{t('eventTab.pointSystem.earningMethods.warning.title')}</span>
              </div>
              <p className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                {t('eventTab.pointSystem.earningMethods.warning.message')}
              </p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t-2 border-gray-300 my-8"></div>
          
          {/* 포인트 사용처 */}
          <div className="p-2 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-700 border border-purple-200 dark:border-gray-600 rounded-xl shadow-sm" data-tutorial="point-rewards">
            <div className="flex items-center gap-2 mb-3 px-2 sm:px-0">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🏆</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-800 dark:text-gray-200">{t('eventTab.pointSystem.usage.title')}</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400">{t('eventTab.pointSystem.usage.subtitle')}</p>
              </div>
            </div>
            
            {/* 데스크톱: 카드 스타일 */}
            <div className="hidden md:block space-y-4">
              {/* 현재 사용처 - 비행기 티켓 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.usage.current.title')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.usage.current.description')}</p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">
                    🎯 {t('eventTab.pointSystem.usage.current.detail')}
                  </p>
                </div>
              </div>
              
              {/* 향후 사용처 - 포인트 상점 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 opacity-75">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.usage.upcoming.title')}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{t('eventTab.pointSystem.usage.upcoming.description')}</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    🚧 {t('eventTab.pointSystem.usage.upcoming.detail')}
                  </p>
                </div>
              </div>
            </div>

            {/* 모바일: 카드 스타일 */}
            <div className="block md:hidden space-y-2 px-1">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.usage.current.title')}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.usage.current.description')}</p>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-1 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">🎯 {t('eventTab.pointSystem.usage.current.detail')}</div>
                </div>
              </div>
              
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm opacity-75">
                <div className="mb-1">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 text-sm">{t('eventTab.pointSystem.usage.upcoming.title')}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">{t('eventTab.pointSystem.usage.upcoming.description')}</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-1 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400">🚧 {t('eventTab.pointSystem.usage.upcoming.detail')}</div>
                </div>
              </div>
            </div>
          </div>

    </div>
  )
}
