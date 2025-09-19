'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Share2, Heart, MessageCircle } from 'lucide-react'

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
  }
  onBack: () => void
  showSpanish?: boolean
}

export default function NewsDetail({ news, onBack, showSpanish = false }: NewsDetailProps) {
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

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
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
          <img 
            src={news.thumbnail} 
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 뉴스 내용 */}
        <div className="p-6">
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
            {showSpanish && news.title_es ? news.title_es : news.title}
          </h1>
          
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
