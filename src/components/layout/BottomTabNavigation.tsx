'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  Home, 
  Video, 
  MessageSquare, 
  User, 
  Zap, 
  ShoppingBag,
  Calendar 
} from 'lucide-react'

export default function BottomTabNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('home')

  // 현재 경로에 따라 활성 탭 설정
  useEffect(() => {
    if (pathname === '/main') {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab') || 'home'
      setActiveTab(tab)
    }
  }, [pathname])

  const tabs = [
    {
      id: 'home',
      label: t('headerNav.home'),
      icon: Home,
      path: '/main?tab=home'
    },
    {
      id: 'meet',
      label: t('headerNav.videoCall'),
      icon: Video,
      path: '/main?tab=meet'
    },
    {
      id: 'community',
      label: t('headerNav.community'),
      icon: MessageSquare,
      path: '/main?tab=community'
    },
    {
      id: 'charging',
      label: t('headerNav.chargingStationShort'),
      icon: Zap,
      path: '/main?tab=charging'
    },
    {
      id: 'event',
      label: t('headerNav.event'),
      icon: Calendar,
      path: '/main?tab=event'
    },
    {
      id: 'me',
      label: t('main.me'),
      icon: User,
      path: '/main?tab=me'
    }
  ]

  const handleTabClick = (tab: typeof tabs[0]) => {
    // 로그인하지 않은 상태에서 'me' 탭 클릭 시 로그인 페이지로 이동
    if (tab.id === 'me' && !user) {
      router.push('/sign-in')
      return
    }
    
    setActiveTab(tab.id)
    router.push(tab.path)
    
    // 헤더 네비게이션과 동기화
    window.dispatchEvent(new CustomEvent('mainTabChanged', { 
      detail: { tab: tab.id } 
    }))
  }

  // 메인 페이지가 아닐 때는 숨김
  if (!pathname.startsWith('/main')) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-50 border-t-2 border-blue-200 shadow-2xl md:hidden">
      {/* 상단 글로우 효과 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400"></div>
      
      <div className="flex items-center justify-around px-1 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center p-3 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isActive 
                  ? tab.id === 'community'
                    ? 'text-white bg-gradient-to-br from-green-500 to-mint-400 shadow-lg border-2 border-green-300 rounded-xl' 
                    : 'text-blue-700'
                  : tab.id === 'community'
                    ? 'text-green-700 hover:text-green-800 hover:bg-green-200'
                    : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? (tab.id === 'community' ? 'text-white drop-shadow-sm' : 'text-blue-700') : tab.id === 'community' ? 'text-green-700' : 'text-blue-600'}`} />
              <span className={`${t('language') === 'es' ? 'text-[10px]' : 'text-xs'} ${tab.id === 'community' ? 'font-black' : 'font-bold'} ${isActive ? (tab.id === 'community' ? 'text-white drop-shadow-sm' : 'text-blue-700') : tab.id === 'community' ? 'text-green-700' : 'text-blue-600'}`}>
                {tab.label}
              </span>
              
              {/* 선택된 버튼에 펄스 효과 - 커뮤니티만 */}
              {isActive && tab.id === 'community' && (
                <div className="absolute inset-0 rounded-xl bg-green-400 opacity-20 animate-pulse"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
