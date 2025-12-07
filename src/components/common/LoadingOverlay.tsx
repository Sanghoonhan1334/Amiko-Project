'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  showProgress?: boolean
  progress?: number
  minDisplayTime?: number // 최소 표시 시간 (ms)
}

export default function LoadingOverlay({ 
  isVisible, 
  message, 
  showProgress = false, 
  progress = 0,
  minDisplayTime = 300 // 기본 300ms
}: LoadingOverlayProps) {
  const { t, language } = useLanguage()
  const [shouldShow, setShouldShow] = useState(false)
  const [showStartTime, setShowStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true)
      setShowStartTime(Date.now())
    } else if (shouldShow) {
      // 최소 표시 시간 확보
      const elapsed = showStartTime ? Date.now() - showStartTime : minDisplayTime
      const remainingTime = Math.max(0, minDisplayTime - elapsed)
      
      const timer = setTimeout(() => {
        setShouldShow(false)
        setShowStartTime(null)
      }, remainingTime)
      
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, minDisplayTime])

  if (!shouldShow) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full relative">
        {/* 로고 - 맨 위에 배치, 하얀색 배경으로 덮음 */}
        <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl pt-6 pb-4 -mt-8 -mx-8 px-8 z-10">
          <div className="flex justify-center">
            <Image
              src="/logos/amiko-logo.png"
              alt="AMIKO"
              width={120}
              height={120}
              className="block dark:hidden w-24 h-24 object-contain"
              priority
            />
            <Image
              src="/logos/amiko-logo-dark.png"
              alt="AMIKO"
              width={120}
              height={120}
              className="hidden dark:block w-24 h-24 object-contain"
              priority
            />
          </div>
        </div>

        {/* 콘텐츠 영역 - 로고 아래에 배치 */}
        <div className="mt-20">
          {/* 로딩 스피너 */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full animate-spin border-t-gray-600 dark:border-t-gray-400"></div>
          </div>

          {/* 메시지 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {message || t('common.loading')}
            </h3>
            
            {/* 진행률 표시 */}
            {showProgress && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* 애니메이션 텍스트 */}
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>{language === 'es' ? 'Cargando' : '로딩중'}</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
