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
    available: 0,
    community: 0,
    videoCall: 0
  })
  const [rankingData, setRankingData] = useState({
    ranking: [],
    userRank: null,
    totalUsers: 0
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
          available: 0,
          community: 0,
          videoCall: 0
        })
        setRankingData({
          ranking: [],
          userRank: null,
          totalUsers: 0
        })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 포인트 및 랭킹 데이터 병렬 호출
        const [pointsResponse, rankingResponse] = await Promise.all([
          fetch(`/api/points?userId=${user.id}`),
          fetch(`/api/points/ranking?userId=${user.id}&limit=10`)
        ])
        
        if (!pointsResponse.ok || !rankingResponse.ok) {
          // API 에러 시 기본값 사용
          console.warn('[EventTab] 포인트/랭킹 API 호출 실패, 기본값 사용')
          setPointsData({
            total: 0,
            available: 0,
            community: 0,
            videoCall: 0
          })
          setRankingData({
            ranking: [],
            userRank: null,
            totalUsers: 0
          })
          return
        }

        const [pointsResult, rankingResult] = await Promise.all([
          pointsResponse.json(),
          rankingResponse.json()
        ])

        // 포인트 데이터 설정
        const userPoints = pointsResult.userPoints
        setPointsData({
          total: userPoints?.total_points || 0,
          available: userPoints?.available_points || 0,
          community: 0, // 히스토리에서 계산
          videoCall: 0  // 히스토리에서 계산
        })

        // 랭킹 데이터 설정
        setRankingData({
          ranking: rankingResult.ranking || [],
          userRank: rankingResult.userRank,
          totalUsers: rankingResult.totalUsers || 0
        })

      } catch (error) {
        console.error('[EventTab] 포인트 데이터 로드 실패:', error)
        
        // 네트워크 에러나 기타 에러 시 기본값 설정
        setPointsData({
          total: 0,
          available: 0,
          community: 0,
          videoCall: 0
        })
        setRankingData({
          ranking: [],
          userRank: null,
          totalUsers: 0
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

  // 포인트 데이터 로드 (새로운 규칙)
  const loadPointsData = () => {
    // 커뮤니티 활동 포인트 (하루 최대 +20점)
    const communityPoints = 15 // 예시: 질문 1개(5) + 답변 1개(5) + 스토리 1개(5)

    // 영상채팅 포인트 (1회 완료 시 +40점)
    const videoCallPoints = 40 // 영상채팅 완료 시

    const total = communityPoints + videoCallPoints

    setPointsData({
      attendance: 0, // 출석체크 포인트 제거
      community: communityPoints,
      videoCall: videoCallPoints,
      total: total,
      coupons: 0 // 포인트로 쿠폰 구매 불가
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* 특별 이벤트 */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            {t('eventTab.attendanceCheck.specialEvents.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* 현지인용 특별 이벤트 */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  <img 
                    src="/airport.jpeg" 
                    alt="Airport" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-800">{t('eventTab.attendanceCheck.specialEvents.localEvent.title')}</h3>
                  <p className="text-xs sm:text-sm text-blue-600">{t('eventTab.attendanceCheck.specialEvents.localEvent.description')}</p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div className="font-semibold text-gray-800">{t('eventTab.attendanceCheck.specialEvents.localEvent.firstPrize')}</div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.flightTicket')}</div>
                    <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.guideService')}</div>
                    <div>• {t('eventTab.attendanceCheck.specialEvents.localEvent.accommodation')}</div>
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
            <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.title')}</h3>
                <p className="text-xs sm:text-sm text-green-600">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.description')}</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">DELE</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.dele')}</div>
                    <div className="text-sm text-gray-600">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">FLEX</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.flex')}</div>
                    <div className="text-sm text-gray-600">{t('eventTab.attendanceCheck.specialEvents.koreanEvent.examFeeSupport')}</div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* 포인트 시스템 상세 정보 */}
          <div className="mt-6 space-y-6">


          </div>
        </CardContent>
      </Card>

      {/* 포인트 랭킹 */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            {t('eventTab.pointRanking.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('eventTab.pointRanking.loading')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 내 랭킹 */}
              {rankingData.userRank && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {rankingData.userRank.position}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{t('eventTab.pointRanking.myRank')}</h4>
                        <p className="text-sm text-gray-600">
                          {t('eventTab.pointRanking.totalPoints')} {rankingData.userRank.total_points}{t('eventTab.points')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {rankingData.userRank.position}{t('eventTab.pointRanking.rank')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('eventTab.pointRanking.outOf')} {rankingData.totalUsers}{t('eventTab.pointRanking.users')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 상위 랭킹 */}
              {rankingData.ranking.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 mb-3">🏆 {t('eventTab.pointRanking.topRanking')}</h4>
                  {rankingData.ranking.slice(0, 5).map((user: any, index: number) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {user.userName}
                          </div>
                          <div className="text-sm text-gray-500">
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('eventTab.pointRanking.noData')}</p>
                  <p className="text-sm">{t('eventTab.pointRanking.startActivity')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 간소화된 포인트 시스템 안내 */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 font-['Inter']">{t('eventTab.pointRules.title')}</h3>
          </div>

          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">{t('eventTab.pointRules.subtitle')}</h4>
            <p className="text-gray-600 mb-4">
              {t('eventTab.pointRules.description')}
            </p>
            <Button 
              onClick={() => {
                // 상점 탭으로 이동
                if (typeof window !== 'undefined') {
                  (window as any).changeMainTab?.('store')
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {t('eventTab.pointRules.goToStore')}
            </Button>
          </div>

        </CardContent>
      </Card>


    </div>
  )
}
