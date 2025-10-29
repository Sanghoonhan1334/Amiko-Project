'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('home')

  // 현재 경로 및 URL 파라미터에 따라 활성 탭 설정
  useEffect(() => {
    if (pathname === '/main') {
      const tab = searchParams.get('tab') || 'home'
      setActiveTab(tab)
    } else if (pathname.startsWith('/community')) {
      // 커뮤니티 서브페이지에서는 커뮤니티 탭을 활성화
      setActiveTab('community')
    }
  }, [pathname, searchParams])

  // 메인 페이지에서 발생하는 탭 변경 이벤트 감지
  useEffect(() => {
    const handleMainTabChanged = (event: CustomEvent) => {
      setActiveTab(event.detail.tab)
    }

    window.addEventListener('mainTabChanged', handleMainTabChanged as EventListener)
    return () => window.removeEventListener('mainTabChanged', handleMainTabChanged as EventListener)
  }, [])

  const tabs = [
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
      id: 'home',
      label: t('home.navigation.home'),
      icon: Home,
      path: '/main?tab=home'
    },
    {
      id: 'event',
      label: t('headerNav.event'),
      icon: Calendar,
      path: '/main?tab=event'
    },
    {
      id: 'me',
      label: t('main.myPage'),
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-50 dark:bg-gray-800 border-t-2 border-blue-200 dark:border-gray-700 shadow-2xl md:hidden">
      
      <div className="flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`relative flex flex-col items-center justify-center p-2 transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'text-purple-600 dark:text-purple-400 scale-110' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className={`${t('language') === 'es' ? 'text-[9px]' : 'text-[8px] xs:text-[9px] sm:text-[10px]'} font-bold whitespace-nowrap ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
