'use client'

import { useState } from 'react'
import { MessageSquare, Brain, Newspaper, Users, Clock, ChevronRight, X, AlertCircle, Info, Megaphone, Camera } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

// 목업 데이터를 번역 함수로 감싸기 위해 컴포넌트 내부로 이동

export default function HomeDashboard() {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<number[]>([])
  const { t } = useLanguage()

  // 목업 데이터 (번역 적용)
  const mockAnnouncements = [
    {
      id: 1,
      title: t('home.announcements.newVideoChatFeature'),
      content: t('home.announcements.betterVideoCallExperience'),
      type: "info",
      date: "2025-01-15"
    },
    {
      id: 2,
      title: t('home.announcements.systemMaintenanceNotice'),
      content: t('home.announcements.maintenanceSchedule'),
      type: "warning", 
      date: "2025-01-14"
    }
  ]

  const mockPopularPosts = [
    {
      id: 1,
      title: t('home.sampleContent.posts.dramaRecommendation'),
      category: t('home.sampleContent.posts.freeBoard'),
      author: "김민수",
      comments: 24,
      likes: 15,
      time: `2${t('home.dashboard.hoursAgo')}`
    },
    {
      id: 2,
      title: t('home.sampleContent.posts.koreanStudyMethod'),
      category: t('home.sampleContent.posts.learningBoard'), 
      author: "박지영",
      comments: 18,
      likes: 32,
      time: `4${t('home.dashboard.hoursAgo')}`
    },
    {
      id: 3,
      title: t('home.sampleContent.posts.koreanFoodRecipes'),
      category: t('home.sampleContent.posts.cultureBoard'),
      author: "이서현",
      comments: 12,
      likes: 28,
      time: `6${t('home.dashboard.hoursAgo')}`
    }
  ]

  const mockPopularTests = [
    {
      id: 1,
      title: t('home.sampleContent.tests.favoriteKoreanDrama'),
      participants: 156,
      time: `1${t('home.dashboard.daysAgo')}`
    },
    {
      id: 2,
      title: t('home.sampleContent.tests.koreanLevelTest'),
      participants: 89,
      time: `2${t('home.dashboard.daysAgo')}`
    },
    {
      id: 3,
      title: t('home.sampleContent.tests.culturalAdaptationTest'),
      participants: 67,
      time: `3${t('home.dashboard.daysAgo')}`
    }
  ]

  const mockPopularNews = [
    {
      id: 1,
      title: t('home.sampleContent.news.btsNewAlbum'),
      likes: 45,
      comments: 12,
      time: `1${t('home.dashboard.hoursAgo')}`
    },
    {
      id: 2,
      title: t('home.sampleContent.news.koreanTourismIncrease'),
      likes: 23,
      comments: 8,
      time: `3${t('home.dashboard.hoursAgo')}`
    },
    {
      id: 3,
      title: t('home.sampleContent.news.kFoodGlobalPopularity'),
      likes: 31,
      comments: 15,
      time: `5${t('home.dashboard.hoursAgo')}`
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
      action: `${t('home.sampleContent.posts.dramaRecommendation')} ${t('home.sampleContent.activities.commentedOnPost')}`,
      time: `30${t('home.dashboard.minutesAgo')}`
    },
    {
      id: 2,
      user: "박지영",
      action: `${t('home.sampleContent.posts.koreanStudyMethod')} ${t('home.sampleContent.activities.likedPost')}`,
      time: `1${t('home.dashboard.hoursAgo')}`
    },
    {
      id: 3,
      user: "이서현",
      action: `${t('home.sampleContent.tests.favoriteKoreanDrama')} ${t('home.sampleContent.activities.completedTest')}`,
      time: `2${t('home.dashboard.hoursAgo')}`
    },
    {
      id: 4,
      user: "최수진",
      action: `${t('home.sampleContent.news.btsNewAlbum')} ${t('home.sampleContent.activities.commentedOnNews')}`,
      time: `3${t('home.dashboard.hoursAgo')}`
    }
  ]

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
        return "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700"
      case 'info':
      default:
        return "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 px-1 md:px-0">
      {/* 운영자 공지 */}
      {mockAnnouncements.filter(a => !visibleAnnouncements.includes(a.id)).map((announcement) => (
        <div key={announcement.id} className={`border rounded-lg p-2 md:p-4 ${getTypeStyles(announcement.type)}`}>
          <div className="flex items-start justify-between gap-2 md:gap-3">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              {getTypeIcon(announcement.type)}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm mb-1">
                  {announcement.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                  {announcement.content}
                </p>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {announcement.date}
                </span>
              </div>
            </div>
            <button
              onClick={() => hideAnnouncement(announcement.id)}
              className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3 md:w-4 md:h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      ))}

      {/* 인기 게시글 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 md:p-5">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{t('home.dashboard.popularPosts')}</h2>
          </div>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-2 md:space-y-3">
          {mockPopularPosts.map((post) => (
            <div key={post.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 md:pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs md:text-sm mb-1 line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="bg-gray-100 dark:bg-gray-700 px-1.5 md:px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 text-xs">
                      {post.category}
                    </span>
                    <span className="hidden sm:inline">{post.author}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 md:p-5">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{t('home.dashboard.popularTests')}</h2>
          </div>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-2 md:space-y-3">
          {mockPopularTests.map((test) => (
            <div key={test.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 md:pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs md:text-sm mb-1 line-clamp-2">
                    {test.title}
                  </h3>
                  <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{test.participants}{t('home.dashboard.participants')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{test.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 스토리 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-4">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-3 h-3 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
            <h2 className="font-medium text-gray-900 dark:text-gray-100 text-xs md:text-sm">{t('home.dashboard.recentStories')}</h2>
          </div>
          <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2">
          {mockRecentStories.map((story) => (
            <div key={story.id} className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-purple-500">
                {story.avatar ? (
                  <img 
                    src={story.avatar} 
                    alt={story.user}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {story.userInitial}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight max-w-[60px] truncate">
                {story.user}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 인기 한국뉴스 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 md:p-5">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{t('home.dashboard.popularNews')}</h2>
          </div>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-2 md:space-y-3">
          {mockPopularNews.map((news) => (
            <div key={news.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 md:pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs md:text-sm mb-1 line-clamp-2">
                    {news.title}
                  </h3>
                  <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{news.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 md:p-5">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{t('home.dashboard.recentActivities')}</h2>
          </div>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-2 md:space-y-3">
          {mockRecentActivities.map((activity) => (
            <div key={activity.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 md:pb-3 last:pb-0">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                    <span className="font-medium">{activity.user}</span>님이 {activity.action}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
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
