'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import GalleryList from '@/components/main/app/community/GalleryList'
import { useLanguage } from '@/context/LanguageContext'

export default function GalleriesPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* 모바일 전용 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 md:hidden">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">주제별 게시판</h1>
          <div className="flex justify-end">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('buttons.back')}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-0 pt-4 pb-20 md:px-4 md:pt-24 md:pb-6">
        <GalleryList
          onGallerySelect={(gallery) => {
            // 갤러리별 게시물 목록으로 이동
            router.push(`/community/gallery/${gallery.slug}`)
          }}
          onPopularPosts={() => {
            // 인기 게시물로 이동
            router.push('/community/popular')
          }}
        />
      </div>
    </div>
  )
}
