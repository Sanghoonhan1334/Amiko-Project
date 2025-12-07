'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // 스크롤 위치 감지
  useEffect(() => {
    const toggleVisibility = () => {
      // 페이지 상단에서 100px 이상 스크롤했을 때 버튼 표시 (더 쉽게 보이도록)
      if (window.pageYOffset > 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // 초기 체크
    toggleVisibility()

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  // 맨 위로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-36 right-2 z-50 sm:bottom-24 sm:right-8 md:bottom-36 md:right-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <Button
        onClick={scrollToTop}
        className="w-11 h-11 sm:w-14 sm:h-14 md:w-14 md:h-14 rounded-full bg-gray-800 hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        size="icon"
        title="맨 위로"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" />
      </Button>
    </div>
  )
}
