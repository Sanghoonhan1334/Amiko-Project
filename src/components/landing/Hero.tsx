'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function Hero() {
  const router = useRouter()
  const { t } = useLanguage()
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50 z-0">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-slate-100/40 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-blue-100/20 rounded-full blur-xl"></div>
      </div>

      {/* 첫 번째 섹션 - Global Community */}
      <div className="container-custom relative z-0 px-0 sm:px-0 md:px-0 pt-32 sm:pt-36 md:pt-40 pb-8">
        {/* 모바일 레이아웃 */}
        <div className="block md:hidden">
          <div className="w-full px-4 text-center">
            {/* 상단 텍스트 */}
            <p className="text-gray-600 text-lg font-medium mb-2 leading-relaxed">
              {t('heroSlides.slide1.subtitle')}
            </p>
            
            {/* 메인 제목 */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight font-['Inter']">
              {t('heroSlides.slide1.title')}
            </h1>
            
            {/* 하단 설명 */}
            <p className="text-gray-700 text-base leading-relaxed mb-8">
              {t('heroSlides.slide1.description')}
            </p>
            
            {/* 이미지 */}
            <div className="flex justify-center -mt-20 -mb-8">
              <img 
                src="/Slide1.png" 
                alt="Global Community" 
                className="w-full max-w-sm h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* 데스크톱 레이아웃 */}
        <div className="hidden md:block">
          <div className="flex flex-col items-center justify-start pt-4 md:pt-6 lg:pt-8 -mb-16 md:-mb-24 lg:-mb-32">
            <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
              <div className="w-full">
                {/* 상단 텍스트 */}
                <p className="text-gray-600 text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-1 leading-relaxed">
                  {t('heroSlides.slide1.subtitle')}
                </p>
                
                {/* 메인 제목 */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-2 leading-tight font-['Inter']">
                  {t('heroSlides.slide1.title')}
                </h1>
                
                {/* 하단 설명 */}
                <p className="text-gray-700 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-0">
                  {t('heroSlides.slide1.description')}
                </p>
                
                {/* 이미지 */}
                <div className="flex justify-center -mt-20 md:-mt-28 lg:-mt-36">
                  <img 
                    src="/Slide1.png" 
                    alt="Global Community" 
                    className="w-full max-w-4xl h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 두 번째 섹션 - 화상 채팅 */}
      <div className="bg-white py-8 md:py-12 lg:py-16">
        <div className="flex items-start justify-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto relative">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                {/* 왼쪽: 텍스트 */}
                <div className="text-left max-w-lg">
                  <div className="inline-flex items-center gap-2 bg-blue-100/50 backdrop-blur-sm rounded-full px-3 py-1.5 mb-3 border border-blue-200/30">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-700 font-medium text-xs">{t('heroSlides.slide2.badge')}</span>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight font-['Inter']">
                    {t('heroSlides.slide2.title')}
                  </h1>
                  
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed mb-0">
                    {t('heroSlides.slide2.description').split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < t('heroSlides.slide2.description').split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>

                {/* 오른쪽: 이미지 */}
                <div className="flex justify-center z-10">
                  <img 
                    src="/Slide2.png" 
                    alt="화상 채팅" 
                    className="w-48"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 세 번째 섹션 - 홈 (커뮤니티 서비스) */}
      <div className="container-custom relative z-0 px-0 sm:px-0 md:px-0 pb-8">
        <div className="flex flex-col justify-start pt-4 md:pt-6 lg:pt-8 pb-6 sm:pb-8 md:pb-10">
          <div className="w-full px-2 sm:px-4">
            {/* 메인 레이아웃 */}
            <div className="space-y-2 sm:space-y-3">
              {/* 왼쪽 섹션 */}
              <div className="space-y-2 sm:space-y-3 pt-0 md:pt-0">
                {/* 제목 섹션 */}
                <div className="text-left ml-4 sm:ml-6 md:ml-12 lg:ml-16">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-normal text-gray-900 mb-2 sm:mb-3">
                    {t('heroSlides.slide3.subtitle')}
                  </h2>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 font-['Inter']">
                    {t('heroSlides.slide3.title')}
                  </h1>
                  <div className="space-y-1 text-gray-700 text-sm sm:text-base leading-relaxed">
                    <p>{t('heroSlides.slide3.description')}</p>
                  </div>
                </div>
                
                {/* 4개 카드 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-2 sm:mt-4 md:mt-6 mx-2 sm:mx-4 md:mx-6 lg:mx-8">
                  {/* 주제별 게시판 카드 */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">01</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/주제별게시판.png" alt="주제별 게시판" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.topicBoard.title')}</h3>
                      <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('heroSlides.slide3.cards.topicBoard.description')}
                      </p>
                    </div>
                  </div>
                  
                  {/* 한국뉴스 카드 */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">02</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/K-매거진.png" alt="K-매거진" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.koreanNews.title')}</h3>
                      <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('heroSlides.slide3.cards.koreanNews.description')}
                      </p>
                    </div>
                  </div>
                  
                  {/* 한국성향테스트 카드 */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">03</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/심리테스트.png" alt="한국성향테스트" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.koreanTest.title')}</h3>
                      <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        오늘의 운세와 나의 성향을 재밌게 알아보세요
                      </p>
                    </div>
                  </div>
                  
                  {/* 스토리 카드 */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 relative h-28 sm:h-32 md:h-36 lg:h-40 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">04</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/스토리.png" alt="스토리" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 sm:mb-2 font-['Inter']">스토리</h3>
                      <p className="text-gray-600 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        일상을 공유하고 소통해보세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 시작하기 버튼 섹션 */}
      <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-16 md:py-20 lg:py-24">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              지금 시작하고 1분 만에 커뮤니티를 만나보세요
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              무료 커뮤니티. 한국인들과 영상통화 및 게임을 즐겨보세요
            </p>
            <button 
              onClick={() => router.push('/main')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-2xl md:text-3xl font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[220px] inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              무료로 시작하기
            </button>
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