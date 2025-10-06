'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import FreeBoardList from '@/components/main/app/community/FreeBoardList'
import PostCreate from '@/components/main/app/community/PostCreate'

export default function FreeBoardPage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list')

  const handleBackToList = () => {
    setCurrentView('list')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-0 pt-4 pb-20 md:px-4 md:pt-24 md:pb-6">
        {currentView === 'list' ? (
          <FreeBoardList
            showHeader={false}
            onPostSelect={(post) => {
              // 게시물 상세 페이지로 이동
              router.push(`/community/post/${post.id}`)
            }}
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
      
      {/* 모바일 하단 네비게이션 - 주제별 게시판에서는 숨김 */}
      {/* <BottomTabNavigation /> */}
    </div>
  )
}
