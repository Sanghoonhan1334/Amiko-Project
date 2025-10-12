'use client'

import React, { useState, useEffect } from 'react'
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
  const { t } = useLanguage()
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full">
        {/* 로딩 스피너 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* 외부 원 */}
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-600 rounded-full animate-spin border-t-purple-500"></div>
            {/* 내부 원 */}
            <div className="absolute inset-2 w-12 h-12 border-2 border-gray-100 dark:border-gray-500 rounded-full animate-spin border-t-pink-500" style={{ animationDirection: 'reverse' }}></div>
            {/* 중앙 점 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 ease-out"
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
            <span>로딩중</span>
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          </div>
        </div>

        {/* 하단 장식 */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
