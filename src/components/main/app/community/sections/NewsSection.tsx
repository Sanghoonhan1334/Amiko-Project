'use client'

import { Button } from '@/components/ui/button'
import NewsCard from '../ui/NewsCard'
import NewsDetail from '../NewsDetail'
import { toast } from 'sonner'

interface NewsSectionProps {
  newsData: any[]
  newsLoading: boolean
  showSpanishNews: boolean
  showNewsDetail: boolean
  selectedNews: any
  isAdmin: boolean
  onNewsClick: (news: any, e?: React.MouseEvent) => void
  onBack: () => void
  onShowWriteModal: () => void
  onEdit: (news: any) => void
  onDelete: (newsId: string) => void
  onPin: (newsId: string, isPinned: boolean) => void
  setNewsData: React.Dispatch<React.SetStateAction<any[]>>
  t: (key: string) => string
}

export default function NewsSection({
  newsData,
  newsLoading,
  showSpanishNews,
  showNewsDetail,
  selectedNews,
  isAdmin,
  onNewsClick,
  onBack,
  onShowWriteModal,
  onEdit,
  onDelete,
  onPin,
  setNewsData,
  t
}: NewsSectionProps) {
  return (
    <div className="w-full">
      {showNewsDetail && selectedNews ? (
        // 뉴스 상세 내용
        <div className="space-y-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 text-xs md:text-sm"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">{t('freeboard.backToList')}</span>
            </button>
          </div>
          <NewsDetail 
            news={selectedNews} 
            onBack={onBack}
            showSpanish={showSpanishNews}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
          />
        </div>
      ) : (
        // 뉴스 목록
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            {isAdmin && (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={onShowWriteModal}
              >
                ➕ 뉴스 작성
              </Button>
            )}
          </div>
          
          <div className="space-y-0">
            {newsLoading ? (
              // 로딩 스켈레톤
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border-b border-gray-200">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-purple-600">
                    <span className="animate-spin">⏳</span>
                    <span>번역 중...</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {newsData.map((news) => (
                  <NewsCard
                    key={news.id}
                    news={{
                      id: news.id,
                      title: showSpanishNews && news.title_es ? news.title_es : news.title,
                      source: news.source,
                      date: news.date,
                      thumbnail: news.thumbnail,
                      views: news.views,
                      likes: news.likes,
                      comments: news.comments,
                      is_pinned: news.is_pinned
                    }}
                    onClick={onNewsClick}
                    isAdmin={isAdmin}
                    onEdit={(news) => onEdit(news)}
                    onTogglePin={async (news) => {
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
                          setNewsData(prev => prev.map(n => 
                            n.id === news.id ? { ...n, is_pinned: !news.is_pinned } : n
                          ))
                        } else {
                          const errorData = await response.json().catch(() => ({}))
                          console.error('고정 상태 변경 실패:', errorData)
                          toast.error(errorData.error || '고정 상태 변경에 실패했습니다.')
                        }
                      } catch (error) {
                        console.error('뉴스 고정 오류:', error)
                        toast.error('고정 상태 변경 중 오류가 발생했습니다.')
                      }
                    }}
                    onDelete={async (news) => {
                      try {
                        const response = await fetch(`/api/news?id=${news.id}`, {
                          method: 'DELETE'
                        })
                        if (response.ok) {
                          toast.success('뉴스가 삭제되었습니다.')
                          setNewsData(prev => prev.filter(n => n.id !== news.id))
                        } else {
                          toast.error('뉴스 삭제에 실패했습니다.')
                        }
                      } catch (error) {
                        console.error('뉴스 삭제 오류:', error)
                        toast.error('뉴스 삭제 중 오류가 발생했습니다.')
                      }
                    }}
                  />
                ))}

                {/* 더 많은 뉴스 보기 버튼 */}
                <div className="text-center pt-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" className="bg-white hover:bg-gray-50">
                      {t('community.viewMoreNews')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
