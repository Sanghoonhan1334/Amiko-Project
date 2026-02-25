'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
// 🚀 최적화: 컴포넌트 지연 로딩으로 초기 번들 크기 감소
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/lib/translations'
import { useAuth } from '@/context/AuthContext'
import { Video, Music } from 'lucide-react'
// 🚀 최적화: React Query hook 추가
import { useMainPageData } from '@/hooks/useMainPageData'
import { appEngagementEvents, marketingEvents } from '@/lib/analytics'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { Skeleton } from '@/components/ui/skeleton'
import PushNotificationConsentModal from '@/components/notifications/PushNotificationConsentModal'

const HomeTab = dynamic(() => import('@/components/main/app/home/HomeTab'), {
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  )
})

// 지연 로딩 컴포넌트들
const MeetTab = dynamic(() => import('@/components/main/app/meet/MeetTab'), {
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  )
})
const CommunityTab = dynamic(() => import('@/components/main/app/community/CommunityTab').catch((error) => {
  console.error('[CommunityTab] 로드 오류:', error)
  return { default: () => <div className="p-4 text-red-500">커뮤니티 탭을 로드할 수 없습니다.</div> }
}), {
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  ),
  ssr: false
})
const MyTab = dynamic(() => import('@/components/main/app/me/MyTab'), {
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-6 w-1/2 mx-auto" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
})
const EventTab = dynamic(() => import('@/components/main/app/event/EventTab'), {
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
})
const DanceTab = dynamic(() => import('@/components/main/app/dance/DanceTab'), {
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    </div>
  )
})

function AppPageContent() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('home')
  const [isAdmin, setIsAdmin] = useState(false)
  const [communityView, setCommunityView] = useState('home')

  // 🚀 최적화: React Query로 포인트 및 쿠폰 데이터 관리
  const {
    data: mainData,
    isLoading: pointsLoading,
    refetch: refetchMainData
  } = useMainPageData()

  // React Query에서 가져온 데이터 분리
  const currentPoints = mainData?.currentPoints || 0
  const availableAKO = mainData?.availableAKO || 0

  // 🚀 최적화: fetchPoints 함수 제거됨 (React Query로 대체)

  // 운영자 상태 확인 함수
  const checkAdminStatus = async () => {
    if (!user?.id && !user?.email) {
      setIsAdmin(false)
      return
    }

    try {
      const baseUrl = window.location.origin
      const params = new URLSearchParams()
      if (user?.id) params.append('userId', user.id)
      if (user?.email) params.append('email', user.email)

      const response = await fetch(`${baseUrl}/api/admin/check?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } else {
        console.error('[MAIN] 관리자 상태 확인 실패:', response.status, response.statusText)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('[MAIN] 관리자 상태 확인 오류:', error)
      console.error('오류 타입:', typeof error)
      console.error('오류 메시지:', error instanceof Error ? error.message : String(error))
      setIsAdmin(false)
    }
  }

  // 사용자 정보가 있을 때 포인트 데이터 로드 및 운영자 상태 확인
  useEffect(() => {
    // 🚀 최적화: fetchPoints 호출 제거됨 (React Query에서 자동 처리)
    checkAdminStatus()
  }, [user?.id, user?.email])


  // URL 파라미터에서 탭 확인 및 설정
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') return

    const tabParam = searchParams.get('tab')
    console.log('MainPage: tabParam from URL:', tabParam)

    let targetTab = 'home' // 기본값을 home으로 변경

    if (tabParam && ['home', 'meet', 'community', 'me', 'dance', 'event'].includes(tabParam)) {
      // payments를 me로 리다이렉트 (하위 호환성)
      if (tabParam === 'payments') {
        router.replace('/main?tab=me')
        return
      }
      // URL 파라미터가 있으면 그것을 사용
      targetTab = tabParam
      console.log('MainPage: using URL param:', targetTab)
    } else {
      // URL 파라미터가 없으면 기본값 사용하고 URL 업데이트
      console.log('MainPage: no tab param, using default: home')
      router.replace('/main?tab=home')
      return // URL 업데이트 후 다시 실행될 것이므로 여기서 종료
    }

    // 탭 설정
    setActiveTab(targetTab)
    ;(window as any).currentMainTab = targetTab
  }, [searchParams, router])



  // 헤더에서 탭 변경 이벤트 감지
  useEffect(() => {
    const handleMainTabChanged = (event: CustomEvent) => {
      console.log('MainPage: received mainTabChanged event:', event.detail.tab)
      setActiveTab(event.detail.tab)
    }

    window.addEventListener('mainTabChanged', handleMainTabChanged as EventListener)
    return () => window.removeEventListener('mainTabChanged', handleMainTabChanged as EventListener)
  }, [])

  // 전역 함수로 탭 변경 가능하도록 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).changeMainTab = (tab: string) => {
        console.log('MainPage: changeMainTab called with:', tab)
        setActiveTab(tab)
      }
    }
  }, [])

  // 커뮤니티 탭으로 돌아올 때 communityView 설정 (URL 파라미터 확인)
  useEffect(() => {
    if (activeTab === 'community') {
      const cTab = searchParams.get('cTab')
      // cTab 파라미터가 있으면 그것을 사용, 없으면 'home'
      if (cTab && ['news', 'tests', 'events'].includes(cTab)) {
        setCommunityView(cTab)
      } else {
        // cTab이 없거나 'home'이면 'home'으로 설정
        setCommunityView('home')
      }
    }
  }, [activeTab, searchParams])

  // 재방문 사용자 감지
  useEffect(() => {
    if (typeof window === 'undefined') return

    const lastVisit = localStorage.getItem('amiko_last_visit')
    const now = Date.now()

    if (lastVisit) {
      const timeSinceLastVisit = now - parseInt(lastVisit, 10)
      // 24시간 이상 경과한 경우 재방문으로 간주
      if (timeSinceLastVisit > 24 * 60 * 60 * 1000) {
        marketingEvents.returningUsers()
      }
    }

    // 현재 방문 시간 저장
    localStorage.setItem('amiko_last_visit', now.toString())
  }, [])

  // 메인 앱 DAU 퍼널: 탭별 방문 이벤트 추적
  useEffect(() => {
    if (!activeTab) return

    switch (activeTab) {
      case 'home':
        appEngagementEvents.visitHomeTab()
        break
      case 'meet':
        appEngagementEvents.visitMeetTab()
        break
      case 'community':
        appEngagementEvents.visitCommunityTab()
        break
      case 'event':
        appEngagementEvents.visitEventTab()
        break
      case 'dance':
        // Dance tab analytics can be added here if needed
        break
      case 'payments':
        // Add payments analytics if needed
        break
      case 'charging':
        appEngagementEvents.visitChargingTab()
        break
      case 'me':
        appEngagementEvents.visitProfileTab()
        break
    }
  }, [activeTab])

  // 레벨 또는 포인트 섹션으로 스크롤 처리
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeTab !== 'me') return

    const hash = window.location.hash

    if (hash === '#my-level' || hash === '#my-points') {
      const targetId = hash.substring(1) // # 제거

      // 탭이 변경되고 컴포넌트가 렌더링된 후 스크롤
      const scrollToTarget = () => {
        const element = document.getElementById(targetId)
        if (element) {
          // 요소 위치 계산
          const elementTop = element.offsetTop
          const offset = 80 // 헤더 높이 고려

          // scrollIntoView와 window.scrollTo 모두 시도
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // iOS Safari를 위한 추가 스크롤 시도
          if (window.innerWidth < 768) {
            setTimeout(() => {
              window.scrollTo({ top: elementTop - offset, behavior: 'smooth' })
            }, 100)
          } else {
            window.scrollTo({ top: elementTop - offset, behavior: 'smooth' })
          }
          return true
        }
        return false
      }

      // 모바일에서는 더 긴 딜레이와 더 많은 시도
      const isMobile = window.innerWidth < 768
      const delays = isMobile ? [1200, 1800, 2500, 3000, 3500] : [800, 1200, 1600, 2000]

      delays.forEach((delay) => {
        setTimeout(() => {
          scrollToTarget()
        }, delay)
      })
    }
  }, [activeTab])

  return (
    <div className="min-h-screen body-gradient bg-white dark:bg-transparent pb-20 md:pb-0">
      {/* 메인 콘텐츠 섹션 */}
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-8 lg:px-16 xl:px-24 py-0 sm:py-2 md:py-6 relative z-0">
        <div className="w-full">

          {/* 콘텐츠 */}
          <div className="space-y-2 sm:space-y-8">
            {activeTab === 'home' && (
              <div className="pt-12 md:pt-20">
                <HomeTab />
              </div>
            )}

            {activeTab === 'meet' && (
              <div className="hidden md:block pt-20 sm:pt-36">
                <div className="w-full">
                  <div className="card p-8 pt-12 -mt-12 sm:mt-0">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0 md:mb-0">
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img
                          src="/misc/video-call-title.png"
                          alt="화상통화"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('main.meet')}</h2>
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('mainPage.akoExplanation')}</p>
                    </div>
                    <MeetTab />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meet' && (
              <div className="block md:hidden pt-24 pb-20">
                <div className="px-1">
                  <MeetTab />
                </div>
              </div>
            )}

            {activeTab === 'community' && (
              <div className="hidden md:block pt-24 sm:pt-40">
                  <div className="card dark:bg-gray-800 dark:border-gray-700 px-8 pt-8 pb-0 -mt-12 sm:mt-0">
                  <div className="flex items-center justify-between mb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img
                          src="/misc/community-title.png"
                          alt="커뮤니티"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {(() => {
                          const title = communityView === 'home' ? t('main.community') :
                                       communityView === 'freeboard' ? t('community.freeBoard') :
                                       (communityView === 'news' || communityView === 'news-detail') ? t('community.koreanNews') :
                                       communityView === 'tests' ? t('tests.title') :
                                       t('main.community')
                          console.log('헤더 제목 디버그:', { communityView, title, koreanNews: t('community.koreanNews') })
                          return title
                        })()}
                      </h2>
                    </div>
                    {(communityView === 'news' || communityView === 'freeboard' || communityView === 'tests' || communityView === 'events') && (
                      <button
                        onClick={() => {
                          setCommunityView('home')
                          // CommunityTab에 뷰 변경 알림
                          window.dispatchEvent(new CustomEvent('communityViewChanged', { detail: 'home' }))
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm font-medium">이전</span>
                      </button>
                    )}
                  </div>
                  <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      {communityView === 'home' ? t('main.communityDescription') :
                       communityView === 'freeboard' ? t('community.freeBoardDescription') :
                       communityView === 'news' ? t('community.koreanNewsDescription') :
                       communityView === 'tests' ? t('tests.description') :
                       communityView === 'events' ? t('community.eventsDesc') :
                       t('main.communityDescription')}
                    </p>
                  </div>
                  <CommunityTab onViewChange={setCommunityView} />
                </div>
              </div>
            )}

            {activeTab === 'community' && (
              <div className="block md:hidden pt-20">
                <CommunityTab onViewChange={setCommunityView} />
              </div>
            )}

            {activeTab === 'dance' && (
              <div className="pb-4 md:pb-8 pt-16 sm:pt-36">
                {/* 웹: 섹션 카드로 감싸기 */}
                <div className="hidden md:block">
                  <div className="card dark:bg-gray-800 dark:border-gray-700 px-8 py-8 -mt-12 sm:mt-0 relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden bg-purple-100 dark:bg-purple-900/30">
                        <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {language === 'ko' ? '댄스' : 'Dance'}
                        </h2>
                      </div>
                    </div>
                    <DanceTab />
                  </div>
                </div>

                {/* 모바일: 섹션 카드 없이 */}
                <div className="block md:hidden pt-0">
                  <div className="px-0 pt-0">
                    <DanceTab />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'me' && (
              <div className="pt-28 md:pt-8 pb-20 md:pb-8">
                {/* 웹: 섹션 카드로 감싸기 */}
                <div className="hidden md:block">
                  <div className="card dark:bg-gray-800 dark:border-gray-700 px-10 py-8 pt-12 mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-28">
                    {/* 일반 사용자만 헤더 섹션 표시 - 제거됨 */}
                    {/* 운영자는 대시보드만 표시 (헤더 없음) */}
                    <MyTab />
                  </div>
                </div>

                {/* 모바일: 섹션 카드 없이 */}
                <div className="block md:hidden">
                  {/* 일반 사용자만 헤더 섹션 표시 - 제거됨 */}
                  {/* 운영자는 대시보드만 표시 (헤더 없음) */}
                  <MyTab />
                </div>
              </div>
            )}

            {activeTab === 'event' && (
              <div className="pb-20 md:pb-8 pt-16 sm:pt-36">
                {/* 웹: 섹션 카드로 감싸기 */}
                <div className="hidden md:block">
                  <div className="card dark:bg-gray-800 dark:border-gray-700 px-8 py-8 -mt-12 sm:mt-0">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img
                          src="/misc/event-title.png"
                          alt="이벤트"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('headerNav.event')}</h2>
                      </div>
                    </div>
                    <div>
                      <EventTab />
                    </div>
                  </div>
                </div>

                {/* 모바일: 섹션 카드 없이 */}
                <div className="block md:hidden pt-12">
                  <div className="px-2 sm:px-4 pt-6">
                    <EventTab />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 하단 탭 네비게이션 */}
      <BottomTabNavigation />

      {/* 데이터 로딩 오버레이 */}
      <LoadingOverlay
        isVisible={pointsLoading}
        message={pointsLoading ? t('common.loadingData') : ''}
      />

      {/* 푸시 알림 동의 모달 */}
      <PushNotificationConsentModal />
    </div>
  )
}

export default function AppPage() {
  const { t } = useLanguage()

  return (
    <Suspense fallback={
      <div className="min-h-screen body-gradient bg-white dark:bg-transparent">
        {/* 헤더 스켈레톤 */}
        <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

        {/* 메인 콘텐츠 스켈레톤 */}
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* 상단 탭 스켈레톤 */}
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-20 rounded-lg" />
              ))}
            </div>

            {/* 메인 콘텐츠 영역 스켈레톤 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <AppPageContent />
    </Suspense>
  )
}
