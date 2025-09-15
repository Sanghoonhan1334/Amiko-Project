'use client'

import { useState } from 'react'
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

// 목업 스토리 데이터
const mockMyStories: Story[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '김민지',
    userAvatar: 'https://picsum.photos/48/48?random=1',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    text: '오늘 한국 전통 한복을 입어봤어요! 너무 예뻐서 기분이 좋았습니다 💕',
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
    isExpired: false
  },
  {
    id: '2',
    userId: 'user1',
    userName: '김민지',
    userAvatar: 'https://picsum.photos/48/48?random=2',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    text: '한국 화장품으로 메이크업 연습 중이에요. 어떤가요? 😊',
    isPublic: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
    isExpired: false
  }
]

export default function StorySettings() {
  const { t } = useLanguage()
  const [stories, setStories] = useState<Story[]>(mockMyStories)
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



  // 스토리 삭제
  const deleteStory = (storyId: string) => {
    if (confirm(t('storySettings.individualSettings.deleteConfirm'))) {
      setStories(prev => prev.filter(story => story.id !== storyId))
    }
  }

  // 스토리 가시성 변경
  const toggleStoryVisibility = (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId ? { ...story, isPublic: !story.isPublic } : story
    ))
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
                    <p className="font-medium text-sm">{story.text.substring(0, 50)}...</p>
                    <p className="text-xs text-gray-500">
                      {story.createdAt.toLocaleDateString()} {story.createdAt.toLocaleTimeString()}
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
        </CardContent>
      </Card>
    </div>
  )
}
