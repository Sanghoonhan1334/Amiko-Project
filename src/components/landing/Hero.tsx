'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function Hero() {
  const router = useRouter()
  const { t } = useLanguage()
  const swiperRef = useRef<any>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 z-0 pointer-events-none">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-slate-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-0 flex items-center justify-center min-h-screen px-4 pt-20">
        <div className="w-full max-w-6xl">

          {/* 슬라이더 */}
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            pagination={{
              clickable: true,
              el: '.swiper-pagination',
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active'
            }}
            className="w-full relative z-0 pointer-events-auto"
            onInit={(swiper) => {
              ;(window as any).swiperInstance = swiper
            }}
            onSlideChange={(swiper) => {
              setActiveSlide(swiper.activeIndex)
              ;(window as any).swiperInstance = swiper
              window.dispatchEvent(new CustomEvent('slideChanged', { 
                detail: { activeIndex: swiper.activeIndex } 
              }))
            }}
          >
            {/* 첫 번째 슬라이드 - 홈 (사진과 동일하게) */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col">
                {/* 상단 메인 콘텐츠 */}
                <div className="flex flex-col lg:flex-row items-center justify-between py-16 sm:py-20 md:py-24 lg:py-32 gap-8 lg:gap-12">
                  {/* 왼쪽 콘텐츠 */}
                  <div className="flex-1 max-w-2xl text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 border border-blue-200/30">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <span className="text-blue-700 font-medium text-xs sm:text-sm">{t('heroSlides.slide1.badge')}</span>
                    </div>
                    
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                      {t('heroSlides.slide1.title')}
                    </h1>
                    
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                      {t('heroSlides.slide1.description')}
                    </p>
                  </div>

                  {/* 오른쪽 이미지 영역 */}
                  <div className="flex-1 flex justify-center items-center">
                    <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="text-4xl sm:text-5xl md:text-6xl">🎥</div>
                    </div>
                  </div>
                </div>

                {/* 하단 흰색 배경 섹션 */}
                <div className="bg-white py-6 sm:py-8">
                  <div className="container-custom max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
                      {/* 왼쪽: 큰 텍스트 */}
                      <div className="flex-1 flex justify-center lg:justify-start">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-normal text-gray-900 leading-tight mt-8 lg:mt-12 font-['Noto_Sans_KR'] text-center lg:text-left">
                          {t('heroSlides.slide1.subtitle').split('\n').map((line, index) => (
                            <span key={index}>
                              {line}
                              {index === 0 && <br />}
                            </span>
                          ))}
                        </h2>
                      </div>

                      {/* 오른쪽: 작은 텍스트들 */}
                      <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                          • {t('heroSlides.slide1.features.curriculum')}
                        </p>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                          • {t('heroSlides.slide1.features.education')}
                        </p>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                          • {t('heroSlides.slide1.features.experience')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 홈 (커뮤니티 서비스) */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col py-12 sm:py-16 md:py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                  {/* 메인 레이아웃 */}
                  <div className="space-y-6 sm:space-y-8">
                    {/* 왼쪽 섹션 */}
                    <div className="space-y-6 sm:space-y-8 pt-12 sm:pt-16 md:pt-20">
                      {/* 제목 섹션 */}
                      <div className="text-center lg:text-left">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-normal text-gray-900 mb-3 sm:mb-4">
                          {t('heroSlides.slide2.subtitle')}
                        </h2>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                          {t('heroSlides.slide2.title')}
                        </h1>
                        <div className="w-32 sm:w-40 md:w-48 h-1 bg-purple-300 mb-4 sm:mb-6 mx-auto lg:mx-0"></div>
                        <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0">
                          {t('heroSlides.slide2.description')}
                        </p>
                      </div>
                      
                      {/* 왼쪽 아래 2개 카드 */}
                      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mt-12 sm:mt-16 md:mt-20">
                        {/* K-Trend 카드 */}
                        <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto md:mx-0">
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">01</span>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-10 sm:w-20 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
                              {/* 직사각형 문서 모양 */}
                              <div className="w-12 h-8 sm:w-14 sm:h-10 bg-white border-2 border-gray-800 rounded-lg relative">
                                {/* 가로선들 */}
                                <div className="absolute top-1 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-2 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-3 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-4 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-5 left-1 right-1 h-0.5 bg-gray-400"></div>
                                {/* 노란색 사각형 */}
                                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-sm"></div>
                              </div>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('heroSlides.slide2.ktrend.title')}</h3>
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                              {t('heroSlides.slide2.ktrend.description')}
                            </p>
                          </div>
                        </div>
                        
                        {/* 자유게시판 카드 */}
                        <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto md:mx-0">
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">02</span>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-10 sm:w-20 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
                              {/* 직사각형 말풍선 모양 */}
                              <div className="w-12 h-8 sm:w-14 sm:h-10 bg-white border-2 border-gray-800 rounded-lg relative">
                                {/* 말풍선 안의 텍스트 라인들 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="flex flex-col space-y-0.5">
                                    <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-4 h-0.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-5 h-0.5 bg-gray-400 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('heroSlides.slide2.freeboard.title')}</h3>
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                              {t('heroSlides.slide2.freeboard.description')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Q&A 카드 */}
                    <div className="flex justify-center lg:justify-end">
                      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto lg:mx-0">
                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">03</span>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-10 sm:w-20 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            {/* 검은색 테두리 말풍선 */}
                            <div className="w-12 h-8 sm:w-14 sm:h-10 border-2 border-gray-800 rounded-lg relative bg-white">
                              {/* 말풍선 꼬리 */}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-800"></div>
                              {/* 물음표 */}
                              <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg sm:text-xl">?</div>
                            </div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('heroSlides.slide2.qna.title')}</h3>
                          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                            {t('heroSlides.slide2.qna.description')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

          </Swiper>

          {/* 커스텀 네비게이션 버튼 - 큰 버전 */}
          <button 
            onClick={() => {
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slidePrev()
              }
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-2xl hover:scale-110 transition-all duration-300 group pointer-events-auto"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-blue-600 transition-colors" />
          </button>
          
          <button 
            onClick={() => {
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideNext()
              }
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-2xl hover:scale-110 transition-all duration-300 group pointer-events-auto"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* 커스텀 페이지네이션 */}
          <div className="swiper-pagination !bottom-8 !flex !justify-center !gap-2">
            <style jsx>{`
              .swiper-pagination-bullet {
                width: 12px !important;
                height: 12px !important;
                background: rgba(156, 163, 175, 0.5) !important;
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
              }
              .swiper-pagination-bullet-active {
                background: #3b82f6 !important;
                transform: scale(1.2) !important;
              }
            `}</style>
          </div>

          {/* 슬라이드 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-0 pointer-events-auto">
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideTo(0)
                }
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                activeSlide === 0 ? 'bg-blue-600 scale-125' : 'bg-gray-400'
              }`}
            />
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideTo(1)
                }
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                activeSlide === 1 ? 'bg-blue-600 scale-125' : 'bg-gray-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 비디오 모달 */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl aspect-video">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <iframe
              src="https://www.youtube.com/embed/6BdrKjSMBJY?autoplay=1"
              title="Amiko 소개 영상"
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  )
}

