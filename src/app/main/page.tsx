'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import MeetTab from '@/components/main/app/meet/MeetTab'
import CommunityTab from '@/components/main/app/community/CommunityTab'
import MyTab from '@/components/main/app/me/MyTab'
import { useLanguage } from '@/context/LanguageContext'

export default function AppPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('meet')

  // 전역 상태에서 탭 상태 동기화
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).currentMainTab) {
      const globalTab = (window as any).currentMainTab
      console.log('MainPage: global tab changed to:', globalTab)
      if (['meet', 'community', 'me'].includes(globalTab)) {
        setActiveTab(globalTab)
      }
    }
  }, [])

  // 페이지 진입 시 초기화
  useEffect(() => {
    console.log('MainPage: page mounted, initializing...')
    // 전역 상태 확인
    if (typeof window !== 'undefined' && (window as any).currentMainTab) {
      const globalTab = (window as any).currentMainTab
      if (['meet', 'community', 'me'].includes(globalTab)) {
        setActiveTab(globalTab)
        return
      }
    }
    // 기본값 설정
    setActiveTab('meet')
  }, [])

  // 라운지에서 돌아왔을 때 상태 초기화
  useEffect(() => {
    if (activeTab === 'lounge') {
      console.log('MainPage: resetting from lounge to meet')
      setActiveTab('meet')
    }
  }, [activeTab])

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
