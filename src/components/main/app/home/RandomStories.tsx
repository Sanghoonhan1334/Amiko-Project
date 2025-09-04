'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, Eye, BookOpen } from 'lucide-react'

interface Story {
  id: string
  type: 'story'
  title: string
  preview: string
  images?: string[]
  tags: string[]
  views: number
  likes: number
  created_at: string
  lang: string
}

export default function RandomStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        // 인기 스토리와 랜덤 스토리 혼합 (인기 3개 + 랜덤 2개)
        const popularResponse = await fetch('/api/feed?type=story&sort=popular&limit=3')
        const popularData = await popularResponse.json()
        
        const randomResponse = await fetch('/api/feed?type=story&sort=latest&limit=5')
        const randomData = await randomResponse.json()
        
        // 인기 스토리와 랜덤 스토리 혼합
        const popularStories = popularData.data || []
        const allRandomStories = randomData.data || []
        
        // 인기 스토리에 없는 랜덤 스토리만 선택
        const popularIds = new Set(popularStories.map((s: Story) => s.id))
        const uniqueRandomStories = allRandomStories.filter((s: Story) => !popularIds.has(s.id)).slice(0, 2)
        
        // 최종 혼합 리스트
        const mixedStories = [...popularStories, ...uniqueRandomStories]
        setStories(mixedStories)
      } catch (error) {
        console.error('Failed to fetch stories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 스토리 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story) => (
          <Card key={story.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="space-y-3">
              {/* 이미지 */}
              {story.images && story.images.length > 0 && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={story.images[0]}
                    alt={story.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* 제목 */}
              <h4 className="font-semibold text-gray-800 line-clamp-2">
                {story.title}
              </h4>
              
              {/* 미리보기 */}
              <p className="text-gray-600 text-sm line-clamp-2">
                {story.preview}
              </p>
              
              {/* 태그 */}
              {story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {story.tags.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* 통계 */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-red-500">
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">{story.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-500">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{story.views}</span>
                  </div>
                </div>
                <BookOpen className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      

    </div>
  )
}
