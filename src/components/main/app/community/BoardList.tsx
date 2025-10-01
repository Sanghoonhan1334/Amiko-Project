'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import AuthConfirmDialog from '@/components/common/AuthConfirmDialog'

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
  refreshTrigger?: number // 새로고침 트리거
  showHeader?: boolean // 헤더 표시 여부
}

export default function BoardList({ onPostSelect, onWritePost, refreshTrigger, showHeader = true }: BoardListProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [showSpanish, setShowSpanish] = useState(false) // 번역 상태
  const [isTranslating, setIsTranslating] = useState(false) // 번역 중 상태
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // 운영자 권한 확인
  const checkAdminStatus = () => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    
    // 운영자 이메일 목록
    const adminEmails = [
      'admin@amiko.com',
      'editor@amiko.com',
      'manager@amiko.com'
    ]
    
    // 운영자 ID 목록
    const adminIds = [
      '66623263-4c1d-4dce-85a7-cc1b21d01f70' // 현재 사용자 ID
    ]
    
    const isAdminUser = adminEmails.includes(user.email) || adminIds.includes(user.id)
    setIsAdmin(isAdminUser)
  }

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  // refreshTrigger가 변경될 때 게시글 목록 새로고침
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchPosts()
    }
  }, [refreshTrigger])

  // 카테고리 옵션
  const categories = [
    { id: 'all', name: t('community.categories.all'), icon: '📝' },
    { id: 'free', name: t('community.categories.free'), icon: '💬' },
    { id: 'kpop', name: t('community.categories.kpop'), icon: '🎵' },
    { id: 'kdrama', name: t('community.categories.kdrama'), icon: '📺' },
    { id: 'beauty', name: t('community.categories.beauty'), icon: '💄' },
    { id: 'korean', name: t('community.categories.korean'), icon: '🇰🇷' },
    { id: 'spanish', name: t('community.categories.spanish'), icon: '🇪🇸' }
  ]

  // 실제 게시글 API 호출 함수
  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('게시글 API 호출 시작...')
      
      // 타임아웃 설정으로 무한 대기 방지
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃
      
      const response = await fetch('/api/posts', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API 오류 응답:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: 게시글을 불러오는데 실패했습니다`)
      }
      
      const data = await response.json()
      console.log('API 응답 데이터:', data)
      console.log('API 응답 상세:', {
        success: data.success,
        postsCount: data.posts?.length || 0,
        posts: data.posts?.map(p => ({
          id: p.id,
          title: p.title,
          author: p.author?.full_name || p.author,
          created_at: p.created_at
        }))
      })
      
      // 성공적으로 빈 배열을 받아도 정상 처리
      const posts = data.posts || []
      console.log('게시글 개수:', posts.length)
      setPosts(posts)
      
    } catch (err) {
      console.error('게시글 로드 오류:', err)
      
      // AbortError인 경우 타임아웃으로 처리
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('게시글 로딩 타임아웃, 빈 배열 사용')
        setError('요청 시간이 초과되었습니다. 다시 시도해주세요.')
      } else {
        setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다')
      }
      
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
      {/* 헤더 - showHeader가 true일 때만 표시 */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {t('community.freeBoard')}
              </h2>
              <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                {t('community.freeBoardDescription')}
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
            
            <Button onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              
              // 로그인 체크
              if (!user) {
                setShowAuthDialog(true)
                return
              }
              
              // 운영자는 인증 없이 바로 글쓰기 가능
              if (isAdmin) {
                onWritePost?.()
                return
              }
              
              // 인증 상태 확인 (헤더와 동일한 로직 사용)
              try {
                const response = await fetch(`/api/auth/status?userId=${user.id}`)
                if (response.ok) {
                  const data = await response.json()
                  console.log('게시글 작성 인증 상태 확인:', data)
                  
                  // 헤더와 동일한 조건: emailVerified 또는 smsVerified가 true인 경우
                  if (data.success && (data.emailVerified || data.smsVerified)) {
                    console.log('인증 완료 - 글쓰기 모달 표시')
                    onWritePost?.()
                  } else {
                    // 인증 안 된 경우 인증 다이얼로그 표시
                    console.log('인증 필요 - 인증 다이얼로그 표시')
                    setShowAuthDialog(true)
                  }
                } else {
                  // API 오류 시 안전하게 인증 다이얼로그 표시
                  console.log('API 오류 - 인증 다이얼로그 표시')
                  setShowAuthDialog(true)
                }
              } catch (error) {
                console.error('인증 상태 확인 오류:', error)
                setShowAuthDialog(true)
              }
            }} className="bg-blue-600 hover:bg-blue-700 text-white">
              {t('community.writePost')}
            </Button>
          </div>
        </div>
      )}

      {/* 카테고리 필터 - 드롭다운 */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 flex-1"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {t(`community.categories.${category.id}`)}
                </option>
              ))}
            </select>
          </div>
          
          {/* 글쓰기 버튼 */}
          <Button 
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              
              // 로그인 체크
              if (!user) {
                setShowAuthDialog(true)
                return
              }
              
              // 운영자는 인증 없이 바로 글쓰기 가능
              if (isAdmin) {
                onWritePost?.()
                return
              }
              
              // 인증 상태 확인 (헤더와 동일한 로직 사용)
              try {
                const response = await fetch(`/api/auth/status?userId=${user.id}`)
                if (response.ok) {
                  const data = await response.json()
                  console.log('게시글 작성 인증 상태 확인:', data)
                  
                  // 헤더와 동일한 조건: emailVerified 또는 smsVerified가 true인 경우
                  if (data.success && (data.emailVerified || data.smsVerified)) {
                    console.log('인증 완료 - 글쓰기 모달 표시')
                    onWritePost?.()
                  } else {
                    // 인증 안 된 경우 인증 다이얼로그 표시
                    console.log('인증 필요 - 인증 다이얼로그 표시')
                    setShowAuthDialog(true)
                  }
                } else {
                  // API 오류 시 안전하게 인증 다이얼로그 표시
                  console.log('API 오류 - 인증 다이얼로그 표시')
                  setShowAuthDialog(true)
                }
              } catch (error) {
                console.error('인증 상태 확인 오류:', error)
                setShowAuthDialog(true)
              }
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto"
          >
            {t('community.writePost')}
          </Button>
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t('community.sortOptions.latest')}</SelectItem>
            <SelectItem value="popular">{t('community.sortOptions.popular')}</SelectItem>
            <SelectItem value="views">{t('community.sortOptions.views')}</SelectItem>
          </SelectContent>
        </Select>
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
            <div className="text-gray-500">
              <span className="text-4xl">📝</span>
              <p className="mt-2 text-lg">
                {t('community.noPosts')}
              </p>
              <p className="text-sm mt-1">
                {t('community.beFirstToWrite')}
              </p>
            </div>
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
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={language === 'ko' ? '게시글 검색' : 'Search Posts'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            style={{ paddingLeft: '3rem' }}
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            💬
          </span>
        </div>
        <Button variant="outline" size="sm">
          🔍
        </Button>
      </div>

      {/* 인증 확인 다이얼로그 */}
      <AuthConfirmDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="인증이 필요합니다"
        description="게시글 작성을 위해 인증이 필요합니다. 인증센터로 이동하시겠습니까?"
        confirmText="인증센터로 이동"
        cancelText="취소"
      />
    </div>
  )
}
