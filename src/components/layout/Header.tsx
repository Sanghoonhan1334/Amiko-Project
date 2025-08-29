'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { translations } from '@/lib/translations'
import { 
  Sparkles, 
  Play, 
  Smartphone, 
  Users, 
  Menu, 
  X,
  Home,
  MessageSquare,
  Calendar,
  User,
  Settings,
  Sun,
  Moon,
  Globe
} from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  
  // 언어 상태
  const [language, setLanguage] = useState<'ko' | 'es'>('ko')

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

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // 언어 전환
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ko' ? 'es' : 'ko')
  }

  // SSR 방지 - 스켈레톤 UI 반환
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-mint-500 bg-clip-text text-transparent">
              Amiko
            </div>
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  // 현재 페이지에 따른 버튼 표시 조건
  const isMainPage = pathname === '/main'
  const isLoungePage = pathname === '/lounge'
  const isAuthPage = pathname === '/sign-up' || pathname === '/sign-in' || pathname === '/verify'
  const isLandingPage = pathname === '/'

  return (
    <>
      {/* 데스크톱 헤더 */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 좌측 로고 */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-mint-500 bg-clip-text text-transparent group-hover:from-brand-600 group-hover:to-mint-600 transition-all duration-300">
                Amiko
              </div>
              <div className="text-xl animate-pulse group-hover:animate-bounce">
                ✨
              </div>
            </Link>

            {/* 중앙: 언어 전환 */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* 언어 전환 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="px-2 py-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                title={language === 'ko' ? translations.ko.changeToSpanish : translations.es.changeToKorean}
              >
                <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-600" />
                <span className="text-xs md:text-sm font-medium">
                  {language === 'ko' ? translations.ko.korean : translations.es.spanish}
                </span>
              </Button>
            </div>

            {/* 우측 버튼들 */}
            <div className="hidden md:flex items-center gap-3">
              {/* 메인페이지 버튼 - 라운지 페이지에서만 표시 */}
              {isLoungePage && (
                <Button 
                  asChild
                  variant="ghost" 
                  className="text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-all duration-300"
                >
                  <Link href="/main">
                    <Home className="w-4 h-4 mr-2" />
                    {translations[language].mainPage}
                  </Link>
                </Button>
              )}
              
              {/* 랜딩페이지 버튼 - 메인 페이지에서만 표시 */}
              {!isLandingPage && !isLoungePage && (
                <Button 
                  asChild
                  variant="ghost" 
                  className="text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-all duration-300"
                >
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    {translations[language].landingPage}
                  </Link>
                </Button>
              )}
              
              {/* 시작하기 버튼 - 랜딩 페이지에서만 표시 */}
              {isLandingPage && (
                <Button 
                  asChild
                  variant="ghost" 
                  className="text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-all duration-300"
                >
                  <Link href="/main">
                    <Play className="w-4 h-4 mr-2" />
                    {translations[language].start}
                  </Link>
                </Button>
              )}
              

              
              {/* 라운지 버튼 - 항상 표시하되, 현재 페이지일 때는 다른 스타일 */}
              <Button 
                asChild
                className={isLoungePage 
                  ? "bg-gray-100 text-gray-500 cursor-default shadow-none hover:scale-100" 
                  : "bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                }
                disabled={isLoungePage}
              >
                <Link href="/lounge">
                  <Users className="w-4 h-4 mr-2" />
                  라운지
                </Link>
              </Button>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-700 hover:text-brand-600"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* 배경 오버레이 */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          
          {/* 메뉴 패널 */}
          <div className="absolute right-0 top-16 w-64 h-full bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/50">
            <div className="p-6 space-y-4">
              {/* 메인 메뉴 */}
              <div className="space-y-2">
                {/* 메인페이지 - 라운지 페이지에서만 표시 */}
                {isLoungePage && (
                  <Link 
                    href="/main" 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-gray-700 hover:text-brand-600 transition-all duration-300"
                    onClick={toggleMobileMenu}
                  >
                    <Home className="w-5 h-5" />
                    {translations[language].mainPage}
                  </Link>
                )}
                
                {/* 랜딩페이지 - 메인 페이지에서만 표시 */}
                {!isLandingPage && !isLoungePage && (
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-gray-700 hover:text-brand-600 transition-all duration-300"
                    onClick={toggleMobileMenu}
                  >
                    <Home className="w-5 h-5" />
                    {translations[language].landingPage}
                  </Link>
                )}
                
                {/* 시작하기 - 랜딩 페이지에서만 표시 */}
                {isLandingPage && (
                  <Link 
                    href="/main" 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-brand-600 bg-brand-50"
                    onClick={toggleMobileMenu}
                  >
                    <Play className="w-5 h-5" />
                    {translations[language].start}
                  </Link>
                )}
                

                
                {/* 라운지 - 항상 표시하되, 현재 페이지일 때는 다른 스타일 */}
                <Link 
                  href="/lounge" 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isLoungePage 
                      ? "bg-gray-100 text-gray-500 cursor-default" 
                      : "bg-gradient-to-r from-brand-500 to-mint-500 text-white shadow-lg hover:from-brand-600 hover:to-mint-600"
                  }`}
                  onClick={toggleMobileMenu}
                >
                  <Users className="w-5 h-5" />
                  라운지
                </Link>
              </div>
              
              {/* 구분선 */}
              <div className="border-t border-gray-200 my-4" />
              
              {/* 언어 전환 */}
              <div className="space-y-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300 w-full text-left"
                >
                  <Globe className="w-5 h-5" />
                  {language === 'ko' ? translations.ko.korean : translations.es.spanish}
                </button>
              </div>
              
              {/* 구분선 */}
              <div className="border-t border-gray-200 my-4" />
              
              {/* 추가 메뉴 */}
              <div className="space-y-2">
                <Link 
                  href="/community" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <MessageSquare className="w-5 h-5" />
                  커뮤니티
                </Link>
                
                <Link 
                  href="/lounge" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <Calendar className="w-5 h-5" />
                  라운지 일정
                </Link>
                
                <Link 
                  href="/profile" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <User className="w-5 h-5" />
                  프로필
                </Link>
                
                <Link 
                  href="/settings" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300"
                  onClick={toggleMobileMenu}
                >
                  <Settings className="w-5 h-5" />
                  설정
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 높이만큼 여백 */}
      <div className="h-16" />
    </>
  )
}
