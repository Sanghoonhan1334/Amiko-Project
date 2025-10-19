'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import Image from 'next/image'

export default function CustomBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 프로덕션 환경에서만 배너 표시
    if (process.env.NODE_ENV === 'production') {
      setIsVisible(true)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* 왼쪽: Amiko 로고와 텍스트 */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Image
                src="/amiko-logo.png"
                alt="Amiko"
                width={24}
                height={24}
                className="rounded-full bg-white p-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                Amiko - 한국 문화 교류 플랫폼
              </span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </div>
          </div>

          {/* 오른쪽: 닫기 버튼 */}
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="배너 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
