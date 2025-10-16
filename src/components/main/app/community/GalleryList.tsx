'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
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

interface GalleryListProps {
  onGallerySelect: (gallery: Gallery) => void
  onPopularPosts?: () => void
}

export default function GalleryList({ onGallerySelect, onPopularPosts }: GalleryListProps) {
  const { t, language } = useLanguage()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : t('community.galleryList.errors.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  const getGalleryName = (gallery: Gallery) => {
    return language === 'ko' ? gallery.name_ko : (gallery.name_es || gallery.name_ko)
  }

  const getGalleryDescription = (gallery: Gallery) => {
    return language === 'ko' ? gallery.description_ko : (gallery.description_es || gallery.description_ko)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('buttons.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadGalleries}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 - 모바일에서 숨김 */}
      <div className="text-center hidden md:block">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {t('community.galleryList.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('community.galleryList.subtitle')}
        </p>
        
        {/* 인기글 버튼 */}
        {onPopularPosts && (
          <div className="flex justify-center">
            <button
              onClick={onPopularPosts}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔥 {t('community.galleryList.popularPosts')}
            </button>
          </div>
        )}
      </div>

      {/* 갤러리 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {galleries
          .filter(gallery => gallery.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((gallery) => (
            <Card 
              key={gallery.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 dark:border-gray-600 dark:hover:border-blue-400 bg-white dark:bg-gray-800 group"
              onClick={() => onGallerySelect(gallery)}
            >
              <div className="p-6">
                {/* 갤러리 아이콘과 색상 */}
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl flex items-center justify-center text-3xl md:text-4xl lg:text-5xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: gallery.color + '20' }}
                >
                  {gallery.icon || '📁'}
                </div>

                {/* 갤러리 이름 */}
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
                  {getGalleryName(gallery)}
                </h3>

                {/* 갤러리 설명 */}
                <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-4 text-center line-clamp-2">
                  {getGalleryDescription(gallery)}
                </p>

                {/* 통계 정보 */}
                <div className="flex justify-center space-x-4 text-xs md:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <span className="mr-1">📝</span>
                    <span>{gallery.post_count}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">💬</span>
                    <span>{gallery.comment_count}</span>
                  </div>
                </div>

                {/* 활성 상태 표시 */}
                {gallery.post_count > 0 && (
                  <div className="mt-3 flex justify-center">
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-green-100 text-green-700 border-green-200"
                    >
                      활성
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
      </div>

      {/* 갤러리가 없는 경우 */}
      {galleries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📁</div>
          <p className="text-gray-600">{t('community.galleryList.noPosts')}</p>
        </div>
      )}
    </div>
  )
}
