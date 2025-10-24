'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'

export default function FortuneLoadingPage() {
  const router = useRouter()
  const [loadingText, setLoadingText] = useState('Analizando tu estado emocional...')
  
  const loadingMessages = [
    'Analizando tu estado emocional...',
    'Revisando tu energía personal...',
    'Descifrando tu personalidad...',
    'Calculando tu fortuna...',
    'Preparando tu destino...'
  ]

  useEffect(() => {
    let messageIndex = 0
    
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length
      setLoadingText(loadingMessages[messageIndex])
    }, 2000)

    // 10초 후 결과 페이지로 이동
    const timeout = setTimeout(() => {
      router.push('/quiz/fortune/result')
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#FDF4E6] flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* 포춘쿠키 메인 아이콘 */}
        <div className="relative mb-8">
          <div className="w-32 h-32 flex items-center justify-center">
            <span className="text-6xl">🥠</span>
          </div>
          
          {/* 포춘쿠키 주변 애니메이션 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 border-2 border-[#FFB74D] rounded-full animate-pulse opacity-50"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border border-[#FFB74D] rounded-full animate-ping opacity-30"></div>
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Leyendo tu fortuna...
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            {loadingText}
          </p>
          <p className="text-sm text-gray-500">
            Por favor espera un momento
          </p>
        </div>

        {/* 로딩 애니메이션 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[#F7A74B] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[#F7A74B] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-[#F7A74B] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* 포춘쿠키 작은 아이콘들 */}
        <div className="flex space-x-4 opacity-60">
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-lg">🥠</span>
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-lg">🥠</span>
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-lg">🥠</span>
          </div>
        </div>

        {/* 진행 표시 */}
        <div className="mt-8 w-64">
          <div className="w-full h-2 bg-[#FFB74D] rounded-full overflow-hidden">
            <div className="h-full bg-[#F7A74B] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
