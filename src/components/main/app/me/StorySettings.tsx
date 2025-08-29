'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Eye, 
  EyeOff, 
  Image as ImageIcon,
  Trash2,
  Calendar,
  User,
  Settings
} from 'lucide-react'
import { Story } from '@/types/story'
import { useAuth } from '@/context/AuthContext'

// 목업 스토리 데이터 (내가 올린 것들 - 아카이브 방식)
const mockMyStories: Story[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '마리아',
    imageUrl: 'https://picsum.photos/400/500?random=1',
    text: '오늘 한국 전통 한복을 입어봤어요! 너무 예뻐서 기분이 좋았습니다 💕',
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22시간 후 만료 (커뮤니티용)
    isExpired: false
  },
  {
    id: '2',
    userId: 'user1',
    userName: '마리아',
    imageUrl: 'https://picsum.photos/400/500?random=2',
    text: '한국 화장품으로 메이크업 연습 중이에요. 어떤가요? 😊',
    isPublic: false,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26시간 전
    expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전 만료 (커뮤니티용)
    isExpired: false // 내 프로필에서는 만료되지 않음
  },
  {
    id: '3',
    userId: 'user1',
    userName: '마리아',
    imageUrl: 'https://picsum.photos/400/500?random=3',
    text: '서울에서 맛있는 떡볶이를 먹었어요! 매운맛이 정말 대박이었습니다 🔥',
    isPublic: true,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30시간 전
    expiresAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6시간 전 만료 (커뮤니티용)
    isExpired: false // 내 프로필에서는 만료되지 않음
  },
  {
    id: '4',
    userId: 'user1',
    userName: '마리아',
    imageUrl: 'https://picsum.photos/400/500?random=4',
    text: '한국 드라마 보면서 한국어 공부하고 있어요. 진짜 재미있어요! 📺',
    isPublic: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2일 전
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전 만료 (커뮤니티용)
    isExpired: false // 내 프로필에서는 만료되지 않음
  },
  {
    id: '5',
    userId: 'user1',
    userName: '마리아',
    imageUrl: 'https://picsum.photos/400/500?random=5',
    text: '라틴 음악에 빠져서 스페인어를 배우기 시작했어요! 🎵',
    isPublic: false,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3일 전
    expiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2일 전 만료 (커뮤니티용)
    isExpired: false // 내 프로필에서는 만료되지 않음
  }
]

export default function StorySettings() {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>(mockMyStories)
  const [globalStorySettings, setGlobalStorySettings] = useState({
    autoPublic: true,
    showInProfile: true
  })

  // 내 프로필에서는 스토리를 자동으로 삭제하지 않음 (아카이브 방식)
  // 24시간 만료는 커뮤니티 탭에서만 적용됨

  // 스토리 공개/비공개 토글
  const toggleStoryVisibility = (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, isPublic: !story.isPublic }
        : story
    ))
  }

  // 스토리 삭제
  const deleteStory = (storyId: string) => {
    if (confirm('정말로 이 스토리를 삭제하시겠습니까?')) {
      setStories(prev => prev.filter(story => story.id !== storyId))
    }
  }

  // 내 프로필에서는 24시간 기준이 아닌 최근/과거 기준으로 분류
  const recentStories = stories.filter(story => {
    const hoursAgo = (Date.now() - story.createdAt.getTime()) / (1000 * 60 * 60)
    return hoursAgo <= 24 // 24시간 이내
  })
  const archiveStories = stories.filter(story => {
    const hoursAgo = (Date.now() - story.createdAt.getTime()) / (1000 * 60 * 60)
    return hoursAgo > 24 // 24시간 초과
  })

  return (
    <div className="space-y-6">
      {/* 스토리 설정 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-brand-500" />
          스토리 설정
        </h3>
        <Badge variant="outline" className="text-brand-600 border-brand-300">
          <Clock className="w-3 h-3 mr-1" />
          아카이브 저장
        </Badge>
      </div>

      {/* 전역 스토리 설정 */}
      <Card className="p-6 bg-gradient-to-r from-brand-50 to-mint-50 border border-brand-200">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          기본 설정
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoPublic" className="text-sm font-medium text-gray-700">
                새 스토리 자동 공개
              </Label>
              <p className="text-xs text-gray-500">새로 올리는 스토리를 기본적으로 공개로 설정</p>
            </div>
            <Switch
              id="autoPublic"
              checked={globalStorySettings.autoPublic}
              onCheckedChange={(checked) => setGlobalStorySettings(prev => ({ ...prev, autoPublic: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="showInProfile" className="text-sm font-medium text-gray-700">
                프로필에 스토리 표시
              </Label>
              <p className="text-xs text-gray-500">다른 사용자가 내 프로필에서 지난 스토리 확인 가능</p>
            </div>
            <Switch
              id="showInProfile"
              checked={globalStorySettings.showInProfile}
              onCheckedChange={(checked) => setGlobalStorySettings(prev => ({ ...prev, showInProfile: checked }))}
            />
          </div>
        </div>
      </Card>

      {/* 최근 스토리 (24시간 이내) */}
      {recentStories.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            최근 스토리 ({recentStories.length}개)
          </h4>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentStories.map((story) => (
              <div key={story.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative">
                  <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                    <img
                      src={story.imageUrl}
                      alt="스토리 이미지"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 작성 시간 표시 */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {Math.floor((Date.now() - story.createdAt.getTime()) / (1000 * 60 * 60))}시간 전
                    </div>
                    
                    {/* 공개/비공개 표시 */}
                    <div className="absolute top-2 left-2">
                      {story.isPublic ? (
                        <div className="bg-green-500 text-white p-1 rounded-full">
                          <Eye className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="bg-gray-500 text-white p-1 rounded-full">
                          <EyeOff className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{story.text}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStoryVisibility(story.id)}
                          className="text-xs"
                        >
                          {story.isPublic ? '비공개로' : '공개로'}
                        </Button>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteStory(story.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 아카이브 스토리 (24시간 초과) */}
      {archiveStories.length > 0 && (
        <Card className="p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            아카이브 스토리 ({archiveStories.length}개)
          </h4>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archiveStories.map((story) => (
              <div key={story.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white opacity-75">
                <div className="relative">
                  <div className="aspect-[3/4] bg-gray-200 relative overflow-hidden">
                    <img
                      src={story.imageUrl}
                      alt="스토리 이미지"
                      className="w-full h-full object-cover grayscale"
                    />
                    
                    {/* 아카이브 표시 */}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Badge variant="secondary" className="bg-gray-500 text-white">
                        아카이브
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{story.text}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>작성: {story.createdAt.toLocaleDateString('ko-KR')}</span>
                      <span>{story.isPublic ? '공개됨' : '비공개됨'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              아카이브된 스토리는 영구 보관되며, 공개/비공개 설정만 변경 가능합니다.
            </p>
          </div>
        </Card>
      )}

      {/* 스토리가 없을 때 */}
      {stories.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-r from-brand-50 to-mint-50 border border-brand-200">
          <ImageIcon className="w-16 h-16 text-brand-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">아직 스토리가 없어요!</h4>
          <p className="text-gray-500 mb-4">
            커뮤니티 탭에서 첫 번째 스토리를 올려보세요.
          </p>
          <Button className="bg-brand-500 hover:bg-brand-600">
            커뮤니티로 이동
          </Button>
        </Card>
      )}
    </div>
  )
}
