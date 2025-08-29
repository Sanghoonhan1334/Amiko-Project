'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  Sparkles, 
  Globe, 
  Mail, 
  MessageSquare, 
  Trophy,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 border-t border-brand-200/50">
      <div className="container mx-auto px-4 py-12">
        {/* 메인 푸터 콘텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* 브랜드 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-mint-500 bg-clip-text text-transparent">
                Amiko
              </div>
              <div className="text-xl animate-pulse">✨</div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              한국과 라틴 아메리카 청년들이 함께하는 
              언어 교류와 문화 체험 플랫폼입니다.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Heart className="w-4 h-4 text-pink-500" />
              <span>Made with love in Korea</span>
            </div>
          </div>

          {/* 지원 링크 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg">지원</h4>
            <div className="space-y-2">
              <Link 
                href="/help" 
                className="flex items-center gap-2 text-gray-600 hover:text-mint-600 transition-colors duration-300 text-sm"
              >
                <Globe className="w-4 h-4" />
                도움말
              </Link>
              <Link 
                href="/faq" 
                className="flex items-center gap-2 text-gray-600 hover:text-mint-600 transition-colors duration-300 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                자주 묻는 질문
              </Link>
              <Link 
                href="/contact" 
                className="flex items-center gap-2 text-gray-600 hover:text-mint-600 transition-colors duration-300 text-sm"
              >
                <Mail className="w-4 h-4" />
                문의하기
              </Link>
              <Link 
                href="/feedback" 
                className="flex items-center gap-2 text-gray-600 hover:text-mint-600 transition-colors duration-300 text-sm"
              >
                <Trophy className="w-4 h-4" />
                피드백
              </Link>
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg">회사</h4>
            <div className="space-y-2">
              <Link 
                href="/about" 
                className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors duration-300 text-sm"
              >
                <Heart className="w-4 h-4" />
                회사 소개
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
            <p className="text-gray-600 text-sm">
              © {currentYear} Amiko. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-brand-600 transition-colors duration-300">
                개인정보처리방침
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-brand-600 transition-colors duration-300">
                이용약관
              </Link>
              <span>•</span>
              <Link href="/cookies" className="hover:text-brand-600 transition-colors duration-300">
                쿠키 정책
              </Link>
            </div>
          </div>

          {/* 소셜 미디어 아이콘 */}
          <div className="flex items-center gap-4">
            <h5 className="text-sm font-medium text-gray-700 mr-2">Follow us:</h5>
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-600 hover:text-pink-700 border border-pink-200 hover:border-pink-300 transition-all duration-300"
                onClick={() => window.open('https://instagram.com', '_blank')}
              >
                <Instagram className="w-4 h-4" />
              </Button>

              {/* Facebook */}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 transition-all duration-300"
                onClick={() => window.open('https://facebook.com', '_blank')}
              >
                <Facebook className="w-4 h-4" />
              </Button>

              {/* YouTube */}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-full bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all duration-300"
                onClick={() => window.open('https://youtube.com', '_blank')}
              >
                <Youtube className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-8 pt-6 border-t border-brand-200/30">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              🌏 한국어 • Español • English • Português
            </p>
            <p className="text-xs text-gray-400">
              Made with <Heart className="w-3 h-3 inline text-pink-400" /> and <Sparkles className="w-3 h-3 inline text-yellow-400" /> 
              for global language learners
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
