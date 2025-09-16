'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Heart
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useLanguage()

  return (
    <footer className="bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 border-t border-brand-200/50">
      <div className="container mx-auto px-4 py-8">
        {/* 메인 푸터 콘텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 브랜드 섹션 */}
          <div>
            <div className="flex items-end gap-2 -mt-8 mb-0">
              <div className="flex items-center gap-2">
                <img 
                  src="/amiko-foto.png" 
                  alt="Amiko" 
                  className="h-32 w-auto object-contain"
                  style={{ maxHeight: '128px' }}
                />
              </div>
            </div>
            <p className="text-gray-700 text-base leading-relaxed -mt-8 font-['Inter'] font-semibold">
              {t('footer.bridgeDescription')}
            </p>
          </div>

          {/* 지원 링크 */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg font-['Inter']">{t('footer.support')}</h4>
            <div className="space-y-3">
              <Link 
                href="/help" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium py-1"
              >
                {t('footer.help')}
              </Link>
              <Link 
                href="/faq" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium py-1"
              >
                {t('footer.faq')}
              </Link>
              <Link 
                href="/contact" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium py-1"
              >
                {t('footer.contact')}
              </Link>
              <Link 
                href="/feedback" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium py-1"
              >
                {t('footer.feedback')}
              </Link>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-brand-200/50 my-8" />

        {/* 하단 섹션 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* 저작권 */}
          <div className="text-center md:text-left">
            <p className="text-gray-700 text-sm flex items-center gap-2 justify-center md:justify-start font-['Inter'] font-medium">
              <span>© {currentYear}</span>
              <img 
                src="/amiko-foto.png" 
                alt="Amiko" 
                className="h-4 w-auto object-contain"
                style={{ maxHeight: '16px' }}
              />
              <span>. {t('footer.copyright').replace('© 2025 Amiko. ', '')}</span>
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 font-['Inter'] font-medium">
              <Link href="/privacy" className="hover:text-brand-600 transition-colors duration-300">
                {t('footer.privacy')}
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-brand-600 transition-colors duration-300">
                {t('footer.terms')}
              </Link>
              <span>•</span>
              <Link href="/cookies" className="hover:text-brand-600 transition-colors duration-300">
                {t('footer.cookies')}
              </Link>
            </div>
          </div>

          {/* 소셜 미디어 아이콘 */}
          <div className="flex items-center gap-6">
            <h5 className="text-lg font-bold text-gray-800 mr-4 font-['Inter']">{t('footer.officialSns')}</h5>
            <div className="flex items-center gap-4">
              {/* TikTok */}
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 p-0 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => window.open('https://tiktok.com', '_blank')}
              >
                <img 
                  src="/tictok.png" 
                  alt="TikTok" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </Button>

              {/* Instagram */}
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 p-0 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => window.open('https://instagram.com', '_blank')}
              >
                <img 
                  src="/instagram.jpeg" 
                  alt="Instagram" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </Button>

              {/* YouTube */}
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 p-0 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => window.open('https://youtube.com', '_blank')}
              >
                <img 
                  src="/youtube.png" 
                  alt="YouTube" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 pt-6 border-t border-brand-200/30">
          <div className="text-center">
            <p className="text-base text-gray-700 font-['Inter'] font-bold">
              Amiko
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
