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
                    대표자 소개영상
                  </h2>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 lg:p-12 border border-gray-200/50 shadow-lg w-full mt-2">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full">
                      <iframe
                        src="https://www.youtube.com/embed/6BdrKjSMBJY"
                        title="Amiko 대표자 소개 영상"
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
                          className="w-72 h-72 object-contain -mb-20 -mt-12"
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
                          className="w-72 h-72 object-contain -mb-20 -mt-12"
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
                          className="w-72 h-72 object-contain -mb-20 -mt-12"
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
                        안녕하세요.
                      </h2>
                    </div>
                    
                    <div className="space-y-6 text-left">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        Amiko를 찾아주셔서 감사합니다.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        Amiko의 CTO 한상훈(Samuel), CMO 박겸(Pablo)입니다.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        저희는 여러 남미 국가에서 살며 그들의 문화와 사람들을 진심으로 사랑하게 되었습니다.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        최근 한국의 다양한 매체를 통해 남미의 아름다움이 소개되면서, 많은 한국인들이 점차 지구 반대편의 매력적인 대륙에 대해 알아가고 있습니다.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        이러한 경험을 통해 한국과 남미를 더욱 가깝게 연결할 수 있는 문화 교류와 커뮤니티의 필요성을 깊이 느끼게 되었습니다.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed font-semibold">
                        그래서 다짐했습니다. 한국과 남미를 이어주는 다리를 만들자.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        Amiko는 화상 통화와 커뮤니티 서비스를 기반으로, 철저히 검증된 멤버십을 통해 신뢰할 수 있는 플랫폼을 제공합니다.
                      </p>
                      
                      <p className="text-gray-700 text-lg leading-relaxed">
                        단순한 소통을 넘어 한국의 트렌드, 패션, K-POP, 라이프스타일까지 공유할 수 있는 커뮤니티로 발전해 나가겠습니다.
                      </p>
                      
                      <div className="text-center mt-12">
                        <p className="text-2xl font-bold text-gray-900">
                          Amiko를 통해 서로에게 가까이 다가가보세요.
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
