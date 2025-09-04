'use client'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function AboutPage() {
  const swiperRef = useRef<any>(null)

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
              ;(window as any).swiperInstance = swiper
            }}
          >
            {/* 회사소개 슬라이드 */}
            <SwiperSlide>
              <div className="min-h-[600px] py-20 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-4xl mx-auto px-4">
                  <div className="space-y-8">
                    {/* 첫 번째 카드 */}
                    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src="/1.png" 
                          alt="AMIKO Logo 1" 
                          className="w-32 h-32 object-contain mb-4"
                        />
                        <p className="text-gray-700 text-lg">
                          : AMI(America) KO(Korea)를 잇다.
                        </p>
                      </div>
                    </div>

                    {/* 두 번째 카드 */}
                    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src="/2.png" 
                          alt="AMIKO Logo 2" 
                          className="w-32 h-32 object-contain mb-4"
                        />
                        <p className="text-gray-700 text-lg">
                          : <span className="text-red-500">AM</span>erica와 <span className="text-blue-500">KO</span>rea를 이어주는 다리
                        </p>
                      </div>
                    </div>

                    {/* 세 번째 카드 */}
                    <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src="/3.png" 
                          alt="AMIKO Logo 3" 
                          className="w-32 h-32 object-contain mb-4"
                        />
                        <p className="text-gray-700 text-lg">
                          : A mí(나에게) Korea를 더 가깝게
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 소개 영상 슬라이드 */}
            <SwiperSlide>
              <div className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-6xl lg:max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 text-center">
                  <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
                    대표자 소개영상
                  </h2>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 lg:p-12 border border-gray-200/50 shadow-lg w-full">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full">
                      <iframe
                        src="https://www.youtube.com/embed/6BdrKjSMBJY?autoplay=0&rel=0"
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
          </Swiper>

          {/* 커스텀 네비게이션 버튼 */}
          <button 
            onClick={() => {
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slidePrev()
              }
            }}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-lg transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={() => {
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideNext()
              }
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-lg transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
