'use client'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useLanguage } from '@/context/LanguageContext'

export default function AboutPage() {
  const swiperRef = useRef<any>(null)
  const { t, language } = useLanguage()

  return (
    <section className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-slate-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
        <div className="w-full max-w-6xl">

          {/* 슬라이더 */}
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            speed={300}
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
            className="w-full relative z-10"
            onInit={(swiper) => {
              try {
                if (typeof window !== 'undefined') {
                  (window as any).swiperInstance = swiper
                }
              } catch (error) {
                console.error('Swiper initialization error:', error)
              }
            }}
          >
            {/* 소개 영상 슬라이드 */}
            <SwiperSlide className="swiper-slide-no-lazy">
              <div className="min-h-screen flex items-start justify-center pt-28 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-6xl lg:max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 text-center">
                  <h2 className="text-4xl font-bold text-gray-900 mb-0 leading-tight -mt-2">
                    {t('about.introVideo')}
                  </h2>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 lg:p-12 border border-gray-200/50 shadow-lg w-full mt-2">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full">
                      <iframe
                        src="https://www.youtube.com/embed/2tDHgOhdCqY"
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
              <div className="min-h-[600px] py-20 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-xl mx-auto px-16">
                  <div className="space-y-8 pt-8">
                    {/* 첫 번째 카드 */}
                    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src="/1.png" 
                          alt="AMIKO Logo 1" 
                          className="w-64 h-64 object-contain -mb-16 -mt-20"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className="text-gray-700 text-lg">
                          : {t('about.companyDescription')}
                        </p>
                      </div>
                    </div>

                    {/* 두 번째 카드 */}
                    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src="/2.png" 
                          alt="AMIKO Logo 2" 
                          className="w-64 h-64 object-contain -mb-16 -mt-20"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className="text-gray-700 text-lg">
                          : {language === 'es' ? (
                            <>
                              Un puente que conecta<br />
                              entre <span className="text-red-500">AM</span>erica y <span className="text-blue-500">KO</span>rea
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
                    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src="/3.png" 
                          alt="AMIKO Logo 3" 
                          className="w-64 h-64 object-contain -mb-16 -mt-20"
                          loading="lazy"
                          decoding="async"
                        />
                        <p className="text-gray-700 text-lg">
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
              <div className="min-h-screen flex items-center justify-center py-4 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 lg:p-16 border border-gray-200/50 shadow-lg">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                        {t('about.greeting')}
                      </h2>
                    </div>
                    
                    <div className="space-y-6 text-left">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.thankYou')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.teamIntroduction')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.latinAmericaExperience')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.koreanInterest')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.culturalExchange')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed font-semibold">
                        {t('about.bridgePromise')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.platformDescription')}
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {t('about.communityVision')}
                      </p>
                      
                      <div className="text-center mt-12">
                        <p className="text-2xl font-bold text-gray-900">
                          {t('about.finalMessage')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          {/* 커스텀 네비게이션 버튼 - 매우 큰 버전 */}
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-200 group"
          >
            <svg className="w-8 h-8 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-200 group"
          >
            <svg className="w-8 h-8 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
        </div>
      </div>
    </section>
  )
}
