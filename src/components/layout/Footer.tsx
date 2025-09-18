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
        {/* 메인 푸터 콘텐츠 - 3열 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 왼쪽: 저작권 및 정책 */}
          <div className="space-y-3 mx-auto max-w-fit ml-auto mr-4">
            <div className="text-gray-700 text-sm font-['Inter'] font-medium">
              © 2025 Amiko. All rights reserved.
            </div>
            <div className="space-y-1 text-xs text-gray-600 font-['Inter'] font-medium">
              <Link href="/privacy" className="block hover:text-brand-600 transition-colors duration-300">
                {t('footer.privacy')}
              </Link>
              <Link href="/terms" className="block hover:text-brand-600 transition-colors duration-300">
                {t('footer.terms')}
              </Link>
              <Link href="/cookies" className="block hover:text-brand-600 transition-colors duration-300">
                {t('footer.cookies')}
              </Link>
            </div>
          </div>

          {/* 가운데: 고객지원 */}
          <div className="space-y-3 mx-auto max-w-fit">
            <h4 className="font-bold text-gray-800 text-lg font-['Inter']">{t('footer.support')}</h4>
            <div className="space-y-2">
              <Link 
                href="/help" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium"
              >
                {t('footer.help')}
              </Link>
              <Link 
                href="/faq" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium"
              >
                {t('footer.faq')}
              </Link>
              <Link 
                href="/contact" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium"
              >
                {t('footer.contact')}
              </Link>
              <Link 
                href="/feedback" 
                className="block text-gray-700 hover:text-mint-600 transition-colors duration-300 text-sm font-['Inter'] font-medium"
              >
                {t('footer.feedback')}
              </Link>
            </div>
          </div>

          {/* 오른쪽: AMIKO 공식 SNS */}
          <div className="space-y-3">
            <h5 className="text-lg font-bold text-gray-800 font-['Inter']">{t('footer.officialSns')}</h5>
            <div className="flex items-center gap-4">
              {/* TikTok */}
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 p-0 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-white"
                onClick={() => window.open('https://www.tiktok.com/@amiko_latin', '_blank')}
              >
                <img 
                  src="/tictok.png" 
                  alt="TikTok" 
                  className="w-full h-full object-cover rounded-xl"
                />
              </Button>

              {/* Instagram */}
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 p-0 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-white"
                onClick={() => window.open('https://www.instagram.com/amiko_latin/', '_blank')}
              >
                <img 
                  src="/instagram.jpeg" 
                  alt="Instagram" 
                  className="w-full h-full object-cover rounded-xl"
                />
              </Button>

              {/* YouTube */}
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 p-0 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-white"
                onClick={() => window.open('https://www.youtube.com/@AMIKO_Officialstudio', '_blank')}
              >
                <img 
                  src="/youtube.png" 
                  alt="YouTube" 
                  className="w-full h-full object-cover rounded-xl"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 pt-6 border-t border-brand-200/30">
          <div className="text-center">
            <p className="text-base text-gray-700 font-['Inter'] font-bold">
              {t('footer.bridgeDescription')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
