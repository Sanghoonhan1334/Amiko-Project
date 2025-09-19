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

      <div className="container-custom relative z-0 flex items-start justify-center min-h-screen px-2 sm:px-4 pt-2 sm:pt-4">
        <div className="w-full max-w-6xl">

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
              <div className="min-h-screen flex flex-col">
                {/* 상단 메인 콘텐츠 */}
                <div className="flex flex-col items-center justify-center pt-40 sm:pt-48 md:pt-56 lg:pt-48 xl:pt-36 pb-16 sm:pb-24 md:pb-32 lg:pb-40 xl:pb-48 text-center">
                  <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
                    <div className="inline-flex items-center gap-2 bg-purple-100/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-purple-200/30">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700 font-medium text-sm">{t('heroSlides.slide1.badge')}</span>
                    </div>
                    
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight font-['Inter']">
                      {t('heroSlides.slide1.title').split('\n').map((line, index) => (
                        <span key={index}>
                          <span className={index === 0 ? 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl' : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'}>{line}</span>
                          {index === 0 && <br />}
                        </span>
                      ))}
                    </h1>
                    
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
                      {t('heroSlides.slide1.description')}
                    </p>
                    
                    {/* 다인종 이미지 */}
                    <div className="flex justify-center mb-8">
                      <img 
                        src="/다인종.jpg" 
                        alt="다인종" 
                        className="w-64 h-48 sm:w-80 sm:h-60 md:w-96 md:h-72 lg:w-[28rem] lg:h-[21rem] xl:w-[32rem] xl:h-[24rem] object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 화상 채팅 */}
            <SwiperSlide className="pointer-events-auto">
              <div className="h-screen flex flex-col">
                {/* 메인 콘텐츠 - CSS Grid로 자연스러운 반응형 */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                  <div className="w-full max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                      
                      {/* 왼쪽: 텍스트 콘텐츠 */}
                      <div className="order-2 lg:order-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4 border border-blue-200/30">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-700 font-medium text-xs">{t('heroSlides.slide2.badge')}</span>
                        </div>
                        
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight font-['Inter']">
                          {t('heroSlides.slide2.title')}
                        </h1>
                        
                        <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed mb-6">
                          {t('heroSlides.slide2.description').split('\n').map((line, index) => (
                            <span key={index}>
                              {line}
                              {index < t('heroSlides.slide2.description').split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      </div>

                      {/* 오른쪽: 이미지 */}
                      <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                        <div className="relative">
                          <img 
                            src="/image.png" 
                            alt="Profile" 
                            className="w-64 h-80 sm:w-72 sm:h-96 md:w-80 md:h-[28rem] lg:w-72 lg:h-80 xl:w-80 xl:h-96 object-contain transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단 정보 섹션 */}
                <div className="bg-white pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-10 lg:pb-12">
                  <div className="container-custom max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight font-['Pretendard'] mb-4">
                        {t('heroSlides.slide2.subtitle').split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < t('heroSlides.slide2.subtitle').split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </h2>
                      
                      <div className="space-y-2 text-gray-600 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
                        <p>{t('heroSlides.slide2.experience1')}</p>
                        <p>{t('heroSlides.slide2.experience2')}</p>
                        <p>{t('heroSlides.slide2.experience3')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 세 번째 슬라이드 - 홈 (커뮤니티 서비스) */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col py-12 sm:py-16 md:py-20">
                <div className="max-w-7xl mx-auto px-2 sm:px-4">
                  {/* 메인 레이아웃 */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* 왼쪽 섹션 */}
                    <div className="space-y-3 sm:space-y-4 pt-16 sm:pt-20 md:pt-24">
                      {/* 제목 섹션 */}
                      <div className="text-left">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-normal text-gray-900 mb-3 sm:mb-4">
                          {t('heroSlides.slide3.subtitle')}
                        </h2>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">
                          {t('heroSlides.slide3.title')}
                        </h1>
                        <div className="w-32 sm:w-40 md:w-48 h-1 bg-purple-300 mb-4 sm:mb-6"></div>
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
                            <p className="text-gray-600 text-xs leading-relaxed">
                              {t('heroSlides.slide3.cards.topicBoard.description').split('\n').map((line, index) => (
                                <span key={index}>
                                  {line}
                                  {index < t('heroSlides.slide3.cards.topicBoard.description').split('\n').length - 1 && <br />}
                                </span>
                              ))}
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
                            <p className="text-gray-600 text-xs leading-relaxed">
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
                            <p className="text-gray-600 text-xs leading-relaxed">
                              {t('heroSlides.slide3.cards.story.description')}
                            </p>
                          </div>
                        </div>
                        
                        {/* 시작하기 버튼 카드 */}
                        <div 
                          className="bg-gradient-to-br from-purple-300 to-pink-400 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-purple-200 relative h-28 sm:h-32 md:h-36 lg:h-40 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
                          onClick={() => router.push('/sign-up')}
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

