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
            onSlideChange={(swiper) => {
              setActiveSlide(swiper.activeIndex)
              ;(window as any).swiperInstance = swiper
              window.dispatchEvent(new CustomEvent('slideChanged', { 
                detail: { activeIndex: swiper.activeIndex } 
              }))
            }}
          >
            {/* 첫 번째 슬라이드 - 홈 (사진과 동일하게) */}
            <SwiperSlide>
              <div className="min-h-screen flex flex-col">
                {/* 상단 메인 콘텐츠 */}
                <div className="flex items-center justify-between py-32">
                  {/* 왼쪽 콘텐츠 */}
                  <div className="flex-1 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-blue-200/30">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700 font-medium text-sm">Amiko에 탑재된 AI 통역과 함께</span>
                    </div>
                    
                    <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                      화상으로 소통하세요
                    </h1>
                    
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                      자체 플랫폼을 통한 1:1 화상 미팅 시스템과 AI 통역 서비스로 막힘없이, 간편하게, 서로의 문화와 언어를 교류할 수 있습니다.
                    </p>
                    
                    
                  </div>

                  {/* 오른쪽 이미지 영역 */}
                  <div className="flex-1 flex justify-center items-center">
                    <div className="w-80 h-80 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="text-6xl">🎥</div>
                    </div>
                  </div>
                </div>

                {/* 하단 흰색 배경 섹션 */}
                <div className="bg-white py-6">
                  <div className="container-custom max-w-6xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-start gap-12">
                      {/* 왼쪽: 큰 텍스트 */}
                      <div className="flex-1 flex justify-center -ml-8">
                        <h2 className="text-3xl font-normal text-gray-900 leading-tight mt-12 font-['Noto_Sans_KR']">
                          검증된 한국인 튜터들이<br />
                          여러분들과 함께합니다.
                        </h2>
                      </div>

                      {/* 오른쪽: 작은 텍스트들 */}
                      <div className="flex-1 flex flex-col gap-4 -ml-12 mr-8">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          • 한국어를 배우고 싶은 외국인들을 위한 맞춤형 커리큘럼
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          • 한국 문화와 언어를 함께 배우는 체계적인 교육 시스템
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          • 실시간 화상 통화를 통한 생생한 한국어 학습 경험
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 홈 (Amiko의 목표) */}
            <SwiperSlide>
              <div className="min-h-screen flex items-center justify-center py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-blue-200/30">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700 font-medium text-sm">Amiko의 목표</span>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
                    언어와 문화의 장벽을 허물고<br />
                    <span className="text-blue-600">진정한 소통</span>을 만들어갑니다
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-8 mt-12">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
                      <div className="text-4xl mb-4">🌍</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">글로벌 커뮤니티</h3>
                      <p className="text-gray-600 leading-relaxed">
                        전 세계 사람들이 언어의 장벽 없이 자유롭게 소통할 수 있는 플랫폼을 제공합니다.
                      </p>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">맞춤형 학습</h3>
                      <p className="text-gray-600 leading-relaxed">
                        개인의 수준과 목표에 맞는 맞춤형 커리큘럼으로 효율적인 언어 학습을 지원합니다.
                      </p>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
                      <div className="text-4xl mb-4">🤝</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">문화 교류</h3>
                      <p className="text-gray-600 leading-relaxed">
                        단순한 언어 학습을 넘어 문화적 이해와 상호 존중을 바탕으로 한 진정한 교류를 추구합니다.
                      </p>
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

