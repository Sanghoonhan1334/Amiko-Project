'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function Hero() {
  const router = useRouter()
  const { t } = useLanguage()
  const [showVideo, setShowVideo] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
      
      // 강제로 텍스트 색상 적용
      const subtitleMobile = document.getElementById('hero-subtitle-mobile')
      const subtitleDesktop = document.getElementById('hero-subtitle-desktop')
      
      if (subtitleMobile) {
        subtitleMobile.style.color = document.documentElement.classList.contains('dark') ? '#ffffff' : '#6b7280'
      }
      if (subtitleDesktop) {
        subtitleDesktop.style.color = document.documentElement.classList.contains('dark') ? '#ffffff' : '#6b7280'
      }
    }
    
    checkDarkMode()
    
    // 다크모드 변경 감지
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // 주기적으로 색상 확인
    const interval = setInterval(checkDarkMode, 1000)
    
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 z-10">
      {/* 배경 장식 요소들 - 텍스트 가림 방지를 위해 임시 제거 */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 dark:bg-blue-900/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-slate-100/40 dark:bg-gray-700/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-blue-100/20 dark:bg-blue-900/10 rounded-full blur-xl"></div>
      </div> */}

      {/* 첫 번째 섹션 - Global Community */}
      <div className="relative z-10 px-0 sm:px-0 md:px-0 pt-32 sm:pt-36 md:pt-40 pb-8">
        {/* 모바일 레이아웃 */}
        <div className="block md:hidden text-center px-4 relative z-50">
            {/* 상단 텍스트 */}
            <p className="text-gray-600 dark:text-white text-lg font-medium mb-2 leading-relaxed relative z-50">
              {t('heroSlides.slide1.subtitle')}
            </p>
            
            {/* 메인 제목 */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight font-['Inter'] relative z-50">
              {t('heroSlides.slide1.title')}
            </h1>
            
            {/* 하단 설명 */}
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-8 relative z-50">
              {t('heroSlides.slide1.description')}
            </p>
            
            {/* 이미지 */}
            <div className="flex justify-center -mt-20 -mb-8 relative z-0">
              <img 
                src="/Slide1.png" 
                alt="Global Community" 
                className="w-full max-w-sm h-auto object-contain relative z-0"
                loading="lazy"
              />
            </div>
        </div>

        {/* 데스크톱 레이아웃 */}
        <div className="hidden md:block text-center pt-4 md:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8 relative z-50">
                {/* 상단 텍스트 */}
                <p className="text-gray-600 dark:text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-1 leading-relaxed bg-transparent relative z-50">
                  {t('heroSlides.slide1.subtitle')}
                </p>
                
                {/* 메인 제목 */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight font-['Inter'] relative z-50">
                  {t('heroSlides.slide1.title')}
                </h1>
                
                {/* 하단 설명 */}
                <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-0 relative z-50">
                  {t('heroSlides.slide1.description')}
                </p>
                
                {/* 이미지 */}
                <div className="flex justify-center -mt-20 md:-mt-28 lg:-mt-36 relative z-0">
                  <img 
                    src="/Slide1.png" 
                    alt="Global Community" 
                    className="w-full max-w-4xl h-auto object-contain relative z-0"
                    loading="lazy"
                  />
                </div>
        </div>
      </div>

      {/* 두 번째 섹션 - 화상 채팅 */}
      <div className="bg-white dark:bg-transparent py-8 md:py-12 lg:py-16">
        <div className="flex items-start justify-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto relative">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                {/* 왼쪽: 텍스트 */}
                <div className="text-left max-w-lg">
                  <div className="inline-flex items-center gap-2 bg-blue-100/50 dark:bg-blue-900/30 backdrop-blur-sm rounded-full px-3 py-1.5 mb-3 border border-blue-200/30 dark:border-blue-700/30">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium text-xs">{t('heroSlides.slide2.badge')}</span>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight font-['Inter']">
                    {t('heroSlides.slide2.title')}
                  </h1>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-0">
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
                  <h2 className="text-lg sm:text-xl md:text-2xl font-normal text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                    {t('heroSlides.slide3.subtitle')}
                  </h2>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 font-['Inter']">
                    {t('heroSlides.slide3.title')}
                  </h1>
                  <div className="space-y-1 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                    <p>{t('heroSlides.slide3.description')}</p>
                  </div>
                </div>
                
                {/* 4개 카드 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-2 sm:mt-4 md:mt-6 mx-2 sm:mx-4 md:mx-6 lg:mx-8">
                  {/* 주제별 게시판 카드 */}
                  <div className="bg-white dark:bg-transparent rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 dark:border-gray-700 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">01</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/topic-board.png" alt="주제별 게시판" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.topicBoard.title')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('heroSlides.slide3.cards.topicBoard.description')}
                      </p>
                    </div>
                  </div>
                  
                  {/* 한국뉴스 카드 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 dark:border-gray-700 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">02</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/k-magazine.png" alt="K-매거진" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.koreanNews.title')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('heroSlides.slide3.cards.koreanNews.description')}
                      </p>
                    </div>
                  </div>
                  
                  {/* 한국성향테스트 카드 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 dark:border-gray-700 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">03</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/psychology-test.png" alt="한국성향테스트" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.koreanTest.title')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('heroSlides.slide3.cards.koreanTest.description')}
                      </p>
                    </div>
                  </div>
                  
                  {/* 스토리 카드 */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg border border-gray-100 dark:border-gray-700 relative h-28 sm:h-32 md:h-36 lg:h-40">
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">04</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-lg group-hover:shadow-2xl transition-shadow duration-300 mb-2 overflow-hidden mx-auto">
                        <img src="/story.png" alt="스토리" className="w-8 h-8 object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 font-['Inter']">{t('heroSlides.slide3.cards.story.title')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('heroSlides.slide3.cards.story.description')}
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
      <div className="bg-gradient-to-r from-blue-600 via-purple-700 to-pink-600 dark:bg-transparent py-16 md:py-20 lg:py-24">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white dark:text-white mb-4 leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {t('heroSlides.slide3.bottomSection.title')}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 dark:text-white mb-8 leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {t('heroSlides.slide3.bottomSection.description')}
            </p>
            <button 
              onClick={() => router.push('/main')}
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-6 py-1 md:py-4 text-lg md:text-xl font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[180px] inline-flex items-center justify-center whitespace-nowrap border-2 border-white/20 dark:border-gray-600"
            >
              {t('heroSlides.slide3.bottomSection.startButton')}
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