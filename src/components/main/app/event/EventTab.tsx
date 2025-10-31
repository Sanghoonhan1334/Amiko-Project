'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Video,
  Users
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
// 🚀 최적화: React Query hook 추가
import { useUser } from '@/context/UserContext'
import { getUserLevel } from '@/lib/user-level'
import ZepEventCard from './ZepEventCard'

interface AttendanceRecord {
  date: string
  streak: number
  points: number
  stamps: number
}

// getRewards 함수에서 language를 파라미터로 받도록 변경
const getRewards = (language: string) => {
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

export default function EventTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, refreshUser } = useUser()
  const { t, language } = useLanguage()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  // 핵심: 항상 중앙 context의 user?.points를 신뢰하게!
  const totalPoints = user?.points
  const [isStampAnimating, setIsStampAnimating] = useState(false)
  const [stampSize, setStampSize] = useState(1)
  const [clickedDay, setClickedDay] = useState<number | null>(null)
  const [userType, setUserType] = useState<'local' | 'korean'>('local') // 기본값: 현지인
  const refreshAttempted = useRef(false);
  const [refreshTryCount, setRefreshTryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (loading || !user || !user.id) {
      const t = setTimeout(() => setShowError(true), 5000);
      return () => clearTimeout(t);
    } else {
      setShowError(false);
    }
  }, [loading, user]);
  // guard 없이 항상 컨텐츠 표시. user/points 없을 때 fallback.
  const safePoints = typeof user?.points === 'number' ? user.points : 0;
  const levelResult = getUserLevel(safePoints);
  const currentLevel = levelResult.label || '확인불가';
  const levelIcon = levelResult.level === 'sprout' ? '🌱' : levelResult.level === 'rose' ? '🌹' : '🌿';
  const rewards = getRewards(language);
  const getNextReward = () => {
    const milestones = Object.keys(rewards).map(Number).sort((a, b) => a - b)
    return milestones.find(milestone => milestone > currentStreak) || null
  }
  // points가 확정적으로 없거나 0일 때 자동 갱신 (최대 한 번만 시도)
  useEffect(() => {
    if (!refreshAttempted.current && (!loading && (totalPoints === undefined || totalPoints === 0)) && user?.id) {
      refreshUser()
      refreshAttempted.current = true;
    }
  }, [totalPoints, loading, user?.id, refreshUser]);

  // URL 쿼리 파라미터로 ACU-POINT 섹션으로 스크롤
  useEffect(() => {
    const showParam = searchParams?.get('show')
    if (showParam === 'acu-point-sunscreen') {
      // 섹션으로 스크롤
      setTimeout(() => {
        const element = document.getElementById('acu-point-event')
        if (element) {
          const headerOffset = 100
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [searchParams]);

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
  // const getRewards = () => {
  //   const consecutiveDaysText = (days: number) => {
  //     if (language === 'es') {
  //       return `${days} días consecutivos`
  //     } else {
  //       return `${days}일 연속`
  //     }
  //   }

  //   return {
  //     3: { points: 20, label: consecutiveDaysText(3) },
  //     7: { points: 30, label: consecutiveDaysText(7) },
  //     10: { points: 40, label: consecutiveDaysText(10) },
  //     15: { points: 60, label: consecutiveDaysText(15) },
  //     22: { points: 70, label: consecutiveDaysText(22) },
  //     25: { points: 80, label: consecutiveDaysText(25) },
  //     30: { points: 100, label: consecutiveDaysText(30) }
  //   }
  // }
  
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
      // setTotalPoints(newPoints) // 이제 중앙 context에서 관리
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
      // setTotalPoints(parseInt(savedPoints)) // 이제 중앙 context에서 관리
    } else {
      // setTotalPoints(0) // 이제 중앙 context에서 관리
    }
  }

  useEffect(() => {
    loadAttendanceData()
    // 🚀 최적화: loadPointsData 제거됨 (React Query로 대체)
    // 사용자가 로그인된 경우에만 쿠폰 지급 확인
    if (user?.id) {
      checkFirstTimeUser()
    }
  }, [user?.id])

  // 🚀 최적화: 포인트 데이터 로드 함수 제거 (React Query에서 처리)

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
      // setTotalPoints(prev => prev + reward.points) // 이제 중앙 context에서 관리
      // localStorage.setItem('totalPoints', (totalPoints + reward.points).toString()) // 이제 중앙 context에서 관리
      
      // 보상 알림
      let rewardMessage = `🎉 ${t('eventTab.rewardAchieved')} ${reward.label}!\n`
      rewardMessage += `${t('eventTab.pointsEarned')} +${reward.points}${t('eventTab.points')}`
      
      alert(rewardMessage)
      console.log(`${t('eventTab.rewardObtained')} ${reward.label}: ${t('eventTab.points')} ${reward.points}${t('eventTab.points')}`)
    }
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-0 md:px-8 py-0 sm:py-2 md:py-6 -mt-8" data-tutorial="event-section">
      {/* 배지/참여 기준 안내 카드 */}
      <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
          <div className="font-bold text-base sm:text-lg md:text-xl mb-2">{t('eventTab.badgeGuide.title')}</div>
          <div className="space-y-0.5">
            <div>{t('eventTab.badgeGuide.sprout')}</div>
            <div>{t('eventTab.badgeGuide.levels')}</div>
            <div>{t('eventTab.badgeGuide.rose')}</div>
            <div>{t('eventTab.badgeGuide.vip')}</div>
            <div className="mt-1">{t('eventTab.badgeGuide.requirement')}</div>
          </div>
          {/* 내 레벨보기 버튼 */}
          <div className="mt-3 sm:mt-4">
            <Button
              onClick={() => {
                // 헤더 네비게이션에 탭 변경 알림
                window.dispatchEvent(new CustomEvent('mainTabChanged', { 
                  detail: { tab: 'me' } 
                }))
                router.push('/main?tab=me#my-level')
              }}
              className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-700 text-white font-medium text-xs sm:text-sm py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('eventTab.badgeGuide.viewMyLevel')}
            </Button>
          </div>
        </div>
      </div>
      {/* 특별 이벤트 제목 */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t('eventTab.attendanceCheck.specialEvents.title')}</h2>
      </div>

      {/* 추천인 이벤트 비활성화 */}

      {/* 구분선 제거 (추천인 섹션 비활성화에 따라) */}

        {/* 데스크톱: 카드 스타일 */}
        <div className="hidden md:grid grid-cols-2 gap-4 sm:gap-6" data-tutorial="event-participation">
          {/* 현지인용 특별 이벤트 */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                <img 
                  src="/misc/airport.jpeg" 
                  alt="Airport" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.localEvent.title')}</h3>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">{t('eventTab.attendanceCheck.specialEvents.localEvent.description')}</p>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold">{t('eventTab.attendanceCheck.specialEvents.localEvent.raffle')}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('eventTab.attendanceCheck.specialEvents.localEvent.raffleDescription')}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✈</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.attendanceCheck.specialEvents.localEvent.firstPrize')}</div>
                </div>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.flightTicket')}</div>
                  <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.guideService')}</div>
                  <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.accommodation')}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-2 sm:p-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium">
                🏆 {t('eventTab.attendanceCheck.specialEvents.localEvent.period')}
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
                  src="/misc/airport.jpeg" 
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
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">{t('eventTab.attendanceCheck.specialEvents.localEvent.raffle')}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('eventTab.attendanceCheck.specialEvents.localEvent.raffleDescription')}</p>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✈</span>
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
        </div>

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
                <span className="text-white text-base">🎯</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.title')}</h3>
                <p className="text-xs text-green-600 dark:text-green-400">{t('eventTab.pointSystem.earningMethods.subtitle')}</p>
              </div>
            </div>
            
            {/* 데스크톱: 카드 그리드 */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              {/* 출석체크 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.attendanceCheck.title')}</span>
                  <Badge className="bg-green-500 text-white">{t('eventTab.pointSystem.earningMethods.attendanceCheck.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.attendanceCheck.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.attendanceCheck.limit')}</div>
              </div>
              
              {/* 댓글 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.comments.title')}</span>
                  <Badge className="bg-blue-500 text-white">{t('eventTab.pointSystem.earningMethods.comments.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.comments.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.comments.limit')}</div>
              </div>
              
              {/* 좋아요 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.likes.title')}</span>
                  <Badge className="bg-pink-500 text-white">{t('eventTab.pointSystem.earningMethods.likes.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.likes.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.likes.limit')}</div>
              </div>
              
              {/* 팬아트 업로드 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.fanartUpload.title')}</span>
                  <Badge className="bg-purple-500 text-white">{t('eventTab.pointSystem.earningMethods.fanartUpload.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.fanartUpload.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.fanartUpload.limit')}</div>
              </div>
              
              {/* 아이돌 사진 업로드 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.title')}</span>
                  <Badge className="bg-purple-500 text-white">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.limit')}</div>
              </div>
              
              {/* 투표 참여 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.pollVotes.title')}</span>
                  <Badge className="bg-indigo-500 text-white">{t('eventTab.pointSystem.earningMethods.pollVotes.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.pollVotes.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.pollVotes.limit')}</div>
              </div>
              
              {/* 뉴스 댓글 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.newsComments.title')}</span>
                  <Badge className="bg-cyan-500 text-white">{t('eventTab.pointSystem.earningMethods.newsComments.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.newsComments.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.newsComments.limit')}</div>
              </div>
              
              {/* 공유 */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.share.title')}</span>
                  <Badge className="bg-orange-500 text-white">{t('eventTab.pointSystem.earningMethods.share.points')}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.share.description')}</p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.share.limit')}</div>
              </div>
            </div>

            {/* 모바일: 카드 스타일 */}
            <div className="block md:hidden space-y-2 px-1">
              {/* 출석체크 */}
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.attendanceCheck.title')}</span>
                  <Badge className="bg-green-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.attendanceCheck.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.attendanceCheck.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.attendanceCheck.limit')}</div>
              </div>
              
              {/* 댓글 */}
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.comments.title')}</span>
                  <Badge className="bg-blue-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.comments.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.comments.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.comments.limit')}</div>
              </div>
              
              {/* 좋아요 */}
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.likes.title')}</span>
                  <Badge className="bg-pink-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.likes.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.likes.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.likes.limit')}</div>
              </div>
              
              {/* 공유 */}
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.share.title')}</span>
                  <Badge className="bg-orange-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.share.points')}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.share.description')}</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.share.limit')}</div>
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

            {/* 내 포인트 현황 보기 버튼 */}
            <div className="mt-4 flex justify-center px-2 sm:px-0">
              <Button
                onClick={() => {
                  // 헤더 네비게이션에 탭 변경 알림
                  window.dispatchEvent(new CustomEvent('mainTabChanged', { 
                    detail: { tab: 'me' } 
                  }))
                  router.push('/main?tab=me#my-points')
                }}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                {t('eventTab.pointSystem.earningMethods.viewMyPoints')}
              </Button>
            </div>
          </div>

      {/* 구분선 */}
      <div className="border-t-2 border-gray-300 my-8"></div>

      {/* ACU-POINT 선크림 이벤트 */}
      <div id="acu-point-event" className="scroll-mt-20">
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="text-xl sm:text-2xl">☀️</div>
              <CardTitle className="text-sm sm:text-base md:text-lg text-emerald-700 dark:text-emerald-300">
                {language === 'ko' ? 'ACU-POINT 선크림 오픈 이벤트' : 'Evento de Apertura ACU-POINT'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 이미지 */}
            <div className="relative w-full rounded-lg overflow-hidden max-w-2xl mx-auto">
              <img 
                src="/images/acu-point-sunscreen-detail.jpg"
                alt="ACU-POINT Sunscreen"
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>

            {/* 이벤트 설명 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎁</span>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                    {language === 'ko' ? '추첨 상품' : 'Premio del Sorteo'}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'ko' 
                      ? '10명의 당첨자에게 ACU-POINT 선크림 (약 $45 상당) 무료 증정!' 
                      : '¡10 ganadores recibirán gratis bloqueador solar ACU-POINT (equivalente a $45)!'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                    {language === 'ko' ? '참여 조건' : 'Condiciones de Participación'}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'ko' 
                      ? '레벨 1 달성한 모든 사용자 (누적 포인트 75점 이상)' 
                      : 'Todos los usuarios que han alcanzado el Nivel 1 (75 puntos acumulados o más)'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 구분선 */}
      <div className="border-t-2 border-gray-300 my-8"></div>
      
      {/* ZEP 운영자 미팅 카드 */}
      <ZepEventCard user={user} />
    </div>
  )
}

