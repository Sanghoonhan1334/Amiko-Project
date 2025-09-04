'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import HomeTab from '@/components/main/app/home/HomeTab'
import MeetTab from '@/components/main/app/meet/MeetTab'
import CommunityTab from '@/components/main/app/community/CommunityTab'
import MyTab from '@/components/main/app/me/MyTab'
import { useLanguage } from '@/context/LanguageContext'

function AppPageContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('home')

  // URL 파라미터에서 탭 확인 및 설정
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') return
    
    const tabParam = searchParams.get('tab')
    console.log('MainPage: tabParam from URL:', tabParam)
    
    let targetTab = 'home' // 기본값
    
    if (tabParam && ['home', 'meet', 'community', 'me'].includes(tabParam)) {
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
    <div className="min-h-screen body-gradient pt-40">
      {/* 메인 콘텐츠 섹션 */}
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-0">
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
                  <div className="w-12 h-12 bg-brand-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">🎥</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.meet')} ({t('videoCall')})</h2>
                    <p className="text-gray-600">{t('main.meetDescription')}</p>
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
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.community')} (Q&A)</h2>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen body-gradient pt-40 flex items-center justify-center">Loading...</div>}>
      <AppPageContent />
    </Suspense>
  )
}
