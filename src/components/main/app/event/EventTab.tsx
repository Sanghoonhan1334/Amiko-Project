'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  Star, 
  Trophy, 
  Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
// 🚀 최적화: React Query hook 추가
import { useUser } from '@/context/UserContext'
import { getUserLevel } from '@/lib/user-level'
import { useTheme } from 'next-themes'
import ZepEventCard from './ZepEventCard'
import SeedIcon from '@/components/common/SeedIcon'

export default function EventTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, refreshUser } = useUser()
  const { t, language } = useLanguage()
  const { theme } = useTheme()
  // 핵심: 항상 중앙 context의 user?.points를 신뢰하게!
  const totalPoints = user?.points
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
  const getLevelIcon = (level: string) => {
    const iconMap: Record<string, string> = {
      sprout: 'seed', // SVG 컴포넌트로 대체
      lv1: '🌱',
      lv2: '☘️',
      lv3: '🍀',
      lv4: '🌿',
      lv5: '🌳',
      rose: '🌹',
    }
    return iconMap[level] || 'seed'
  }
  const levelIconValue = getLevelIcon(levelResult.level);
  // points가 확정적으로 없거나 0일 때 자동 갱신 (최대 한 번만 시도)
  useEffect(() => {
    if (!refreshAttempted.current && (!loading && (totalPoints === undefined || totalPoints === 0)) && user?.id) {
      refreshUser()
      refreshAttempted.current = true;
    }
  }, [totalPoints, loading, user?.id, refreshUser]);

  // URL 쿼리 파라미터로 특정 섹션으로 스크롤
  useEffect(() => {
    const showParam = searchParams?.get('show')
    if (showParam === 'acu-point-sunscreen') {
      // ACU-POINT 섹션으로 스크롤 - 숨김 처리로 인해 비활성화
      // setTimeout(() => {
      //   const element = document.getElementById('acu-point-event')
      //   if (element) {
      //     const headerOffset = 100
      //     const elementPosition = element.getBoundingClientRect().top
      //     const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      //     window.scrollTo({
      //       top: offsetPosition,
      //       behavior: 'smooth'
      //     })
      //   }
      // }, 100)
    }
  }, [searchParams]);
  
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

  useEffect(() => {
    // 사용자가 로그인된 경우에만 쿠폰 지급 확인
    if (user?.id) {
      checkFirstTimeUser()
    }
  }, [user?.id])

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-0 md:px-8 py-0 sm:py-2 md:py-6 -mt-8" data-tutorial="event-section">
      {/* 배지/참여 기준 안내 카드 */}
      <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
        <div className="text-xs sm:text-sm text-purple-900 dark:text-purple-100">
          <div className="font-bold text-base sm:text-lg md:text-xl mb-2">{t('eventTab.badgeGuide.title')}</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <SeedIcon size={16} className="inline-block" />
              <span>{t('eventTab.badgeGuide.sprout')}</span>
            </div>
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
              className="w-full text-white font-medium text-xs sm:text-sm py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-300"
              style={{ 
                background: 'linear-gradient(to right, rgb(124 58 237), rgb(139 92 246), rgb(124 58 237))',
                border: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(109 40 217), rgb(124 58 237), rgb(109 40 217))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(124 58 237), rgb(139 92 246), rgb(124 58 237))'
              }}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('eventTab.badgeGuide.viewMyLevel')}
            </Button>
          </div>
        </div>
      </div>
      {/* 특별 이벤트 제목 - 내용이 없어서 숨김 처리 */}
      {/* <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t('eventTab.attendanceCheck.specialEvents.title')}</h2>
      </div> */}

      {/* 추천인 이벤트 비활성화 */}

      {/* 구분선 제거 (추천인 섹션 비활성화에 따라) */}

        {/* 데스크톱: 카드 스타일 */}
        {/* 비행기 이벤트 숨김 처리 */}
        {/* <div className="hidden md:grid grid-cols-2 gap-4 sm:gap-6" data-tutorial="event-participation">
          <div className="p-4 sm:p-6 border border-blue-200 dark:border-gray-600 rounded-xl" style={{ background: theme === 'dark' ? 'linear-gradient(to bottom right, rgb(55 65 81), rgb(55 65 81))' : 'linear-gradient(to bottom right, rgb(239 246 255), rgb(219 234 254))' }}>
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
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
        </div> */}

        {/* 모바일: 카드 스타일 */}
        {/* 비행기 이벤트 숨김 처리 */}
        {/* <div className="block md:hidden space-y-4 px-1" data-tutorial="event-participation">
          <div className="border border-blue-200 dark:border-gray-600 rounded-xl p-2 shadow-sm" style={{ background: theme === 'dark' ? 'linear-gradient(to bottom right, rgb(55 65 81), rgb(55 65 81))' : 'linear-gradient(to bottom right, rgb(239 246 255), rgb(219 234 254))' }}>
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
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
        </div> */}

      {/* 구분선 - ACU-POINT 이벤트가 숨겨져서 제거 */}
      {/* <div className="border-t-2 border-gray-300 my-8"></div> */}
      
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
                <h3 className="text-sm font-bold text-green-800 dark:text-gray-200 point-system-title">{t('eventTab.pointSystem.earningMethods.title')}</h3>
                <p className="text-xs text-green-600 dark:text-green-400 point-system-subtitle">{t('eventTab.pointSystem.earningMethods.subtitle')}</p>
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
            
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg mx-2 sm:mx-0">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span className='font-medium text-blue-800 dark:text-blue-300 text-sm'>{t('eventTab.pointSystem.earningMethods.warning.title')}</span>
              </div>
              <p className='text-xs text-blue-700 dark:text-blue-300 mt-1'>
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
                className="w-full text-white font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300"
                style={{ 
                  background: 'linear-gradient(to right, rgb(34 197 94), rgb(13 148 136))',
                  border: 'none',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(22 163 74), rgb(15 118 110))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(34 197 94), rgb(13 148 136))'
                }}
              >
                <Trophy className="w-4 h-4 mr-2" />
                {t('eventTab.pointSystem.earningMethods.viewMyPoints')}
              </Button>
            </div>
          </div>

      {/* 구분선 - ACU-POINT 이벤트가 숨겨져서 제거 */}
      {/* <div className="border-t-2 border-gray-300 my-8"></div> */}

      {/* ACU-POINT 선크림 이벤트 - 숨김 처리 */}
      {/* <div id="acu-point-event" className="scroll-mt-20">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="text-xl sm:text-2xl">☀️</div>
              <CardTitle className="text-sm sm:text-base md:text-lg text-purple-700 dark:text-purple-300">
                {language === 'ko' ? 'ACU-POINT 선크림 오픈 이벤트' : 'Evento de Apertura ACU-POINT'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full rounded-lg overflow-hidden max-w-2xl mx-auto">
              <img 
                src="/images/acu-point-sunscreen-detail.jpg"
                alt="ACU-POINT Sunscreen"
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎁</span>
                <div className="flex-1">
                  <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-1">
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
                  <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-1">
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
      </div> */}

      {/* 구분선 */}
      <div className="border-t-2 border-gray-300 my-8"></div>
      
      {/* ZEP 운영자 미팅 카드 */}
      <ZepEventCard user={user} />
    </div>
  )
}

