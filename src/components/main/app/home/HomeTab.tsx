'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import {
  Video,
  MessageSquare,
  Gift,
  ArrowRight
} from 'lucide-react'

export default function HomeTab() {
  // const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="relative py-8">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-8 w-20 h-20 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-12 w-16 h-16 bg-purple-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-1/4 w-18 h-18 bg-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 relative z-10">
        {/* 제목 섹션 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-['Inter']">{t('mainPage.title')}</h2>
          <div className="w-16 h-1 bg-purple-300 mx-auto rounded-full"></div>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AI 화상 채팅 카드 */}
          <Card className="p-4 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="mb-0">
              {/* AI 화상 채팅 이미지 */}
              <div className="relative w-24 h-20 mx-auto mb-0 -mb-2">
                <img 
                  src="/화상채팅.jpg" 
                  alt="AI 화상 채팅" 
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-0 mt-1 font-['Inter']">{t('mainPage.videoCall')}</h3>
            <p className="text-sm text-gray-600 -mt-1 font-['Inter']">{t('mainPage.videoCallDescription')}</p>
            <div className="mt-2">
              <Badge className="bg-blue-500 text-white border-blue-500 text-xs whitespace-normal text-center leading-tight">
{t('homeTab.openingOctober')}
              </Badge>
            </div>
          </Card>

          {/* 커뮤니티 카드 */}
          <Card className="p-4 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="mb-0">
              {/* 커뮤니티 이미지 */}
              <div className="relative w-24 h-20 mx-auto mb-0">
                <img 
                  src="/커뮤니티.jpeg" 
                  alt="커뮤니티" 
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-0 mt-1 font-['Inter']">{t('homeTab.community')}</h3>
            <p className="text-sm text-gray-600 -mt-1 font-['Inter']">
              {t('mainPage.communityDescription').split('\n').map((line, index) => (
                <span key={index}>
                  {line}
                  {index < t('mainPage.communityDescription').split('\n').length - 1 && <br />}
                </span>
              ))}
            </p>
          </Card>

          {/* 오픈 기념 이벤트 카드 */}
          <Card className="p-4 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden">
            {/* 이벤트 리본 */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-pink-500"></div>
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 text-white border-red-500 text-xs">
                {t('mainPage.eventBadge')}
              </Badge>
            </div>
            
            <div className="mb-0 mt-4">
              {/* 빨간색 리본 배너 */}
              <div className="relative w-24 h-16 mx-auto mb-0">
                {/* 리본 본체 */}
                <div className="absolute inset-0 bg-red-500 rounded-lg shadow-lg transform rotate-3">
                  {/* 3D 효과를 위한 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-lg"></div>
                  {/* 접힌 부분 */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-red-600 transform rotate-45 origin-top-right"></div>
                </div>
                {/* EVENT 텍스트 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg tracking-wider font-['Inter']">{t('mainPage.eventBadge')}</span>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-0 mt-1 font-['Inter']">{t('mainPage.openEvent')}</h3>
            <p className="text-sm text-gray-600 mt-1 font-['Inter']">{t('mainPage.openEventDescription')}<br />
            <span className="text-xs text-gray-500 font-['Inter']">{t('mainPage.openEventNote')}</span></p>
          </Card>
        </div>


      </div>
    </div>
  )
}
