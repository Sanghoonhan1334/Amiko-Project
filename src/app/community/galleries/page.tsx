'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import GalleryList from '@/components/main/app/community/GalleryList'

export default function GalleriesPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* 모바일 전용 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 bg-white shadow-sm hover:shadow-md px-3 py-2 text-sm font-medium min-w-[60px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">이전</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">주제별 게시판</h1>
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
