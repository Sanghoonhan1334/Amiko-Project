'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-target ${
                isActive 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-purple-600' : 'text-gray-600'}`} />
              <span className={`${t('language') === 'es' ? 'text-[10px]' : 'text-xs'} font-medium ${isActive ? 'text-purple-600' : 'text-gray-600'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
