'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, Eye, TrendingUp } from 'lucide-react'

interface HotPost {
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

export default function TodayHotPosts() {
  const [hotPosts, setHotPosts] = useState<HotPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHotPosts = async () => {
      try {
        const response = await fetch('/api/feed?sort=popular&limit=3')
        const data = await response.json()
        setHotPosts(data.data || [])
      } catch (error) {
        console.error('Failed to fetch hot posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotPosts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
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
      {hotPosts.map((post, index) => (
        <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            {/* 순위 뱃지 */}
            <div className="flex-shrink-0">
              <Badge 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  index === 1 ? 'bg-gray-100 text-gray-700 border-gray-200' :
                  'bg-orange-100 text-orange-700 border-orange-200'
                }`}
              >
                {index + 1}
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                {post.title}
              </h4>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {post.preview}
              </p>
              
              {/* 태그 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* 통계 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-red-500">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-500">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{post.views}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
