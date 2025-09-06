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

            {/* 두 번째 슬라이드 - 홈 (커뮤니티 서비스) */}
            <SwiperSlide>
              <div className="min-h-screen flex flex-col py-20">
                <div className="max-w-6xl mx-auto px-4">
                  {/* 메인 레이아웃 */}
                  <div className="space-y-8">
                    {/* 왼쪽 섹션 */}
                    <div className="space-y-8 pt-20">
                      {/* 제목 섹션 */}
                      <div className="text-left">
                        <h2 className="text-3xl font-normal text-gray-900 mb-4">
                          지구 반대편과 소통하세요.
                        </h2>
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                          Amiko 커뮤니티 서비스
                        </h1>
                        <div className="w-48 h-1 bg-purple-300 mb-6"></div>
                        <p className="text-gray-600 text-lg">
                          Amiko는 지구 반대편을 연결하는 다리입니다. 커뮤니티를 통해 서로의 문화에 더욱 가까이 다가가보세요.
                        </p>
                      </div>
                      
                      {/* 왼쪽 아래 2개 카드 */}
                      <div className="flex flex-col md:flex-row gap-6 mt-20">
                        {/* K-Trend 카드 */}
                        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 relative w-full max-w-md h-64">
                          <div className="absolute top-4 right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">01</span>
                          </div>
                          <div className="text-center">
                            <div className="w-20 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 relative">
                              {/* 직사각형 문서 모양 */}
                              <div className="w-14 h-10 bg-white border-2 border-gray-800 rounded-lg relative">
                                {/* 가로선들 */}
                                <div className="absolute top-1 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-2 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-3 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-4 left-1 right-1 h-0.5 bg-gray-400"></div>
                                <div className="absolute top-5 left-1 right-1 h-0.5 bg-gray-400"></div>
                                {/* 노란색 사각형 */}
                                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-sm"></div>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">K-Trend</h3>
                            <p className="text-gray-600 leading-relaxed">
                              한국인이 직접 전하는 정확하고 빠른 K-Trend, Amiko에서 경험해보세요.
                            </p>
                          </div>
                        </div>
                        
                        {/* 자유게시판 카드 */}
                        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 relative w-full max-w-md h-64">
                          <div className="absolute top-4 right-4">
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">02</span>
                          </div>
                          <div className="text-center">
                            <div className="w-20 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 relative">
                              {/* 직사각형 말풍선 모양 */}
                              <div className="w-14 h-10 bg-white border-2 border-gray-800 rounded-lg relative">
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
                            <h3 className="text-xl font-bold text-gray-900 mb-4">자유게시판</h3>
                            <p className="text-gray-600 leading-relaxed">
                              K-POP게시판, K-DRAMA게시판 여행 게시판, 자유 게시판을 통해 자유로운 소통을 경험해보세요.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Q&A 카드 */}
                    <div className="flex justify-end">
                      <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 relative w-full max-w-md h-64">
                        <div className="absolute top-4 right-4">
                          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">03</span>
                        </div>
                        <div className="text-center">
                          <div className="w-20 h-12 flex items-center justify-center mx-auto mb-4">
                            {/* 검은색 테두리 말풍선 */}
                            <div className="w-14 h-10 border-2 border-gray-800 rounded-lg relative bg-white">
                              {/* 말풍선 꼬리 */}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-800"></div>
                              {/* 물음표 */}
                              <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold text-xl">?</div>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Q&A</h3>
                          <p className="text-gray-600 leading-relaxed">
                            Q&A 커뮤니티를 통해 서로에게 궁금한 점들을 질문하고 현지인에게 직접 답변을 받아보세요.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 세 번째 슬라이드 - 문의하기 */}
            <SwiperSlide>
              <div className="min-h-screen flex flex-col">
                {/* 상단 메인 콘텐츠 */}
                <div className="flex items-center justify-between py-32">
                  {/* 왼쪽 콘텐츠 */}
                  <div className="flex-1 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-green-100/50 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-green-200/30">
                      <span className="text-green-700 font-medium text-sm">💬 문의하기</span>
                    </div>
                    
                    <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                      불편사항을<br />
                      알려주세요
                    </h1>
                    
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                      사용 중 불편한 점이나 개선사항이 있다면 언제든지 문의해주세요. 
                      빠른 시일 내에 답변드리겠습니다.
                    </p>
                    
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => router.push('/inquiry')}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        문의하기
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/main?tab=community')}
                        className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 rounded-full text-lg font-medium"
                      >
                        커뮤니티 보기
                      </Button>
                    </div>
                  </div>

                  {/* 오른쪽 이미지 영역 */}
                  <div className="flex-1 flex justify-center items-center">
                    <div className="w-80 h-80 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="text-6xl">💬</div>
                    </div>
                  </div>
                </div>

                {/* 하단 문의 섹션 */}
                <div className="bg-white py-6" id="inquiry-section">
                  <div className="container-custom max-w-6xl mx-auto px-4">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">문의 유형</h2>
                      <p className="text-gray-600">어떤 종류의 문의든 편하게 남겨주세요</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* 버그 신고 */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🐛</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">버그 신고</h3>
                          <p className="text-gray-600 text-sm">
                            앱이나 웹사이트에서 발견한 오류를 신고해주세요
                          </p>
                        </div>
                      </div>

                      {/* 기능 제안 */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💡</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">기능 제안</h3>
                          <p className="text-gray-600 text-sm">
                            새로운 기능이나 개선사항을 제안해주세요
                          </p>
                        </div>
                      </div>

                      {/* 일반 문의 */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💬</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">일반 문의</h3>
                          <p className="text-gray-600 text-sm">
                            기타 궁금한 사항이나 도움이 필요한 내용
                          </p>
                        </div>
                      </div>

                      {/* 결제 문의 */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💳</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">결제 문의</h3>
                          <p className="text-gray-600 text-sm">
                            결제 관련 문제나 환불 문의
                          </p>
                        </div>
                      </div>

                      {/* 계정 문의 */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">👤</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">계정 문의</h3>
                          <p className="text-gray-600 text-sm">
                            로그인, 회원가입, 계정 관련 문제
                          </p>
                        </div>
                      </div>

                      {/* 기타 */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">❓</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">기타</h3>
                          <p className="text-gray-600 text-sm">
                            위 카테고리에 해당하지 않는 문의
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          {/* 커스텀 네비게이션 버튼 - 큰 버전 */}
          <button 
            onClick={() => {
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slidePrev()
              }
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
          >
            <ChevronLeft className="w-8 h-8 group-hover:text-blue-600 transition-colors" />
          </button>
          
          <button 
            onClick={() => {
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideNext()
              }
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white/90 backdrop-blur-md rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
          >
            <ChevronRight className="w-8 h-8 group-hover:text-blue-600 transition-colors" />
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

          {/* 슬라이드 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideTo(0)
                }
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                activeSlide === 0 ? 'bg-blue-600 scale-125' : 'bg-gray-400'
              }`}
            />
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideTo(1)
                }
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                activeSlide === 1 ? 'bg-blue-600 scale-125' : 'bg-gray-400'
              }`}
            />
            <button 
              onClick={() => {
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideTo(2)
                }
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                activeSlide === 2 ? 'bg-green-600 scale-125' : 'bg-gray-400'
              }`}
            />
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

