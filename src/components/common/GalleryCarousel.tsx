'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface GalleryItem {
  id: string
  title: string
  image?: string
  description?: string
  date?: string
  likes?: number
  createdAt?: string
}

interface GalleryCarouselProps {
  items: GalleryItem[]
  title?: string
  icon?: React.ReactNode
  moreText?: string
  onMoreClick?: () => void
  onItemClick?: (item: GalleryItem) => void
  autoSlide?: boolean
  slideInterval?: number
  itemsPerRow?: number // 한 번에 표시할 아이템 개수 (기본값: 6)
  aspectRatio?: string // 카드 비율 (기본값: '8 / 13')
}

export default function GalleryCarousel({ 
  items,
  title,
  icon,
  moreText,
  onMoreClick,
  onItemClick,
  autoSlide = true,
  slideInterval = 5000,
  itemsPerRow = 6,
  aspectRatio = '8 / 13'
}: GalleryCarouselProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoSliding, setIsAutoSliding] = useState(autoSlide)

  // 자동 롤링 (itemsPerRow개씩)
  useEffect(() => {
    if (items.length > itemsPerRow && isAutoSliding) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + itemsPerRow
          return nextIndex >= items.length ? 0 : nextIndex
        })
      }, slideInterval)
      return () => clearInterval(interval)
    }
  }, [items.length, isAutoSliding, slideInterval, itemsPerRow])

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? Math.max(0, items.length - itemsPerRow) : Math.max(0, currentIndex - itemsPerRow)
    setCurrentIndex(newIndex)
    setIsAutoSliding(false)
  }

  const handleNext = () => {
    const newIndex = currentIndex + itemsPerRow >= items.length ? 0 : currentIndex + itemsPerRow
    setCurrentIndex(newIndex)
    setIsAutoSliding(false)
  }

  const handlePageClick = (pageIndex: number) => {
    setCurrentIndex(pageIndex * itemsPerRow)
    setIsAutoSliding(false)
  }

  if (items.length === 0) return null

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-8">
      <div className="mx-auto px-4" style={{ maxWidth: '1420px' }}>
        {/* 타이틀 섹션 */}
        {title && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            </div>
            {moreText && onMoreClick && (
              <button
                onClick={onMoreClick}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium transition-colors"
              >
                <span>{moreText}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="relative">
          {/* 이전/다음 버튼 */}
          {items.length > itemsPerRow && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all"
                aria-label="Previous"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all"
                aria-label="Next"
              >
                <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* 갤러리 그리드 */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-4 transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${Math.floor(currentIndex / itemsPerRow) * 100}%)`
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex-shrink-0"
                  onClick={() => onItemClick?.(item)}
                  style={{ 
                    width: `calc((100% - ${itemsPerRow - 1} * 1rem) / ${itemsPerRow})`, // 동적 카드 너비
                    aspectRatio: aspectRatio // 동적 비율
                  }}
                >
                  {/* 배너 이미지 또는 그라데이션 배경 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* 항상 표시되는 정보 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="text-sm font-bold mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/90 mb-1 line-clamp-2">
                        {item.description || (item.likes ? `${item.likes} likes` : '')}
                      </p>
                      <p className="text-xs text-white/80">
                        {item.date || item.createdAt || ''}
                      </p>
                    </div>
                  </div>

                  {/* 호버 시 추가 효과 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 인디케이터 */}
          {items.length > itemsPerRow && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(items.length / itemsPerRow) }).map((_, pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => handlePageClick(pageIndex)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    Math.floor(currentIndex / itemsPerRow) === pageIndex
                      ? 'bg-purple-600 w-8'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
