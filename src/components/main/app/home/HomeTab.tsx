'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { 
  Star,
  TrendingUp,
  BookOpen,
  Newspaper,
  ArrowRight
} from 'lucide-react'
import Highlights from './Highlights'
import TodayHotPosts from './TodayHotPosts'
import RandomStories from './RandomStories'
import TodayNews from './TodayNews'

export default function HomeTab() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 로딩 완료
    setLoading(false)
  }, [])

  return (
    <div className="space-y-8">
      {/* 1. 주간 하이라이트 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">주간 하이라이트</h3>
              <p className="text-gray-600 text-sm">이번 주 추천 콘텐츠</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
            운영팀 추천
          </Badge>
        </div>
        <Highlights />
        <div className="mt-6 text-center">
          <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
            전체보기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* 2. 오늘의 뉴스 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">오늘의 뉴스</h3>
              <p className="text-gray-600 text-sm">지금 알아야 할 소식</p>
            </div>
          </div>
        </div>
        <TodayNews />
        <div className="mt-6 text-center">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            뉴스 더보기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* 3. 오늘의 인기글 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">오늘의 인기글</h3>
              <p className="text-gray-600 text-sm">실시간 인기 차트</p>
            </div>
          </div>
        </div>
        <TodayHotPosts />
        <div className="mt-6 text-center">
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            더 보기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* 4. 인기 스토리 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">인기 스토리</h3>
              <p className="text-gray-600 text-sm">커뮤니티 스토리</p>
            </div>
          </div>
        </div>
        <RandomStories />
      </Card>
    </div>
  )
}
