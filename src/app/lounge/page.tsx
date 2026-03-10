'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Clock, 
  Users
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'





export default function LoungePage() {
  const { t } = useLanguage()

  // 라운지 페이지 진입 시 URL 파라미터 정리
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('tab')) {
      url.searchParams.delete('tab')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative text-center py-16 px-4">
        <div className="max-w-6xl mx-auto relative">
          {/* 배경 이미지 */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 rounded-3xl"
            style={{ backgroundImage: 'url(/zep.jpg)' }}
          ></div>
          
          {/* 콘텐츠 */}
          <div className="relative z-10 py-16 px-8">
            <div className="text-6xl mb-4">🎈</div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              AMIKO 라운지
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              메타버스를 통한 자유로운 소통 공간<br />
              준비 중입니다
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Clock className="w-5 h-5 text-brand-500" />
                <span>준비 중</span>
              </div>
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Users className="w-5 h-5 text-mint-500" />
                <span>최대 30명</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        {/* 준비중 안내 */}
        <Card className="bg-gradient-to-r from-brand-50 to-mint-50 border-2 border-brand-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Calendar className="w-6 h-6 text-brand-600" />
              준비 중인 서비스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                AMIKO 라운지가 곧 오픈됩니다!
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                함께 모임을 가지게 될 시점에 사용하기 위해 라운지도 만들어갈 예정입니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-brand-500 to-mint-500 text-white border-0">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">
              곧 만나요!
            </h3>
            <p className="text-lg mb-6 opacity-90">
              AMIKO 라운지 오픈 소식을 가장 먼저 받아보세요
            </p>
            <div className="text-white/80 text-sm">
              준비가 완료되면 알려드리겠습니다
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
