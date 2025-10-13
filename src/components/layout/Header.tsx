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
  
  // 운영진 상태 관리
  const [isAdmin, setIsAdmin] = useState(false)
  
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

  // 포인트 로딩 함수 - 로그 최소화
  const loadUserPoints = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/points?userId=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // 다양한 포인트 필드 확인
        const points = data.userPoints?.available_points || 
                      data.userPoints?.total_points || 
                      data.totalPoints || 
                      data.availablePoints || 
                      0
        
        setUserPoints(points)
      }
    } catch (error) {
      console.error('포인트 로딩 실패:', error)
    }
  }

  // 운영진 여부 확인 함수 - 로그 간소화
  const checkAdminStatus = async () => {
    if (!user?.id && !user?.email) {
      setIsAdmin(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/check?userId=${user.id}&email=${user.email}`)
      
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      setIsAdmin(false)
    }
  }

  // 사용자 로그인 시 포인트 로딩
  useEffect(() => {
    if (user?.id) {
      loadUserPoints()
      checkAdminStatus()
    } else {
      setIsAdmin(false)
    }
  }, [user?.id, user?.email])

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
  const isMainPage = pathname.startsWith('/main') || pathname.startsWith('/lounge') || pathname.startsWith('/community')

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

  // URL 파라미터에 따라 상단 네비게이션 활성 탭 설정
  useEffect(() => {
    if (pathname === '/main') {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab') || 'home'
      setActiveMainTab(tab)
    }
  }, [pathname])

  // 인증 상태 및 포인트 확인
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.id) {
        setVerificationStatus('unverified')
        // 포인트는 별도로 로딩하므로 여기서 리셋하지 않음
        return
      }

      // 운영자일 때는 인증 상태 확인 건너뛰기
      if (isAdmin) {
        setVerificationStatus('verified')
        return
      }

      try {
        // 인증 상태 확인 (users 테이블의 email_verified, phone_verified 확인)
        const baseUrl = window.location.origin
        const authStatusResponse = await fetch(`${baseUrl}/api/auth/status?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        // 404 오류 시 (사용자가 users 테이블에 없음) 인증 필요로 표시
        if (authStatusResponse.status === 404) {
          setVerificationStatus('unverified')
          return
        }
        
        if (!authStatusResponse.ok) {
          console.error('[HEADER] 인증 상태 API 오류:', authStatusResponse.status, authStatusResponse.statusText)
          setVerificationStatus('unverified')
          return
        }
        
        const authStatusResult = await authStatusResponse.json()
        console.log('[HEADER] 인증 상태 결과:', authStatusResult)

        if (authStatusResponse.ok && authStatusResult.success && (authStatusResult.emailVerified || authStatusResult.smsVerified)) {
          console.log('[HEADER] 인증 완료로 설정')
          setVerificationStatus('verified')
        } else {
          console.log('[HEADER] 인증 미완료로 설정')
          setVerificationStatus('unverified')
        }

        // 포인트는 별도 로딩 함수에서 처리
      } catch (error) {
        console.error('인증 상태 및 포인트 확인 오류:', error)
        console.error('오류 타입:', typeof error)
        console.error('오류 메시지:', error instanceof Error ? error.message : String(error))
        setVerificationStatus('unverified')
        // 포인트는 별도로 로딩하므로 여기서 리셋하지 않음
      }
    }

    // 운영자 상태가 확인된 후에만 인증 상태 확인 실행
    if (user?.id && !isAdmin) {
      checkVerificationStatus()
    } else if (isAdmin) {
      // 운영자일 때는 바로 verified 상태로 설정
      setVerificationStatus('verified')
    }
  }, [user?.id, isAdmin])

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
    console.log('handleMainNavClick 호출됨:', tab)
    console.log('현재 사용자:', user)
    console.log('현재 경로:', pathname)
    
    // 로그인하지 않은 상태에서 'me' 탭 클릭 시 로그인 페이지로 이동
    if (tab === 'me' && !user) {
      console.log('로그인 필요 - 로그인 페이지로 이동')
      router.push('/sign-in')
      return
    }
    
    console.log('활성 탭 설정:', tab)
    setActiveMainTab(tab)
    
    if (pathname === '/main') {
      console.log('메인 페이지에서 탭 변경')
      // 세션스토리지에 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastActiveTab', tab)
        console.log('세션스토리지에 저장됨:', tab)
      }
      
      // 커스텀 이벤트로 알림
      window.dispatchEvent(new CustomEvent('mainTabChanged', { 
        detail: { tab } 
      }))
      console.log('커스텀 이벤트 발송됨:', tab)
    } else {
      console.log('메인 페이지가 아님 - 페이지 이동')
      // 메인 페이지가 아닐 때는 해당 탭으로 이동
      if (tab === 'community') {
        router.push('/main?tab=community')
      } else {
        router.push(`/main?tab=${tab}`)
      }
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 xl:px-16 lg:max-w-6xl lg:mx-auto">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-32 lg:h-32 xl:h-32 2xl:h-32 3xl:h-32 relative">
            {/* 좌측: 언어 전환 버튼 및 시계 */}
            <div className="flex flex-col items-start gap-0.5 sm:gap-2 flex-shrink-0 w-16 sm:w-24 md:w-28">
              {/* 언어 드롭다운 - 시계 위에 */}
              <div className="relative language-dropdown">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center gap-0.5 sm:gap-1"
                  title={t('selectLanguage')}
                >
                  <Globe className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                    {language === 'ko' ? '한국어' : 'Español'}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                </Button>
                
                {/* 언어 선택 드롭다운 */}
                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-50">
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
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        <span className="text-base">🇰🇷</span>
                        <span>한국어</span>
                        {language === 'ko' && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
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
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        <span className="text-base">🇲🇽</span>
                        <span>Español</span>
                        {language === 'es' && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
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
                <div className="flex items-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-0.5 sm:py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300">
                  <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400" />
                  <div className="flex flex-row gap-0.5 sm:gap-2 text-xs font-medium">
                    <span 
                      className="text-blue-700 dark:text-blue-300 whitespace-nowrap" 
                      style={{ 
                        fontSize: '10px',
                        background: 'transparent !important',
                        filter: 'none !important',
                        textShadow: 'none !important',
                        mixBlendMode: 'normal !important'
                      }}
                    >
                      🇰🇷 {koreanTime}
                    </span>
                    <span 
                      className="text-indigo-700 dark:text-indigo-300 whitespace-nowrap" 
                      style={{ 
                        fontSize: '10px',
                        background: 'transparent !important',
                        filter: 'none !important',
                        textShadow: 'none !important',
                        mixBlendMode: 'normal !important'
                      }}
                    >
                      🇲🇽 {localTime}
                    </span>
                  </div>
                </div>
                
                {/* 상세 시간 정보 드롭다운 */}
                {showTimeDetails && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-4 z-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">🌏 세계 시간</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowTimeDetails(false)
                          }}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {/* 한국 */}
                        <div className="relative overflow-hidden bg-red-50 dark:bg-gray-700 rounded-xl p-3 border border-red-100 dark:border-gray-600 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 dark:from-red-500 dark:to-pink-600 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-sm">🇰🇷</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-red-800 dark:text-red-300">
                                  {language === 'ko' ? '한국' : 'Corea del Sur'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold text-red-700 dark:text-red-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', { 
                                  timeZone: 'Asia/Seoul',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-red-500 dark:text-red-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', { 
                                  timeZone: 'Asia/Seoul',
                                  month: '2-digit',
                                  day: '2-digit',
                                  weekday: 'short'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 멕시코 */}
                        <div className="relative overflow-hidden bg-blue-50 dark:bg-gray-700 rounded-xl p-3 border border-blue-100 dark:border-gray-600 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-sm">🇲🇽</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                  {language === 'ko' ? '멕시코' : 'México'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', {
                                  timeZone: 'America/Mexico_City',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-blue-500 dark:text-blue-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', {
                                  timeZone: 'America/Mexico_City',
                                  month: '2-digit',
                                  day: '2-digit',
                                  weekday: 'short'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 페루 */}
                        <div className="relative overflow-hidden bg-green-50 dark:bg-gray-700 rounded-xl p-3 border border-green-100 dark:border-gray-600 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-sm">🇵🇪</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-green-800 dark:text-green-300">
                                  {language === 'ko' ? '페루' : 'Perú'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold text-green-700 dark:text-green-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', { 
                                  timeZone: 'America/Lima',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-green-500 dark:text-green-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', { 
                                  timeZone: 'America/Lima',
                                  month: '2-digit',
                                  day: '2-digit',
                                  weekday: 'short'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 콜롬비아 */}
                        <div className="relative overflow-hidden bg-purple-50 dark:bg-gray-700 rounded-xl p-3 border border-purple-100 dark:border-gray-600 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-500 dark:to-violet-600 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-sm">🇨🇴</span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                                  {language === 'ko' ? '콜롬비아' : 'Colombia'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold text-purple-700 dark:text-purple-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', { 
                                  timeZone: 'America/Bogota',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-purple-500 dark:text-purple-400">
                                {new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES', { 
                                  timeZone: 'America/Bogota',
                                  month: '2-digit',
                                  day: '2-digit',
                                  weekday: 'short'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 중앙: 로고와 네비게이션 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-6 z-0 flex flex-col items-center">
              {/* 로고 */}
              <div className="relative logo-container">
                {/* 라이트 모드 로고 */}
                <img 
                  src="/amiko-logo.png" 
                  alt="Amiko" 
                  className="h-28 sm:h-32 md:h-36 lg:h-40 xl:h-44 w-auto object-contain transition-all duration-300 dark:hidden"
                  style={{ 
                    maxHeight: '160px'
                  }}
                />
                {/* 다크 모드 로고 - amiko-logo.png 사용 */}
                <img 
                  src="/amiko-logo.png?v=3" 
                  alt="Amiko" 
                  className="h-28 sm:h-32 md:h-36 lg:h-40 xl:h-44 w-auto object-contain transition-all duration-300 hidden dark:block"
                  style={{ 
                    maxHeight: '160px',
                    filter: 'brightness(0) invert(1)',
                    WebkitFilter: 'brightness(0) invert(1)'
                  }}
                />
                {/* 로고 클릭 영역 - 완전 투명 */}
                <div 
                  className="absolute cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/')
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    left: '0',
                    top: '0'
                  }}
                >
                </div>
              </div>

              {/* 네비게이션 */}
              <nav className="hidden md:flex items-center space-x-6 lg:space-x-6 xl:space-x-6 -mt-6 sm:-mt-8 md:-mt-12 lg:-mt-12 xl:-mt-12 2xl:-mt-12 3xl:-mt-12 relative z-20 ml-[12px]">
                {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership') ? (
                  // 랜딩페이지에서는 네비게이션 제거 - 아코디언으로 모든 정보 제공
                  <></>
                ) : isMainPage ? (
                  // 메인페이지 네비게이션 (데스크톱에서만 표시)
                  <div className="hidden md:flex items-center space-x-6 lg:space-x-6 xl:space-x-6">
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Home 버튼 클릭됨')
                        handleMainNavClick('home')
                      }}
                      className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap bg-transparent focus:outline-none active:outline-none focus:bg-transparent active:bg-transparent hover:bg-transparent cursor-pointer ${
                        activeMainTab === 'home' 
                          ? 'text-purple-500' 
                          : 'text-gray-800 dark:text-gray-200 hover:text-purple-500'
                      }`}
                      style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
                    >
                      {t('home.navigation.home')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Community 버튼 클릭됨')
                        handleMainNavClick('community')
                      }}
                      className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap bg-transparent focus:outline-none active:outline-none focus:bg-transparent active:bg-transparent hover:bg-transparent cursor-pointer ${
                        activeMainTab === 'community' 
                          ? 'text-purple-500' 
                          : 'text-gray-800 dark:text-gray-200 hover:text-purple-500'
                      }`}
                      style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
                    >
                      {t('headerNav.community')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Meet 버튼 클릭됨')
                        handleMainNavClick('meet')
                      }}
                      className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap bg-transparent focus:outline-none active:outline-none focus:bg-transparent active:bg-transparent hover:bg-transparent cursor-pointer ${
                        activeMainTab === 'meet' 
                          ? 'text-purple-500' 
                          : 'text-gray-800 dark:text-gray-200 hover:text-purple-500'
                      }`}
                      style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
                    >
                      {t('headerNav.videoCall')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Charging 버튼 클릭됨')
                        handleMainNavClick('charging')
                      }}
                      className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap bg-transparent focus:outline-none active:outline-none focus:bg-transparent active:bg-transparent hover:bg-transparent cursor-pointer ${
                        activeMainTab === 'charging' 
                          ? 'text-purple-500' 
                          : 'text-gray-800 dark:text-gray-200 hover:text-purple-500'
                      }`}
                      style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
                    >
                      <span className="hidden lg:inline">{t('headerNav.chargingStation')}</span>
                      <span className="lg:hidden">{t('headerNav.chargingStationShort')}</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Event 버튼 클릭됨')
                        handleMainNavClick('event')
                      }}
                      className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap bg-transparent focus:outline-none active:outline-none focus:bg-transparent active:bg-transparent hover:bg-transparent cursor-pointer ${
                        activeMainTab === 'event' 
                          ? 'text-purple-500' 
                          : 'text-gray-800 dark:text-gray-200 hover:text-purple-500'
                      }`}
                      style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
                    >
                      {t('headerNav.event')}
                    </button>
                  </div>
                ) : null}
              </nav>
            </div>

            {/* 우측: 시작하기 버튼, 알림, 프로필, 모바일 메뉴 */}
            <div className="flex items-center space-x-0.5 sm:space-x-2 md:space-x-4 flex-shrink-0 w-16 sm:w-24 md:w-28 justify-end">
              {/* 로그인 버튼 - 메인페이지에서만 표시 (데스크톱에서만) */}
              {isMainPage && !user && (
                <button 
                  onClick={() => router.push('/sign-in')}
                  className="hidden md:block font-semibold transition-all duration-300 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg whitespace-nowrap mt-5"
                >
                  {t('buttons.login')}
                </button>
              )}

              {/* 데스크톱용 버튼들 - 데스크톱에서만 표시 */}
              {isMainPage && user && (
                <div className="hidden md:flex flex-col items-end gap-1">
                  {/* 상단: 쿠폰(포인트) 표시 */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">💰</span>
                    <span className="text-blue-700 dark:text-blue-300 text-sm font-bold">{userPoints.toLocaleString()}</span>
                  </div>
                  
                  {/* 중간: 로그아웃, 알림, 프로필 버튼 */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* 로그아웃 버튼 */}
                    <button 
                      onClick={() => handleLogout()}
                      className="font-semibold transition-all duration-300 drop-shadow-lg text-gray-800 dark:text-gray-200 hover:text-red-500 whitespace-nowrap text-sm"
                    >
                      {t('headerNav.logout')}
                    </button>
                    
                    {/* 알림 버튼 */}
                    <NotificationBell />
                    
                    {/* 프로필 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Profile 버튼 클릭됨')
                        handleMainNavClick('me')
                      }}
                      className={`p-1 sm:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer ${
                        activeMainTab === 'me' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                      }`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
                    </Button>
                  </div>
                  
                  {/* 하단: 인증 상태 표시 */}
                  {isAdmin ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <span className="text-purple-600 dark:text-purple-400 text-sm">👑</span>
                      <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">운영자</span>
                    </div>
                  ) : verificationStatus === 'verified' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="text-green-600 dark:text-green-400 text-sm">✅</span>
                      <span className="text-green-700 dark:text-green-300 text-sm font-medium">{t('notifications.verified')}</span>
                    </div>
                  ) : verificationStatus === 'unverified' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
                      <span className="text-amber-700 dark:text-amber-300 text-sm font-medium">{t('notifications.unverified')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 text-sm animate-pulse">⏳</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t('notifications.checking')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 모바일용 알림 및 인증 표시 - 모바일에서만 표시 */}
              {isMainPage && user && (
                <div className="md:hidden flex items-center gap-2">
                  {/* 간단한 인증 표시 */}
                  {isAdmin ? (
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  ) : verificationStatus === 'verified' ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ) : verificationStatus === 'unverified' ? (
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  )}
                  
                  {/* 알림 버튼 */}
                  <NotificationBell />
                </div>
              )}


              {/* 모바일 시작하기 버튼 - 랜딩페이지에서만 표시 */}
              {isLandingPage && (
                <Button
                  onClick={() => router.push(user ? '/main' : '/sign-in')}
                  className="md:hidden px-2 py-0 text-[8px] bg-gray-800 hover:bg-gray-700 text-white rounded transition-all duration-300 flex items-center gap-0.5"
                >
                  {t('buttons.start')}
                </Button>
              )}

              {/* 모바일 메뉴 버튼 - 랜딩페이지에서는 숨김 */}
              {!isLandingPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileMenu}
                  className="md:hidden p-1.5 rounded-full hover:bg-gray-100 transition-all duration-300 [&_svg]:!size-5"
                >
                  {isMobileMenuOpen ? (
                    <X className="text-gray-600" />
                  ) : (
                    <Menu className="text-gray-600" />
                  )}
                </Button>
              )}

              {/* 시작하기 버튼 - 랜딩페이지 및 문의페이지에서 표시 (데스크톱에서만) */}
              {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership') && (
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/main')
                  }}
                  className="hidden md:block font-semibold transition-all duration-300 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 px-3 sm:px-4 py-1 sm:py-1.5 text-sm rounded-lg shadow-lg hover:shadow-xl whitespace-nowrap"
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
        <div className={`absolute left-0 top-14 sm:top-16 md:top-20 w-52 sm:w-56 md:w-64 max-h-80 sm:max-h-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 rounded-r-2xl transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4 space-y-1 sm:space-y-2 max-h-80 sm:max-h-96 overflow-y-auto scroll-smooth-touch">
            {/* 인증 메뉴 - 맨 위로 이동 */}
            <div className="space-y-1 mb-4">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      handleLogout()
                      toggleMobileMenu()
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </button>
                </>
              ) : (
                <Link 
                  href="/sign-in"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <span className="text-base">🔐</span>
{t('buttons.login')}
                </Link>
              )}
            </div>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
            
            {/* 메인 메뉴 */}
            <div className="space-y-1">
              {/* 랜딩페이지 및 문의페이지 네비게이션 메뉴 - 제거됨 */}
              
              {/* 랜딩페이지 및 문의페이지에서는 시작하기 버튼 표시 */}
              
            </div>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
            
            {/* 푸터 내용 - 모바일에서만 표시 - SNS, 고객지원, 개인정보처리방침은 랜딩페이지 아코디언으로 이동됨 */}
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-3" />
          </div>
        </div>
      </div>
    </>
  )
}
