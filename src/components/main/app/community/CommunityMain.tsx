'use client'

import React, { useState } from 'react'
import GalleryList from './GalleryList'
import GalleryPostList from './GalleryPostList'
import PostDetail from './PostDetail'
import PostCreate from './PostCreate'
import PopularPosts from './PopularPosts'

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

interface Post {
  id: string
  title: string
  content: string
  images: string[]
  view_count: number
  like_count: number
  dislike_count: number
  comment_count: number
  is_pinned: boolean
  is_hot: boolean
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

type ViewMode = 'galleries' | 'posts' | 'post-detail' | 'post-create' | 'popular'

// CommunityMain.tsx - 갤러리 시스템 메인 컴포넌트 (주제별 게시판)
export default function CommunityMain() {
  const [viewMode, setViewMode] = useState<ViewMode>('galleries')
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const handleGallerySelect = (gallery: Gallery) => {
    setSelectedGallery(gallery)
    setViewMode('posts')
  }

  const handlePostSelect = (post: Post) => {
    setSelectedPost(post)
    setViewMode('post-detail')
  }

  const handleCreatePost = () => {
    setViewMode('post-create')
  }

  const handleBackToGalleries = () => {
    setSelectedGallery(null)
    setSelectedPost(null)
    setViewMode('galleries')
  }

  const handleBackToPosts = () => {
    setSelectedPost(null)
    setViewMode('posts')
  }

  const handlePostCreateSuccess = () => {
    setViewMode('posts')
    // 게시물 목록 새로고침을 위해 PostList 컴포넌트에 key 변경
  }

  const handlePostCreateCancel = () => {
    setViewMode('posts')
  }

  const handlePopularPosts = () => {
    setViewMode('popular')
  }

  const handlePostEdit = () => {
    // 게시물 수정 기능 (나중에 구현)
    console.log('게시물 수정')
  }

  const handlePostDelete = () => {
    if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      // 게시물 삭제 로직
      console.log('게시물 삭제')
      handleBackToPosts()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 네비게이션 브레드크럼 */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={handleBackToGalleries}
              className="hover:text-blue-500 transition-colors"
            >
              커뮤니티
            </button>
            
            {viewMode !== 'galleries' && (
              <>
                <span>›</span>
                {viewMode === 'popular' ? (
                  <span className="text-gray-800">인기글</span>
                ) : selectedGallery && (
                  <>
                    <span className="text-gray-800">{selectedGallery.name_ko}</span>
                    {viewMode === 'post-detail' && selectedPost && (
                      <>
                        <span>›</span>
                        <span className="text-gray-800 truncate max-w-xs">
                          {selectedPost.title}
                        </span>
                      </>
                    )}
                    {viewMode === 'post-create' && (
                      <>
                        <span>›</span>
                        <span className="text-gray-800">글 작성</span>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        {/* 메인 컨텐츠 */}
        {viewMode === 'galleries' && (
          <GalleryList 
            onGallerySelect={handleGallerySelect} 
            onPopularPosts={handlePopularPosts}
          />
        )}

        {viewMode === 'posts' && selectedGallery && (
          <GalleryPostList
            key={`posts-${selectedGallery.id}`} // 새로고침을 위한 key
            gallery={selectedGallery}
            onPostSelect={handlePostSelect}
            onCreatePost={handleCreatePost}
            onGallerySelect={handleGallerySelect}
            onBackToGalleries={handleBackToGalleries}
            onPopularPosts={handlePopularPosts}
          />
        )}

        {viewMode === 'post-detail' && selectedPost && (
          <PostDetail
            postId={selectedPost.id}
            onBack={handleBackToPosts}
            onEdit={handlePostEdit}
            onDelete={handlePostDelete}
          />
        )}

        {viewMode === 'post-create' && selectedGallery && (
          <PostCreate
            gallery={selectedGallery}
            onSuccess={handlePostCreateSuccess}
            onCancel={handlePostCreateCancel}
          />
        )}

        {viewMode === 'popular' && (
          <PopularPosts onPostSelect={handlePostSelect} />
        )}
      </div>
    </div>
  )
}
