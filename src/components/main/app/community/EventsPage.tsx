'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Trophy, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import SeedIcon from '@/components/common/SeedIcon'
import ZepEventCard from '../event/ZepEventCard'

export default function EventsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  const handleViewMyLevel = () => {
    window.dispatchEvent(new CustomEvent('mainTabChanged', { 
      detail: { tab: 'me' } 
    }))
    router.push('/main?tab=me#my-level')
  }

  const handleViewMyPoints = () => {
    window.dispatchEvent(new CustomEvent('mainTabChanged', { 
      detail: { tab: 'me' } 
    }))
    router.push('/main?tab=me#my-points')
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-0 md:px-8 py-0 sm:py-2 md:py-6 -mt-8">
      {/* 배지/참여 기준 안내 카드 */}
      <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
        <div className="text-xs sm:text-sm text-purple-900 dark:text-purple-100">
          <div className="font-bold text-base sm:text-lg md:text-xl mb-2">{t('eventTab.badgeGuide.title')}</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <SeedIcon size={16} className="inline-block" />
              <span>{t('eventTab.badgeGuide.sprout')}</span>
            </div>
            <div>{t('eventTab.badgeGuide.levels')}</div>
            <div>{t('eventTab.badgeGuide.rose')}</div>
            <div>{t('eventTab.badgeGuide.vip')}</div>
            <div className="mt-1">{t('eventTab.badgeGuide.requirement')}</div>
          </div>
          {/* 내 레벨보기 버튼 */}
          <div className="mt-3 sm:mt-4">
            <Button
              onClick={handleViewMyLevel}
              className="w-full text-white font-medium text-xs sm:text-sm py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-300"
              style={{ 
                background: 'linear-gradient(to right, rgb(124 58 237), rgb(139 92 246), rgb(124 58 237))',
                border: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(109 40 217), rgb(124 58 237), rgb(109 40 217))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(124 58 237), rgb(139 92 246), rgb(124 58 237))'
              }}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('eventTab.badgeGuide.viewMyLevel')}
            </Button>
          </div>
        </div>
      </div>

      {/* 포인트 시스템 제목 */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t('eventTab.pointSystem.title')}</h2>
      </div>
          
      {/* 포인트 획득 방법 */}
      <div className="p-2 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-700 border border-green-200 dark:border-gray-600 rounded-xl shadow-sm" data-tutorial="point-system">
        <div className="flex items-center gap-2 mb-3 px-2 sm:px-0">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-base">🎯</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-green-800 dark:text-gray-200 point-system-title">{t('eventTab.pointSystem.earningMethods.title')}</h3>
            <p className="text-xs text-green-600 dark:text-green-400 point-system-subtitle">{t('eventTab.pointSystem.earningMethods.subtitle')}</p>
          </div>
        </div>
        
        {/* 데스크톱: 카드 그리드 */}
        <div className="hidden md:grid grid-cols-2 gap-4">
          {/* 출석체크 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.attendanceCheck.title')}</span>
              <Badge className="bg-green-500 text-white">{t('eventTab.pointSystem.earningMethods.attendanceCheck.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.attendanceCheck.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.attendanceCheck.limit')}</div>
          </div>
          
          {/* 댓글 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.comments.title')}</span>
              <Badge className="bg-blue-500 text-white">{t('eventTab.pointSystem.earningMethods.comments.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.comments.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.comments.limit')}</div>
          </div>
          
          {/* 좋아요 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.likes.title')}</span>
              <Badge className="bg-pink-500 text-white">{t('eventTab.pointSystem.earningMethods.likes.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.likes.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.likes.limit')}</div>
          </div>
          
          {/* 팬아트 업로드 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.fanartUpload.title')}</span>
              <Badge className="bg-purple-500 text-white">{t('eventTab.pointSystem.earningMethods.fanartUpload.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.fanartUpload.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.fanartUpload.limit')}</div>
          </div>
          
          {/* 아이돌 사진 업로드 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.title')}</span>
              <Badge className="bg-purple-500 text-white">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.idolPhotoUpload.limit')}</div>
          </div>
          
          {/* 투표 참여 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.pollVotes.title')}</span>
              <Badge className="bg-indigo-500 text-white">{t('eventTab.pointSystem.earningMethods.pollVotes.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.pollVotes.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.pollVotes.limit')}</div>
          </div>
          
          {/* 뉴스 댓글 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.newsComments.title')}</span>
              <Badge className="bg-cyan-500 text-white">{t('eventTab.pointSystem.earningMethods.newsComments.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.newsComments.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.newsComments.limit')}</div>
          </div>
          
          {/* 공유 */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{t('eventTab.pointSystem.earningMethods.share.title')}</span>
              <Badge className="bg-orange-500 text-white">{t('eventTab.pointSystem.earningMethods.share.points')}</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('eventTab.pointSystem.earningMethods.share.description')}</p>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.share.limit')}</div>
          </div>
        </div>

        {/* 모바일: 카드 스타일 */}
        <div className="block md:hidden space-y-2 px-1">
          {/* 출석체크 */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.attendanceCheck.title')}</span>
              <Badge className="bg-green-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.attendanceCheck.points')}</Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.attendanceCheck.description')}</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.attendanceCheck.limit')}</div>
          </div>
          
          {/* 댓글 */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.comments.title')}</span>
              <Badge className="bg-blue-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.comments.points')}</Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.comments.description')}</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.comments.limit')}</div>
          </div>
          
          {/* 좋아요 */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.likes.title')}</span>
              <Badge className="bg-pink-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.likes.points')}</Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.likes.description')}</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.likes.limit')}</div>
          </div>
          
          {/* 공유 */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t('eventTab.pointSystem.earningMethods.share.title')}</span>
              <Badge className="bg-orange-500 text-white text-xs">{t('eventTab.pointSystem.earningMethods.share.points')}</Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('eventTab.pointSystem.earningMethods.share.description')}</p>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('eventTab.pointSystem.earningMethods.share.limit')}</div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg mx-2 sm:mx-0">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className='font-medium text-blue-800 dark:text-blue-300 text-sm'>{t('eventTab.pointSystem.earningMethods.warning.title')}</span>
          </div>
          <p className='text-xs text-blue-700 dark:text-blue-300 mt-1'>
            {t('eventTab.pointSystem.earningMethods.warning.message')}
          </p>
        </div>

        {/* 내 포인트 현황 보기 버튼 */}
        <div className="mt-4 flex justify-center px-2 sm:px-0">
          <Button
            onClick={handleViewMyPoints}
            className="w-full text-white font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300"
            style={{ 
              background: 'linear-gradient(to right, rgb(34 197 94), rgb(13 148 136))',
              border: 'none',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(22 163 74), rgb(15 118 110))'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(34 197 94), rgb(13 148 136))'
            }}
          >
            <Trophy className="w-4 h-4 mr-2" />
            {t('eventTab.pointSystem.earningMethods.viewMyPoints')}
          </Button>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t-2 border-gray-300 my-8"></div>
      
      {/* ZEP 운영자 미팅 카드 */}
      <ZepEventCard user={user} />
    </div>
  )
}

