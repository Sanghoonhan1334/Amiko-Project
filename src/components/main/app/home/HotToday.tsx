'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Eye, Heart } from 'lucide-react'

interface HotItem {
  id: string
  type: 'post' | 'story' | 'news'
  title: string
  preview: string
  tags: string[]
  views: number
  likes: number
  created_at: string
  lang: string
  score: number
}

export default function HotToday() {
  const [hotItems, setHotItems] = useState<HotItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHotToday()
  }, [])

  const loadHotToday = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feed?sort=popular&limit=5')
      const result = await response.json()

      if (result.error) {
        console.error('인기글 로드 실패:', result.error)
        return
      }

      // 점수 계산 (likes*3 + views*0.2)
      const itemsWithScore = result.data.map((item: any) => ({
        ...item,
        score: item.likes * 3 + item.views * 0.2
      }))

      // 점수순으로 정렬
      const sortedItems = itemsWithScore.sort((a: HotItem, b: HotItem) => b.score - a.score)
      setHotItems(sortedItems.slice(0, 5))
    } catch (error) {
      console.error('인기글 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">오늘의 인기글</h3>
        </div>
        
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (hotItems.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">오늘의 인기글</h3>
      </div>
      
      <div className="space-y-3">
        {hotItems.map((item, index) => (
          <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            {/* 순위 */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-100 text-yellow-700' :
              index === 1 ? 'bg-gray-100 text-gray-700' :
              index === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {index + 1}
            </div>
            
            {/* 콘텐츠 */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-1 text-sm">
                {item.title}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                {item.preview}
              </p>
              
              {/* 태그 */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* 통계 */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{item.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{item.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
