'use client'

import { useState } from 'react'
import { MessageSquare, Brain, Newspaper, Users, Clock, ChevronRight, X, AlertCircle, Info, Megaphone, Camera } from 'lucide-react'

// 목업 데이터
const mockAnnouncements = [
  {
    id: 1,
    title: "새로운 화상채팅 기능이 추가되었습니다",
    content: "더 나은 화상 통화 경험을 제공합니다.",
    type: "info",
    date: "2025-01-15"
  },
  {
    id: 2,
    title: "시스템 점검 안내",
    content: "1월 20일 오전 2시-4시 점검이 예정되어 있습니다.",
    type: "warning", 
    date: "2025-01-14"
  }
]

const mockPopularPosts = [
  {
    id: 1,
    title: "한국 드라마 추천해주세요!",
    category: "자유게시판",
    author: "김민수",
    comments: 24,
    likes: 15,
    time: "2시간 전"
  },
  {
    id: 2,
    title: "한국어 공부 방법 공유",
    category: "학습게시판", 
    author: "박지영",
    comments: 18,
    likes: 32,
    time: "4시간 전"
  },
  {
    id: 3,
    title: "한국 음식 레시피 모음",
    category: "문화게시판",
    author: "이서현",
    comments: 12,
    likes: 28,
    time: "6시간 전"
  }
]

const mockPopularTests = [
  {
    id: 1,
    title: "내가 가장 좋아할 한국 드라마는?",
    participants: 156,
    time: "1일 전"
  },
  {
    id: 2,
    title: "한국어 실력 레벨 테스트",
    participants: 89,
    time: "2일 전"
  },
  {
    id: 3,
    title: "한국 문화 적응도 체크",
    participants: 67,
    time: "3일 전"
  }
]

const mockPopularNews = [
  {
    id: 1,
    title: "BTS, 새로운 앨범 발표 예정",
    likes: 45,
    comments: 12,
    time: "1시간 전"
  },
  {
    id: 2,
    title: "한국 관광객 증가세 지속",
    likes: 23,
    comments: 8,
    time: "3시간 전"
  },
  {
    id: 3,
    title: "K-푸드 글로벌 인기 상승",
    likes: 31,
    comments: 15,
    time: "5시간 전"
  }
]

const mockRecentStories = [
  {
    id: 1,
    user: "김민수",
    userInitial: "김",
    avatar: "/celebs/jin.webp",
    time: "2시간 전"
  },
  {
    id: 2,
    user: "박지영",
    userInitial: "박",
    avatar: "/celebs/rm.jpg",
    time: "4시간 전"
  },
  {
    id: 3,
    user: "이서현",
    userInitial: "이",
    avatar: "/celebs/suga.jpg",
    time: "6시간 전"
  }
]

const mockRecentActivities = [
  {
    id: 1,
    user: "김민수",
    action: "한국 드라마 추천해주세요! 게시글에 댓글을 남겼습니다",
    time: "30분 전"
  },
  {
    id: 2,
    user: "박지영",
    action: "한국어 공부 방법 공유 게시글을 좋아요했습니다",
    time: "1시간 전"
  },
  {
    id: 3,
    user: "이서현",
    action: "내가 가장 좋아할 한국 드라마는? 테스트를 완료했습니다",
    time: "2시간 전"
  },
  {
    id: 4,
    user: "최수진",
    action: "BTS, 새로운 앨범 발표 예정 뉴스에 댓글을 남겼습니다",
    time: "3시간 전"
  }
]

export default function HomeDashboard() {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<number[]>([])

  const hideAnnouncement = (id: number) => {
    setVisibleAnnouncements(prev => [...prev, id])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600" />
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return "bg-amber-50 border-amber-200"
      case 'info':
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* 운영자 공지 */}
      {mockAnnouncements.filter(a => !visibleAnnouncements.includes(a.id)).map((announcement) => (
        <div key={announcement.id} className={`border rounded-lg p-4 ${getTypeStyles(announcement.type)}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {getTypeIcon(announcement.type)}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {announcement.title}
                </h3>
                <p className="text-gray-700 text-xs">
                  {announcement.content}
                </p>
                <span className="text-gray-500 text-xs">
                  {announcement.date}
                </span>
              </div>
            </div>
            <button
              onClick={() => hideAnnouncement(announcement.id)}
              className="p-1 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      ))}

      {/* 인기 게시글 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">인기 게시글</h2>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="space-y-3">
          {mockPopularPosts.map((post) => (
            <div key={post.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {post.category}
                    </span>
                    <span>{post.author}</span>
                    <Clock className="w-3 h-3" />
                    <span>{post.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{post.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>👍</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인기 심리테스트 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">인기 심리테스트</h2>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="space-y-3">
          {mockPopularTests.map((test) => (
            <div key={test.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {test.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{test.participants}명 참여</span>
                    <Clock className="w-3 h-3" />
                    <span>{test.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 스토리 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-600" />
            <h2 className="font-medium text-gray-900 text-sm">최근 스토리</h2>
          </div>
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </div>
              <div className="flex items-center gap-3">
                {mockRecentStories.map((story) => (
                  <div key={story.id} className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
                      {story.avatar ? (
                        <img 
                          src={story.avatar} 
                          alt={story.user}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {story.userInitial}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 text-center leading-tight">
                      {story.user}
                    </span>
                  </div>
                ))}
              </div>
      </div>

      {/* 인기 한국뉴스 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">인기 한국뉴스</h2>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="space-y-3">
          {mockPopularNews.map((news) => (
            <div key={news.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {news.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{news.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span>👍</span>
                    <span>{news.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{news.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">최근 활동</h2>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="space-y-3">
          {mockRecentActivities.map((activity) => (
            <div key={activity.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>님이 {activity.action}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
