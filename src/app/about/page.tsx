'use client'

import { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useLanguage } from '@/context/LanguageContext'

export default function AboutPage() {
  const swiperRef = useRef<any>(null)
  const { t, language } = useLanguage()
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <section className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-slate-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 flex items-center justify-center min-h-screen px-4 pt-20 md:pt-32">
        <div className="w-full max-w-6xl">

          {/* 슬라이더 */}
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            speed={300}
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
            className="w-full relative z-10 scroll-smooth-touch"
            onInit={(swiper) => {
              try {
                if (typeof window !== 'undefined') {
                  (window as any).swiperInstance = swiper
                }
              } catch (error) {
                console.error('Swiper initialization error:', error)
              }
            }}
            onSlideChange={(swiper) => {
              setActiveSlide(swiper.activeIndex)
            }}
          >
            {/* 소개 영상 슬라이드 */}
            <SwiperSlide className="swiper-slide-no-lazy">
              <div className="min-h-screen flex items-start justify-center pt-24 md:pt-[8vh] lg:pt-[10vh] bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-6xl lg:max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-0 text-center relative">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                    {t('about.introVideo')}
                  </h2>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 sm:p-4 lg:p-6 border border-gray-200/50 shadow-lg w-full mt-4 relative z-10">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full">
                      <iframe
                        src="https://www.youtube.com/embed/do4aDyGZmgM"
                        title={t('about.introVideoTitle')}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 회사소개 슬라이드 */}
            <SwiperSlide>
              <div className="min-h-[600px] py-0 md:py-3 bg-gradient-to-br from-slate-50 to-blue-50 relative">
                <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
                  <div className="space-y-4 pt-0 md:pt-8">
                    {/* 첫 번째 카드 */}
                    <div className="bg-white rounded-lg p-4 pt-0 pb-4 shadow-lg border border-gray-100 max-w-md mx-auto">
                      <div className="flex flex-col items-center text-center -mt-6">
                        <img 
                          src="/1.png" 
                          alt="AMIKO Logo 1" 
                          className="w-32 h-32 md:w-48 md:h-48 object-contain -mb-8 md:-mb-10"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className={`text-gray-700 ${language === 'es' ? 'text-xs md:text-sm' : 'text-xs md:text-sm'} leading-relaxed tracking-wide`}>
                          : {t('about.companyDescription')}
                        </p>
                      </div>
                    </div>

                    {/* 두 번째 카드 */}
                    <div className="bg-white rounded-lg p-4 pt-0 pb-4 shadow-lg border border-gray-100 max-w-md mx-auto">
                      <div className="flex flex-col items-center text-center -mt-6">
                        <img 
                          src="/2.png" 
                          alt="AMIKO Logo 2" 
                          className="w-32 h-32 md:w-48 md:h-48 object-contain -mb-8 md:-mb-10"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className={`text-gray-700 ${language === 'es' ? 'text-xs md:text-sm' : 'text-xs md:text-sm'} leading-relaxed tracking-wide`}>
                          : {language === 'es' ? (
                            <>
                              Puente que conecta entre <span className="text-red-500">AM</span>erica y <span className="text-blue-500">KO</span>rea
                            </>
                          ) : (
                            <>
                              <span className="text-red-500">AM</span>erica와 <span className="text-blue-500">KO</span>rea를 {t('about.bridgeDescription')}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 세 번째 카드 */}
                    <div className="bg-white rounded-lg p-4 pt-0 pb-4 shadow-lg border border-gray-100 max-w-md mx-auto">
                      <div className="flex flex-col items-center text-center -mt-6">
                        <img 
                          src="/3.png" 
                          alt="AMIKO Logo 3" 
                          className="w-32 h-32 md:w-48 md:h-48 object-contain -mb-8 md:-mb-10"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className={`text-gray-700 ${language === 'es' ? 'text-xs md:text-sm' : 'text-xs md:text-sm'} leading-relaxed tracking-wide`}>
                          : {t('about.closerDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 대표자 소개 텍스트 슬라이드 */}
            <SwiperSlide>
              <div className="min-h-screen flex items-start justify-center pt-2 sm:pt-8 py-6 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-3xl mx-auto px-0 sm:px-8 lg:px-12">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-3 sm:p-10 lg:p-12 border border-gray-200/50 shadow-xl">
                    <div className="text-center mb-2">
                      <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        {t('about.greeting')}
                      </h2>
                    </div>
                    
                    <div className="space-y-6 text-center max-w-2xl mx-auto">
                      <p className={`text-gray-700 ${language === 'es' ? 'text-sm sm:text-base' : 'text-sm sm:text-base'} leading-relaxed tracking-wide`}>
                        {t('about.thankYou')}<br />
                        {t('about.teamIntroduction').split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index === 0 && <br />}
                          </span>
                        ))}
                      </p>
                      
                      <p className={`text-gray-700 ${language === 'es' ? 'text-xs' : 'text-sm'} leading-relaxed tracking-wide`}>
                        {t('about.latinAmericaExperience')}<br />
                        {t('about.koreanInterest')}
                      </p>
                      
                      <p className="text-gray-800 text-sm leading-relaxed font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                        {t('about.bridgePromise')}
                      </p>
                      
                      <p className={`text-gray-700 ${language === 'es' ? 'text-xs' : 'text-sm'} leading-relaxed tracking-wide`}>
                        {t('about.platformDescription')}<br />
                        {t('about.communityVision')}
                      </p>
                      
                      <div className="text-center mt-8 pt-4 border-t border-gray-200">
                        <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                          {t('about.finalMessage')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          {/* 커스텀 네비게이션 버튼 - 슬라이드별 동적 배치 */}
          <button 
            onClick={(e) => {
              e.preventDefault()
              try {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slidePrev()
                }
              } catch (error) {
                console.error('Swiper navigation error:', error)
              }
            }}
            className={`absolute z-20 bg-white/95 backdrop-blur-md rounded-full border-2 border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-200 group ${
              activeSlide === 0 
                ? 'left-2 sm:left-4 md:left-6 top-[25%] md:top-[30%] -translate-y-1/2 w-10 h-10 md:w-16 md:h-16' // 소개영상: 쪼금 더 위로
                : activeSlide === 1
                ? 'left-2 sm:left-4 md:left-6 top-[25%] md:top-[30%] -translate-y-1/2 w-10 h-10 md:w-16 md:h-16' // 회사소개: 쪼금 더 위로
                : 'left-2 sm:left-4 md:left-6 top-[25%] md:top-[30%] -translate-y-1/2 w-10 h-10 md:w-16 md:h-16' // 대표자소개: 쪼금 더 위로
            }`}
          >
            <svg className={`group-hover:text-blue-600 transition-colors ${activeSlide === 0 ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={(e) => {
              e.preventDefault()
              try {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideNext()
                }
              } catch (error) {
                console.error('Swiper navigation error:', error)
              }
            }}
            className={`absolute z-20 bg-white/95 backdrop-blur-md rounded-full border-2 border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-200 group ${
              activeSlide === 0 
                ? 'right-2 sm:right-4 md:right-6 top-[25%] md:top-[30%] -translate-y-1/2 w-10 h-10 md:w-16 md:h-16' // 소개영상: 쪼금 더 위로
                : activeSlide === 1 
                ? 'right-2 sm:right-4 md:right-6 top-[25%] md:top-[30%] -translate-y-1/2 w-10 h-10 md:w-16 md:h-16' // 회사소개: 쪼금 더 위로
                : 'right-2 sm:right-4 md:right-6 top-[25%] md:top-[30%] -translate-y-1/2 w-10 h-10 md:w-16 md:h-16' // 대표자소개: 쪼금 더 위로
            }`}
          >
            <svg className={`group-hover:text-blue-600 transition-colors ${activeSlide === 0 ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 커스텀 페이지네이션 - 슬라이드별 동적 위치 */}
          <div className="swiper-pagination !flex !justify-center !gap-2">
            <style jsx>{`
              .swiper-pagination {
                position: absolute !important;
                bottom: ${activeSlide === 0 ? '6rem' : activeSlide === 1 ? '5rem' : '4rem'} !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 10 !important;
              }
              @media (max-width: 640px) {
                .swiper-pagination {
                  bottom: ${activeSlide === 0 ? '20rem' : activeSlide === 1 ? '18rem' : '16rem'} !important;
                }
              }
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
    </section>
  )
}
