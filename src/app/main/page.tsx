'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
// import HomeTab from '@/components/main/app/home/HomeTab' // 제거됨
import MeetTab from '@/components/main/app/meet/MeetTab'
import CommunityTab from '@/components/main/app/community/CommunityTab'
import MyTab from '@/components/main/app/me/MyTab'
import ChargingTab from '@/components/main/app/charging/ChargingTab'
import EventTab from '@/components/main/app/event/EventTab'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Video } from 'lucide-react'

function AppPageContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('community')
  const [availableAKO, setAvailableAKO] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [pointsLoading, setPointsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [communityView, setCommunityView] = useState('home')

  // 포인트 데이터 가져오기
  const fetchPoints = async () => {
    if (!user?.id) {
      setPointsLoading(false)
      return
    }

    try {
      setPointsLoading(true)
      
      // 토큰 갱신 시도
      let token = localStorage.getItem('amiko_token')
      
      // 토큰이 없거나 만료되었을 가능성이 있으면 Supabase에서 새로 가져오기
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (session && !sessionError) {
          token = session.access_token
          localStorage.setItem('amiko_token', token)
          console.log('[MAIN] 토큰 갱신 성공')
        }
      } catch (refreshError) {
        console.log('[MAIN] 토큰 갱신 실패:', refreshError)
      }
      
      // 포인트와 AKO 쿠폰을 병렬로 조회
      const baseUrl = window.location.origin
      const promises = [
        fetch(`${baseUrl}/api/points?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]
      
      // 토큰이 있을 때만 쿠폰 조회
      if (token) {
        promises.push(
          fetch(`${baseUrl}/api/coupons/check`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${encodeURIComponent(token)}`,
              'Content-Type': 'application/json'
            }
          })
        )
      }
      
      const responses = await Promise.all(promises)
      const [pointsResponse, couponsResponse] = responses
      
      if (pointsResponse.ok) {
        const data = await pointsResponse.json()
        setCurrentPoints(data.userPoints?.total_points || 0)
      } else {
        console.error('포인트 조회 실패:', pointsResponse.status)
        setCurrentPoints(0)
      }
      
      // 쿠폰 응답이 있을 때만 처리
      if (couponsResponse) {
        if (couponsResponse.ok) {
          const couponsData = await couponsResponse.json()
          setAvailableAKO(couponsData.availableCoupons || 0)
        } else {
          console.error('쿠폰 조회 실패:', couponsResponse.status)
          try {
            const errorData = await couponsResponse.json()
            console.error('쿠폰 API 에러 상세:', errorData)
          } catch (e) {
            console.error('쿠폰 API 에러 응답 파싱 실패:', e)
          }
          setAvailableAKO(0)
        }
      } else {
        // 토큰이 없어서 쿠폰 조회를 하지 않은 경우
        setAvailableAKO(0)
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error)
      console.error('오류 타입:', typeof error)
      console.error('오류 메시지:', error instanceof Error ? error.message : String(error))
      console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace')
      setAvailableAKO(0)
      setCurrentPoints(0)
    } finally {
      setPointsLoading(false)
    }
  }

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
    if (user?.id) {
      fetchPoints()
    }
    checkAdminStatus()
  }, [user?.id, user?.email])

  // URL 파라미터에서 탭 확인 및 설정
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') return
    
    const tabParam = searchParams.get('tab')
    console.log('MainPage: tabParam from URL:', tabParam)
    
    let targetTab = 'community' // 기본값을 community로 변경
    
    if (tabParam && ['meet', 'community', 'me', 'charging', 'event'].includes(tabParam)) {
      // URL 파라미터가 있으면 그것을 사용
      targetTab = tabParam
      console.log('MainPage: using URL param:', targetTab)
    } else {
      // URL 파라미터가 없으면 기본값 사용하고 URL 업데이트
      console.log('MainPage: no tab param, using default: community')
      router.replace('/main?tab=community')
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

  // 커뮤니티 탭으로 돌아올 때 communityView를 'home'으로 리셋
  useEffect(() => {
    if (activeTab === 'community') {
      setCommunityView('home')
    }
  }, [activeTab])
  
  return (
    <div className="min-h-screen body-gradient pb-20 md:pb-0">
      {/* 메인 콘텐츠 섹션 */}
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-8 lg:px-16 xl:px-24 py-0 sm:py-2 md:py-6 relative z-0">
        <div className="w-full">

          {/* 콘텐츠 */}
          <div className="space-y-2 sm:space-y-8">
            {/* 홈 탭 제거됨 - 커뮤니티로 통합 */}

            {activeTab === 'meet' && (
              <div className="hidden md:block pt-20 sm:pt-36">
                <div className="w-full">
                  <div className="card p-8 pt-12 -mt-12 sm:mt-0">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0 md:mb-0">
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img 
                          src="/화상통화(제목).png" 
                          alt="화상통화" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">{t('main.meet')}</h2>
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-sm text-blue-600 font-medium">{t('mainPage.akoExplanation')}</p>
                    </div>
                    <MeetTab />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meet' && (
              <div className="block md:hidden pt-28">
                <MeetTab />
              </div>
            )}

            {activeTab === 'community' && (
              <div className="hidden md:block pt-24 sm:pt-40">
                <div className="card px-8 pt-8 pb-0 -mt-12 sm:mt-0">
                  <div className="flex items-center justify-between mb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img 
                          src="/커뮤니티(제목).png" 
                          alt="커뮤니티" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {(() => {
                          const title = communityView === 'home' ? t('main.community') :
                                       communityView === 'freeboard' ? t('community.freeBoard') :
                                       (communityView === 'news' || communityView === 'news-detail') ? t('community.koreanNews') :
                                       communityView === 'qa' ? t('community.qa') :
                                       communityView === 'tests' ? t('tests.title') :
                                       t('main.community')
                          console.log('헤더 제목 디버그:', { communityView, title, koreanNews: t('community.koreanNews') })
                          return title
                        })()}
                      </h2>
                    </div>
                    {(communityView === 'news' || communityView === 'freeboard' || communityView === 'tests' || communityView === 'qa') && (
                      <button
                        onClick={() => {
                          setCommunityView('home')
                          // CommunityTab에 뷰 변경 알림
                          window.dispatchEvent(new CustomEvent('communityViewChanged', { detail: 'home' }))
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm font-medium">이전</span>
                      </button>
                    )}
                  </div>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      {communityView === 'home' ? t('main.communityDescription') :
                       communityView === 'freeboard' ? t('community.freeBoardDescription') :
                       communityView === 'news' ? t('community.koreanNewsDescription') :
                       communityView === 'qa' ? t('community.qaDescription') :
                       communityView === 'tests' ? t('tests.description') :
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

            {activeTab === 'me' && (
              <div className="pt-28 md:pt-8 pb-20 md:pb-8">
                {/* 웹: 섹션 카드로 감싸기 */}
                <div className="hidden md:block">
                  <div className="card px-10 py-8 pt-12 mt-8 sm:mt-16 md:mt-20 lg:mt-24 xl:mt-28">
                    {/* 일반 사용자만 헤더 섹션 표시 */}
                    {!isAdmin && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-sky-100 rounded-3xl flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-800">{t('main.me')}</h2>
                          <p className="text-sm text-gray-600">{t('main.meDescription')}</p>
                        </div>
                      </div>
                    )}
                    {/* 운영자는 대시보드만 표시 (헤더 없음) */}
                    <MyTab />
                  </div>
                </div>
                
                {/* 모바일: 섹션 카드 없이 */}
                <div className="block md:hidden">
                  {/* 일반 사용자만 헤더 섹션 표시 */}
                  {!isAdmin && (
                    <div className="flex items-center gap-3 mb-0 px-2 sm:px-4">
                      <div className="w-12 h-12 bg-sky-100 rounded-3xl flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">{t('main.me')}</h2>
                      </div>
                    </div>
                  )}
                  {/* 설명 섹션 */}
                  {!isAdmin && (
                    <div className="mb-6 px-2 sm:px-4">
                      <p className="text-gray-600">{t('main.meDescription')}</p>
                    </div>
                  )}
                  {/* 운영자는 대시보드만 표시 (헤더 없음) */}
                  <MyTab />
                </div>
              </div>
            )}


            {activeTab === 'charging' && (
              <div className="space-y-6 pt-10 sm:pt-36">
                {/* 웹: 섹션 카드로 감싸기 */}
                <div className="hidden md:block">
                  <div className="card p-8 -mt-12 sm:mt-0">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img 
                          src="/충전소(제목).png" 
                          alt="충전소" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{t('storeTab.title')}</h2>
                        <p className="text-sm text-gray-600">{t('storeTab.subtitle')}</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">{t('mainPage.akoExplanation')}</p>
                      </div>
                    </div>
                    
                    {/* 포인트 카드 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className='text-sm font-medium text-blue-800'>{t('storeTab.pointCard.title')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                          {pointsLoading ? (
                            <div className="text-xl font-bold text-blue-600 animate-pulse">...</div>
                          ) : (
                            <div className="text-xl font-bold text-blue-600">{availableAKO}</div>
                          )}
                          <div className='text-sm text-gray-600 mt-1'>{t('storeTab.pointCard.availableAKO')}</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                          {pointsLoading ? (
                            <div className="text-xl font-bold text-purple-600 animate-pulse">...</div>
                          ) : (
                            <div className="text-xl font-bold text-purple-600">{currentPoints}</div>
                          )}
                          <div className='text-sm text-gray-600 mt-1'>{t('storeTab.pointCard.currentPoints')}</div>
                        </div>
                      </div>
                    </div>
                    
                    <ChargingTab />
                  </div>
                </div>
                
                {/* 모바일: 섹션 카드 없이 */}
                <div className="block md:hidden pt-20">
                  <div className="px-2 sm:px-4 py-2 sm:py-8 pt-8 -mt-16 sm:mt-0">
                    {/* 헤더 섹션 */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-purple-100 rounded-3xl flex items-center justify-center">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{t('storeTab.title')}</h2>
                        <p className="text-sm text-gray-600">{t('storeTab.subtitle')}</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">{t('mainPage.akoExplanation')}</p>
                      </div>
                    </div>
                    
                    {/* 포인트 카드 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className='text-sm font-medium text-blue-800'>{t('storeTab.pointCard.title')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                          {pointsLoading ? (
                            <div className="text-xl font-bold text-blue-600 animate-pulse">...</div>
                          ) : (
                            <div className="text-xl font-bold text-blue-600">{availableAKO}</div>
                          )}
                          <div className='text-sm text-gray-600 mt-1'>{t('storeTab.pointCard.availableAKO')}</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                          {pointsLoading ? (
                            <div className="text-xl font-bold text-purple-600 animate-pulse">...</div>
                          ) : (
                            <div className="text-xl font-bold text-purple-600">{currentPoints}</div>
                          )}
                          <div className='text-sm text-gray-600 mt-1'>{t('storeTab.pointCard.currentPoints')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChargingTab />
                </div>
              </div>
            )}


            {activeTab === 'event' && (
              <div className="pb-20 md:pb-8 pt-16 sm:pt-36">
                {/* 웹: 섹션 카드로 감싸기 */}
                <div className="hidden md:block">
                  <div className="card px-8 py-8 -mt-12 sm:mt-0">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden">
                        <img 
                          src="/이벤트(제목).png" 
                          alt="이벤트" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{t('headerNav.event')}</h2>
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
    </div>
  )
}

export default function AppPage() {
  const { t } = useLanguage()
  
  return (
    <Suspense fallback={<div className="min-h-screen body-gradient pt-40 flex items-center justify-center">{t('buttons.loading')}</div>}>
      <AppPageContent />
    </Suspense>
  )
}
