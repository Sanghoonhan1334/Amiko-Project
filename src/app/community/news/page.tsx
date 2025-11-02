'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Eye, MessageCircle, ThumbsUp, ThumbsDown, Edit, Pin, PinOff, Trash2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { toast } from 'sonner'

// 댓글 관련 타입 정의
interface Comment {
  id: string
  content: string
  author: string
  author_id: string
  created_at: string
  updated_at: string
  parent_id?: string
  replies?: Comment[]
  likes: number
  dislikes: number
}

// 운영자 권한 체크 함수를 컴포넌트 내부로 이동
const checkOperatorStatus = async (user: any, token: string | null): Promise<boolean> => {
  try {
    if (!user || !token) {
      console.log('운영자 체크: 사용자가 로그인되지 않음 또는 토큰 없음')
      return false
    }

    console.log('운영자 체크: 사용자 ID:', user.id)

    const response = await fetch('/api/admin/check-operator', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('운영자 체크 API 응답:', response.status)

    if (response.ok) {
      const result = await response.json()
      console.log('운영자 체크 결과:', result)
      return result.isOperator
    }

    console.log('운영자 체크 API 실패:', response.status)
    return false
  } catch (error) {
    console.error('Operator check error:', error)
    return false
  }
}

// 임시 뉴스 데이터 (컴포넌트 외부로 이동)
const tempNewsData = [
  {
    id: 1,
    title: '"한국 문화가 세계를 휩쓸고 있다!" 글로벌 K-콘텐츠 열풍',
    title_es: '"¡La cultura coreana está arrasando el mundo!" Torbellino global de contenido K',
    source: 'NewsWA',
    author: 'Amiko 뉴스팀',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
    content: `한국의 전통문화와 현대문화가 조화롭게 발전하고 있습니다. K-팝, K-드라마, K-푸드 등 한국 문화 콘텐츠가 전 세계적으로 큰 인기를 얻고 있으며, 이를 통해 한국의 문화적 가치가 더욱 널리 알려지고 있습니다.

최근 넷플릭스에서 한국 드라마가 상위권을 차지하고 있고, BTS, 뉴진스 등 K-팝 아티스트들이 빌보드 차트를 휩쓸고 있습니다. 또한 김치, 비빔밥 등 한국 음식도 전 세계인의 입맛을 사로잡고 있습니다.`,
    likes: 156,
    comments: 23
  },
  {
    id: 2,
    title: '"한국어 배우기 열풍" 전 세계 한국어 학습자 급증',
    title_es: '"Torbellino de aprendizaje del coreano" Aumento drástico de estudiantes de coreano en todo el mundo',
    source: 'NewsWA',
    author: 'Amiko 뉴스팀',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    content: `한류 콘텐츠의 인기로 인해 전 세계적으로 한국어 학습 열풍이 불고 있습니다. K-팝 가사와 드라마 대사를 이해하고 싶어하는 팬들이 한국어를 배우기 시작하고 있으며, 이는 한국 문화에 대한 깊은 관심으로 이어지고 있습니다.

세계 각국의 한국어 교육기관과 온라인 학습 플랫폼에서 한국어 수강생이 급증하고 있으며, 특히 젊은 세대들의 학습 열정이 높습니다.`,
    likes: 89,
    comments: 8
  },
  {
    id: 3,
    title: '"한국이 다시 핫하다!" 외국인 관광객 몰려드는 충격 현황',
    source: 'NewsWA',
    author: 'Amiko 뉴스팀',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    content: `한국 관광산업이 코로나19 이후 빠르게 회복되고 있습니다. 서울, 부산, 제주도 등 주요 관광지에 외국인 관광객들이 다시 찾아오고 있으며, 한국의 아름다운 자연과 문화를 경험하고자 하는 관심이 높아지고 있습니다.

특히 한류 콘텐츠를 통해 한국에 관심을 갖게 된 젊은 관광객들이 크게 증가하고 있습니다. K-팝 콘서트, 드라마 촬영지 투어, 한국 전통문화 체험 등이 인기 관광 상품으로 떠오르고 있습니다.`,
    likes: 234,
    comments: 23
  }
]

function NewsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const languageContext = useLanguage()
  const { t, language } = languageContext || { t: (key: string) => key, language: 'ko' }
  const { user, token } = useAuth()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [showNewsDetail, setShowNewsDetail] = useState(false)
  const [isOperatorUser, setIsOperatorUser] = useState(false)
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNews, setTotalNews] = useState(0)
  const itemsPerPage = 10
  
  // 뉴스 작성 모달 상태 (CommunityTab.tsx에서 가져옴)
  const [showNewsWriteModal, setShowNewsWriteModal] = useState(false)
  const [showNewsEditModal, setShowNewsEditModal] = useState(false)
  const [editingNews, setEditingNews] = useState<any>(null)
  const [newsWriteForm, setNewsWriteForm] = useState({
    title: '',
    title_es: '',
    content: '',
    content_es: '',
    source: '',
    author: 'Amiko 편집팀',
    date: new Date().toISOString().split('T')[0],
    category: 'entertainment'
  })
  const [newsWriteLoading, setNewsWriteLoading] = useState(false)
  
  // 이미지 관련 상태
  const [newsUploadedImages, setNewsUploadedImages] = useState<Array<{url: string, name: string}>>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')
  
  // 댓글 관련 상태
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleBack = () => {
    const fromHome = searchParams.get('from') === 'home'
    router.push(fromHome ? '/main?tab=home' : '/main?tab=community')
  }

  const handleCreateNews = () => {
    // 뉴스 작성 폼 초기화
    setNewsWriteForm({
      title: '',
      title_es: '',
      content: '',
      content_es: '',
      source: '',
      author: 'Amiko 편집팀',
      date: new Date().toISOString().split('T')[0],
      category: 'entertainment'
    })
    setNewsUploadedImages([])
    setSelectedThumbnail('')
    setShowNewsWriteModal(true)
  }

  const handleNewsClick = (newsItem: any) => {
    setSelectedNews(newsItem)
    setShowNewsDetail(true)
    // 댓글 로드
    fetchComments(newsItem.id)
  }

  const handleBackToList = () => {
    setShowNewsDetail(false)
    setSelectedNews(null)
  }

  // 뉴스 데이터 새로고침 함수 (페이지네이션 지원)
  const fetchRealNews = async (page: number = currentPage) => {
    try {
      const response = await fetch(`/api/news?page=${page}&limit=${itemsPerPage}`)
      const data = await response.json()
      
      if (data.success) {
        const sortedNews = data.newsItems.sort((a: any, b: any) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
        })
        setNews(sortedNews)
        setTotalNews(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error('뉴스 새로고침 오류:', error)
    }
  }

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchRealNews(page)
  }

  // 이미지 업로드 함수 (CommunityTab.tsx에서 가져옴)
  const insertImageToContent = async (file: File, isNews: boolean = false) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('이미지 업로드 실패')
      }
      
      const result = await response.json()
      
      if (isNews) {
        // 뉴스용 이미지 업로드
        const newImage = { url: result.url, name: file.name }
        setNewsUploadedImages(prev => [...prev, newImage])
        
        // 썸네일이 선택되지 않았다면 첫 번째 이미지를 썸네일로 설정
        if (!selectedThumbnail) {
          setSelectedThumbnail(result.url)
        }
        
        // 이미지만 업로드하고 텍스트는 자동으로 추가하지 않음
      }
      
      toast.success('이미지가 업로드되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    }
  }

  // 뉴스 편집 함수
  const handleNewsEdit = (newsItem: any) => {
    setEditingNews(newsItem)
    setNewsWriteForm({
      title: newsItem.title || '',
      title_es: newsItem.title_es || '',
      content: newsItem.content || '',
      content_es: newsItem.content_es || '',
      source: newsItem.source || '',
      author: newsItem.author || '',
      date: newsItem.date || '',
      category: newsItem.category || 'entertainment'
    })
    setSelectedThumbnail(newsItem.thumbnail || '')
    setShowNewsEditModal(true)
  }

  // 뉴스 고정/고정해제 함수
  const handleNewsPin = async (newsItem: any) => {
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: newsItem.id,
          is_pinned: !newsItem.is_pinned
        })
      })

      if (response.ok) {
        toast.success(newsItem.is_pinned ? '고정이 해제되었습니다.' : '뉴스가 고정되었습니다.')
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error('고정 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 고정 오류:', error)
      toast.error('고정 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 뉴스 삭제 함수
  const handleNewsDelete = async (newsItem: any) => {
    if (!confirm(`"${newsItem.title}" 뉴스를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/news?id=${newsItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('뉴스가 삭제되었습니다.')
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error('뉴스 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 삭제 오류:', error)
      toast.error('뉴스 삭제 중 오류가 발생했습니다.')
    }
  }

  // 뉴스 업데이트 함수
  const handleNewsUpdate = async () => {
    if (!newsWriteForm.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setNewsWriteLoading(true)
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingNews.id,
          title: newsWriteForm.title,
          title_es: newsWriteForm.title_es,
          content: newsWriteForm.content,
          content_es: newsWriteForm.content_es,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: newsWriteForm.category,
          thumbnail: selectedThumbnail || editingNews.thumbnail,
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('뉴스가 수정되었습니다!')
        setShowNewsEditModal(false)
        setEditingNews(null)
        setNewsWriteForm({
          title: '',
          title_es: '',
          content: '',
          content_es: '',
          source: '',
          author: '',
          date: '',
          category: 'entertainment'
        })
        setNewsUploadedImages([])
        setSelectedThumbnail('')
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error(result.error || '뉴스 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 수정 오류:', error)
      toast.error('뉴스 수정 중 오류가 발생했습니다.')
    } finally {
      setNewsWriteLoading(false)
    }
  }

  // 댓글 관련 함수들
  const fetchComments = async (newsId: string) => {
    try {
      console.log('뉴스 댓글 로드 시도:', newsId)
      
      const response = await fetch(`/api/news/${newsId}/comments`)
      console.log('뉴스 댓글 로드 응답:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 댓글 로드 성공:', data.comments?.length || 0, '개')
        
        // 댓글을 계층 구조로 재구성
        const allComments = data.comments || []
        const commentMap = new Map()
        const rootComments: any[] = []
        
        // 1단계: 모든 댓글을 Map에 저장
        allComments.forEach((comment: any) => {
          commentMap.set(comment.id, { ...comment, replies: [] })
        })
        
        // 2단계: 부모-자식 관계 설정
        allComments.forEach((comment: any) => {
          const commentWithReplies = commentMap.get(comment.id)
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id)
            if (parent) {
              parent.replies.push(commentWithReplies)
            }
          } else {
            rootComments.push(commentWithReplies)
          }
        })
        
        setComments(rootComments)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 댓글 로드 실패:', errorData)
      }
    } catch (error) {
      console.error('댓글 로드 오류:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedNews?.id) return

    try {
      console.log('뉴스 댓글 작성 시도:', { content: newComment.trim(), newsId: selectedNews.id })
      
      const response = await fetch(`/api/news/${selectedNews.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      })

      console.log('뉴스 댓글 작성 응답:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 댓글 작성 성공:', data)
        
        setNewComment('')
        toast.success(language === 'ko' ? '댓글이 작성되었습니다!' : '¡Comentario publicado!')
        
        // 댓글 목록 새로고침
        await fetchComments(selectedNews.id)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 댓글 작성 실패:', errorData)
        toast.error(errorData.error || (language === 'ko' ? '댓글 작성에 실패했습니다.' : 'Error al publicar comentario.'))
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error)
      toast.error(language === 'ko' ? '댓글 작성 중 오류가 발생했습니다.' : 'Error al publicar comentario.')
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !selectedNews?.id) return

    try {
      console.log('뉴스 대댓글 작성 시도:', { parentId, content: replyContent.trim(), newsId: selectedNews.id })
      
      const response = await fetch(`/api/news/${selectedNews.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId
        })
      })

      console.log('뉴스 대댓글 작성 응답:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 대댓글 작성 성공:', data)
        
        setReplyContent('')
        setReplyingTo(null)
        toast.success(language === 'ko' ? '답글이 작성되었습니다!' : '¡Respuesta publicada!')
        
        // 댓글 목록 새로고침
        await fetchComments(selectedNews.id)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 대댓글 작성 실패:', errorData)
        toast.error(errorData.error || (language === 'ko' ? '답글 작성에 실패했습니다.' : 'Error al publicar respuesta.'))
      }
    } catch (error) {
      console.error('답글 작성 오류:', error)
      toast.error(language === 'ko' ? '답글 작성 중 오류가 발생했습니다.' : 'Error al publicar respuesta.')
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !selectedNews?.id) return

    try {
      console.log('뉴스 댓글 수정 시도:', { commentId, content: editContent.trim(), newsId: selectedNews.id })
      
      const response = await fetch(`/api/news/${selectedNews.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editContent.trim()
        })
      })

      console.log('뉴스 댓글 수정 응답:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 댓글 수정 성공:', data)
        
        setEditContent('')
        setEditingComment(null)
        toast.success(language === 'ko' ? '댓글이 수정되었습니다!' : '¡Comentario actualizado!')
        
        // 댓글 목록 새로고침
        await fetchComments(selectedNews.id)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 댓글 수정 실패:', errorData)
        toast.error(errorData.error || (language === 'ko' ? '댓글 수정에 실패했습니다.' : 'Error al actualizar comentario.'))
      }
    } catch (error) {
      console.error('댓글 수정 오류:', error)
      toast.error(language === 'ko' ? '댓글 수정 중 오류가 발생했습니다.' : 'Error al actualizar comentario.')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(language === 'ko' ? '댓글을 삭제하시겠습니까?' : '¿Eliminar este comentario?')) return
    if (!selectedNews?.id) return

    try {
      console.log('뉴스 댓글 삭제 시도:', { commentId, newsId: selectedNews.id })
      
      const response = await fetch(`/api/news/${selectedNews.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('뉴스 댓글 삭제 응답:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 댓글 삭제 성공:', data)
        
        toast.success(language === 'ko' ? '댓글이 삭제되었습니다!' : '¡Comentario eliminado!')
        
        // 댓글 목록 새로고침
        await fetchComments(selectedNews.id)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 댓글 삭제 실패:', errorData)
        toast.error(errorData.error || (language === 'ko' ? '댓글 삭제에 실패했습니다.' : 'Error al eliminar comentario.'))
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error)
      toast.error(language === 'ko' ? '댓글 삭제 중 오류가 발생했습니다.' : 'Error al eliminar comentario.')
    }
  }

  // 뉴스 좋아요/싫어요 처리
  const handleNewsVote = async (type: 'like' | 'dislike') => {
    if (!selectedNews?.id) return

    // 로그인 확인
    if (!user || !token) {
      toast.error(language === 'ko' ? '로그인이 필요합니다.' : 'Necesitas iniciar sesión.')
      router.push('/sign-in')
      return
    }

    console.log('뉴스 투표 시작:', { newsId: selectedNews.id, type, hasToken: !!token, userId: user.id })

    try {
      const response = await fetch(`/api/news/${selectedNews.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: type })
      })

      console.log('뉴스 투표 응답:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 투표 성공:', data)
        
        // 뉴스 목록에서 해당 뉴스 업데이트
        setNews(prevNews => 
          prevNews.map(news => 
            news.id === selectedNews.id 
              ? { ...news, likes: data.like_count, dislikes: data.dislike_count }
              : news
          )
        )
        
        // 현재 선택된 뉴스도 업데이트
        setSelectedNews(prev => ({
          ...prev,
          likes: data.like_count,
          dislikes: data.dislike_count
        }))
        
        if (type === 'like') {
          toast.success(language === 'ko' ? '좋아요를 눌렀습니다!' : '¡Me gusta!')
        } else {
          toast.success(language === 'ko' ? '싫어요를 눌렀습니다!' : '¡No me gusta!')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 투표 실패:', errorData)
        toast.error(errorData.error || (language === 'ko' ? '투표에 실패했습니다.' : 'Error al votar.'))
      }
    } catch (error) {
      console.error('뉴스 투표 오류:', error)
      toast.error(language === 'ko' ? '투표 중 오류가 발생했습니다.' : 'Error al votar.')
    }
  }

  const handleCommentVote = async (commentId: string, type: 'like' | 'dislike') => {
    if (!selectedNews?.id) return

    // 로그인 확인
    if (!user || !token) {
      toast.error(language === 'ko' ? '로그인이 필요합니다.' : 'Necesitas iniciar sesión.')
      router.push('/sign-in')
      return
    }

    try {
      console.log('뉴스 댓글 투표 시도:', { commentId, type, newsId: selectedNews.id })
      
      const response = await fetch(`/api/news/${selectedNews.id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: type })
      })

      console.log('뉴스 댓글 투표 응답:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('뉴스 댓글 투표 성공:', data)
        
        // 즉시 UI 업데이트 (댓글과 대댓글 모두 처리)
        setComments(prevComments => 
          prevComments.map(comment => {
            // 메인 댓글 확인
            if (comment.id === commentId) {
              return {
                ...comment,
                like_count: data.like_count || comment.like_count || comment.likes || 0,
                dislike_count: data.dislike_count || comment.dislike_count || comment.dislikes || 0,
                likes: data.like_count || comment.likes || 0,
                dislikes: data.dislike_count || comment.dislikes || 0
              }
            }
            
            // 대댓글 확인
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply.id === commentId) {
                    return {
                      ...reply,
                      like_count: data.like_count || reply.like_count || reply.likes || 0,
                      dislike_count: data.dislike_count || reply.dislike_count || reply.dislikes || 0,
                      likes: data.like_count || reply.likes || 0,
                      dislikes: data.dislike_count || reply.dislikes || 0
                    }
                  }
                  return reply
                })
              }
            }
            
            return comment
          })
        )
        
        if (type === 'like') {
          toast.success(language === 'ko' ? '좋아요를 눌렀습니다!' : '¡Me gusta!')
        } else {
          toast.success(language === 'ko' ? '싫어요를 눌렀습니다!' : '¡No me gusta!')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('뉴스 댓글 투표 실패:', errorData)
        toast.error(language === 'ko' ? '투표에 실패했습니다.' : 'Error al votar.')
      }
    } catch (error) {
      console.error('댓글 투표 오류:', error)
      toast.error(language === 'ko' ? '투표 중 오류가 발생했습니다.' : 'Error al votar.')
    }
  }

  // 모바일용 뉴스 편집 함수들
  const handleEditNews = (newsItem: any) => {
    handleNewsEdit(newsItem)
  }

  const handleTogglePin = (newsItem: any) => {
    handleNewsPin(newsItem)
  }

  const handleDeleteNews = async (newsId: string) => {
    const newsItem = news.find(item => item.id === newsId)
    if (newsItem) {
      await handleNewsDelete(newsItem)
    }
  }

  // 뉴스 작성 함수 (CommunityTab.tsx에서 가져옴)
  const handleNewsWrite = async () => {
    if (!newsWriteForm.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setNewsWriteLoading(true)
    try {
      console.log('뉴스 작성 요청 데이터:', {
        title: newsWriteForm.title,
        content: newsWriteForm.content,
        source: newsWriteForm.source,
        author: newsWriteForm.author,
        selectedThumbnail: selectedThumbnail,
        thumbnailLength: selectedThumbnail?.length
      })

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newsWriteForm.title,
          title_es: newsWriteForm.title, // 한국어 제목을 스페인어 제목으로도 사용
          content: newsWriteForm.content,
          content_es: newsWriteForm.content, // 한국어 내용을 스페인어 내용으로도 사용
          source: newsWriteForm.source.trim() || null, // source가 비어있으면 null
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: 'entertainment', // 기본 카테고리 설정
          thumbnail: selectedThumbnail && selectedThumbnail.trim() ? selectedThumbnail : null, // 빈 문자열이면 null
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('뉴스가 작성되었습니다!')
        setShowNewsWriteModal(false)
        setNewsWriteForm({
          title: '',
          title_es: '',
          content: '',
          content_es: '',
          source: '',
          author: '',
          date: '',
          category: 'entertainment'
        })
        setNewsUploadedImages([])
        setSelectedThumbnail('')
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error(result.error || '뉴스 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 작성 오류:', error)
      toast.error('뉴스 작성 중 오류가 발생했습니다.')
    } finally {
      setNewsWriteLoading(false)
    }
  }


  // 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    console.log('NewsPage useEffect 실행')
    
    // 간단하고 안전한 튜토리얼 오버레이 제거
    const removeTutorialOverlays = () => {
      // Dialog 오버레이만 타겟팅하여 제거 (실제 콘텐츠는 건드리지 않음)
      const dialogOverlays = document.querySelectorAll('[data-radix-dialog-overlay]')
      dialogOverlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.display = 'none'
          overlay.remove()
        }
      })
      
      // 특정 보라색 오버레이만 제거 (정확한 색상 코드로 타겟팅)
      const specificPurpleOverlays = document.querySelectorAll('[style*="rgba(147, 51, 234"], [style*="rgba(168, 85, 247"]')
      specificPurpleOverlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.display = 'none'
          overlay.remove()
        }
      })
    }
    
    // 페이지 로드 후 간단히 오버레이 제거
    setTimeout(removeTutorialOverlays, 1000)
    
        // 뉴스 데이터 로딩 (페이지네이션 지원) - 성능 최적화
        const loadNews = async () => {
          console.log('뉴스 로딩 시작')
          setLoading(true)
          setError(null)
          
          try {
            // 타임아웃 설정 (10초)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            
            const response = await fetch(`/api/news?page=1&limit=${itemsPerPage}`, {
              signal: controller.signal,
              headers: {
                'Cache-Control': 'max-age=300' // 5분 캐시
              }
            })
            
            clearTimeout(timeoutId)
            const data = await response.json()
            
            if (data.success) {
              // 고정된 뉴스를 먼저, 그 다음 최신순으로 정렬
              const sortedNews = data.newsItems.sort((a: any, b: any) => {
                // 고정된 뉴스가 먼저
                if (a.is_pinned && !b.is_pinned) return -1
                if (!a.is_pinned && b.is_pinned) return 1
                // 같은 고정 상태면 최신순
                return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
              })
              setNews(sortedNews)
              setTotalNews(data.total || 0)
              setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
              console.log('뉴스 로드 완료:', sortedNews.length, '개, 총', data.total || 0, '개')
            } else {
              throw new Error(data.error || '뉴스를 불러오는데 실패했습니다.')
            }
          } catch (error) {
            console.error('뉴스 API 오류:', error)
            if (error instanceof Error && error.name === 'AbortError') {
              setError('뉴스 로딩 시간이 초과되었습니다. 다시 시도해주세요.')
            } else {
              setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
            }
            // 오류 시 임시 데이터 사용
            setNews(tempNewsData)
            setTotalNews(tempNewsData.length)
            setTotalPages(1)
          } finally {
            setLoading(false)
            console.log('뉴스 로딩 완료')
          }
        }
    
    loadNews()
  }, []) // 빈 의존성 배열로 한 번만 실행

  // 운영자 권한 체크는 user와 token 상태가 변경될 때마다 실행
  useEffect(() => {
    const checkOperator = async () => {
      console.log('운영자 체크 시작, user:', user?.id, 'token:', token ? '있음' : '없음')
      if (!user || !token) {
        setIsOperatorUser(false)
        return
      }
      
      try {
        const isOp = await checkOperatorStatus(user, token)
        console.log('운영자 체크 결과:', isOp)
        setIsOperatorUser(isOp)
      } catch (error) {
        console.error('운영자 체크 오류:', error)
        setIsOperatorUser(false)
      }
    }
    
    // 사용자와 토큰이 모두 있을 때만 체크 실행
    if (user && token) {
      checkOperator()
    } else {
      setIsOperatorUser(false)
    }
  }, [user?.id, token]) // user.id와 token만 의존성으로 사용

  if (showNewsDetail && selectedNews) {
    return (
      <div className="min-h-screen bg-white">
        {/* 기존 Header 컴포넌트 사용 */}
        <Header />
        
        {/* 페이지별 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 pt-16 sm:pt-24 md:pt-36">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('buttons.backToList')}
              </Button>
              <h1 className="text-lg font-bold text-gray-800">{t('community.newsDetail')}</h1>
            </div>
          </div>
        </div>

        {/* 뉴스 상세 내용 */}
        <div className="max-w-6xl mx-auto px-2 pt-4 pb-8">
          <Card className="p-6 bg-white shadow-lg border border-gray-200 rounded-xl">
            <div className="mb-4">
              <h1 className="text-sm md:text-2xl lg:text-3xl font-bold text-gray-800 mb-3">{selectedNews.title}</h1>
              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3">
                <div className="flex items-center gap-4">
                  <span>{selectedNews.author}</span>
                  <span>{selectedNews.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-[10px]">{selectedNews.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[10px]">{selectedNews.comments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-xs md:text-base lg:text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedNews.content}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1 md:gap-4 mt-3 md:mt-6 pt-2 md:pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => handleNewsVote('like')}
                className="flex items-center gap-0.5 md:gap-2 text-[10px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 hover:bg-green-50 hover:border-green-300"
              >
                <ThumbsUp className="w-2 h-2 md:w-4 md:h-4" />
                {selectedNews.likes || 0}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNewsVote('dislike')}
                className="flex items-center gap-0.5 md:gap-2 text-[10px] md:text-sm px-1 md:px-4 py-0.5 md:py-2 hover:bg-red-50 hover:border-red-300"
              >
                <ThumbsDown className="w-2 h-2 md:w-4 md:h-4" />
                {selectedNews.dislikes || 0}
              </Button>
            </div>
          </Card>

          {/* 댓글 섹션 */}
          <Card className="mt-2 md:mt-6 p-2 md:p-6 bg-white shadow-lg border border-gray-200 rounded-xl">
            <h2 className="text-xs md:text-lg font-bold text-gray-800 mb-1 md:mb-4">
              {language === 'ko' ? '댓글' : 'Comentarios'} ({comments.length})
            </h2>
            
            {/* 댓글 작성 폼 */}
            {user ? (
              <div className="mb-2 md:mb-6">
                <Textarea
                  placeholder={language === 'ko' ? '댓글을 작성해주세요...' : 'Escribe un comentario...'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={1}
                  className="mb-1 md:mb-3 border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none text-xs md:text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-sm px-2 py-1 md:px-4 md:py-2"
                  >
                    {language === 'ko' ? '댓글 작성' : 'Publicar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-2 md:mb-6 p-1 md:p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-1 md:mb-2 text-[10px] md:text-sm">
                  {language === 'ko' ? '댓글을 작성하려면 로그인이 필요합니다.' : 'Necesitas iniciar sesión para comentar.'}
                </p>
                <Button onClick={() => router.push('/sign-in')} variant="outline" className="text-[10px] md:text-sm">
                  {language === 'ko' ? '로그인하기' : 'Iniciar Sesión'}
                </Button>
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-1 md:space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-2 md:py-8 text-gray-500">
                  <MessageCircle className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 text-gray-300" />
                  <p className="text-[10px] md:text-sm">
                    {language === 'ko' ? '첫 번째 댓글을 작성해보세요!' : '¡Sé el primero en comentar!'}
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-1 md:pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-1 md:mb-2">
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="font-semibold text-[10px] md:text-sm text-gray-800">
                          {comment.users?.nickname || comment.users?.full_name || (language === 'ko' ? '익명' : 'Anónimo')}
                        </span>
                        <span className="text-[9px] md:text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      {user?.id === comment.author_id && (
                        <div className="flex gap-0.5 md:gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingComment(comment.id)
                              setEditContent(comment.content)
                            }}
                            className="h-4 md:h-6 px-1 md:px-2 text-[9px] md:text-xs"
                          >
                            {language === 'ko' ? '수정' : 'Editar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-4 md:h-6 px-1 md:px-2 text-[9px] md:text-xs text-red-600 hover:text-red-800"
                          >
                            {language === 'ko' ? '삭제' : 'Eliminar'}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="mb-1 md:mb-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={1}
                          className="mb-1 md:mb-2 border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none text-[10px] md:text-sm"
                        />
                        <div className="flex gap-0.5 md:gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] md:text-xs px-1 md:px-3 py-0.5 md:py-1"
                          >
                            {language === 'ko' ? '저장' : 'Guardar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingComment(null)
                              setEditContent('')
                            }}
                            className="text-[9px] md:text-xs px-1 md:px-3 py-0.5 md:py-1"
                          >
                            {language === 'ko' ? '취소' : 'Cancelar'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] md:text-sm text-gray-700 mb-1 md:mb-2 whitespace-pre-wrap">{comment.content}</p>
                    )}
                    
                    <div className="flex items-center gap-1 md:gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentVote(comment.id, 'like')}
                        className="h-4 md:h-6 px-0.5 md:px-2 text-[9px] md:text-xs text-gray-600"
                      >
                        <ThumbsUp className="w-3 h-3 mr-0.5 md:mr-1" />
                        {comment.like_count || comment.likes || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentVote(comment.id, 'dislike')}
                        className="h-4 md:h-6 px-0.5 md:px-2 text-[9px] md:text-xs text-gray-600"
                      >
                        <ThumbsDown className="w-3 h-3 mr-0.5 md:mr-1" />
                        {comment.dislike_count || comment.dislikes || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                        className="h-4 md:h-6 px-0.5 md:px-2 text-[9px] md:text-xs text-gray-600"
                      >
                        {language === 'ko' ? '답글' : 'Responder'}
                      </Button>
                    </div>

                    {/* 답글 작성 폼 */}
                    {replyingTo === comment.id && (
                      <div className="mt-1 md:mt-3 ml-1 md:ml-4 p-1 md:p-3 bg-gray-50 rounded-lg">
                        <Textarea
                          placeholder={language === 'ko' ? '답글을 작성해주세요...' : 'Escribe una respuesta...'}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={1}
                          className="mb-1 md:mb-2 border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none text-[10px] md:text-sm"
                        />
                        <div className="flex gap-0.5 md:gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyContent.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] md:text-xs px-1 md:px-3 py-0.5 md:py-1"
                          >
                            {language === 'ko' ? '답글 작성' : 'Responder'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                            }}
                            className="text-[9px] md:text-xs px-1 md:px-3 py-0.5 md:py-1"
                          >
                            {language === 'ko' ? '취소' : 'Cancelar'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-1 md:mt-3 ml-1 md:ml-4 space-y-1 md:space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="p-1 md:p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-1 md:mb-2">
                              <div className="flex items-center gap-0.5 md:gap-2">
                                <span className="font-semibold text-[9px] md:text-xs text-gray-800">
                                  {reply.users?.nickname || reply.users?.full_name || (language === 'ko' ? '익명' : 'Anónimo')}
                                </span>
                                <span className="text-[8px] md:text-xs text-gray-500">{new Date(reply.created_at).toLocaleDateString()}</span>
                              </div>
                              {user?.id === reply.author_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="h-3 md:h-5 px-0.5 md:px-2 text-[8px] md:text-xs text-red-600 hover:text-red-800"
                                >
                                  {language === 'ko' ? '삭제' : 'Eliminar'}
                                </Button>
                              )}
                            </div>
                            <p className="text-[9px] md:text-xs text-gray-700 mb-1 md:mb-2 whitespace-pre-wrap">{reply.content}</p>
                            <div className="flex items-center gap-1 md:gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCommentVote(reply.id, 'like')}
                                className="h-3 md:h-5 px-0.5 md:px-2 text-[8px] md:text-xs text-gray-600"
                              >
                                <ThumbsUp className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                                {reply.like_count || reply.likes || 0}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCommentVote(reply.id, 'dislike')}
                                className="h-3 md:h-5 px-0.5 md:px-2 text-[8px] md:text-xs text-gray-600"
                              >
                                <ThumbsDown className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                                {reply.dislike_count || reply.dislikes || 0}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 페이지별 헤더 - 모바일용 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 pt-20 md:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('community.koreanNews')}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 운영자일 때만 글쓰기 버튼 표시 */}
            {isOperatorUser && (
              <Button
                onClick={handleCreateNews}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                뉴스 작성
              </Button>
            )}
            
            {/* 이전 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border-2 border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('buttons.back')}
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 pt-4 md:pt-40 pb-6">
        {/* 웹 형태일 때 섹션 카드 래퍼 */}
        <div className="hidden md:block">
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="space-y-6">
              {/* 페이지 제목과 버튼들 */}
              <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('community.koreanNews')}</h1>
                
                <div className="flex items-center gap-4">
                  {/* 운영자일 때만 글쓰기 버튼 표시 */}
                  {isOperatorUser && (
                    <Button
                      onClick={handleCreateNews}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      뉴스 작성
                    </Button>
                  )}
                  
                  {/* 이전 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border-2 border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-3 py-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('buttons.back')}
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {/* 스켈레톤 뉴스 카드들 */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-xl animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-3"></div>
                          <div className="flex items-center gap-4">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 뉴스 목록 */}
                  <div className="grid gap-6">
                    {news.length === 0 ? (
                      <Card className="p-8 text-center bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-xl">
                        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📰</div>
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">아직 뉴스가 없습니다</h3>
                        <p className="text-gray-500 dark:text-gray-400">첫 번째 뉴스를 작성해보세요!</p>
                      </Card>
                    ) : (
                      news.map((item) => (
                        <Card key={item.id} className="p-6 bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-xl transition-shadow">
                          <div className="flex gap-4">
                            <div 
                              className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer" 
                              onClick={() => handleNewsClick(item)}
                            >
                              <img 
                                src={item.thumbnail} 
                                alt={item.title}
                                className="w-full h-full object-cover rounded-lg"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling.style.display = 'flex'
                                }}
                              />
                              <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-2xl" style={{display: 'none'}}>
                                📰
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 
                                  className="text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 cursor-pointer flex-1 mr-4" 
                                  onClick={() => handleNewsClick(item)}
                                >
                                  {item.title}
                                  {item.is_pinned && (
                                    <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                                      📌 고정
                                    </span>
                                  )}
                                </h3>
                                
                                {/* 운영자용 버튼들 */}
                                {isOperatorUser && (
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleNewsEdit(item)
                                      }}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleNewsPin(item)
                                      }}
                                      className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                    >
                                      {item.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleNewsDelete(item)
                                      }}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              <p 
                                className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2 cursor-pointer" 
                                onClick={() => handleNewsClick(item)}
                              >
                                {item.content}
                              </p>
                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-4">
                                  {item.source && item.source.trim() ? (
                                    <>
                                      <span>{item.source}</span>
                                      <span>{item.author === 'Amiko 뉴스팀' ? `Amiko ${t('community.newsTeam')}` : item.author}</span>
                                      <span>{item.date}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{item.author === 'Amiko 뉴스팀' ? `Amiko ${t('community.newsTeam')}` : item.author}</span>
                                      <span>{item.date}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>{item.likes || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{item.comments || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                  
                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {t('buttons.back')}
                      </Button>
                      
                      {/* 페이지 번호들 */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 ${
                                currentPage === pageNum 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        다음
                      </Button>
                    </div>
                  )}
            
                  {/* 페이지 정보 */}
                  <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {t('community.newsDisplay', { 
                      total: totalNews, 
                      start: ((currentPage - 1) * itemsPerPage) + 1, 
                      end: Math.min(currentPage * itemsPerPage, totalNews) 
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 모바일 형태일 때 기존 레이아웃 */}
        <div className="md:hidden">
          {loading ? (
            <div className="space-y-4">
              {/* 모바일 스켈레톤 뉴스 카드들 */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-xl animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-10"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 뉴스 목록 */}
              <div className="grid gap-4">
                {news.length === 0 ? (
                  <Card className="p-8 text-center bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-xl">
                    <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📰</div>
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">아직 뉴스가 없습니다</h3>
                    <p className="text-gray-500 dark:text-gray-400">첫 번째 뉴스를 작성해보세요!</p>
                  </Card>
                ) : (
                  news.map((item) => (
                    <Card key={item.id} className="p-4 bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-xl transition-shadow">
                      <div className="flex gap-4">
                        <div 
                          className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer" 
                          onClick={() => handleNewsClick(item)}
                        >
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-2xl" style={{display: 'none'}}>
                            📰
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h3 
                              className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 cursor-pointer flex-1 mr-4" 
                              onClick={() => handleNewsClick(item)}
                            >
                              {item.title}
                              {item.is_pinned && (
                                <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                                  📌 고정
                                </span>
                              )}
                            </h3>
                            
                            {/* 운영자 액션 버튼들 */}
                            {isOperatorUser && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditNews(item)
                                  }}
                                  className="p-2 h-8 w-8"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTogglePin(item)
                                  }}
                                  className={`p-2 h-8 w-8 ${item.is_pinned ? 'bg-yellow-100 border-yellow-300' : ''}`}
                                >
                                  {item.is_pinned ? (
                                    <PinOff className="w-4 h-4 text-yellow-600" />
                                  ) : (
                                    <Pin className="w-4 h-4 text-orange-600" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteNews(item.id)
                                  }}
                                  className="p-2 h-8 w-8 hover:bg-red-50 hover:border-red-300"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                            <div className="block">{item.author === 'Amiko 뉴스팀' ? `Amiko ${t('community.newsTeam')}` : item.author}</div>
                            <div className="block">{item.date}</div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{item.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{item.comments || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-8 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2"
                  >
                    {t('buttons.back')}
                  </Button>
                  
                  {/* 페이지 번호들 */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 ${
                            currentPage === pageNum 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2"
                  >
                    다음
                  </Button>
                </div>
              )}
              
              {/* 페이지 정보 */}
              <div className="text-center mt-4 text-sm text-gray-500">
                {t('community.newsDisplay', { 
                  total: totalNews, 
                  start: ((currentPage - 1) * itemsPerPage) + 1, 
                  end: Math.min(currentPage * itemsPerPage, totalNews) 
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 뉴스 작성 모달 */}
      <Dialog open={showNewsWriteModal} onOpenChange={setShowNewsWriteModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">뉴스 작성</DialogTitle>
            <DialogDescription className="sr-only">새로운 뉴스를 작성하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="min-w-0">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">
                  사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                </Label>
                <Input
                  placeholder="예: NewsWA, 서울En"
                  value={newsWriteForm.source}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                  className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 w-full h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <div className="min-w-0 -ml-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">작성자</Label>
                <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                  <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 w-full h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-6">
                    <SelectValue placeholder="작성자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amiko">Amiko</SelectItem>
                    <SelectItem value="Amiko 편집팀">Amiko 편집팀</SelectItem>
                    <SelectItem value="Amiko {t('community.newsTeam')}">Amiko {t('community.newsTeam')}</SelectItem>
                    <SelectItem value="Amiko 관리자">Amiko 관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">게시 날짜</Label>
                <input
                  type="date"
                  value={newsWriteForm.date}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 focus:outline-none h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  style={{ 
                    colorScheme: 'light'
                  }}
                />
              </div>
            </div>

            {/* 제목 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">제목</Label>
              <Input
                placeholder="제목을 입력하세요"
                value={newsWriteForm.title}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">내용</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) insertImageToContent(file, true)
                    }}
                    className="hidden"
                    id="contentImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('contentImageUpload')?.click()}
                    className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={newsWriteForm.content}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                rows={8}
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* 썸네일 선택 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">썸네일 선택</Label>
              <Select value={selectedThumbnail} onValueChange={setSelectedThumbnail}>
                <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400">
                  <SelectValue placeholder="썸네일로 사용할 이미지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {newsUploadedImages.length > 0 ? (
                    newsUploadedImages.map((image, index) => (
                      <SelectItem key={index} value={image.url}>
                        <div className="flex items-center gap-2">
                          <img src={image.url} alt={`이미지 ${index + 1}`} className="w-8 h-8 object-cover rounded" />
                          <span>이미지 {index + 1}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-images" disabled>
                      <span className="text-gray-400">먼저 이미지를 삽입해주세요</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {newsUploadedImages.length > 0 
                  ? "본문에 삽입된 이미지 중에서 썸네일로 사용할 이미지를 선택하세요."
                  : "본문에 이미지를 삽입하면 썸네일로 선택할 수 있습니다."
                }
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowNewsWriteModal(false)}
                disabled={newsWriteLoading}
                className="px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                취소
              </Button>
              <Button
                onClick={handleNewsWrite}
                disabled={newsWriteLoading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {newsWriteLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    작성 중...
                  </>
                ) : (
                  '뉴스 작성'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 뉴스 편집 모달 */}
      <Dialog open={showNewsEditModal} onOpenChange={setShowNewsEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">뉴스 수정</DialogTitle>
            <DialogDescription className="sr-only">뉴스를 수정하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="min-w-0">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">
                  사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                </Label>
                <Input
                  placeholder="예: NewsWA, 서울En"
                  value={newsWriteForm.source}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                  className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 w-full h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <div className="min-w-0 -ml-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">작성자</Label>
                <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                  <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 w-full h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-6">
                    <SelectValue placeholder="작성자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amiko">Amiko</SelectItem>
                    <SelectItem value="Amiko 편집팀">Amiko 편집팀</SelectItem>
                    <SelectItem value="Amiko {t('community.newsTeam')}">Amiko {t('community.newsTeam')}</SelectItem>
                    <SelectItem value="Amiko 관리자">Amiko 관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">게시 날짜</Label>
                <input
                  type="date"
                  value={newsWriteForm.date}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 focus:outline-none h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  style={{ 
                    colorScheme: 'light'
                  }}
                />
              </div>
            </div>

            {/* 제목 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">제목</Label>
              <Input
                placeholder="제목을 입력하세요"
                value={newsWriteForm.title}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">내용</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) insertImageToContent(file, true)
                    }}
                    className="hidden"
                    id="editContentImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('editContentImageUpload')?.click()}
                    className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={newsWriteForm.content}
                onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                rows={8}
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* 썸네일 선택 */}
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">썸네일 선택</Label>
              <Select value={selectedThumbnail} onValueChange={setSelectedThumbnail}>
                <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 focus:border-gray-600 dark:border-gray-400 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400">
                  <SelectValue placeholder="썸네일로 사용할 이미지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {newsUploadedImages.length > 0 ? (
                    newsUploadedImages.map((image, index) => (
                      <SelectItem key={index} value={image.url}>
                        <div className="flex items-center gap-2">
                          <img src={image.url} alt={`이미지 ${index + 1}`} className="w-8 h-8 object-cover rounded" />
                          <span>이미지 {index + 1}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-images" disabled>
                      <span className="text-gray-400">먼저 이미지를 삽입해주세요</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {newsUploadedImages.length > 0 
                  ? "본문에 삽입된 이미지 중에서 썸네일로 사용할 이미지를 선택하세요."
                  : "본문에 이미지를 삽입하면 썸네일로 선택할 수 있습니다."
                }
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowNewsEditModal(false)}
                disabled={newsWriteLoading}
                className="px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                취소
              </Button>
              <Button
                onClick={handleNewsUpdate}
                disabled={newsWriteLoading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {newsWriteLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    수정 중...
                  </>
                ) : (
                  '뉴스 수정'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 모바일 하단 네비게이션 - 커뮤니티 페이지에서는 숨김 */}
      {/* <BottomTabNavigation /> */}
    </div>
  )
}

export default function NewsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <NewsPageContent />
    </Suspense>
  )
}
