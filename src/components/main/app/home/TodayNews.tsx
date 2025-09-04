'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Clock, Newspaper } from 'lucide-react'

interface News {
  id: string
  type: 'news'
  title: string
  preview: string
  source?: string
  url?: string
  isOfficial?: boolean
  tags: string[]
  views: number
  likes: number
  created_at: string
  lang: string
  thumbnail?: string // Added thumbnail to the interface
}

export default function TodayNews() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/feed?type=news&sort=latest&limit=1')
        const data = await response.json()
        setNews(data.data || [])
      } catch (error) {
        console.error('Failed to fetch news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(1)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-32 h-24 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            {/* 썸네일 이미지 */}
            {item.thumbnail && (
              <div className="flex-shrink-0">
                <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* 콘텐츠 */}
            <div className="flex-1 min-w-0">
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                    {item.title}
                  </h4>
                  
                  {/* 출처와 시간 */}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Newspaper className="w-4 h-4" />
                      <span>{item.source || 'Amiko News'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(item.created_at)}</span>
                    </div>
                    {item.isOfficial && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                        공식
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* 원문 보기 버튼 */}
                {item.url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    원문 보기
                  </Button>
                )}
              </div>
              
              {/* 미리보기 */}
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {item.preview}
              </p>
              
              {/* 태그 */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
