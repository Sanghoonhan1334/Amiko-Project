'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  Play, 
  Users, 
  Menu, 
  X, 
  MessageSquare, 
  Calendar, 
  User, 
  Settings, 
  Globe,
  Home,
  LogOut
} from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [highlightMainButton, setHighlightMainButton] = useState(false)
  const [activeMainTab, setActiveMainTab] = useState('meet')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 언어 Context 사용
  const languageContext = useLanguage()
  const { language, toggleLanguage, t } = languageContext
  
  // 인증 Context 사용
  const { user, signOut } = useAuth()
  
  // 디버깅용 로그
  console.log('Header mounted, language:', language, 't function:', typeof t)

  // 컴포넌트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 슬라이드 변경 이벤트 감지
  useEffect(() => {
    const handleSlideChange = (event: CustomEvent) => {
      console.log('Header received slideChanged event:', event.detail.activeIndex)
      setActiveSlide(event.detail.activeIndex)
    }

    window.addEventListener('slideChanged', handleSlideChange as EventListener)
    return () => window.removeEventListener('slideChanged', handleSlideChange as EventListener)
  }, [])

  // 메인페이지 버튼 하이라이트 이벤트 감지
  useEffect(() => {
    const handleHighlightMainButton = (event: CustomEvent) => {
      setHighlightMainButton(event.detail.highlight)
    }

    window.addEventListener('highlightMainButton', handleHighlightMainButton as EventListener)
    return () => window.removeEventListener('highlightMainButton', handleHighlightMainButton as EventListener)
  }, [])

  // 메인페이지 URL 파라미터에서 탭 상태 동기화
  useEffect(() => {
    console.log('Header: pathname changed to:', pathname)
    if (pathname === '/main') {
      const tabParam = searchParams.get('tab')
      console.log('Header: on main page, tabParam:', tabParam)
      if (tabParam && ['meet', 'community', 'me'].includes(tabParam)) {
        setActiveMainTab(tabParam)
      } else {
        // 기본값 설정
        console.log('Header: setting default tab to meet')
        setActiveMainTab('meet')
      }
    } else if (pathname === '/lounge') {
      // 라운지 페이지일 때는 라운지 탭 활성화
      console.log('Header: on lounge page, setting tab to lounge')
      setActiveMainTab('lounge')
    } else {
      // 다른 페이지일 때는 상태 초기화
      console.log('Header: on other page, resetting to meet')
      setActiveMainTab('meet')
    }
  }, [pathname, searchParams])

  // 메인페이지 진입 시 라운지 상태 초기화
  useEffect(() => {
    if (pathname === '/main') {
      console.log('Header: on main page, activeMainTab:', activeMainTab)
      if (activeMainTab === 'lounge') {
        console.log('Header: resetting from lounge to meet')
        setActiveMainTab('meet')
      }
    }
  }, [pathname, activeMainTab])

  // 모바일 메뉴 상태 추적
  useEffect(() => {
    console.log('모바일 메뉴 상태 변경:', isMobileMenuOpen)
  }, [isMobileMenuOpen])

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    console.log('햄버거 메뉴 클릭됨! 현재 상태:', isMobileMenuOpen)
    setIsMobileMenuOpen(!isMobileMenuOpen)
    console.log('새로운 상태:', !isMobileMenuOpen)
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
      alert('로그아웃되었습니다.')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  // 네비게이션 탭 클릭 처리
  const handleNavClick = (slideIndex: number) => {
    if (pathname === '/') {
      // 랜딩페이지에서만 슬라이더 제어
      const swiper = (window as any).swiperInstance
      console.log('handleNavClick:', slideIndex, 'swiper:', swiper)
      if (swiper) {
        swiper.slideTo(slideIndex)
        setActiveSlide(slideIndex)
      } else {
        console.log('Swiper instance not found!')
      }
    }
  }

  // 메인페이지 네비게이션 클릭 처리
  const handleMainNavClick = (tab: string) => {
    console.log('Header: handleMainNavClick called with tab:', tab, 'pathname:', pathname)
    if (pathname === '/main') {
      setActiveMainTab(tab)
      
      // 직접 메인페이지 함수 호출
      if (typeof window !== 'undefined' && (window as any).changeMainTab) {
        (window as any).changeMainTab(tab)
      }
      
      // 커스텀 이벤트로도 알림
      window.dispatchEvent(new CustomEvent('mainTabChanged', { 
        detail: { tab } 
      }))
    } else {
      console.log('Header: not on main page, current pathname:', pathname)
    }
  }

  // 현재 페이지에 따른 버튼 표시 조건
  const isLandingPage = pathname === '/'
  const isMainPage = pathname === '/main'

  // SSR 방지 - 스켈레톤 UI 반환
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-32">
            {/* 좌측: 햄버거 메뉴 스켈레톤 */}
            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>

            {/* 중앙: 로고 스켈레톤 */}
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>

            {/* 우측: 언어 버튼 스켈레톤 */}
            <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      {/* 데스크톱 헤더 */}
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isScrolled 
            ? 'bg-white shadow-lg border-b border-gray-200' 
            : 'bg-white border-b border-gray-200'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-32">
            {/* 좌측: 햄버거 메뉴 (모바일에서만 표시) */}
            <div className="flex items-center relative z-20 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-gray-100 transition-all duration-300 relative"
              >
                <div className={`hamburger-menu-icon w-5 h-5 flex flex-col justify-center items-center ${isMobileMenuOpen ? 'open' : ''}`}>
                  <span className="hamburger-line w-5 h-0.5 bg-gray-700 rounded-full mb-1"></span>
                  <span className="hamburger-line w-5 h-0.5 bg-gray-700 rounded-full mb-1"></span>
                  <span className="hamburger-line w-5 h-0.5 bg-gray-700 rounded-full"></span>
                </div>
              </Button>
            </div>

            {/* 중앙: 로고 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-4 z-10">
              <Link href="/" className="flex items-center gap-2 group">
                <img 
                  src="/amiko-foto.png" 
                  alt="Amiko" 
                  className="h-32 w-auto object-contain group-hover:scale-105 transition-all duration-300"
                  style={{ maxHeight: '128px' }}
                />
                <div className="text-2xl animate-pulse group-hover:animate-bounce">
                  ✨
                </div>
              </Link>
            </div>

            {/* 메인 네비게이션 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-20 z-10">
              <nav className="flex space-x-8">
                {isLandingPage ? (
                  // 랜딩페이지 네비게이션
                  <>
                    <button 
                      onClick={() => handleNavClick(0)}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeSlide === 0 
                          ? 'text-brand-500 scale-110' 
                          : 'text-gray-800 hover:text-brand-500'
                      }`}
                    >
                      회사소개
                    </button>
                    <button 
                      onClick={() => handleNavClick(1)}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeSlide === 1 
                          ? 'text-brand-500 scale-110' 
                          : 'text-gray-800 hover:text-brand-500'
                      }`}
                    >
                      대화
                    </button>
                    <button 
                      onClick={() => handleNavClick(2)}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeSlide === 2 
                          ? 'text-brand-500 scale-110' 
                          : 'text-gray-800 hover:text-brand-500'
                      }`}
                    >
                      커뮤니티
                    </button>
                    <button 
                      onClick={() => handleNavClick(3)}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeSlide === 3 
                          ? 'text-brand-500 scale-110' 
                          : 'text-gray-800 hover:text-brand-500'
                      }`}
                    >
                      이벤트
                    </button>
                  </>
                ) : isMainPage ? (
                  // 메인페이지 네비게이션 (데스크톱에서만 표시)
                  <div className="hidden md:flex space-x-8">
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
                    <button 
                      onClick={() => {
                        setActiveMainTab('lounge')
                        router.push('/lounge')
                      }}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'lounge' 
                          ? 'text-purple-500 scale-110' 
                          : 'text-gray-800 hover:text-purple-500'
                      }`}
                    >
                      라운지
                    </button>
                  </div>
                ) : (
                  // 라운지 페이지 네비게이션 (데스크톱에서만 표시)
                  <div className="hidden md:flex space-x-8">
                    <button 
                      onClick={() => router.push('/main')}
                      className="font-semibold transition-all duration-300 drop-shadow-lg text-gray-800 hover:text-brand-500"
                    >
                      영상소통
                    </button>
                    <button 
                      onClick={() => router.push('/main')}
                      className="font-semibold transition-all duration-300 drop-shadow-lg text-gray-800 hover:text-mint-500"
                    >
                      커뮤니티
                    </button>
                    <button 
                      onClick={() => router.push('/main')}
                      className="font-semibold transition-all duration-300 drop-shadow-lg text-gray-800 hover:text-sky-500"
                    >
                      내정보
                    </button>
                    <button 
                      className="font-semibold transition-all duration-300 drop-shadow-lg text-purple-500 scale-110"
                    >
                      라운지
                    </button>
                  </div>
                )}
              </nav>
            </div>

            {/* 우측: 메인페이지 이동 + 언어 전환 (데스크톱에서만 표시) */}
            <div className="hidden md:flex items-center gap-2 relative z-20">
              {/* 메인페이지로 이동 버튼 - 랜딩 페이지에서만 표시 */}
              {isLandingPage && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/main')}
                    className={`px-2 py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-all duration-500 border border-gray-200 relative z-10 ${
                      highlightMainButton 
                        ? 'scale-110 shadow-lg border-yellow-400 bg-yellow-50' 
                        : ''
                    }`}
                    title="메인페이지로 이동"
                  >
                    <Home className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-600" />
                    <span className="text-xs md:text-sm font-medium">
                      메인페이지
                    </span>
                  </Button>
                  
                  {/* 하이라이트 효과 */}
                  {highlightMainButton && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse scale-125 transition-all duration-500"></div>
                  )}
                </div>
              )}
              
              {/* 랜딩페이지로 이동 버튼 - 메인페이지에서만 표시 */}
              {isMainPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="px-2 py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                  title="랜딩페이지로 이동"
                >
                  <Home className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-600" />
                  <span className="text-xs md:text-sm font-medium">
                    랜딩페이지
                  </span>
                </Button>
              )}
              
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
              {/* 메인페이지로 이동 - 랜딩 페이지에서만 표시 */}
              {isLandingPage && (
                <Link 
                  href="/main" 
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 text-brand-600 bg-brand-50"
                  onClick={toggleMobileMenu}
                >
                  <Home className="w-5 h-5" />
                  메인페이지로 이동
                </Link>
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
                  
                  {/* 랜딩페이지로 이동 - 메인페이지에서만 표시 */}
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 text-gray-700 hover:text-brand-600 transition-all duration-300"
                    onClick={toggleMobileMenu}
                  >
                    <Home className="w-5 h-5" />
                    랜딩페이지로 이동
                  </Link>
                </div>
              )}

              {/* 라운지 페이지 네비게이션 - 라운지 페이지에서만 표시 */}
              {!isLandingPage && !isMainPage && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      router.push('/main')
                      toggleMobileMenu()
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  >
                    <span className="text-base">🎥</span>
                    영상소통
                  </button>
                  <button
                    onClick={() => {
                      router.push('/main')
                      toggleMobileMenu()
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  >
                    <span className="text-base">💬</span>
                    커뮤니티
                  </button>
                  <button
                    onClick={() => {
                      router.push('/main')
                      toggleMobileMenu()
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  >
                    <span className="text-base">👤</span>
                    내정보
                  </button>
                  <button
                    className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 bg-purple-50 text-purple-600"
                  >
                    <span className="text-base">🎈</span>
                    라운지
                  </button>
                  
                  {/* 랜딩페이지로 이동 - 라운지 페이지에서만 표시 */}
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 text-gray-700 hover:text-brand-600 transition-all duration-300"
                    onClick={toggleMobileMenu}
                  >
                    <Home className="w-5 h-5" />
                    랜딩페이지로 이동
                  </Link>
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
                  <User className="w-5 h-5" />
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
