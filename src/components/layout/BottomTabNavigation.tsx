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
    } else if (pathname.startsWith('/community')) {
      // 커뮤니티 서브페이지에서는 커뮤니티 탭을 활성화
      setActiveTab('community')
    }
  }, [pathname])

  const tabs = [
    {
      id: 'home',
      label: '홈',
      icon: Home,
      path: '/main?tab=home'
    },
    {
      id: 'community',
      label: t('headerNav.community'),
      icon: MessageSquare,
      path: '/main?tab=community'
    },
    {
      id: 'meet',
      label: t('headerNav.videoCall'),
      icon: Video,
      path: '/main?tab=meet'
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
    
    // 커뮤니티 서브페이지에서 다른 탭 클릭 시 메인 페이지로 이동
    if (pathname.startsWith('/community') && tab.id !== 'community') {
      router.push(tab.path)
    } else {
      router.push(tab.path)
    }
    
    // 헤더 네비게이션과 동기화
    window.dispatchEvent(new CustomEvent('mainTabChanged', { 
      detail: { tab: tab.id } 
    }))
  }

  // 메인 페이지나 커뮤니티 서브페이지가 아닐 때는 숨김
  if (!pathname.startsWith('/main') && !pathname.startsWith('/community')) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-50 border-t-2 border-blue-200 shadow-2xl md:hidden">
      
      <div className="flex items-center justify-around px-1 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`relative flex flex-col items-center justify-center p-3 transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-purple-600' 
                  : 'text-blue-600'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 transition-transform duration-200 ${isActive ? 'text-purple-600 scale-110' : 'text-blue-600'}`} />
              <span className={`${t('language') === 'es' ? 'text-[10px]' : 'text-[9px] xs:text-[10px] sm:text-xs'} font-bold whitespace-nowrap ${isActive ? 'text-purple-600' : 'text-blue-600'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
