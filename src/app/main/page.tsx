'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import HomeTab from '@/components/main/app/home/HomeTab'
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
  
  const [activeTab, setActiveTab] = useState('home')
  const [availableAKO, setAvailableAKO] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [pointsLoading, setPointsLoading] = useState(true)

  // 포인트 데이터 가져오기
  const fetchPoints = async () => {
    if (!user?.id) {
      setPointsLoading(false)
      return
    }

    try {
      setPointsLoading(true)
      const response = await fetch(`/api/points?userId=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        // AKO는 쿠폰 개수이므로 별도로 관리 (현재는 0으로 설정)
        setAvailableAKO(0) // TODO: AKO 쿠폰 시스템 구현 시 실제 데이터로 변경
        setCurrentPoints(data.userPoints?.total_points || 0)
      } else {
        console.error('포인트 조회 실패:', response.status)
        setAvailableAKO(0)
        setCurrentPoints(0)
      }
    } catch (error) {
      console.error('포인트 조회 오류:', error)
      setAvailableAKO(0)
      setCurrentPoints(0)
    } finally {
      setPointsLoading(false)
    }
  }

  // 사용자 정보가 있을 때 포인트 데이터 로드
  useEffect(() => {
    if (user?.id) {
      fetchPoints()
    }
  }, [user?.id])

  // URL 파라미터에서 탭 확인 및 설정
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') return
    
    const tabParam = searchParams.get('tab')
    console.log('MainPage: tabParam from URL:', tabParam)
    
    let targetTab = 'home' // 기본값
    
    if (tabParam && ['home', 'meet', 'community', 'me', 'charging', 'event'].includes(tabParam)) {
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
  
  return (
    <div className="min-h-screen body-gradient pt-44 pb-20 md:pb-0">
      {/* 메인 콘텐츠 섹션 */}
      <div className="w-full px-4 py-6 relative z-0 lg:max-w-5xl lg:mx-auto">
        <div className="w-full">

          {/* 콘텐츠 */}
          <div className="space-y-8">
            {activeTab === 'home' && (
              <div className="card p-8">
                <HomeTab />
              </div>
            )}

            {activeTab === 'meet' && (
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg">
                    <Video className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.meet')}</h2>
                    <p className="text-gray-600">{t('main.meetDescription')}</p>
                    <p className="text-sm text-blue-600 font-medium mt-1">{t('mainPage.akoExplanation')}</p>
                  </div>
                </div>
                <MeetTab />
              </div>
            )}

            {activeTab === 'community' && (
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-mint-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.community')}</h2>
                    <p className="text-gray-600">{t('main.communityDescription')}</p>
                  </div>
                </div>
                <CommunityTab />
              </div>
            )}

            {activeTab === 'me' && (
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.me')}</h2>
                    <p className="text-gray-600">{t('main.meDescription')}</p>
                  </div>
                </div>
                <MyTab />
              </div>
            )}


            {activeTab === 'charging' && (
              <>
                <div className="card p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-3xl flex items-center justify-center">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{t('storeTab.title')}</h2>
                        <p className="text-sm text-gray-600">{t('storeTab.subtitle')}</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">{t('mainPage.akoExplanation')}</p>
                      </div>
                    </div>
                    {/* 포인트 카드 - 사용 가능한 AKO만 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-2 sm:p-3 rounded-lg w-full lg:w-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className='text-xs font-medium text-blue-800'>{t('storeTab.pointCard.title')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 sm:gap-2">
                        <div className="text-center p-1 sm:p-2 bg-white rounded border border-blue-200">
                          {pointsLoading ? (
                            <div className="text-lg font-bold text-blue-600 animate-pulse">...</div>
                          ) : (
                            <div className="text-lg font-bold text-blue-600">{availableAKO}</div>
                          )}
                          <div className='text-xs text-gray-600'>{t('storeTab.pointCard.availableAKO')}</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border border-purple-200">
                          {pointsLoading ? (
                            <div className="text-lg font-bold text-purple-600 animate-pulse">...</div>
                          ) : (
                            <div className="text-lg font-bold text-purple-600">{currentPoints}</div>
                          )}
                          <div className='text-xs text-gray-600'>{t('storeTab.pointCard.currentPoints')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <ChargingTab />
              </>
            )}


            {activeTab === 'event' && (
              <div className="card p-8">
                <EventTab />
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
