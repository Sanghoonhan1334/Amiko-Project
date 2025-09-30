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

      <div className="container-custom relative z-0 flex items-start justify-center min-h-screen px-2 sm:px-4 pt-24 sm:pt-32 md:pt-36">
        <div className="w-full lg:max-w-6xl lg:mx-auto">

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
              <div className="min-h-screen flex flex-col items-center justify-start pt-32 sm:pt-40 md:pt-48 lg:pt-52 xl:pt-56">
                <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
                  <div className="max-w-4xl mx-auto">
                    {/* 상단 텍스트 */}
                    <p className="text-gray-600 text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-4 leading-relaxed">
                      {t('heroSlides.slide1.subtitle')}
                    </p>
                    
                    {/* 메인 제목 */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-8 leading-tight font-['Inter']">
                      {t('heroSlides.slide1.title')}
                    </h1>
                    
                    {/* 하단 설명 */}
                    <p className="text-gray-700 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed">
                      {t('heroSlides.slide1.description')}
                    </p>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 화상 채팅 */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col items-center justify-start pt-4 sm:pt-12 md:pt-20 lg:pt-24 xl:pt-28">
                {/* 메인 콘텐츠 - 세 요소가 한 세트처럼 컴팩트하게 */}
                <div className="w-full px-4 sm:px-6 lg:px-8">
                  <div className="w-full lg:max-w-4xl lg:mx-auto">
                    {/* 상단 텍스트 섹션 */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4 border border-blue-200/30">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 font-medium text-xs">{t('heroSlides.slide2.badge')}</span>
                      </div>
                      
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight font-['Inter']">
                        {t('heroSlides.slide2.title')}
                      </h1>
                      
                      <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed mb-8">
                        {t('heroSlides.slide2.description').split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < t('heroSlides.slide2.description').split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>

                    {/* 하단 검증된 튜터 카드 - 바로 붙여서 */}
                    <div className="flex justify-center">
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-full lg:max-w-2xl lg:mx-auto mx-4">
                        <div className="text-center">
                          {/* 메인 제목 */}
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight font-['Pretendard'] mb-4">
                            {t('heroSlides.slide2.subtitle').split('\n').map((line, index) => (
                              <span key={index}>
                                {line}
                                {index === 0 && <br />}
                              </span>
                            ))}
                            <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full ml-1"></span>
                          </h2>
                          
                          {/* 질문 텍스트 */}
                          <div className="space-y-2 text-sm sm:text-base text-gray-700 leading-relaxed">
                            <p>
                              {t('heroSlides.slide2.experience1').split('\n').map((line, index) => (
                                <span key={index}>
                                  {line}
                                  {index < t('heroSlides.slide2.experience1').split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </p>
                            <p>
                              {t('heroSlides.slide2.experience2')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 세 번째 슬라이드 - 홈 (커뮤니티 서비스) */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col pt-0 sm:pt-4 md:pt-8 pb-12 sm:pb-16 md:pb-20">
                <div className="w-full px-2 sm:px-4 lg:max-w-7xl lg:mx-auto">
                  {/* 메인 레이아웃 */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* 왼쪽 섹션 */}
                    <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-8 md:pt-12">
                      {/* 제목 섹션 */}
                      <div className="text-left">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8">
                        {/* 주제별 게시판 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">01</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-8 sm:w-16 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 relative">
                              {/* 음악 노트 아이콘 */}
                              <div className="w-10 h-6 sm:w-12 sm:h-8 bg-white border-2 border-gray-800 rounded-lg relative flex items-center justify-center">
                                <span className="text-gray-800 font-bold text-sm sm:text-base">🎵</span>
                              </div>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.topicBoard.title')}</h3>
                            <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              {t('heroSlides.slide3.cards.topicBoard.description')}
                            </p>
                          </div>
                        </div>
                        
                        {/* 자유게시판 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">02</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-8 sm:w-16 sm:h-10 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 relative">
                              {/* 직사각형 말풍선 모양 */}
                              <div className="w-10 h-6 sm:w-12 sm:h-8 bg-white border-2 border-gray-800 rounded-lg relative">
                                {/* 말풍선 안의 텍스트 라인들 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="flex flex-col space-y-0.5">
                                    <div className="w-4 h-0.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-3 h-0.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-3.5 h-0.5 bg-gray-400 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.freeBoard.title')}</h3>
                            <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              {t('heroSlides.slide3.cards.freeBoard.description')}
                            </p>
                          </div>
                        </div>
                        
                        {/* 스토리 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                            <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">03</span>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-8 sm:w-16 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 relative">
                              {/* 책 아이콘 */}
                              <div className="w-10 h-6 sm:w-12 sm:h-8 bg-white border-2 border-gray-800 rounded-lg relative flex items-center justify-center">
                                <span className="text-gray-800 font-bold text-sm sm:text-base">📖</span>
                              </div>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.story.title')}</h3>
                            <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                              {t('heroSlides.slide3.cards.story.description')}
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
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-md rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 group pointer-events-auto"
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
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-md rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 group pointer-events-auto"
            >
              <ChevronRight className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
            </button>
          )}

          {/* 커스텀 페이지네이션 */}
          <div className="swiper-pagination !bottom-20 sm:!bottom-32 md:!bottom-40 !flex !justify-center !gap-2 !left-1/2 !transform !-translate-x-1/2">
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

