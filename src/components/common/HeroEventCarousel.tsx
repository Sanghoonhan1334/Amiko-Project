'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EventItem {
  id: string
  title: string
  image?: string
  description?: string
  date?: string
  participants?: number
}

interface HeroEventCarouselProps {
  items: EventItem[]
  onItemClick?: (item: EventItem) => void
  autoSlide?: boolean
  slideInterval?: number
}

export default function HeroEventCarousel({ 
  items,
  onItemClick,
  autoSlide = true,
  slideInterval = 5000
}: HeroEventCarouselProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoSliding, setIsAutoSliding] = useState(autoSlide)

  // 자동 롤링 (1개씩)
  useEffect(() => {
    if (items.length > 1 && isAutoSliding) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
      }, slideInterval)
      return () => clearInterval(interval)
    }
  }, [items.length, isAutoSliding, slideInterval])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
    setIsAutoSliding(false)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
    setIsAutoSliding(false)
  }

  const handlePageClick = (pageIndex: number) => {
    setCurrentIndex(pageIndex)
    setIsAutoSliding(false)
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <div className="relative">
        {/* 이전/다음 버튼 */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all"
              aria-label="Previous"
            >
              <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all"
              aria-label="Next"
            >
              <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* 히어로 이벤트 슬라이드 */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer overflow-hidden flex-shrink-0 w-full"
                onClick={() => onItemClick?.(item)}
                style={{ 
                  height: 'max(550px, 50vh)'
                }}
              >
                {/* YouTube 배경 영상 */}
                <div className="absolute inset-0 bg-black overflow-hidden">
                  <iframe
                    className="pointer-events-none"
                    src="https://www.youtube.com/embed/cZxLM4-mSrw?autoplay=1&mute=1&loop=1&playlist=cZxLM4-mSrw&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
                    title="Hero Background Video"
                    allow="autoplay; encrypted-media"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '177.77777778vh', // 16:9 비율 유지
                      height: '56.25vw', // 16:9 비율 유지
                      minWidth: '100%',
                      minHeight: '100%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>

                {/* 오버레이 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                {/* 텍스트 콘텐츠 - 반응형 패딩 */}
                <div className="absolute bottom-8 left-0 right-0 px-5 md:px-10 lg:px-[10rem] flex text-white">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4 line-clamp-3">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm md:text-base lg:text-lg text-white/90 mb-4 md:mb-6 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm md:text-base text-white/80">
                      {item.date && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {item.date}
                        </span>
                      )}
                      {item.participants && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {item.participants}명 참여
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 호버 시 추가 효과 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 인디케이터 */}
        {items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex justify-center gap-2">
            {items.map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => handlePageClick(pageIndex)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === pageIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 w-2'
                }`}
                aria-label={`Go to slide ${pageIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
