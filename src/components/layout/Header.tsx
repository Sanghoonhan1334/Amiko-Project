'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Play, Users, Menu, X, MessageSquare, Calendar, Bell, Settings, Clock, ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/notifications/NotificationBell'
import InquiryModal from '@/components/common/InquiryModal'
import PartnershipModal from '@/components/common/PartnershipModal'

function HeaderContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { language, t, toggleLanguage } = useLanguage()
  const { user, signOut } = useAuth()
  const [activeMainTab, setActiveMainTab] = useState('home')

  // 모바일 메뉴 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [highlightMainButton, setHighlightMainButton] = useState(false)
  
  // 문의/제휴 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false)
  
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
  
  // 두 번째 시간대 관리 (기본값: 멕시코)
  const [secondaryTimezone, setSecondaryTimezone] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('secondary-timezone')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return { code: 'MEX', flag: '🇲🇽', name: 'México', timezone: 'America/Mexico_City' }
        }
      }
    }
    return { code: 'MEX', flag: '🇲🇽', name: 'México', timezone: 'America/Mexico_City' }
  })
  
  // 언어 드롭다운 상태 관리
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  
  // 사용 가능한 시간대 목록
  const timezoneOptions = [
    { code: 'MEX', flag: '🇲🇽', name: language === 'ko' ? '멕시코' : 'México', timezone: 'America/Mexico_City', color: 'blue' },
    { code: 'PER', flag: '🇵🇪', name: language === 'ko' ? '페루' : 'Perú', timezone: 'America/Lima', color: 'green' },
    { code: 'COL', flag: '🇨🇴', name: language === 'ko' ? '콜롬비아' : 'Colombia', timezone: 'America/Bogota', color: 'purple' },
  ]

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
    
    // 선택된 두 번째 시간대
    const secondaryTimeStr = now.toLocaleString('ko-KR', {
      timeZone: secondaryTimezone.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    setKoreanTime(koreanTimeStr)
    setLocalTime(secondaryTimeStr)
  }
  
  // 두 번째 시간대 변경 함수
  const handleTimezoneChange = (timezoneInfo: any) => {
    setSecondaryTimezone(timezoneInfo)
    localStorage.setItem('secondary-timezone', JSON.stringify(timezoneInfo))
    // 즉시 시간 업데이트
    updateClock()
  }

  // 포인트 로딩 함수 - 실제 데이터베이스 연결
  const loadUserPoints = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/points?userId=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // 실제 데이터베이스 응답 구조에 맞게 수정
        const points = data.totalPoints || 
                      data.userPoints?.total_points || 
                      data.availablePoints || 
                      data.userPoints?.available_points || 
                      0
        
        // 더미 데이터인 경우 로그 출력
        if (data.isDummy) {
          console.log('[HEADER POINTS] 더미 데이터 사용:', data.reason)
        }
        
        console.log('포인트 로딩 성공:', { userId: user.id, points, isDummy: data.isDummy })
        setUserPoints(points)
      } else {
        console.error('포인트 API 응답 오류:', response.status, response.statusText)
        setUserPoints(0) // 오류 시 0으로 설정
      }
    } catch (error) {
      console.error('포인트 로딩 실패:', error)
      setUserPoints(0) // 오류 시 0으로 설정
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

  // 언어 변경 시 secondaryTimezone 이름 업데이트
  useEffect(() => {
    const nameMap: { [key: string]: { ko: string, es: string } } = {
      'MEX': { ko: '멕시코', es: 'México' },
      'PER': { ko: '페루', es: 'Perú' },
      'COL': { ko: '콜롬비아', es: 'Colombia' },
    }
    
    if (nameMap[secondaryTimezone.code]) {
      setSecondaryTimezone(prev => ({
        ...prev,
        name: nameMap[prev.code][language as 'ko' | 'es']
      }))
    }
  }, [language])
  
  // 시계 초기화 및 주기적 업데이트
  useEffect(() => {
    updateClock() // 즉시 업데이트
    const timer = setInterval(updateClock, 1000) // 1초마다 업데이트
    
    return () => clearInterval(timer)
  }, [secondaryTimezone])

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
      const tab = searchParams.get('tab') || 'home'
      setActiveMainTab(tab)
    }
  }, [pathname, searchParams])

  // 메인 페이지에서 발생하는 탭 변경 이벤트 감지
  useEffect(() => {
    const handleMainTabChanged = (event: CustomEvent) => {
      setActiveMainTab(event.detail.tab)
    }

    window.addEventListener('mainTabChanged', handleMainTabChanged as EventListener)
    return () => window.removeEventListener('mainTabChanged', handleMainTabChanged as EventListener)
  }, [])

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
        // 인증 상태 확인 (profile API 사용)
        const baseUrl = window.location.origin
        const profileResponse = await fetch(`${baseUrl}/api/profile?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!profileResponse.ok) {
          // 404는 프로필이 없는 정상 케이스
          if (profileResponse.status === 404) {
            console.log('[HEADER] 프로필 미설정 - 인증 필요')
          } else {
          console.error('[HEADER] 프로필 API 오류:', profileResponse.status, profileResponse.statusText)
          }
          setVerificationStatus('unverified')
          return
        }
        
        const profileResult = await profileResponse.json()
        
        if (profileResult.user) {
          // 인증 상태 확인 - 실제 인증센터에서 인증을 완료한 경우만 인증완료로 표시
          // 회원가입 시 입력한 정보만으로는 인증완료로 처리하지 않음
          const userType = profileResult.user.user_type || 'student'
          const isVerified = !!(
            profileResult.user.is_verified ||  // 👈 인증센터에서 설정한 플래그
            profileResult.user.verification_completed ||  // 👈 인증 완료 플래그
            profileResult.user.email_verified_at || 
            profileResult.user.sms_verified_at || 
            profileResult.user.kakao_linked_at || 
            profileResult.user.wa_verified_at ||
            (profileResult.user.korean_name) ||
            (profileResult.user.spanish_name) ||
            (userType === 'student' && profileResult.user.full_name && profileResult.user.university && profileResult.user.major) ||
            (userType === 'general' && profileResult.user.full_name && (profileResult.user.occupation || profileResult.user.company))
          )
          
          setVerificationStatus(isVerified ? 'verified' : 'unverified')
          
          console.log('[HEADER] 인증 상태 확인:', {
            is_verified: profileResult.user.is_verified,
            verification_completed: profileResult.user.verification_completed,
            korean_name: profileResult.user.korean_name,
            spanish_name: profileResult.user.spanish_name,
            full_name: profileResult.user.full_name,
            phone: profileResult.user.phone,
            university: profileResult.user.university,
            major: profileResult.user.major,
            user_type: profileResult.user.user_type,
            occupation: profileResult.user.occupation,
            company: profileResult.user.company,
            isVerified: isVerified
          })
        } else {
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

  // 인증 완료 플래그 확인 (인증센터에서 인증 완료 후 자동으로 상태 업데이트)
  useEffect(() => {
    const checkVerificationJustCompleted = () => {
      const justCompleted = localStorage.getItem('verification_just_completed')
      if (justCompleted === 'true' && user?.id) {
        console.log('[HEADER] 인증 완료 플래그 감지, 인증 상태 다시 확인')
        localStorage.removeItem('verification_just_completed')
        
        // 인증 상태 다시 확인
        const checkVerificationStatus = async () => {
          try {
            const baseUrl = window.location.origin
            const profileResponse = await fetch(`${baseUrl}/api/profile?userId=${user.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (profileResponse.ok) {
              const profileResult = await profileResponse.json()
              if (profileResult.user) {
                const userType = profileResult.user.user_type || 'student'
                const isVerified = !!(
                  profileResult.user.is_verified ||
                  profileResult.user.verification_completed ||
                  profileResult.user.email_verified_at || 
                  profileResult.user.sms_verified_at || 
                  profileResult.user.kakao_linked_at || 
                  profileResult.user.wa_verified_at ||
                  (profileResult.user.korean_name && profileResult.user.nickname) ||
                  (profileResult.user.spanish_name && profileResult.user.nickname) ||
                  (userType === 'student' && profileResult.user.full_name && profileResult.user.university && profileResult.user.major) ||
                  (userType === 'general' && profileResult.user.full_name && (profileResult.user.occupation || profileResult.user.company))
                )
                setVerificationStatus(isVerified ? 'verified' : 'unverified')
                console.log('[HEADER] 인증 상태 업데이트 완료:', isVerified)
              }
            }
          } catch (error) {
            console.error('[HEADER] 인증 상태 재확인 오류:', error)
          }
        }
        
        checkVerificationStatus()
      }
    }

    // 주기적으로 플래그 확인 (인증 완료 후 즉시 반영)
    const interval = setInterval(checkVerificationJustCompleted, 1000)
    checkVerificationJustCompleted() // 즉시 한 번 확인
    
    return () => clearInterval(interval)
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
  const handleMainNavClick = async (tab: string) => {
    console.log('handleMainNavClick 호출됨:', tab)
    console.log('현재 사용자:', user)
    console.log('현재 경로:', pathname)
    
    // 로그인하지 않은 상태에서 'me' 탭 클릭 시 로그인 페이지로 이동
    if (tab === 'me' && !user) {
      console.log('로그인 필요 - 로그인 페이지로 이동')
      router.push('/sign-in')
      return
    }
    
    // 프로필 탭 클릭 시 인증 상태 확인
    if (tab === 'me' && user) {
      try {
        // 운영자 확인
        const adminCheck = await fetch(`/api/admin/check?userId=${user.id}`)
        const adminResult = await adminCheck.json()
        
        if (adminResult.isAdmin) {
          console.log('운영자 확인됨, 인증 체크 스킵')
        } else {
          // 인증 상태 확인
          const profileResponse = await fetch(`/api/profile?userId=${user.id}`)
          
          if (profileResponse.ok) {
            const profileResult = await profileResponse.json()
            
            if (profileResult.user) {
              // 실제 인증센터에서 인증을 완료한 경우만 인증완료로 표시
              const isVerified = !!(
                profileResult.user.is_verified ||
                profileResult.user.verification_completed ||
                profileResult.user.email_verified_at ||
                profileResult.user.sms_verified_at ||
                profileResult.user.kakao_linked_at ||
                profileResult.user.wa_verified_at ||
                (profileResult.user.korean_name && profileResult.user.nickname) ||
                (profileResult.user.spanish_name && profileResult.user.nickname) ||
                (profileResult.user.full_name && profileResult.user.university && profileResult.user.major)
              )
              
              if (!isVerified) {
                console.log('인증 필요 - 인증센터로 이동')
                router.push('/verification-center')
                return
              }
            } else {
              // 프로필이 없으면 인증센터로 이동
              console.log('프로필 없음 - 인증센터로 이동')
              router.push('/verification-center')
              return
            }
          } else if (profileResponse.status === 404) {
            // 프로필이 없으면 인증센터로 이동
            console.log('프로필 없음 (404) - 인증센터로 이동')
            router.push('/verification-center')
            return
          }
        }
      } catch (error) {
        console.error('인증 상태 확인 실패:', error)
        // 오류 발생 시에도 인증센터로 이동 (안전하게 처리)
        router.push('/verification-center')
        return
      }
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

  // 상세 페이지 체크 (전체 헤더 숨김)
  const isDetailPage = pathname.includes('/community/fanart/') || 
                       pathname.includes('/community/idol-photos/') ||
                       pathname.includes('/community/polls/') ||
                       pathname.includes('/community/news/') ||
                       pathname.includes('/community/k-chat')

  // 상세 페이지 및 Chat Zone에서는 헤더 전체 숨김
  if (isDetailPage) {
    return null
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Background layer - Light mode */}
        <div 
          className="absolute inset-0 z-0 dark:hidden" 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }}
        />
        {/* Background layer - Dark mode */}
        <div 
          className="absolute inset-0 z-0 hidden dark:block" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
        <div className="relative w-inside mx-auto z-10">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-24 relative">
            {/* 좌측: 로고 */}
            <div className="flex items-center flex-shrink-0">
              <div 
                className="cursor-pointer flex items-center"
                onClick={() => router.push('/main?tab=home')}
              >
                {/* 라이트 모드 */}
                <img
                  src="/logos/amiko-logo.png"
                  alt="Amiko"
                  className="block dark:hidden h-32 sm:h-36 md:h-40 w-auto object-contain select-none"
                />
                {/* 다크 모드 */}
                <img
                  src="/logos/amiko-logo-dark.png"
                  alt="Amiko"
                  className="hidden dark:block h-32 sm:h-36 md:h-40 w-auto object-contain select-none brightness-0 invert drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                />
              </div>
            </div>

            {/* 중앙: 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 absolute left-1/2 -translate-x-1/2">
              {(isLandingPage || pathname === '/inquiry' || pathname === '/partnership' || isDetailPage) ? (
                // 랜딩페이지 및 상세 페이지에서는 네비게이션 제거
                <></>
              ) : isMainPage ? (
                // 메인페이지 네비게이션 (데스크톱에서만 표시)
                <>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMainNavClick('home')
                    }}
                    className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap ${
                      activeMainTab === 'home' 
                        ? 'text-purple-500' 
                        : 'text-gray-800 dark:text-white hover:text-purple-500'
                    }`}
                  >
                    {t('home.navigation.home')}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMainNavClick('community')
                    }}
                    className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap ${
                      activeMainTab === 'community' 
                        ? 'text-purple-500' 
                        : 'text-gray-800 dark:text-white hover:text-purple-500'
                    }`}
                  >
                    {t('headerNav.community')}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMainNavClick('meet')
                    }}
                    className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap ${
                      activeMainTab === 'meet' 
                        ? 'text-purple-500' 
                        : 'text-gray-800 dark:text-white hover:text-purple-500'
                    }`}
                  >
                    {t('headerNav.videoCall')}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMainNavClick('event')
                    }}
                    className={`px-3 py-2 font-semibold transition-colors duration-300 whitespace-nowrap ${
                      activeMainTab === 'event' 
                        ? 'text-purple-500' 
                        : 'text-gray-800 dark:text-white hover:text-purple-500'
                    }`}
                  >
                    {t('headerNav.event')}
                  </button>
                </>
              ) : null}
            </nav>

            {/* 우측: 검색, 로그인/사용자 정보 */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0 justify-end">
              {/* 검색 인풋 - 메인페이지에서만 표시 */}
              {isMainPage && (
                <div className="hidden md:block relative">
                  <input
                    type="text"
                    placeholder={language === 'ko' ? '검색...' : 'Buscar...'}
                    className="w-40 lg:w-48 px-3 py-1.5 pr-8 rounded-full text-sm border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* 로그인 버튼 - 메인페이지에서만 표시 (데스크톱에서만) */}
              {isMainPage && !user && (
                <button 
                  onClick={() => router.push('/sign-in')}
                  className="hidden md:block font-semibold transition-all duration-300 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg whitespace-nowrap text-sm"
                >
                  {t('buttons.login')}
                </button>
              )}

              {/* 데스크톱용 사용자 정보 - 데스크톱에서만 표시 */}
              {isMainPage && user && (
                <div className="hidden md:flex items-center gap-2">
                  {/* 포인트 표시 */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <span className="w-3 h-3 bg-blue-600 dark:bg-blue-400 text-white text-xs font-bold rounded-full flex items-center justify-center">P</span>
                    <span className="text-blue-700 dark:text-blue-300 text-xs font-bold">{userPoints.toLocaleString()}</span>
                  </div>
                  
                  {/* 로그아웃 버튼 */}
                  <button 
                    onClick={() => handleLogout()}
                    className="font-semibold transition-all duration-300 text-gray-800 dark:text-gray-200 hover:text-red-500 whitespace-nowrap text-sm px-2"
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
                      handleMainNavClick('me')
                    }}
                    className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer ${
                      activeMainTab === 'me' ? 'bg-purple-100 dark:bg-purple-900/30' : ''
                    }`}
                  >
                    <Users className={`flex-shrink-0 transition-all duration-300 ${
                      activeMainTab === 'me' 
                        ? 'text-purple-700 dark:text-purple-400 w-5 h-5' 
                        : 'text-gray-600 dark:text-gray-300 w-4 h-4'
                    }`} style={{
                      ...(activeMainTab === 'me' ? { strokeWidth: 2.5 } : { strokeWidth: 2 })
                    }} />
                  </Button>
                  
                  {/* 인증 상태 표시 */}
                  {isAdmin ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <span className="text-purple-600 dark:text-purple-400 text-xs">👑</span>
                    </div>
                  ) : verificationStatus === 'verified' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="text-green-600 dark:text-green-400 text-xs">✅</span>
                    </div>
                  ) : verificationStatus === 'unverified' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-600 dark:text-amber-400 text-xs">⚠️</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 text-xs animate-pulse">⏳</span>
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
                  onClick={() => router.push('/main')}
                  className="md:hidden px-2 py-0 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded transition-all duration-300 flex items-center gap-0.5"
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
                  className="hidden md:block font-semibold transition-all duration-300 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 px-3 sm:px-4 py-1 sm:py-1.5 text-base rounded-lg shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  {t('header.startButton')}
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <div className={`fixed inset-0 z-[70] transition-all duration-300 ${
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
          <div className="pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4 space-y-1 sm:space-y-2 max-h-80 sm:max-h-96 overflow-y-auto scroll-smooth-touch scrollbar-hide">
            {/* 메인 메뉴 */}
            <div className="space-y-1">
              {/* 홈으로 */}
              <Link 
                href="/"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
                onClick={toggleMobileMenu}
              >
                <span className="text-base">🏠</span>
                <span className="text-sm font-medium">{language === 'ko' ? '홈으로' : 'Inicio'}</span>
              </Link>

              {/* 도움말 / FAQ */}
              <Link 
                href="/faq"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
                onClick={toggleMobileMenu}
              >
                <span className="text-base">❓</span>
                <span className="text-sm font-medium">{language === 'ko' ? 'FAQ / 도움말' : 'FAQ / Ayuda'}</span>
              </Link>

              {/* 문의하기 */}
              <button
                onClick={() => {
                  setIsInquiryModalOpen(true)
                  toggleMobileMenu()
                }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300 w-full text-left"
              >
                <span className="text-base">📧</span>
                <span className="text-sm font-medium">{language === 'ko' ? '문의하기' : 'Contacto'}</span>
              </button>

              {/* 제휴문의 */}
              <button
                onClick={() => {
                  setIsPartnershipModalOpen(true)
                  toggleMobileMenu()
                }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300 w-full text-left"
              >
                <span className="text-base">🤝</span>
                <span className="text-sm font-medium">{language === 'ko' ? '제휴문의' : 'Colaboración'}</span>
              </button>
            </div>
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

            {/* SNS 링크 */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2.5 mb-2">
                {language === 'ko' ? 'SNS' : 'Redes Sociales'}
              </div>
              
              <a 
                href="https://www.tiktok.com/@amiko_latin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
              >
                <img src="/social/tiktok.png" alt="TikTok" className="w-5 h-5 object-contain" />
                <span className="text-sm font-medium">TikTok</span>
              </a>

              <a 
                href="https://www.instagram.com/amiko_latin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
              >
                <img src="/social/instagram.jpeg" alt="Instagram" className="w-5 h-5 object-contain rounded" />
                <span className="text-sm font-medium">Instagram</span>
              </a>

              <a 
                href="https://www.youtube.com/@AMIKO_Officialstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
              >
                <img src="/social/youtube.png" alt="YouTube" className="w-5 h-5 object-contain" />
                <span className="text-sm font-medium">YouTube</span>
              </a>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />

            {/* 앱 정보 */}
            <div className="space-y-1">
              <Link 
                href="/privacy"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
                onClick={toggleMobileMenu}
              >
                <span className="text-base">🔒</span>
                <span className="text-sm font-medium">{language === 'ko' ? '개인정보처리방침' : 'Privacidad'}</span>
              </Link>

              <Link 
                href="/terms"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300"
                onClick={toggleMobileMenu}
              >
                <span className="text-base">📋</span>
                <span className="text-sm font-medium">{language === 'ko' ? '이용약관' : 'Términos'}</span>
              </Link>

              {/* 앱 버전 */}
              <div className="flex items-center gap-3 p-2.5 text-gray-500 dark:text-gray-400">
                <span className="text-base">ℹ️</span>
                <span className="text-xs">v1.0.0</span>
              </div>
            </div>

            {/* 로그인/로그아웃 - 맨 아래 */}
            {user ? (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
                <button
                  onClick={() => {
                    handleLogout()
                    toggleMobileMenu()
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">{language === 'ko' ? '로그아웃' : 'Cerrar Sesión'}</span>
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
                <Link 
                  href="/sign-in"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <span className="text-base">🔐</span>
                  <span className="text-sm font-medium">{t('buttons.login')}</span>
                </Link>
              </>
            )}
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
            
            {/* 푸터 내용 - 모바일에서만 표시 - SNS, 고객지원, 개인정보처리방침은 랜딩페이지 아코디언으로 이동됨 */}
            
            {/* 구분선 */}
            <div className="border-t border-gray-200 my-3" />
          </div>
        </div>
      </div>
      
      {/* 문의 모달 */}
      <InquiryModal 
        isOpen={isInquiryModalOpen} 
        onClose={() => setIsInquiryModalOpen(false)} 
      />
      
      {/* 제휴 모달 */}
      <PartnershipModal 
        isOpen={isPartnershipModalOpen} 
        onClose={() => setIsPartnershipModalOpen(false)} 
      />
    </>
  )
}

export default function Header() {
  return (
    <Suspense fallback={
      <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="flex items-center space-x-4">
            <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>
    }>
      <HeaderContent />
    </Suspense>
  )
}
