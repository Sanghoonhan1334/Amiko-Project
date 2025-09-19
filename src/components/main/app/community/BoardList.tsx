'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'

interface Post {
  id: string
  title: string
  title_es?: string
  author: string
  date: string
  views: number
  likes: number
  comments: number
  category: string
  isHot?: boolean
  isNotice?: boolean
}

interface BoardListProps {
  onPostSelect: (post: Post) => void
  onWritePost?: () => void
}

export default function BoardList({ onPostSelect, onWritePost }: BoardListProps) {
  const { t, language } = useLanguage()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [showSpanish, setShowSpanish] = useState(false) // 번역 상태
  const [isTranslating, setIsTranslating] = useState(false) // 번역 중 상태

  // 카테고리 옵션
  const categories = [
    { id: 'all', name: language === 'ko' ? '전체글' : 'All Posts', icon: '📝' },
    { id: 'beauty', name: language === 'ko' ? '뷰티' : 'Beauty', icon: '💄' },
    { id: 'fashion', name: language === 'ko' ? '패션' : 'Fashion', icon: '👗' },
    { id: 'travel', name: language === 'ko' ? '여행' : 'Travel', icon: '✈️' },
    { id: 'culture', name: language === 'ko' ? '문화' : 'Culture', icon: '🎭' },
    { id: 'food', name: language === 'ko' ? '음식' : 'Food', icon: '🍜' },
    { id: 'language', name: language === 'ko' ? '언어' : 'Language', icon: '📚' },
    { id: 'free', name: language === 'ko' ? '자유' : 'Free', icon: '💬' },
    { id: 'daily', name: language === 'ko' ? '일상' : 'Daily', icon: '📅' }
  ]

  // 실제 게시글 API 호출 함수
  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('게시글 API 호출 시작...')
      const response = await fetch('/api/posts')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API 오류 응답:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: 게시글을 불러오는데 실패했습니다`)
      }
      
      const data = await response.json()
      console.log('API 응답 데이터:', data)
      
      // 성공적으로 빈 배열을 받아도 정상 처리
      const posts = data.posts || []
      console.log('게시글 개수:', posts.length)
      setPosts(posts)
      
    } catch (err) {
      console.error('게시글 로드 오류:', err)
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다')
      setPosts([]) // 오류 시 빈 배열
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, sortBy, currentPage])

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.icon : '📝'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-lg sm:text-xl">📝</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {language === 'ko' ? '주제별 게시판' : 'Topic Board'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {language === 'ko' ? '다양한 주제로 자유롭게 소통하세요' : 'Communicate freely on various topics'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 번역 버튼 */}
          <Button 
            variant={showSpanish ? "default" : "outline"} 
            size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!isTranslating) {
                        setIsTranslating(true)
                        setTimeout(() => {
                          setShowSpanish(!showSpanish)
                          setIsTranslating(false)
                        }, 1000)
                      }
                    }}
            disabled={isTranslating}
            className="flex items-center gap-2"
          >
            <span className="text-sm">
              {isTranslating ? '⏳' : '🌐'}
            </span>
            <span>
              {isTranslating ? (language === 'ko' ? '번역중...' : 'Translating...') : (showSpanish ? 'ES' : 'KO')}
            </span>
          </Button>
          
          <Button onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onWritePost?.()
          }} className="bg-blue-600 hover:bg-blue-700 text-white">
            {language === 'ko' ? '글쓰기' : 'Write Post'}
          </Button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedCategory(category.id)
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2"
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </Button>
        ))}
      </div>

      {/* 정렬 옵션 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-sm text-gray-600">
          {language === 'ko' ? '정렬:' : 'Sort by:'}
        </span>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant={sortBy === 'latest' ? 'default' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSortBy('latest')
            }}
            className="px-2 py-1 sm:px-3 sm:py-2"
          >
            {language === 'ko' ? '최신순' : 'Latest'}
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSortBy('popular')
            }}
            className="px-2 py-1 sm:px-3 sm:py-2"
          >
            {language === 'ko' ? '인기순' : 'Popular'}
          </Button>
          <Button
            variant={sortBy === 'views' ? 'default' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSortBy('views')
            }}
            className="px-2 py-1 sm:px-3 sm:py-2"
          >
            {language === 'ko' ? '조회순' : 'Views'}
          </Button>
        </div>
      </div>

      {/* 게시글 목록 */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <span className="animate-spin">📝</span>
              <span>{language === 'ko' ? '게시글을 불러오는 중...' : 'Loading posts...'}</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <span className="text-2xl">⚠️</span>
            <p className="mt-2">{error}</p>
          </div>
        ) : isTranslating ? (
          // 번역 중 스켈레톤 로딩
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '번호' : 'No'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '말머리' : 'Category'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '제목' : 'Title'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '글쓴이' : 'Author'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '작성일' : 'Date'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '조회' : 'Views'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '추천' : 'Likes'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-purple-600">
                <span className="animate-spin">⏳</span>
                <span>{language === 'ko' ? '번역 중...' : 'Translating...'}</span>
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          // 게시글이 없을 때
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <span className="text-4xl">📝</span>
              <p className="mt-2 text-lg">
                {language === 'ko' ? '게시물이 없습니다' : 'No posts available'}
              </p>
              <p className="text-sm mt-1">
                {language === 'ko' ? '첫 번째 게시글을 작성해보세요!' : 'Be the first to write a post!'}
              </p>
            </div>
            <Button onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onWritePost?.()
            }} className="bg-blue-600 hover:bg-blue-700 text-white">
              {language === 'ko' ? '글쓰기' : 'Write Post'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '번호' : 'No'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '말머리' : 'Category'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '제목' : 'Title'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '글쓴이' : 'Author'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '작성일' : 'Date'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '조회' : 'Views'}
                  </th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ko' ? '추천' : 'Likes'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post, index) => (
                  <tr 
                    key={post.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onPostSelect(post)
                    }}
                  >
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          post.isHot ? 'bg-red-100 text-red-700' : 
                          post.isNotice ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="mr-1">{getCategoryIcon(post.category)}</span>
                        {getCategoryName(post.category)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {showSpanish && post.title_es ? post.title_es : post.title}
                        </span>
                        {post.isHot && (
                          <Badge variant="destructive" className="text-xs">
                            🔥 HOT
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {post.author}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-gray-500">
                      {post.date}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-gray-500">
                      {formatNumber(post.views)}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-gray-500">
                      {formatNumber(post.likes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1}>
          {language === 'ko' ? '이전' : 'Prev'}
        </Button>
        
        {[1, 2, 3, 4, 5].map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        
        <Button variant="outline" size="sm">
          {language === 'ko' ? '다음' : 'Next'}
        </Button>
      </div>

      {/* 검색 바 */}
      <div className="flex items-center gap-2">
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option>{language === 'ko' ? '제목+내용' : 'Title+Content'}</option>
          <option>{language === 'ko' ? '제목' : 'Title'}</option>
          <option>{language === 'ko' ? '작성자' : 'Author'}</option>
        </select>
        <input
          type="text"
          placeholder={language === 'ko' ? '검색어를 입력하세요' : 'Enter search term'}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <Button variant="outline" size="sm">
          🔍
        </Button>
      </div>
    </div>
  )
}
