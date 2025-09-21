'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Heart,
  Menu,
  X
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useState } from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useLanguage()
  const [isSupportMenuOpen, setIsSupportMenuOpen] = useState(false)

  return (
    <footer className="hidden md:block bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 border-t border-brand-200/50">
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 lg:max-w-6xl lg:mx-auto">
        {/* 메인 푸터 콘텐츠 - 모바일 최적화 */}
        <div className="space-y-6 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 mb-4">
          {/* 모바일: SNS 섹션을 맨 위로 */}
          <div className="md:order-2 space-y-3">
            <h5 className="text-sm md:text-base font-bold text-gray-800 text-center">{t('footer.officialSns')}</h5>
            <div className="flex items-center justify-center gap-3">
              {/* TikTok */}
              <a 
                href="https://www.tiktok.com/@amiko_latin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <img 
                  src="/tiktok.png" 
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
                  src="/instagram.jpeg" 
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
                  src="/youtube.png" 
                  alt="YouTube" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </a>
            </div>
          </div>

          {/* 모바일: 저작권 및 정책 */}
          <div className="md:order-1 space-y-2 text-center md:text-left">
            <div className="text-gray-700 text-xs md:text-sm font-['Inter'] font-medium">
              © 2025 Amiko. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-600 font-['Inter'] font-medium">
              <Link href="/privacy" className="hover:text-brand-600 hover:underline transition-all duration-300">
                {t('footer.privacy')}
              </Link>
              <Link href="/terms" className="hover:text-brand-600 hover:underline transition-all duration-300">
                {t('footer.terms')}
              </Link>
              <Link href="/cookies" className="hover:text-brand-600 hover:underline transition-all duration-300">
                {t('footer.cookies')}
              </Link>
            </div>
          </div>

          {/* 모바일: 고객지원 햄버거 메뉴 */}
          <div className="md:order-3 space-y-2 text-center md:text-right">
            {/* 데스크톱: 기존 레이아웃 */}
            <div className="hidden md:block">
              <h4 className="font-bold text-gray-800 text-sm font-['Inter']">{t('footer.support')}</h4>
              <div className="space-y-1 text-right">
                <Link 
                  href="/help" 
                  className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.help')}
                </Link>
                <Link 
                  href="/faq" 
                  className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.faq')}
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.contact')}
                </Link>
                <Link 
                  href="/feedback" 
                  className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-xs font-['Inter'] font-medium"
                >
                  {t('footer.feedback')}
                </Link>
              </div>
            </div>

            {/* 모바일: 햄버거 메뉴 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsSupportMenuOpen(!isSupportMenuOpen)}
                className="flex items-center justify-center gap-2 mx-auto bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <span className="text-sm font-bold text-gray-800 font-['Inter']">{t('footer.support')}</span>
                {isSupportMenuOpen ? (
                  <X className="w-4 h-4 text-gray-600" />
                ) : (
                  <Menu className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              {/* 드롭다운 메뉴 */}
              {isSupportMenuOpen && (
                <div className="mt-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3 space-y-2">
                  <Link 
                    href="/help" 
                    className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.help')}
                  </Link>
                  <Link 
                    href="/faq" 
                    className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.faq')}
                  </Link>
                  <Link 
                    href="/contact" 
                    className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.contact')}
                  </Link>
                  <Link 
                    href="/feedback" 
                    className="block text-gray-700 hover:text-mint-600 hover:underline transition-all duration-300 text-sm font-['Inter'] font-medium py-1"
                    onClick={() => setIsSupportMenuOpen(false)}
                  >
                    {t('footer.feedback')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-brand-200/30">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-700 font-['Inter'] font-bold">
              {t('footer.bridgeDescription')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
