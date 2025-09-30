'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Share2, Heart, MessageCircle, Edit, Trash2, Pin, PinOff } from 'lucide-react'
import { toast } from 'sonner'

interface NewsDetailProps {
  news: {
    id: number
    title: string
    title_es?: string
    source: string
    date: string
    thumbnail: string
    content: string
    content_es?: string
    author?: string
    views?: number
    likes?: number
    comments?: number
    celebrity?: string
    originalUrl?: string
    is_pinned?: boolean
  }
  onBack: () => void
  showSpanish?: boolean
  isAdmin?: boolean
  onEdit?: (news: any) => void
  onDelete?: (newsId: number) => void
  onPin?: (newsId: number, isPinned: boolean) => void
}

export default function NewsDetail({ 
  news, 
  onBack, 
  showSpanish = false, 
  isAdmin = false, 
  onEdit, 
  onDelete, 
  onPin 
}: NewsDetailProps) {
  // news 객체가 undefined인 경우 처리
  if (!news) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">뉴스를 찾을 수 없습니다</p>
            <p className="text-sm">뉴스 데이터를 불러올 수 없습니다.</p>
          </div>
        </Card>
      </div>
    )
  }

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(news.likes || 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinning, setIsPinning] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 뉴스를 삭제하시겠습니까?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/news?id=${news.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('뉴스가 삭제되었습니다.')
        onDelete?.(news.id)
        onBack()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || '뉴스 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 삭제 오류:', error)
      toast.error('뉴스 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePin = async () => {
    setIsPinning(true)
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: news.id,
          is_pinned: !news.is_pinned
        })
      })

      if (response.ok) {
        toast.success(news.is_pinned ? '고정이 해제되었습니다.' : '뉴스가 고정되었습니다.')
        onPin?.(news.id, !news.is_pinned)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || '고정 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 고정 오류:', error)
      toast.error('고정 상태 변경 중 오류가 발생했습니다.')
    } finally {
      setIsPinning(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.content.substring(0, 100) + '...',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 클립보드에 복사되었습니다!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로 돌아가기
        </Button>
      </div>

      {/* 뉴스 상세 내용 */}
      <Card className="overflow-hidden">
        {/* 썸네일 이미지 */}
        <div className="aspect-video w-full bg-gray-200">
          {news.thumbnail ? (
            <img 
              src={news.thumbnail} 
              alt={news.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-center">
                <div className="text-6xl mb-4">📰</div>
                <span className="text-blue-600 text-xl font-medium">뉴스</span>
              </div>
            </div>
          )}
        </div>

        {/* 뉴스 내용 */}
        <div className="p-6">
          {/* 제목과 관리자 버튼 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {showSpanish && news.title_es ? news.title_es : news.title}
                </h1>
                {news.is_pinned && (
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">
                    <Pin className="w-3 h-3" />
                    고정
                  </span>
                )}
              </div>
            </div>
            
            {/* 관리자 버튼들 */}
            {isAdmin && (
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(news)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  수정
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePin}
                  disabled={isPinning}
                  className={`flex items-center gap-1 ${
                    news.is_pinned 
                      ? 'text-yellow-600 border-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {news.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  {isPinning ? '처리중...' : (news.is_pinned ? '고정해제' : '고정')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? '삭제중...' : '삭제'}
                </Button>
              </div>
            )}
          </div>
          
          {/* 연예인 태그 */}
          {news.celebrity && (
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {news.celebrity}
              </span>
            </div>
          )}

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 border-b border-gray-200 pb-4">
            <span className="font-medium">{news.source}</span>
            <span>{news.date}</span>
            {news.author && <span>기자: {news.author}</span>}
            <span>조회 {news.views || 0}</span>
          </div>

          {/* 본문 내용 */}
          <div className="prose max-w-none mb-8">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {showSpanish && news.content_es ? news.content_es : news.content}
            </div>
          </div>
          
          {/* 원본 링크 */}
          {news.originalUrl && (
            <div className="mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(news.originalUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                원본 기사 보기
              </Button>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                isLiked ? 'text-red-500 border-red-500' : 'text-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              좋아요 {likeCount}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 text-gray-600"
            >
              <MessageCircle className="w-4 h-4" />
              댓글 {news.comments || 0}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2 text-gray-600"
            >
              <Share2 className="w-4 h-4" />
              공유
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
