'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { 
  Star,
  TrendingUp,
  BookOpen,
  Newspaper,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Highlights from './Highlights'
import TodayHotPosts from './TodayHotPosts'
import RandomStories from './RandomStories'
import TodayNews from './TodayNews'

export default function HomeTab() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const swiperRef = useRef<any>(null)

  useEffect(() => {
    // 초기 로딩 완료
    setLoading(false)
  }, [])

  return (
    <div className="relative">
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.home-swiper-button-next',
          prevEl: '.home-swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          el: '.home-swiper-pagination',
          bulletClass: 'home-swiper-pagination-bullet',
          bulletActiveClass: 'home-swiper-pagination-bullet-active'
        }}
        className="w-full"
      >
        {/* 첫 번째 슬라이드 - 기존 콘텐츠 */}
        <SwiperSlide>
          <div className="space-y-8">
            {/* 1. 주간 하이라이트 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">주간 하이라이트</h3>
                    <p className="text-gray-600 text-sm">이번 주 추천 콘텐츠</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                  운영팀 추천
                </Badge>
              </div>
              <Highlights />
              <div className="mt-6 text-center">
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  전체보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* 2. 오늘의 뉴스 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">오늘의 뉴스</h3>
                    <p className="text-gray-600 text-sm">지금 알아야 할 소식</p>
                  </div>
                </div>
              </div>
              <TodayNews />
              <div className="mt-6 text-center">
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  뉴스 더보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* 3. 오늘의 인기글 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">오늘의 인기글</h3>
                    <p className="text-gray-600 text-sm">실시간 인기 차트</p>
                  </div>
                </div>
              </div>
              <TodayHotPosts />
              <div className="mt-6 text-center">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  더 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* 4. 인기 스토리 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">인기 스토리</h3>
                    <p className="text-gray-600 text-sm">커뮤니티 스토리</p>
                  </div>
                </div>
              </div>
              <RandomStories />
            </Card>
          </div>
        </SwiperSlide>

        {/* 두 번째 슬라이드 - 새로운 콘텐츠 */}
        <SwiperSlide>
          <div className="space-y-8">
            {/* 새로운 콘텐츠 섹션들 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">추천 콘텐츠</h3>
                    <p className="text-gray-600 text-sm">맞춤형 추천</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">한국 문화 체험</h4>
                  <p className="text-gray-600 text-sm">한국의 전통과 현대를 경험해보세요</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">언어 교환</h4>
                  <p className="text-gray-600 text-sm">한국어와 스페인어를 함께 배워보세요</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">특별 이벤트</h3>
                    <p className="text-gray-600 text-sm">진행 중인 이벤트</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-3">🎉 Amiko 특별 이벤트</h4>
                <p className="text-gray-700 mb-4">
                  지금 참여하고 특별한 혜택을 받아보세요!
                </p>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  이벤트 참여하기
                </Button>
              </div>
            </Card>
          </div>
        </SwiperSlide>
      </Swiper>

      {/* 커스텀 네비게이션 버튼 */}
      <div className="home-swiper-button-prev !w-12 !h-12 !bg-white/90 !backdrop-blur-sm !rounded-full !text-gray-700 hover:!bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
        <ChevronLeft className="w-6 h-6" />
      </div>
      <div className="home-swiper-button-next !w-12 !h-12 !bg-white/90 !backdrop-blur-sm !rounded-full !text-gray-700 hover:!bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
        <ChevronRight className="w-6 h-6" />
      </div>

      {/* 커스텀 페이지네이션 */}
      <div className="home-swiper-pagination !bottom-8 !flex !justify-center !gap-2">
        <style jsx>{`
          .home-swiper-pagination-bullet {
            width: 12px !important;
            height: 12px !important;
            background: rgba(156, 163, 175, 0.5) !important;
            border-radius: 50% !important;
            transition: all 0.3s ease !important;
          }
          .home-swiper-pagination-bullet-active {
            background: #3b82f6 !important;
            transform: scale(1.2) !important;
          }
        `}</style>
      </div>
    </div>
  )
}
