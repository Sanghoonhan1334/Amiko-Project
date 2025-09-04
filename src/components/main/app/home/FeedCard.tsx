'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  Eye, 
  MessageSquare,
  Globe,
  FileText,
  Newspaper,
  Image
} from 'lucide-react'

interface FeedItem {
  id: string
  type: 'post' | 'story' | 'news'
  title: string
  preview: string
  tags: string[]
  views: number
  likes: number
  created_at: string
  lang: string
}

interface FeedCardProps {
  item: FeedItem
}

export default function FeedCard({ item }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translatedPreview, setTranslatedPreview] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)

  // 좋아요 토글
  const handleLike = () => {
    setIsLiked(!isLiked)
    // TODO: API 호출로 좋아요 상태 업데이트
  }

  // 번역 실행
  const handleTranslate = async () => {
    if (isTranslating) return

    // 이미 번역된 상태라면 원문으로 토글
    if (showTranslated) {
      setShowTranslated(false)
      return
    }

    setIsTranslating(true)
    try {
      const targetLang = item.lang === 'ko' ? 'es' : 'ko'
      
      // 제목 번역
      const titleResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refType: item.type,
          refId: item.id,
          original: item.title,
          targetLang
        })
      })
      
      const titleResult = await titleResponse.json()
      if (titleResult.translated) {
        setTranslatedTitle(titleResult.translated)
      }

      // 미리보기 번역
      const previewResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refType: item.type,
          refId: item.id,
          original: item.preview,
          targetLang
        })
      })
      
      const previewResult = await previewResponse.json()
      if (previewResult.translated) {
        setTranslatedPreview(previewResult.translated)
      }

      setShowTranslated(true)
    } catch (error) {
      console.error('번역 실패:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  // 원문으로 돌아가기
  const handleShowOriginal = () => {
    setShowTranslated(false)
  }

  // 타입별 아이콘
  const getTypeIcon = () => {
    switch (item.type) {
      case 'post':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'story':
        return <Image className="w-4 h-4 text-purple-500" />
      case 'news':
        return <Newspaper className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  // 타입별 배지 색상
  const getTypeBadgeColor = () => {
    switch (item.type) {
      case 'post':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'story':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'news':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR', { 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <Badge variant="outline" className={`text-xs ${getTypeBadgeColor()}`}>
              {item.type === 'post' ? '게시글' : item.type === 'story' ? '스토리' : '뉴스'}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatTime(item.created_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="text-xs"
            >
              <Globe className="w-3 h-3 mr-1" />
              {isTranslating ? '번역중...' : showTranslated ? '원문' : '번역'}
            </Button>
          </div>
        </div>

        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {showTranslated && translatedTitle ? translatedTitle : item.title}
        </h3>

        {/* 미리보기 */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {showTranslated && translatedPreview ? translatedPreview : item.preview}
        </p>

        {/* 태그 */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              <span>{item.likes + (isLiked ? 1 : 0)}</span>
            </button>
            
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{item.views}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>0</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {item.lang === 'ko' ? '🇰🇷 한국어' : '🇪🇸 스페인어'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
