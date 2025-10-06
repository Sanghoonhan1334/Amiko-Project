'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight } from 'lucide-react'
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
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-slate-100/40 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-blue-100/20 rounded-full blur-xl"></div>
      </div>

      <div className="container-custom relative z-0 flex items-start justify-center min-h-screen px-0 sm:px-0 md:px-0 pt-24 sm:pt-32 md:pt-36">
        <div className="w-full">

          {/* 슬라이더 */}
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            touchRatio={1}
            touchAngle={45}
            threshold={10}
            longSwipesRatio={0.5}
            longSwipesMs={300}
            followFinger={true}
            allowTouchMove={true}
            resistance={true}
            resistanceRatio={0.85}
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
            className="w-full relative z-0 pointer-events-auto scroll-smooth-touch"
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
            {/* 첫 번째 슬라이드 - Global Community */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col items-center justify-start pt-8 md:justify-start md:pt-[8vh] lg:pt-[10vh]">
                <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
                  <div className="w-full">
                    {/* 상단 텍스트 */}
                    <p className="text-gray-600 text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-1 leading-relaxed">
                      {t('heroSlides.slide1.subtitle')}
                    </p>
                    
                    {/* 메인 제목 */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-2 leading-tight font-['Inter']">
                      {t('heroSlides.slide1.title')}
                    </h1>
                    
                    {/* 하단 설명 */}
                    <p className="text-gray-700 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-0">
                      {t('heroSlides.slide1.description')}
                    </p>
                    
                    {/* 이미지 - 모바일에서는 더 올림, 데스크톱에서는 더 위로 올림 */}
                    <div className="-mt-4 md:-mt-24 lg:-mt-28 flex justify-center">
                      <img 
                        src="/Slide1.png" 
                        alt="Global Community" 
                        className="w-full max-w-5xl"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* 시작하기 버튼 - 모바일에서는 더 올림, 데스크톱에서는 더 위로 올림 */}
                    <div className="-mt-4 md:-mt-16 lg:-mt-24 flex justify-center">
                      <button 
                        onClick={() => router.push('/main')}
                        className="font-semibold transition-all duration-300 bg-gray-900 hover:bg-gray-800 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg shadow-lg hover:shadow-xl"
                      >
                        {t('heroSlides.slide1.startButton')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 화상 채팅 */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex items-start justify-center pt-8 md:pt-12 lg:pt-16">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                  <div className="max-w-6xl mx-auto relative">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                      {/* 왼쪽: 텍스트 */}
                      <div className="text-left max-w-lg">
                        <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4 border border-blue-200/30">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-700 font-medium text-xs">{t('heroSlides.slide2.badge')}</span>
                        </div>
                        
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight font-['Inter']">
                          {t('heroSlides.slide2.title')}
                        </h1>
                        
                        <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed mb-0">
                          {t('heroSlides.slide2.description').split('\n').map((line, index) => (
                            <span key={index}>
                              {line}
                              {index < t('heroSlides.slide2.description').split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      </div>

                      {/* 오른쪽: 이미지 */}
                      <div className="flex justify-center z-10">
                        <img 
                          src="/Slide2.png" 
                          alt="화상 채팅" 
                          className="w-56"
                          loading="lazy"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 세 번째 슬라이드 - 홈 (커뮤니티 서비스) */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col justify-start pt-8 md:justify-start md:pt-[6vh] lg:pt-[8vh] pb-12 sm:pb-16 md:pb-20">
                <div className="w-full px-2 sm:px-4">
                  {/* 메인 레이아웃 */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* 왼쪽 섹션 */}
                    <div className="space-y-3 sm:space-y-4 pt-0 md:pt-0">
                      {/* 제목 섹션 */}
                      <div className="text-left ml-4 sm:ml-6 md:ml-12 lg:ml-16">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-normal text-gray-900 mb-3 sm:mb-4">
                          {t('heroSlides.slide3.subtitle')}
                        </h2>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">
                          {t('heroSlides.slide3.title')}
                        </h1>
                        <div className="space-y-2 text-gray-700 text-sm sm:text-base leading-relaxed">
                          <p>{t('heroSlides.slide3.description')}</p>
                        </div>
                      </div>
                      
                      {/* 4개 카드 그리드 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8 mx-2 sm:mx-4 md:mx-6 lg:mx-8">
                        {/* 주제별 게시판 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">01</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                              <img src="/주제별게시판.png" alt="주제별 게시판" className="w-8 h-8 object-contain" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.topicBoard.title')}</h3>
                            <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              {t('heroSlides.slide3.cards.topicBoard.description')}
                            </p>
                          </div>
                        </div>
                        
                        {/* 한국뉴스 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">02</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                              <img src="/K-매거진.png" alt="K-매거진" className="w-8 h-8 object-contain" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.koreanNews.title')}</h3>
                            <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              {t('heroSlides.slide3.cards.koreanNews.description')}
                            </p>
                          </div>
                        </div>
                        
                        
                        {/* 한국성향테스트 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">03</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                              <img src="/심리테스트.png" alt="한국성향테스트" className="w-8 h-8 object-contain" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.koreanTest.title')}</h3>
                            <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              오늘의 운세와 나의 성향을 재밌게 알아보세요
                            </p>
                          </div>
                        </div>
                        
                        {/* 시작하기 버튼 카드 */}
                        <div 
                          className="bg-gradient-to-br from-purple-300 to-pink-400 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-purple-200 relative h-28 sm:h-32 md:h-36 lg:h-40 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
                          onClick={() => router.push('/main')}
                        >
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-white text-purple-500 text-xs px-1.5 py-0.5 rounded font-bold">START</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-8 sm:w-16 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 relative">
                              {/* 화살표 아이콘 */}
                              <div className="w-10 h-6 sm:w-12 sm:h-8 bg-white rounded-lg flex items-center justify-center relative">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.startButton.title')}</h3>
                            <p className="text-white/90 text-xs leading-relaxed">
                              {t('heroSlides.slide3.startButton.subtitle')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

          </Swiper>

          {/* 왼쪽 네비게이션 버튼 */}
          {activeSlide > 0 && (
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slidePrev()
                }
              }}
              className="absolute left-4 sm:left-6 md:left-8 top-[45%] sm:top-[40%] md:top-[40%] -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-md rounded-full border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 group pointer-events-auto"
            >
              <ChevronLeft className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
            </button>
          )}

          {/* 오른쪽 네비게이션 버튼 */}
          {activeSlide < 2 && (
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideNext()
                }
              }}
              className="absolute right-4 sm:right-6 md:right-8 top-[45%] sm:top-[40%] md:top-[40%] -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-md rounded-full border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 group pointer-events-auto"
            >
              <ChevronRight className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
            </button>
          )}

          {/* 커스텀 페이지네이션 */}
          <div className="swiper-pagination !bottom-4 sm:!bottom-6 md:!bottom-8 !flex !justify-center !gap-2 !left-1/2 !transform !-translate-x-1/2">
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

        </div>
      </div>

      {/* 비디오 모달 */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                 <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg aspect-video">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <iframe
              src="https://www.youtube.com/embed/do4aDyGZmgM?autoplay=1"
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

