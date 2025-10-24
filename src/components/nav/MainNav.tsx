'use client'


import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MainNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    if (path.startsWith('#')) {
      const element = document.querySelector(path)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      router.push(path)
    }
    closeMobileMenu()
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center py-4 px-8 shadow-sm bg-white fixed top-0 left-0 right-0 z-50">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity p-1"
        >
          {/* 라이트 모드 로고 */}
          <img 
            src="/logos/amiko-logo.png" 
            alt="Amiko" 
            className="h-8 w-auto object-contain dark:hidden"
          />
          {/* 다크 모드 로고 */}
          <img 
            src="/logos/amiko-logo-dark.png" 
            alt="Amiko" 
            className="h-8 w-auto object-contain hidden dark:block"
          />
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Button
            variant="ghost"
            className="hover:text-indigo-600 transition-colors"
            onClick={() => handleNavigation('/main')}
          >
            서비스 특징
          </Button>
          <Button
            variant="ghost"
            className="hover:text-indigo-600 transition-colors"
            onClick={() => handleNavigation('/booking/create')}
          >
            상담 예약
          </Button>
          <Button
            variant="ghost"
            className="hover:text-indigo-600 transition-colors"
            onClick={() => handleNavigation('#video')}
          >
            소개 영상
          </Button>
        </div>

        {/* 우측 버튼들 */}
        <div className="hidden md:flex items-center space-x-3">
                <Button
                  variant="outline"
                  className="hover:bg-brand-50 hover:border-brand-300 transition-colors"
                            onClick={() => handleNavigation('/main')}
                >
                  시작하기
                </Button>
          <Button
            variant="outline"
            className="hover:bg-mint-50 hover:border-mint-300 transition-colors"
            onClick={() => handleNavigation('/main')}
          >
            앱 열기
          </Button>
          <Button
            variant="outline"
            className="hover:bg-sky-50 hover:border-sky-300 transition-colors"
            onClick={() => handleNavigation('/lounge')}
          >
            라운지
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={closeMobileMenu}>
          <div className="fixed top-16 left-0 right-0 bg-white shadow-lg border-t" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-6 space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start hover:text-indigo-600 transition-colors"
                onClick={() => handleNavigation('/main')}
              >
                서비스 특징
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start hover:text-indigo-600 transition-colors"
                onClick={() => handleNavigation('/booking/create')}
              >
                상담 예약
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start hover:text-indigo-600 transition-colors"
                onClick={() => handleNavigation('#video')}
              >
                소개 영상
              </Button>
              
              {/* 모바일 메뉴에 우측 버튼들 추가 */}
              <div className="border-t pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-brand-50 hover:border-brand-300 transition-colors"
                  onClick={() => handleNavigation('/main')}
                >
                  시작하기
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-mint-50 hover:border-mint-300 transition-colors"
                  onClick={() => handleNavigation('/main')}
                >
                  앱 열기
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-sky-50 hover:border-sky-300 transition-colors"
                  onClick={() => handleNavigation('/lounge')}
                >
                  라운지
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
