'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
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
              <div className="flex items-center justify-between min-h-[600px] py-20">
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
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => router.push('/main?tab=meet')}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      시작하기
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowVideo(true)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-all duration-300"
                    >
                      소개 영상 보기
                    </Button>
                  </div>
                </div>

                {/* 오른쪽 이미지 영역 */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="w-80 h-80 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full flex items-center justify-center shadow-2xl">
                    <div className="text-6xl">🎥</div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 두 번째 슬라이드 - 메인 히어로 (기존 첫 번째) */}
            <SwiperSlide>
              <div className="flex items-center justify-between min-h-[600px] py-20">
                {/* 왼쪽 콘텐츠 */}
                <div className="flex-1 max-w-2xl">
                  <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                    지구 반대편과 소통하세요.
                  </h1>
                  
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Amiko <span className="underline decoration-purple-300 decoration-2">커뮤니티 서비스</span>
                  </h2>
                  
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    Amiko는 지구 반대편을 연결하는 다리입니다. 커뮤니티를 통해 서로의 문화에 더욱 가까이 다가가보세요.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* 01 K-Trand 카드 */}
                    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 font-bold text-sm">NEWS</span>
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">01</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">K-Trand</h3>
                      <p className="text-gray-600 text-sm">
                        한국인이 직접 전하는 정확하고 빠른 K-Trand, Amiko에서 경험해보세요.
                      </p>
                    </div>

                    {/* 02 자유게시판 카드 */}
                    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-xl">💬</span>
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">02</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">자유게시판</h3>
                      <p className="text-gray-600 text-sm">
                        K-POP게시판, K-DRAMA게시판 여행 게시판, 자유 게시판을 통해 자유로운 소통을 경험해보세요.
                      </p>
                    </div>

                    {/* 03 Q&A 카드 */}
                    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-xl">❓</span>
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">03</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Q&A</h3>
                      <p className="text-gray-600 text-sm">
                        Q&A 커뮤니티를 통해 서로에게 궁금한 점들을 질문하고 현지인에게 직접 답변을 받아보세요.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 오른쪽 이미지 영역 */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-2xl">
                    <div className="text-6xl">🌍</div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          {/* 커스텀 네비게이션 버튼 */}
          <div className="swiper-button-prev !w-12 !h-12 !bg-white/80 !backdrop-blur-sm !rounded-full !text-gray-700 hover:!bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
            <ChevronLeft className="w-6 h-6" />
          </div>
          <div className="swiper-button-next !w-12 !h-12 !bg-white/80 !backdrop-blur-sm !rounded-full !text-gray-700 hover:!bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
            <ChevronRight className="w-6 h-6" />
          </div>

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

