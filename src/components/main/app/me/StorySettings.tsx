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

  // 개별 스토리 설정
  const [storySettings, setStorySettings] = useState({
    allowComments: true,
    allowLikes: true,
    allowShares: true,
    showInFeed: true,
    notifyOnInteraction: true
  })

  // 스토리 가시성 설정
  const [visibilitySettings, setVisibilitySettings] = useState({
    defaultVisibility: 'public', // 'public' | 'friends' | 'private'
    showToFollowers: true,
    showToFriends: true,
    allowReposts: true
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
        setStories(mappedStories)
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

  // 컴포넌트 마운트 시 스토리 로드
  useEffect(() => {
    loadUserStories()
  }, [user, token])

  // 스토리 삭제
  const deleteStory = async (storyId: string) => {
    if (!confirm('정말로 이 스토리를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setStories(prev => prev.filter(story => story.id !== storyId))
      } else {
        console.error('스토리 삭제 실패:', response.status)
        alert('스토리 삭제에 실패했습니다.')
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

      if (response.ok) {
        setStories(prev => prev.map(s => 
          s.id === storyId ? { ...s, isPublic: !s.isPublic } : s
        ))
      } else {
        console.error('스토리 가시성 변경 실패:', response.status)
        alert('스토리 가시성 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('스토리 가시성 변경 중 오류:', error)
      alert('스토리 가시성 변경 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {/* 전역 스토리 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('storySettings.globalSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('storySettings.globalSettings.autoPublic.label')}</Label>
              <p className="text-sm text-gray-500">{t('storySettings.globalSettings.autoPublic.description')}</p>
            </div>
            <Switch
              checked={globalStorySettings.autoPublic}
              onCheckedChange={(checked) => setGlobalStorySettings(prev => ({ ...prev, autoPublic: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('storySettings.globalSettings.showInProfile.label')}</Label>
              <p className="text-sm text-gray-500">{t('storySettings.globalSettings.showInProfile.description')}</p>
            </div>
            <Switch
              checked={globalStorySettings.showInProfile}
              onCheckedChange={(checked) => setGlobalStorySettings(prev => ({ ...prev, showInProfile: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 아카이브 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('storySettings.archiveSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('storySettings.archiveSettings.autoArchive.label')}</Label>
              <p className="text-sm text-gray-500">{t('storySettings.archiveSettings.autoArchive.description')}</p>
            </div>
            <Switch
              checked={archiveSettings.autoArchive}
              onCheckedChange={(checked) => setArchiveSettings(prev => ({ ...prev, autoArchive: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('storySettings.archiveSettings.archiveTiming.label')}</Label>
            <Select
              value={archiveSettings.archiveAfter.toString()}
              onValueChange={(value) => setArchiveSettings(prev => ({ ...prev, archiveAfter: parseInt(value) }))}
            >
              <SelectTrigger>
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
      <Card>
        <CardHeader>
          <CardTitle>{t('storySettings.individualSettings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">스토리를 불러오는 중...</div>
            </div>
          ) : stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <div className="text-lg mb-2">📸</div>
              <div className="text-sm">아직 업로드한 스토리가 없습니다.</div>
              <div className="text-xs mt-1">첫 번째 스토리를 업로드해보세요!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
              <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={story.imageUrl}
                    alt={t('storySettings.individualSettings.storyImage')}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://picsum.photos/48/48?random=${story.id}`
                    }}
                  />
                  <div>
                    <p className="font-medium text-sm">{story.text ? story.text.substring(0, 50) + '...' : '내용 없음'}</p>
                    <p className="text-xs text-gray-500">
                      {story.createdAt ? `${story.createdAt.toLocaleDateString()} ${story.createdAt.toLocaleTimeString()}` : '날짜 정보 없음'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStoryVisibility(story.id)}
                  >
                    {story.isPublic ? (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        {t('storySettings.individualSettings.public')}
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        {t('storySettings.individualSettings.private')}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteStory(story.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t('storySettings.individualSettings.delete')}
                  </Button>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
