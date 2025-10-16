'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye, 
  EyeOff, 
  Trash2,
  Calendar,
  Settings
} from 'lucide-react'
import { Story } from '@/types/story'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function StorySettings() {
  const { t } = useLanguage()
  const { user, token } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [globalStorySettings, setGlobalStorySettings] = useState({
    autoPublic: true,
    showInProfile: true
  })

  // 내 프로필에서는 스토리를 자동으로 삭제하지 않음 (아카이브 방식)
  const [archiveSettings, setArchiveSettings] = useState({
    autoArchive: true,
    archiveAfter: 24, // 시간
    keepArchived: true,
    maxArchived: 100
  })


  // 사용자 스토리 로드
  const loadUserStories = async () => {
    if (!user || !token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/stories?userId=' + user.id, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // API 응답 데이터를 Story 타입에 맞게 매핑
        const mappedStories = (data.stories || []).map((story: any) => ({
          id: story.id,
          userId: story.user_id,
          userName: story.user_name || '익명',
          imageUrl: story.image_url,
          text: story.text_content || '',
          isPublic: story.is_public,
          createdAt: story.created_at ? new Date(story.created_at) : new Date(),
          expiresAt: story.expires_at ? new Date(story.expires_at) : new Date(),
          isExpired: story.is_expired || false
        }))
        
        // 만료된 스토리 필터링 (사용자 설정에서는 만료된 스토리도 보여줌)
        const filteredStories = mappedStories.filter(story => {
          // 만료되었지만 아직 삭제되지 않은 스토리는 보여줌 (사용자가 직접 삭제할 수 있도록)
          return true
        })
        
        setStories(filteredStories)
      } else {
        console.error('스토리 로드 실패:', response.status)
        setStories([])
      }
    } catch (error) {
      console.error('스토리 로드 중 오류:', error)
      setStories([])
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 스토리 로드 및 설정 불러오기
  useEffect(() => {
    loadUserStories()
    
    // localStorage에서 설정 불러오기
    const savedGlobalSettings = localStorage.getItem('storyGlobalSettings')
    if (savedGlobalSettings) {
      setGlobalStorySettings(JSON.parse(savedGlobalSettings))
    }
    
    const savedArchiveSettings = localStorage.getItem('storyArchiveSettings')
    if (savedArchiveSettings) {
      setArchiveSettings(JSON.parse(savedArchiveSettings))
    }
  }, [user, token])
  
  // 전역 설정 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('storyGlobalSettings', JSON.stringify(globalStorySettings))
  }, [globalStorySettings])
  
  // 아카이브 설정 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('storyArchiveSettings', JSON.stringify(archiveSettings))
  }, [archiveSettings])

  // 스토리 삭제
  const deleteStory = async (storyId: string) => {
    if (!confirm('정말로 이 스토리를 삭제하시겠습니까?')) {
      return
    }

    try {
      // 토큰 확인
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      console.log('스토리 삭제 시도:', storyId)

      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const responseData = await response.json()

      if (response.ok) {
        // 🚀 최적화: 전체 목록 재로드 대신 로컬 상태만 업데이트
        setStories(prev => prev.filter(story => story.id !== storyId))
        console.log('스토리 삭제 성공:', responseData)
      } else {
        console.error('스토리 삭제 실패:', response.status, responseData)
        alert(`스토리 삭제에 실패했습니다: ${responseData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('스토리 삭제 중 오류:', error)
      alert('스토리 삭제 중 오류가 발생했습니다.')
    }
  }

  // 스토리 가시성 변경
  const toggleStoryVisibility = async (storyId: string) => {
    try {
      const story = stories.find(s => s.id === storyId)
      if (!story) return

      // 토큰 확인
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      console.log('스토리 가시성 변경 시도:', { storyId, currentVisibility: story.isPublic })

      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: !story.isPublic
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        setStories(prev => prev.map(s => 
          s.id === storyId ? { ...s, isPublic: !s.isPublic } : s
        ))
        console.log('스토리 가시성 변경 성공:', responseData)
      } else {
        console.error('스토리 가시성 변경 실패:', response.status, responseData)
        alert(`스토리 가시성 변경에 실패했습니다: ${responseData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('스토리 가시성 변경 중 오류:', error)
      alert('스토리 가시성 변경 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-4">
      {/* 전역 스토리 설정 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-sm">
            <Settings className="w-4 h-4" />
            {t('storySettings.globalSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-gray-800 dark:text-gray-200 text-xs">{t('storySettings.globalSettings.autoPublic.label')}</Label>
              <p className="text-xs text-gray-500 dark:text-gray-300">{t('storySettings.globalSettings.autoPublic.description')}</p>
            </div>
            <Switch
              checked={globalStorySettings.autoPublic}
              onCheckedChange={(checked) => setGlobalStorySettings(prev => ({ ...prev, autoPublic: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-gray-800 dark:text-gray-200 text-xs">{t('storySettings.globalSettings.showInProfile.label')}</Label>
              <p className="text-xs text-gray-500 dark:text-gray-300">{t('storySettings.globalSettings.showInProfile.description')}</p>
            </div>
            <Switch
              checked={globalStorySettings.showInProfile}
              onCheckedChange={(checked) => setGlobalStorySettings(prev => ({ ...prev, showInProfile: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 아카이브 설정 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-sm">
            <Calendar className="w-4 h-4" />
            {t('storySettings.archiveSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-gray-800 dark:text-gray-200 text-xs">{t('storySettings.archiveSettings.autoArchive.label')}</Label>
              <p className="text-xs text-gray-500 dark:text-gray-300">{t('storySettings.archiveSettings.autoArchive.description')}</p>
            </div>
            <Switch
              checked={archiveSettings.autoArchive}
              onCheckedChange={(checked) => setArchiveSettings(prev => ({ ...prev, autoArchive: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-800 dark:text-gray-200 text-xs">{t('storySettings.archiveSettings.archiveTiming.label')}</Label>
            <Select
              value={archiveSettings.archiveAfter.toString()}
              onValueChange={(value) => setArchiveSettings(prev => ({ ...prev, archiveAfter: parseInt(value) }))}
            >
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('storySettings.archiveSettings.archiveTiming.options.1')}</SelectItem>
                <SelectItem value="6">{t('storySettings.archiveSettings.archiveTiming.options.6')}</SelectItem>
                <SelectItem value="12">{t('storySettings.archiveSettings.archiveTiming.options.12')}</SelectItem>
                <SelectItem value="24">{t('storySettings.archiveSettings.archiveTiming.options.24')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 개별 스토리 설정 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-gray-800 dark:text-gray-100 text-sm">{t('storySettings.individualSettings.title')}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm whitespace-nowrap"
              onClick={async () => {
                try {
                  const response = await fetch('/api/stories/cleanup', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  })
                  
                  if (response.ok) {
                    const data = await response.json()
                    alert(t('communityTab.cleanupSuccess').replace('{count}', data.deletedCount))
                    // 🚀 최적화: 만료된 스토리만 로컬에서 제거 (전체 재로드 방지)
                    setStories(prev => prev.filter(story => !story.isExpired))
                  } else {
                    alert(t('communityTab.cleanupFailed'))
                  }
                } catch (error) {
                  console.error('스토리 정리 중 오류:', error)
                  alert(t('communityTab.cleanupError'))
                }
              }}
            >
              {t('communityTab.cleanExpiredStories')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-300">{t('communityTab.loadingStories')}</div>
            </div>
          ) : stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-300">
              <div className="text-lg mb-2">📸</div>
              <div className="text-sm dark:text-gray-200">{t('communityTab.noUploadedStories')}</div>
              <div className="text-xs mt-1 dark:text-gray-300">{t('communityTab.uploadFirstStoryPrompt')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => {
                const now = new Date()
                const isExpired = story.expiresAt < now
                const timeLeft = Math.max(0, Math.floor((story.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
                
                return (
                <div key={story.id} className={`flex items-center justify-between p-3 border rounded-lg ${isExpired ? 'bg-gray-50 dark:bg-gray-700 opacity-60' : 'bg-white dark:bg-gray-800'} border-gray-200 dark:border-gray-600`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={story.imageUrl}
                        alt={t('storySettings.individualSettings.storyImage')}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://picsum.photos/48/48?random=${story.id}`
                        }}
                      />
                      {isExpired && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">만료</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-xs text-gray-800 dark:text-gray-200">{story.text ? story.text.substring(0, 50) + '...' : '내용 없음'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {story.createdAt ? `${story.createdAt.toLocaleDateString()} ${story.createdAt.toLocaleTimeString()}` : '날짜 정보 없음'}
                      </p>
                      {!isExpired && (
                        <p className="text-xs text-orange-500 dark:text-orange-400">
                          {timeLeft}시간 후 만료
                        </p>
                      )}
                    </div>
                  </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs px-2 py-1 w-full sm:w-auto"
                    onClick={() => toggleStoryVisibility(story.id)}
                  >
                    {story.isPublic ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        {t('storySettings.individualSettings.public')}
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        {t('storySettings.individualSettings.private')}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs px-2 py-1 w-full sm:w-auto"
                    onClick={() => deleteStory(story.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t('storySettings.individualSettings.delete')}
                  </Button>
                </div>
              </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
