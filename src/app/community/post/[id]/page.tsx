'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Eye, Calendar, User } from 'lucide-react'
import PostDetail from '@/components/main/app/community/PostDetail'
import PostEditModal from '@/components/main/app/community/PostEditModal'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface Post {
  id: string
  title: string
  content: string
  images?: string[]
  view_count: number
  like_count: number
  dislike_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    full_name: string
    avatar_url?: string
    profile_image?: string
  }
  gallery: {
    id: string
    slug: string
    name_ko: string
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const postId = params.id as string

  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/posts/${postId}`)
      
      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      
      if (data.success && data.post) {
        setPost(data.post)
      } else {
        throw new Error(data.error || '게시글을 찾을 수 없습니다.')
      }
    } catch (err) {
      console.error('게시글 로딩 오류:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // 새로운 자유게시판 페이지로 이동
    router.push('/community/freeboard')
  }

  const handlePostUpdated = (updatedPost: Post) => {
    // 게시글 정보 업데이트
    setPost({ ...post, ...updatedPost })
    setShowEditModal(false)
    setEditingPost(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 기존 Header 컴포넌트 사용 */}
        <Header />
        
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
            <p className="text-gray-600">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 기존 Header 컴포넌트 사용 */}
        <Header />
        
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">게시글을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-white">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      <div className="max-w-4xl mx-auto px-0 pt-16 pb-20 md:px-4 md:pt-24 md:pb-6">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Button>
        </div>

        {/* 게시글 상세 내용 */}
        <PostDetail
          postId={post.id}
          onBack={handleBack}
          onEdit={() => {
            setEditingPost(post)
            setShowEditModal(true)
          }}
          onDelete={async () => {
            if (confirm('정말로 이 게시물을 삭제하시겠습니까?\n삭제된 게시물은 복구할 수 없습니다.')) {
              try {
                console.log('게시물 삭제 시도:', post.id)
                
                // 토큰 가져오기
                const token = localStorage.getItem('amiko_token')
                if (!token) {
                  alert('로그인이 필요합니다.')
                  return
                }

                // DELETE API 호출
                const response = await fetch(`/api/posts/${post.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })

                if (!response.ok) {
                  const errorData = await response.json()
                  throw new Error(errorData.error || '삭제에 실패했습니다.')
                }

                const result = await response.json()
                console.log('삭제 성공:', result)
                
                alert('게시물이 삭제되었습니다.')
                handleBack() // 성공 시에만 뒤로가기
                
              } catch (error) {
                console.error('게시물 삭제 오류:', error)
                alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.')
              }
            }
          }}
        />

        {/* 게시글 수정 모달 */}
        <PostEditModal
          post={editingPost}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingPost(null)
          }}
          onSave={handlePostUpdated}
        />
      </div>
    </div>
  )
}
