'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import dynamic from 'next/dynamic'

// PostCreate 컴포넌트를 동적 임포트로 최적화
const PostCreate = dynamic(() => import('@/components/main/app/community/PostCreate'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
    </div>
  )
})

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

function CreatePostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)

  const gallerySlug = searchParams.get('gallery')

  useEffect(() => {
    if (gallerySlug) {
      fetchGallery()
    } else {
      // 갤러리 정보가 없으면 메인 커뮤니티로 리다이렉트
      router.push('/main?tab=community')
    }
  }, [gallerySlug, router])

  const fetchGallery = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/galleries/${gallerySlug}`)
      
      if (!response.ok) {
        throw new Error('갤러리를 찾을 수 없습니다.')
      }

      const data = await response.json()
      setGallery(data.gallery)
    } catch (error) {
      console.error('갤러리 로딩 오류:', error)
      router.push('/main?tab=community')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (gallerySlug) {
      router.push(`/community/gallery/${gallerySlug}`)
    } else {
      router.push('/main?tab=community')
    }
  }

  const handleSuccess = () => {
    if (gallerySlug) {
      router.push(`/community/gallery/${gallerySlug}`)
    } else {
      router.push('/main?tab=community')
    }
  }

  const handleCancel = () => {
    if (gallerySlug) {
      router.push(`/community/gallery/${gallerySlug}`)
    } else {
      router.push('/main?tab=community')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
            <p className="text-gray-600">갤러리를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">갤러리를 찾을 수 없습니다</h1>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">글쓰기 - {gallery.name_ko}</h1>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-0 pt-4 pb-20 md:px-4 md:pt-24 md:pb-6">
        <PostCreate
          gallery={gallery}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <CreatePostContent />
    </Suspense>
  )
}
