'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Play, Users, Menu, X, MessageSquare, Calendar, Bell, Settings, Clock, ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/notifications/NotificationBell'

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
  
  // 네비게이션 활성 상태 관리
  const [activeNavItem, setActiveNavItem] = useState(pathname)

  // 인증 상태 관리
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'unverified'>('loading')
  
  // 포인트 상태 관리
  const [userPoints, setUserPoints] = useState(0)
  
  // 시계 상태 관리
  const [koreanTime, setKoreanTime] = useState('')
  const [localTime, setLocalTime] = useState('')
  const [showTimeDetails, setShowTimeDetails] = useState(false)
  
  // 언어 드롭다운 상태 관리
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  // 시계 업데이트 함수
  const updateClock = () => {
    const now = new Date()
    
    // 한국 시간
    const koreanTimeStr = now.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    // 멕시코 시간
    const mexicoTimeStr = now.toLocaleString('ko-KR', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    setKoreanTime(koreanTimeStr)
    setLocalTime(mexicoTimeStr)
  }

  // 포인트 로딩 함수
  const loadUserPoints = async () => {
    if (!user?.id) return

    try {
      console.log('헤더 포인트 로딩 시작:', user.id)
      const response = await fetch(`/api/points?userId=${user.id}`)
      console.log('헤더 포인트 API 응답:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('헤더 포인트 데이터:', data)
        
        // 다양한 포인트 필드 확인
        const points = data.userPoints?.available_points || 
                      data.userPoints?.total_points || 
                      data.totalPoints || 
                      data.availablePoints || 
                      0
        
        console.log('설정할 포인트:', points)
        setUserPoints(points)
      } else {
        console.error('헤더 포인트 API 오류:', response.status)
      }
    } catch (error) {
      console.error('헤더 포인트 로딩 실패:', error)
    }
  }

  // 사용자 로그인 시 포인트 로딩
  useEffect(() => {
    if (user?.id) {
      loadUserPoints()
    }
  }, [user?.id])

  // 시계 초기화 및 주기적 업데이트
  useEffect(() => {
    updateClock() // 즉시 업데이트
    const timer = setInterval(updateClock, 1000) // 1초마다 업데이트
    
    return () => clearInterval(timer)
  }, [])

  // 시계 및 언어 드롭다운 외부 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (showTimeDetails && !target.closest('.time-dropdown')) {
        setShowTimeDetails(false)
      }
      
      if (showLanguageDropdown && !target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTimeDetails, showLanguageDropdown])

  // 포인트 업데이트 이벤트 리스너
  useEffect(() => {
    const handlePointsUpdate = () => {
      loadUserPoints()
    }

    window.addEventListener('pointsUpdated', handlePointsUpdate)
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate)
    }
  }, [user?.id])

  // 랜딩페이지와 메인페이지 구분
  const isLandingPage = pathname === '/' || pathname === '/about'
  const isMainPage = pathname.startsWith('/main') || pathname.startsWith('/lounge')

  // pathname 변경 시 activeNavItem 업데이트
  useEffect(() => {
    setActiveNavItem(pathname)
  }, [pathname])

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

  // 인증 상태 및 포인트 확인
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.id) {
        setVerificationStatus('unverified')
        // 포인트는 별도로 로딩하므로 여기서 리셋하지 않음
        return
      }

      try {
        // 인증 상태 확인
        const verificationResponse = await fetch(`/api/verification?userId=${user.id}`)
        const verificationResult = await verificationResponse.json()

        if (verificationResponse.ok && verificationResult.verification?.status === 'approved') {
          setVerificationStatus('verified')
        } else {
          setVerificationStatus('unverified')
        }

        // 포인트는 별도 로딩 함수에서 처리
      } catch (error) {
        console.error('인증 상태 및 포인트 확인 오류:', error)
        setVerificationStatus('unverified')
        // 포인트는 별도로 로딩하므로 여기서 리셋하지 않음
      }
    }

    checkVerificationStatus()
  }, [user?.id])

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
      // signOut 함수에서 이미 페이지 이동을 처리함
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28 sm:h-32 md:h-36">
            {/* 좌측: 언어 전환 버튼 및 시계 */}
            <div className="flex flex-col items-start gap-2">
              {/* 언어 드롭다운 - 시계 위에 */}
              <div className="relative language-dropdown">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="px-1.5 py-1 sm:px-2 sm:py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-all duration-300 border border-gray-200 flex items-center gap-1"
                  title={t('selectLanguage')}
                >
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium">
                    {language === 'ko' ? '한국어' : 'Español'}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </Button>
                
                {/* 언어 선택 드롭다운 */}
                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          if (language !== 'ko') {
                            toggleLanguage()
                          }
                          setShowLanguageDropdown(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          language === 'ko' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-base">🇰🇷</span>
                        <span>한국어</span>
                        {language === 'ko' && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          if (language !== 'es') {
                            toggleLanguage()
                          }
                          setShowLanguageDropdown(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          language === 'es' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-base">🇲🇽</span>
                        <span>Español</span>
                        {language === 'es' && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 시계 표시 - 언어 전환 버튼 아래에 */}
              <div 
                className="relative cursor-pointer group time-dropdown"
                onClick={() => setShowTimeDetails(!showTimeDetails)}
              >
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                  <div className="flex flex-col gap-0.5 text-xs font-medium">
                    <span className="text-blue-700">🇰🇷 {koreanTime}</span>
                    <span className="text-indigo-700">🇲🇽 {localTime}</span>
                  </div>
                </div>
                
                {/* 상세 시간 정보 드롭다운 */}
                {showTimeDetails && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">🌏 세계 시간</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowTimeDetails(false)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <span className="text-sm font-medium text-red-800">🇰🇷 한국</span>
                          <span className="text-sm font-mono text-red-700">
                            {new Date().toLocaleString('ko-KR', { 
                              timeZone: 'Asia/Seoul',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              weekday: 'short'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">🇲🇽 멕시코</span>
                          <span className="text-sm font-mono text-blue-700">
                            {new Date().toLocaleString('ko-KR', {
                              timeZone: 'America/Mexico_City',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              weekday: 'short'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-green-800">🇵🇪 페루</span>
                          <span className="text-sm font-mono text-green-700">
                            {new Date().toLocaleString('ko-KR', { 
                              timeZone: 'America/Lima',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              weekday: 'short'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <span className="text-sm font-medium text-purple-800">🇨🇴 콜롬비아</span>
                          <span className="text-sm font-mono text-purple-700">
                            {new Date().toLocaleString('ko-KR', { 
                              timeZone: 'America/Bogota',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              weekday: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 중앙: 로고와 네비게이션 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 z-0 flex flex-col items-center">
              {/* 로고 */}
              <div className="relative">
                <img 
                  src="/amiko-foto.png" 
                  alt="Amiko" 
                  className="h-24 sm:h-32 md:h-40 w-auto object-contain transition-all duration-300"
                  style={{ 
                    maxHeight: '160px'
                  }}
                />
                {/* 로고 중앙 부분만 클릭 가능하도록 작은 클릭 영역 추가 */}
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/')
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%'
                  }}
                >
                  {/* 시각적 피드백을 위한 투명한 원 */}
                  <div className="w-full h-full bg-transparent hover:bg-blue-100/20 rounded-full transition-all duration-300"></div>
                </div>
              </div>

              {/* 네비게이션 */}
              <nav className="hidden md:flex space-x-6 lg:space-x-8 -mt-6 sm:-mt-8 md:-mt-10 relative z-20">
                {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership') ? (
                  // 랜딩페이지 및 문의페이지 네비게이션 - 홈, 회사소개, 문의, 제휴문의, 시작하기
                  <>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveNavItem('/')
                        router.push('/')
                      }}
                      className={`font-semibold transition-all duration-300 relative z-30 ${
                        activeNavItem === '/'
                          ? 'text-purple-600 scale-110'
                          : 'text-gray-800 hover:text-purple-600'
                      }`}
                    >
                      {t('header.home')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveNavItem('/about')
                        router.push('/about')
                      }}
                      className={`font-semibold transition-all duration-300 relative z-30 ${
                        activeNavItem === '/about' 
                          ? 'text-purple-600 scale-110' 
                          : 'text-gray-800 hover:text-purple-600'
                      }`}
                    >
                      {t('header.about')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveNavItem('/inquiry')
                        router.push('/inquiry')
                      }}
                      className={`font-semibold transition-all duration-300 relative z-30 ${
                        activeNavItem === '/inquiry' 
                          ? 'text-purple-600 scale-110' 
                          : 'text-gray-800 hover:text-purple-600'
                      }`}
                    >
                      {t('header.inquiry')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveNavItem('/partnership')
                        router.push('/partnership')
                      }}
                      className={`font-semibold transition-all duration-300 relative z-30 ${
                        activeNavItem === '/partnership' 
                          ? 'text-purple-600 scale-110' 
                          : 'text-gray-800 hover:text-purple-600'
                      }`}
                    >
                      {t('header.partnership')}
                    </button>
                  </>
                ) : isMainPage ? (
                  // 메인페이지 네비게이션 (데스크톱에서만 표시)
                  <div className="hidden md:flex space-x-8">
                    <button 
                      onClick={() => handleMainNavClick('home')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'home' 
                          ? 'text-purple-500 scale-110' 
                          : 'text-gray-800 hover:text-purple-500'
                      }`}
                    >
                      {t('headerNav.home')}
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('meet')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'meet' 
                          ? 'text-purple-500 scale-110' 
                          : 'text-gray-800 hover:text-purple-500'
                      }`}
                    >
                      {t('headerNav.videoCall')}
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('community')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'community' 
                          ? 'text-purple-500 scale-110' 
                          : 'text-gray-800 hover:text-purple-500'
                      }`}
                    >
                      {t('headerNav.community')}
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('charging')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'charging' 
                          ? 'text-purple-500 scale-110' 
                          : 'text-gray-800 hover:text-purple-500'
                      }`}
                    >
                      <span className="hidden lg:inline">{t('headerNav.chargingStation')}</span>
                      <span className="lg:hidden">{t('headerNav.chargingStationShort')}</span>
                    </button>
                    <button 
                      onClick={() => handleMainNavClick('event')}
                      className={`font-semibold transition-all duration-300 drop-shadow-lg ${
                        activeMainTab === 'event' 
                          ? 'text-purple-500 scale-110' 
                          : 'text-gray-800 hover:text-purple-500'
                      }`}
                    >
                      {t('headerNav.event')}
                    </button>
                  </div>
                ) : null}
              </nav>
            </div>

            {/* 우측: 시작하기 버튼, 알림, 프로필, 모바일 메뉴 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* 로그인/로그아웃 버튼 - 메인페이지에서만 표시 (데스크톱에서만) */}
              {isMainPage && (
                <>
                  {user ? (
                    <button 
                      onClick={() => handleLogout()}
                      className="hidden md:block font-semibold transition-all duration-300 drop-shadow-lg text-gray-800 hover:text-red-500"
                    >
                      {t('headerNav.logout')}
                    </button>
                  ) : (
                    <button 
                      onClick={() => router.push('/sign-in')}
                      className="hidden md:block font-semibold transition-all duration-300 drop-shadow-lg text-gray-800 hover:text-blue-500"
                    >
                      로그인
                    </button>
                  )}
                </>
              )}

              {/* 우측 상단 영역 - 세로 배치 */}
              {isMainPage && user && (
                <div className="hidden md:flex flex-col items-end gap-1">
                  {/* 포인트 표시 - 최상단 */}
                  {verificationStatus === 'verified' && (
                    <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-200 shadow-sm mb-1">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold font-['Inter']">★</span>
                      </div>
                      <span className="text-xs text-purple-700 font-medium">{userPoints}P</span>
                    </div>
                  )}
                  
                  {/* 상단 버튼들 - 가로 배치 */}
                  <div className="flex items-center gap-1">
                    {/* 알림 버튼 */}
                    <NotificationBell />
                    
                    {/* 프로필 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMainNavClick('me')}
                      className={`p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-all duration-300 ${
                        activeMainTab === 'me' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </Button>
                  </div>
                  
                  {/* 인증 상태 표시 */}
                  <div className="flex items-center gap-2">
                    {verificationStatus === 'loading' ? (
                      <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-50 rounded-full border border-gray-200">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">확인 중...</span>
                      </div>
                    ) : verificationStatus === 'verified' ? (
                      <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-emerald-50 to-green-50 rounded-full border border-emerald-200 shadow-sm">
                        <div className="flex items-center justify-center w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full">
                          <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-xs text-emerald-700 font-medium">{t('myTab.verificationComplete')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-50 rounded-full border border-amber-200">
                        <div className="flex items-center justify-center w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 rounded-full">
                          <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-xs text-amber-700 font-medium">{t('myTab.verificationRequired')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 모바일용 알림 - 모바일에서만 표시 */}
              {isMainPage && (
                <div className="md:hidden">
                  <NotificationBell />
                </div>
              )}

              {/* 모바일 메뉴 버튼 - 모든 페이지에서 표시 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </Button>

              {/* 시작하기 버튼 - 랜딩페이지 및 문의페이지에서 표시 (데스크톱에서만) */}
              {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership') && (
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/main')
                  }}
                  className="hidden md:block font-semibold transition-all duration-300 bg-gray-900 hover:bg-gray-800 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg shadow-lg hover:shadow-xl"
                >
                  {t('header.startButton')}
                </button>
              )}

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
        <div className={`absolute left-0 top-14 sm:top-16 md:top-20 w-52 sm:w-56 md:w-64 max-h-80 sm:max-h-96 bg-white/95 backdrop-blur-md shadow-2xl border-r border-gray-200/50 rounded-r-2xl transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4 space-y-1 sm:space-y-2 max-h-80 sm:max-h-96 overflow-y-auto scroll-smooth-touch">
            {/* 메인 메뉴 */}
            <div className="space-y-1">
              {/* 랜딩페이지 및 문의페이지 네비게이션 메뉴 */}
              {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership') && (
                <div className="space-y-1 mb-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveNavItem('/')
                      router.push('/')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg w-full text-left transition-all duration-300 touch-target ${
                      activeNavItem === '/' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-sm sm:text-base">🏠</span>
                    {t('header.home')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveNavItem('/about')
                      router.push('/about')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg w-full text-left transition-all duration-300 touch-target ${
                      activeNavItem === '/about' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-sm sm:text-base">🏢</span>
                    {t('header.about')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveNavItem('/inquiry')
                      router.push('/inquiry')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeNavItem === '/inquiry' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">💬</span>
                    {t('header.inquiry')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveNavItem('/partnership')
                      router.push('/partnership')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeNavItem === '/partnership' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">🤝</span>
                    {t('header.partnership')}
                  </button>
                </div>
              )}
              
              {/* 랜딩페이지 및 문의페이지에서는 시작하기 버튼 표시 */}
              {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership') && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/main')
                    toggleMobileMenu()
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800"
                >
                  <span className="text-base">🚀</span>
{t('header.startButton')}
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
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">🎥</span>
                    {t('headerNav.videoCall')}
                  </button>
                  <button
                    onClick={() => {
                      handleMainNavClick('community')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'community' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">💬</span>
                    {t('headerNav.community')}
                  </button>
                  <button
                    onClick={() => {
                      handleMainNavClick('me')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'me' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">👤</span>
                    내 정보
                  </button>
                  <button
                    onClick={() => {
                      handleMainNavClick('charging')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'charging' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">⚡</span>
                    {t('headerNav.chargingStation')}
                  </button>
                  <button
                    onClick={() => {
                      handleMainNavClick('event')
                      toggleMobileMenu()
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg w-full text-left transition-all duration-300 ${
                      activeMainTab === 'event' 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">🎁</span>
                    {t('headerNav.event')}
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
            
            {/* 알림과 프로필 - 메인페이지에서만 표시 */}
            {isMainPage && (
              <div className="space-y-1">
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300 w-full">
                  <Bell className="w-5 h-5" />
{t('myTab.notifications')}
                  <div className="ml-auto">
                    <NotificationBell />
                  </div>
                </div>
                {user && (
                  <button
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300 w-full text-left"
                  >
                    <Users className="w-5 h-5" />
                    프로필
                  </button>
                )}
              </div>
            )}
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-3" />
            
            {/* 언어 전환 */}
            <div className="space-y-1">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300 w-full text-left"
              >
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
