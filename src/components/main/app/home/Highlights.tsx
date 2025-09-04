'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, FileText, Image, Newspaper } from 'lucide-react'

interface HighlightItem {
  id: string
  ref_type: 'post' | 'story' | 'news'
  ref_id: string
  period: string
  note: string
  starts_at: string
  ends_at: string
  posts?: any
  stories?: any
  news?: any
}

export default function Highlights() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHighlights()
  }, [])

  const loadHighlights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'weekly' })
      })
      
      const result = await response.json()

      if (result.error) {
        console.error('하이라이트 로드 실패:', result.error)
        return
      }

      setHighlights(result.highlights || [])
    } catch (error) {
      console.error('하이라이트 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 타입별 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
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
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-32 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (highlights.length === 0) {
    return null
  }

  return (
    <div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights.map((highlight) => {
          // 참조된 콘텐츠 정보 가져오기
          const content = highlight.posts || highlight.stories || highlight.news
          
          if (!content) return null

          return (
            <div key={highlight.id} className="group cursor-pointer">
              <Card className="p-4 hover:shadow-md transition-all duration-300 group-hover:scale-105">
                <div className="space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-center gap-2">
                    {getTypeIcon(highlight.ref_type)}
                    <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(highlight.ref_type)}`}>
                      {highlight.ref_type === 'post' ? '게시글' : 
                       highlight.ref_type === 'story' ? '스토리' : '뉴스'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {highlight.period === 'daily' ? '일간' : '주간'}
                    </Badge>
                  </div>

                  {/* 제목 */}
                  <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                    {content.title}
                  </h4>

                  {/* 미리보기 */}
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {content.content?.substring(0, 100)}...
                  </p>

                  {/* 노트 */}
                  {highlight.note && (
                    <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                      💡 {highlight.note}
                    </div>
                  )}

                  {/* 통계 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>❤️ {content.likes || 0}</span>
                      <span>👁️ {content.views || 0}</span>
                    </div>
                    <span className="text-yellow-600 font-medium">
                      ⭐ 하이라이트
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
