'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import FreeBoardList from '@/components/main/app/community/FreeBoardList'
import PostCreate from '@/components/main/app/community/PostCreate'

export default function FreeBoardPage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list')

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  const handleCreatePost = () => {
    setCurrentView('create')
  }

  const handleBackToList = () => {
    setCurrentView('list')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 페이지별 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-500 bg-white shadow-sm hover:shadow-md px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </Button>
            <h1 className="text-xl font-bold text-gray-800">주제별 게시판</h1>
          </div>
          
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
          <FreeBoardList
            onPostSelect={() => {}}
            onWritePost={handleCreatePost}
            showHeader={false}
          />
        ) : (
          <PostCreate
            gallery={{
              id: 'free',
              slug: 'free',
              name_ko: '자유게시판',
              icon: '📝',
              color: '#3B82F6'
            }}
            onSuccess={handleBackToList}
            onCancel={handleBackToList}
          />
        )}
      </div>
      
      {/* 모바일 하단 네비게이션 */}
      <BottomTabNavigation />
    </div>
  )
}
