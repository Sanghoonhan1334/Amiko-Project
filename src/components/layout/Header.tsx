'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, LogOut, Play, Users, Menu, X, MessageSquare, Calendar, Bell, Settings } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { language, t, toggleLanguage } = useLanguage()
  const { user, signOut } = useAuth()
  const [activeMainTab, setActiveMainTab] = useState('home')

  // 모바일 메뉴 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [highlightMainButton, setHighlightMainButton] = useState(false)

  // 랜딩페이지와 메인페이지 구분
  const isLandingPage = pathname === '/' || pathname === '/about'
  const isMainPage = pathname.startsWith('/main') || pathname.startsWith('/lounge')

  // 슬라이드 변경 이벤트 리스너
  useEffect(() => {
    const handleSlideChange = (event: CustomEvent) => {
      setActiveSlide(event.detail.slideIndex)
    }

    window.addEventListener('slideChanged', handleSlideChange as EventListener)
    return () => {
      window.removeEventListener('slideChanged', handleSlideChange as EventListener)
    }
  }, [])

  // 메인 버튼 하이라이트 효과
  useEffect(() => {
    if (isLandingPage) {
      setHighlightMainButton(true)
      const timer = setTimeout(() => setHighlightMainButton(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isLandingPage])

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // 네비게이션 클릭 핸들러
  const handleNavClick = (path: string) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  // 메인페이지 네비게이션 클릭 핸들러
  const handleMainNavClick = (tab: string) => {
    setActiveMainTab(tab)
    if (pathname === '/main') {
      // 세션스토리지에 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastActiveTab', tab)
      }
      
      // 커스텀 이벤트로 알림
      window.dispatchEvent(new CustomEvent('mainTabChanged', { 
        detail: { tab } 
      }))
    }
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 좌측: 언어 전환 버튼 */}
            <div className="flex items-center">
              {/* 랜딩페이지에서는 언어 전환 버튼만 표시 */}
              {isLandingPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="px-2 py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                  title={language === 'ko' ? t('changeToSpanish') : t('changeToKorean')}
                >
                  <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-600" />
                  <span className="text-xs md:text-sm font-medium">
                    {language === 'ko' ? t('korean') : t('spanish')}
                  </span>
                </Button>
              )}
              
              {/* 언어 전환 버튼 - 랜딩페이지가 아닐 때만 표시 */}
              {!isLandingPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="px-2 py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                  title={language === 'ko' ? t('changeToSpanish') : t('changeToKorean')}
                >
                  <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-600" />
                  <span className="text-xs md:text-sm font-medium">
                    {language === 'ko' ? t('korean') : t('spanish')}
                  </span>
                </Button>
              )}
            </div>

            {/* 중앙: 로고와 네비게이션 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-10 flex flex-col items-center">
              {/* 로고 */}
              <div className="pointer-events-none mb-4">
                <img 
                  src="/amiko-foto.png" 
                  alt="Amiko" 
                  className="h-32 w-auto object-contain transition-all duration-300 pointer-events-none"
                  style={{ 
                    maxHeight: '128px'
                  }}
                />
              </div>

              {/* 네비게이션 */}
              <nav className="flex space-x-8">
                {isLandingPage ? (
                  // 랜딩페이지 네비게이션 - 홈, 회사소개, 문의, 제휴문의, 시작하기
                  <>
                    <button 
                      onClick={() => router.push('/')}
                      className={`font-semibold transition-all duration-300 ${
                        pathname === '/' 
                          ? 'text-blue-600' 
                          : 'text-gray-800 hover:text-gray-600'
                      }`}
                    >
                      홈
                    </button>
                    <button 
                      onClick={() => router.push('/about')}
                      className={`font-semibold transition-all duration-300 ${
                        pathname === '/about' 
                          ? 'text-blue-600' 
                          : 'text-gray-800 hover:text-gray-600'
                      }`}
                    >
                      회사소개
                    </button>
                    <button 
                      className="font-semibold transition-all duration-300 text-gray-800 hover:text-gray-600"
                    >
                      문의
                    </button>
                    <button 
                      className="font-semibold transition-all duration-300 text-gray-800 hover:text-gray-600"
                    >
                      제휴문의
                    </button>
                    <button 
                      onClick={() => router.push('/main')}
                      className="font-semibold transition-all duration-300 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl"
                    >
                      시작하기
                    </button>
                  </>
                ) : isMainPage ? (
                  // 메인페이지 네비게이션 (데스크톱에서만 표시)
                  <div className="hidden md:flex space-x-8">
                    <button 
                      onClick={() => handleMainNavClick('home')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'home' 
                          ? 'text-orange-500 scale-110' 
                          : 'text-gray-800 hover:text-orange-500'
                      }`}
                    >
                      홈
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('meet')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'meet' 
                          ? 'text-brand-500 scale-110' 
                          : 'text-gray-800 hover:text-brand-500'
                      }`}
                    >
                      영상소통
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('community')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'community' 
                          ? 'text-mint-500 scale-110' 
                          : 'text-gray-800 hover:text-mint-500'
                      }`}
                    >
                      커뮤니티
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('me')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'me' 
                          ? 'text-sky-500 scale-110' 
                          : 'text-gray-800 hover:text-sky-500'
                      }`}
                    >
                      내정보
                    </button>
                  </div>
                ) : null}
              </nav>
            </div>

            {/* 우측: 알림, 프로필, 모바일 메뉴 */}
            <div className="flex items-center space-x-4">
              {/* 알림 버튼 - 메인페이지에서만 표시 */}
              {isMainPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-300"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    3
                  </Badge>
                </Button>
              )}

              {/* 프로필 버튼 - 메인페이지에서만 표시 */}
              {isMainPage && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300"
                >
                  <Users className="w-5 h-5 text-gray-600" />
                </Button>
              )}

              {/* 모바일 메뉴 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <div className={`fixed inset-0 z-[500] transition-all duration-300 ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* 배경 오버레이 */}
        <div 
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleMobileMenu}
        />
        
        {/* 메뉴 패널 */}
        <div className={`absolute left-0 top-20 w-64 max-h-96 bg-white/95 backdrop-blur-md shadow-2xl border-r border-gray-200/50 rounded-r-2xl transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="pt-6 px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
            {/* 메인 메뉴 */}
            <div className="space-y-1">
              {/* 랜딩페이지에서는 시작하기 버튼 표시 */}
              {isLandingPage && (
                <button
                  onClick={() => {
                    router.push('/main')
                    toggleMobileMenu()
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800"
                >
                  <span className="text-base">🚀</span>
                  시작하기
                </button>
              )}
              
              {/* 메인페이지 네비게이션 - 메인페이지에서만 표시 */}
              {isMainPage && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleMainNavClick('meet')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'meet' 
                        ? 'bg-brand-50 text-brand-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">🎥</span>
                    영상소통
                  </button>
                  <button
                    onClick={() => {
                      handleMainNavClick('community')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'community' 
                        ? 'bg-mint-50 text-mint-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">💬</span>
                    커뮤니티
                  </button>
                  <button
                    onClick={() => {
                      handleMainNavClick('me')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'me' 
                        ? 'bg-sky-50 text-sky-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">👤</span>
                    내정보
                  </button>
                  <button
                    onClick={() => {
                      setActiveMainTab('lounge')
                      router.push('/lounge')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'lounge' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">🎈</span>
                    라운지
                  </button>
                </div>
              )}
            </div>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-3" />
            
            {/* 언어 전환 */}
            <div className="space-y-1">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300 w-full text-left"
              >
                <Globe className="w-5 h-5" />
                {language === 'ko' ? t('korean') : t('spanish')}
              </button>
            </div>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-3" />
            
            {/* 인증 메뉴 */}
            <div className="space-y-1">
              {user ? (
                <>
                  <div className="p-2.5 text-sm text-gray-600 border-b border-gray-100">
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      toggleMobileMenu()
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-300 w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </button>
                </>
              ) : (
                <Link 
                  href="/sign-in"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 text-gray-700 hover:text-brand-600 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <span className="text-base">🔐</span>
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
