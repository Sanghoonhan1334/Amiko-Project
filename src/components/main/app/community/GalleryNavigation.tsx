'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'

interface Gallery {
  id: string
  slug: string
  name_ko: string
  name_es?: string
  description_ko: string
  description_es?: string
  icon: string
  color: string
  post_count: number
  comment_count: number
  is_active: boolean
  sort_order: number
}

interface GalleryNavigationProps {
  currentGallery?: Gallery
  onGallerySelect: (gallery: Gallery) => void
  onBackToGalleries: () => void
  onPopularPosts: () => void
}

export default function GalleryNavigation({ 
  currentGallery, 
  onGallerySelect, 
  onBackToGalleries,
  onPopularPosts 
}: GalleryNavigationProps) {
  const { t, language } = useLanguage()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllGalleries, setShowAllGalleries] = useState(false)

  useEffect(() => {
    loadGalleries()
  }, [])

  const loadGalleries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/galleries')
      
      if (!response.ok) {
        throw new Error('갤러리를 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setGalleries(data.galleries || [])
    } catch (err) {
      console.error('갤러리 로드 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const getGalleryName = (gallery: Gallery) => {
    return language === 'ko' ? gallery.name_ko : (gallery.name_es || gallery.name_ko)
  }

  const activeGalleries = galleries.filter(gallery => gallery.is_active)
  const displayedGalleries = showAllGalleries ? activeGalleries : activeGalleries.slice(0, 6)

  if (loading) {
    return (
      <Card className="p-4 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-400"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">갤러리 로딩 중...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {currentGallery ? '다른 갤러리 보기' : '갤러리 선택'}
          </h3>
          
          <div className="flex space-x-2">
            <Button
              onClick={onBackToGalleries}
              variant="outline"
              size="sm"
            >
              전체 갤러리
            </Button>
            <Button
              onClick={onPopularPosts}
              size="sm"
              className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600"
            >
              🔥 인기글
            </Button>
          </div>
        </div>

        {/* 현재 갤러리 표시 */}
        {currentGallery && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-gray-600 dark:border-gray-400 dark:border-gray-600 dark:border-gray-400">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: currentGallery.color + '20' }}
              >
                {currentGallery.icon}
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">{getGalleryName(currentGallery)}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  게시물 {currentGallery.post_count}개 • 댓글 {currentGallery.comment_count}개
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 갤러리 목록 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {displayedGalleries.map((gallery) => (
            <button
              key={gallery.id}
              onClick={() => onGallerySelect(gallery)}
              className={`p-3 rounded-lg text-center transition-all duration-200 ${
                currentGallery?.id === gallery.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-gray-600 dark:border-gray-400 dark:border-gray-600 dark:border-gray-400'
                  : 'bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400'
              }`}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mx-auto mb-2"
                style={{ backgroundColor: gallery.color + '20' }}
              >
                {gallery.icon}
              </div>
              <p className={`text-xs font-medium ${
                currentGallery?.id === gallery.id ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-white'
              }`}>
                {getGalleryName(gallery)}
              </p>
              <p className={`text-xs mt-1 ${
                currentGallery?.id === gallery.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-white'
              }`}>
                {gallery.post_count}개
              </p>
            </button>
          ))}
        </div>

        {/* 더보기 버튼 */}
        {activeGalleries.length > 6 && (
          <div className="text-center">
            <Button
              onClick={() => setShowAllGalleries(!showAllGalleries)}
              variant="outline"
              size="sm"
            >
              {showAllGalleries ? '간단히 보기' : `더보기 (${activeGalleries.length - 6}개)`}
            </Button>
          </div>
        )}

        {/* 빠른 액세스 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-white mr-2">빠른 액세스:</span>
            
            <Button
              onClick={() => onGallerySelect(activeGalleries.find(g => g.slug === 'beauty')!)}
              variant="outline"
              size="sm"
              className="text-pink-600 hover:text-pink-700"
            >
              💄 뷰티
            </Button>
            
            <Button
              onClick={() => onGallerySelect(activeGalleries.find(g => g.slug === 'fashion')!)}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
            >
              👕 패션
            </Button>
            
            <Button
              onClick={() => onGallerySelect(activeGalleries.find(g => g.slug === 'travel')!)}
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              🗺️ 여행
            </Button>
            
            <Button
              onClick={() => onGallerySelect(activeGalleries.find(g => g.slug === 'food')!)}
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700"
            >
              🍱 음식
            </Button>
            
            <Button
              onClick={() => onGallerySelect(activeGalleries.find(g => g.slug === 'language')!)}
              variant="outline"
              size="sm"
              className="text-purple-600 hover:text-purple-700"
            >
              📖 언어
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
