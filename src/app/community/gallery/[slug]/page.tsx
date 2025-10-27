'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Header from '@/components/layout/Header'
import dynamic from 'next/dynamic'

// 무거운 컴포넌트들을 동적 임포트로 최적화
const GalleryPostList = dynamic(() => import('@/components/main/app/community/GalleryPostList'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
})

const PostCreate = dynamic(() => import('@/components/main/app/community/PostCreate'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

export default function GalleryPostsPage() {
  const params = useParams()
  const router = useRouter()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list')
  const [loading, setLoading] = useState(true)

  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      fetchGallery()
    }
  }, [slug])

  const fetchGallery = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/galleries/${slug}`)
      
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
    router.push('/main?tab=community')
  }

  const handleCreatePost = () => {
    setCurrentView('create')
  }

  const handleBackToList = () => {
    setCurrentView('list')
  }

  const handlePostSelect = (post: any) => {
    // 게시물 상세 페이지로 이동
    router.push(`/community/post/${post.id}`)
  }

  const handleBackToGalleries = () => {
    router.push('/main?tab=community')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* 모바일 전용 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 md:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-3 py-2 text-sm font-medium min-w-[60px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">이전</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{gallery.name_ko}</h1>
          </div>
          
          {/* 모바일 글쓰기 버튼 */}
          {currentView === 'list' && (
            <Button
              onClick={handleCreatePost}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              글쓰기
            </Button>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-0 pt-4 pb-20 md:px-4 md:pt-24 md:pb-6">
        {currentView === 'list' ? (
          <GalleryPostList
            gallery={gallery}
            onPostSelect={handlePostSelect}
            onCreatePost={handleCreatePost}
            onGallerySelect={() => {}} // 현재 갤러리에서 다른 갤러리 선택은 불가
            onBackToGalleries={handleBackToGalleries}
            onPopularPosts={() => router.push('/community/popular')}
          />
        ) : (
          <PostCreate
            gallery={gallery}
            onSuccess={handleBackToList}
            onCancel={handleBackToList}
          />
        )}
      </div>
    </div>
  )
}
