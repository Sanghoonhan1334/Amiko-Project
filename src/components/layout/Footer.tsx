'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Heart,
  Menu,
  X
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useState, useEffect } from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useLanguage()
  const [isSupportMenuOpen, setIsSupportMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 다크 모드 감지 (클라이언트 사이드에서만 실행)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // MutationObserver로 다크 모드 변경 감지
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // 테마에 따른 파트너 로고 데이터
  const partnerLogos = isDarkMode ? [
    { id: 1, name: 'Amiko', logo: '/logos/amiko-logo-dark.png' },
    { id: 2, name: 'Para Fans', logo: '/logos/para-fans-logo.jpg' },
    { id: 3, name: 'Acu Point', logo: '/logos/acu-point-logo.jpg' },
    { id: 4, name: 'Partner 4', logo: '/logos/socios-placeholder.jpg' },
    { id: 5, name: 'Partner 5', logo: '/logos/socios-placeholder.jpg' },
    { id: 6, name: 'Partner 6', logo: '/logos/socios-placeholder.jpg' },
  ] : [
    { id: 1, name: 'Amiko', logo: '/logos/amiko-logo.png' },
    { id: 2, name: 'Para Fans', logo: '/logos/para-fans-logo.jpg' },
    { id: 3, name: 'Acu Point', logo: '/logos/acu-point-logo.jpg' },
    { id: 4, name: 'Partner 4', logo: '/logos/socios-placeholder.jpg' },
    { id: 5, name: 'Partner 5', logo: '/logos/socios-placeholder.jpg' },
    { id: 6, name: 'Partner 6', logo: '/logos/socios-placeholder.jpg' },
  ]

  return (
    <footer className="bg-muted/60 dark:bg-gray-800/90 border-t-2 border-border">
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 lg:max-w-6xl lg:mx-auto">
        {/* 메인 푸터 콘텐츠 - 모바일 최적화 */}
        <div className="space-y-6 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 mb-4">
          {/* 모바일: SNS 섹션을 맨 위로 */}
          <div className="md:order-2 space-y-3">
            <h5 className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 text-center">{t('footer.officialSns')}</h5>
            <div className="flex items-center justify-center gap-3">
              {/* TikTok */}
              <a 
                href="https://www.tiktok.com/@amiko_latin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <img 
                  src="/social/tiktok.png" 
                  alt="TikTok" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/amiko_latin/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <img 
                  src="/social/instagram.jpeg" 
                  alt="Instagram" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </a>

              {/* YouTube */}
              <a 
                href="https://www.youtube.com/@AMIKO_Officialstudio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <img 
                  src="/social/youtube.png" 
                  alt="YouTube" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </a>
            </div>
          </div>

          {/* 모바일: 저작권 및 정책 */}
          <div className="md:order-1 space-y-2 text-center md:text-left">
            <div className="text-gray-900 dark:text-gray-100 text-xs md:text-sm font-['Inter'] font-medium">
              © 2025 Amiko. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 font-['Inter'] font-medium">
              <Link href="/privacy" className="hover:text-primary hover:underline transition-all duration-300">
                {t('footer.privacy')}
              </Link>
              <Link href="/terms" className="hover:text-primary hover:underline transition-all duration-300">
                {t('footer.terms')}
              </Link>
              <Link href="/cookies" className="hover:text-primary hover:underline transition-all duration-300">
                {t('footer.cookies')}
              </Link>
            </div>
          </div>

          {/* 모바일: 고객지원 햄버거 메뉴 */}
          <div className="md:order-3 space-y-2 text-center md:text-right">
            {/* 데스크톱: 기존 레이아웃 */}
            <div className="hidden md:block">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm font-['Inter']">{t('footer.support')}</h4>
              <div className="space-y-1 text-right">
                <Link 
                  href="/help" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.help')}
                </Link>
                <Link 
                  href="/faq" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.faq')}
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.contact')}
                </Link>
                <Link 
                  href="/feedback" 
                  className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.feedback')}
                </Link>
              </div>
            </div>

            {/* 모바일: 햄버거 메뉴 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsSupportMenuOpen(!isSupportMenuOpen)}
                className="flex items-center justify-center gap-2 mx-auto bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-['Inter']">{t('footer.support')}</span>
                {isSupportMenuOpen ? (
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              
              {/* 드롭다운 메뉴 */}
              {isSupportMenuOpen && (
                <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3 space-y-2">
                  <Link 
                    href="/help" 
                    className="block text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-purple-400 hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.help')}
                  </Link>
                  <Link 
                    href="/faq" 
                    className="block text-foreground/80 hover:text-primary hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.faq')}
                  </Link>
                  <Link 
                    href="/contact" 
                    className="block text-foreground/80 hover:text-primary hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.contact')}
                  </Link>
                  <Link 
                    href="/feedback" 
                    className="block text-foreground/80 hover:text-primary hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.feedback')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 파트너 로고 섹션 - 최하단 바로 위 */}
        <div className="mt-6 pt-6 border-t border-border/50">
          {/* 로고 그리드 - 반응형 표시 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
            {partnerLogos.slice(0, 6).map((partner) => (
              <div
                key={partner.id}
                className="h-24 md:h-48 flex items-center justify-center"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-full h-full object-contain opacity-50"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                  onError={(e) => {
                    // 로고가 없으면 테마에 맞는 아미코 로고로 대체
                    const target = e.currentTarget;
                    const fallbackLogo = isDarkMode ? '/logos/amiko-logo-dark.png' : '/logos/amiko-logo.png';
                    if (target.src !== window.location.origin + fallbackLogo) {
                      target.src = fallbackLogo;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-['Inter'] font-bold">
              {t('footer.bridgeDescription')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
