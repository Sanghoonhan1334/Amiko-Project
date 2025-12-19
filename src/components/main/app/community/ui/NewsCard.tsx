'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, ThumbsUp, MessageSquare } from 'lucide-react'

interface NewsCardProps {
  news: {
    id: string | number
    title: string
    source?: string
    date?: string
    thumbnail?: string
    views?: number
    likes?: number
    comments?: number
    is_pinned?: boolean
  }
  onClick: (news: any, e?: React.MouseEvent) => void
  isAdmin?: boolean
  onEdit?: (news: any) => void
  onTogglePin?: (news: any) => Promise<void>
  onDelete?: (news: any) => Promise<void>
}

export default function NewsCard({
  news,
  onClick,
  isAdmin = false,
  onEdit,
  onTogglePin,
  onDelete
}: NewsCardProps) {
  return (
    <Card
      className="p-3 md:p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
      onClick={(e) => onClick(news, e)}
    >
      <div className="flex gap-3">
        {/* 썸네일 */}
        {news.thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={news.thumbnail}
              alt={news.title}
              className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover"
            />
          </div>
        )}

        {/* 뉴스 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
              {news.is_pinned && (
                <Badge className="mr-2 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                  📌 고정
                </Badge>
              )}
              {news.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {news.source && <span>{news.source}</span>}
            {news.date && <span>•</span>}
            {news.date && <span>{news.date}</span>}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-3 mt-2">
            {news.views !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Eye className="w-3 h-3" />
                <span>{news.views.toLocaleString()}</span>
              </div>
            )}
            {news.likes !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ThumbsUp className="w-3 h-3" />
                <span>{news.likes}</span>
              </div>
            )}
            {news.comments !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span>{news.comments}</span>
              </div>
            )}

            {/* 운영진 전용 버튼들 */}
            {isAdmin && (
              <div className="flex items-center gap-1 ml-auto">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onEdit(news)
                    }}
                  >
                    ✏️
                  </Button>
                )}
                {onTogglePin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-6 px-2 text-xs ${
                      news.is_pinned
                        ? 'text-yellow-600 border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-orange-600 border-orange-300 hover:bg-orange-50'
                    }`}
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await onTogglePin(news)
                    }}
                  >
                    {news.is_pinned ? '🔒' : '📌'}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!confirm('정말로 이 뉴스를 삭제하시겠습니까?')) {
                        return
                      }
                      await onDelete(news)
                    }}
                  >
                    🗑️
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
