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

      <div className="container-custom relative z-0 flex items-start justify-center min-h-screen px-4 pt-4">
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
            {/* 첫 번째 슬라이드 - Global Community */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col">
                {/* 상단 메인 콘텐츠 */}
                <div className="flex flex-col items-center justify-center py-24 sm:py-32 md:py-40 lg:py-48 text-center">
                  <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="inline-flex items-center gap-2 bg-purple-100/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-purple-200/30">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700 font-medium text-sm">{t('heroSlides.slide1.badge')}</span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-tight font-['Inter']">
                      {t('heroSlides.slide1.title').split('\n').map((line, index) => (
                        <span key={index}>
                          {index === 0 ? (
                            <span>
                              <span>Global Community</span>
                              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">를</span>
                            </span>
                          ) : (
                            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">{line}</span>
                          )}
                          {index === 0 && <br />}
                        </span>
                      ))}
                    </h1>
                    
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
                      {t('heroSlides.slide1.description')}
                    </p>
                  </div>
                </div>

              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 화상 통화 */}
            <SwiperSlide className="pointer-events-auto">
              <div className="h-screen flex flex-col">
                {/* 상단 메인 콘텐츠 */}
                <div className="flex flex-col lg:flex-row items-center justify-start pt-4 pb-0 gap-18 lg:gap-24">
                  {/* 왼쪽 콘텐츠 */}
                  <div className="max-w-xl text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-3 py-1.5 mb-3 border border-blue-200/30">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-700 font-medium text-xs">{t('heroSlides.slide2.badge')}</span>
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight font-['Inter']">
                      {t('heroSlides.slide2.title')}
                    </h1>
                    
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
                      {t('heroSlides.slide2.description').split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < t('heroSlides.slide2.description').split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* 오른쪽 이미지 영역 */}
                  <div className="flex justify-center items-center">
                    <img 
                      src="/image.png" 
                      alt="Profile" 
                      className="w-72 h-96 sm:w-80 sm:h-[28rem] md:w-88 md:h-[32rem] lg:w-96 lg:h-[36rem] object-contain"
                    />
                  </div>
                </div>

                {/* 하단 흰색 배경 섹션 */}
                <div className="bg-white pt-4 pb-8 sm:pt-6 sm:pb-12 md:pt-8 md:pb-16 -translate-y-8 sm:-translate-y-12 md:-translate-y-16 lg:-translate-y-20">
                  <div className="container-custom max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                      {/* 왼쪽: 큰 텍스트 */}
                      <div className="flex-1 flex justify-center lg:justify-start items-center">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 leading-tight -mt-2 lg:mt-0 font-['Pretendard'] text-center lg:text-left -ml-8">
                          {t('heroSlides.slide2.subtitle').split('\n').map((line, index) => (
                            <span key={index}>
                              {line}
                              {index === 0 && <br />}
                            </span>
                          ))}
                        </h2>
                      </div>

                      {/* 오른쪽: 작은 텍스트들 */}
                      <div className="flex-1 flex flex-col gap-1 sm:gap-2 justify-center">
                        <p className="text-gray-600 text-xs leading-tight text-left whitespace-nowrap pl-0 pr-24">
                          서로의 나라에 대한 좋은 이미지를 가지고 그들을 만나기 위해 AI 화상 채팅 어플을 사용했던 경험이 있으신가요?
                        </p>
                        <p className="text-gray-600 text-xs leading-tight text-left whitespace-nowrap pl-0 pr-24">
                          혹시 그 경험이 당신에게 실망으로 다가오시지는 않으셨나요?
                        </p>
                        <p className="text-gray-600 text-xs leading-tight text-left whitespace-nowrap pl-0 pr-24">
                          Amiko는 검증된 한국인 튜터들과 별점 시스템을 통해 좋은 경험을 여러분들께 선사합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 세 번째 슬라이드 - 홈 (커뮤니티 서비스) */}
            <SwiperSlide className="pointer-events-auto">
              <div className="min-h-screen flex flex-col py-8 sm:py-12 md:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  {/* 메인 레이아웃 */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* 왼쪽 섹션 */}
                    <div className="space-y-4 sm:space-y-6 pt-8 sm:pt-12 md:pt-16">
                      {/* 제목 섹션 */}
                      <div className="text-center lg:text-left">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-normal text-gray-900 mb-2 sm:mb-3">
                          {t('heroSlides.slide3.subtitle')}
                        </h2>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">
                          {t('heroSlides.slide3.title')}
                        </h1>
                        <div className="w-24 sm:w-32 md:w-40 h-1 bg-purple-300 mb-3 sm:mb-4 mx-auto lg:mx-0"></div>
                        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0">
                          {t('heroSlides.slide3.description')}
                        </p>
                      </div>
                      
                      {/* 4개 카드 그리드 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-12 md:mt-16">
                        {/* 주제별 게시판 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto md:mx-0">
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">01</span>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-10 sm:w-20 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
                              {/* 음악 노트 아이콘 */}
                              <div className="w-12 h-8 sm:w-14 sm:h-10 bg-white border-2 border-gray-800 rounded-lg relative flex items-center justify-center">
                                <span className="text-gray-800 font-bold text-lg sm:text-xl">🎵</span>
                              </div>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">주제별 게시판</h3>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                              K-POP, K-DRAMA, K-뷰티, 트랜드, 여행 등 다양한 주제를 자유롭게 소통해보세요.
                            </p>
                          </div>
                        </div>
                        
                        {/* 자유게시판 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto md:mx-0">
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">02</span>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-10 sm:w-20 sm:h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
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
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">자유게시판</h3>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                              자유로운 주제로 자유롭게 지구 반대편과 소통해보세요.
                            </p>
                          </div>
                        </div>
                        
                        {/* 스토리 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto md:mx-0">
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">03</span>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-10 sm:w-20 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 relative">
                              {/* 책 아이콘 */}
                              <div className="w-12 h-8 sm:w-14 sm:h-10 bg-white border-2 border-gray-800 rounded-lg relative flex items-center justify-center">
                                <span className="text-gray-800 font-bold text-lg sm:text-xl">📖</span>
                              </div>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">스토리</h3>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                              나의 일상을 공유하고 일상에 대해서 대화해보세요.
                            </p>
                          </div>
                        </div>
                        
                        {/* Q&A 카드 */}
                        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-lg border border-gray-100 relative w-full max-w-md mx-auto md:mx-0">
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">04</span>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-10 sm:w-20 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                              {/* 검은색 테두리 말풍선 */}
                              <div className="w-12 h-8 sm:w-14 sm:h-10 border-2 border-gray-800 rounded-lg relative bg-white">
                                {/* 말풍선 꼬리 */}
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-800"></div>
                                {/* 물음표 */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-lg sm:text-xl">?</div>
                              </div>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">Q&A</h3>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                              Q&A 커뮤니티를 통해 서로에게 궁금한 점을 질문하고 직접 답변을 받아보세요.
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
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 group pointer-events-auto"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 group pointer-events-auto"
            >
              <ChevronRight className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
            </button>
          )}

          {/* 커스텀 페이지네이션 */}
          <div className="swiper-pagination !bottom-40 !flex !justify-center !gap-2 !left-1/2 !transform !-translate-x-1/2">
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

