'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Image as ImageIcon,
  Clock,
  Eye,
  EyeOff,
  User
} from 'lucide-react'
import { Story, StoryForm, StoryState } from '@/types/story'
import { useAuth } from '@/context/AuthContext'

// 목업 스토리 데이터
const mockStories: Story[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '김민지',
    userAvatar: '/avatars/user1.jpg',
    imageUrl: '/stories/story1.jpg',
    text: '오늘 한국 전통 한복을 입어봤어요! 너무 예뻐서 기분이 좋았습니다 💕',
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22시간 후 만료
    isExpired: false
  },
  {
    id: '2',
    userId: 'user2',
    userName: '마리아',
    userAvatar: '/avatars/user2.jpg',
    imageUrl: '/stories/story2.jpg',
    text: '한국 화장품으로 메이크업 연습 중이에요. 어떤가요? 😊',
    isPublic: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4시간 전
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20시간 후 만료
    isExpired: false
  },
  {
    id: '3',
    userId: 'user3',
    userName: '카를로스',
    userAvatar: '/avatars/user3.jpg',
    imageUrl: '/stories/story3.jpg',
    text: '서울에서 맛있는 떡볶이를 먹었어요! 매운맛이 정말 대박이었습니다 🔥',
    isPublic: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6시간 전
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18시간 후 만료
    isExpired: false
  },
  {
    id: '4',
    userId: 'user4',
    userName: '소피아',
    userAvatar: '/avatars/user4.jpg',
    imageUrl: '/stories/story4.jpg',
    text: '한국 드라마 보면서 한국어 공부하고 있어요. 진짜 재미있어요! 📺',
    isPublic: true,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8시간 전
    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), // 16시간 후 만료
    isExpired: false
  }
]

interface StorySectionProps {
  onTabChange?: () => void
}

export default function StorySection({ onTabChange }: StorySectionProps) {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>(mockStories)
  const [storyState, setStoryState] = useState<StoryState>({
    isExpanded: false,
    visibleCount: 1,
    maxVisibleCount: 3
  })
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [storyForm, setStoryForm] = useState<StoryForm>({
    imageUrl: '',
    text: '',
    isPublic: true
  })
  const [isUploading, setIsUploading] = useState(false)

  // 탭 변경 감지 (다른 영역으로 이동 시 자동 축소)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetStoryState()
      }
    }

    const handlePageHide = () => {
      resetStoryState()
    }

    const handleBeforeUnload = () => {
      resetStoryState()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // 스토리 상태 리셋
  const resetStoryState = () => {
    setStoryState({
      isExpanded: false,
      visibleCount: 1,
      maxVisibleCount: 3
    })
  }

  // 스토리 확장/축소 토글
  const toggleStoryExpansion = () => {
    if (storyState.isExpanded) {
      resetStoryState()
    } else {
      setStoryState(prev => ({
        ...prev,
        isExpanded: true,
        visibleCount: Math.min(prev.maxVisibleCount, stories.length)
      }))
    }
  }

  // 스토리 업로드 처리
  const handleStoryUpload = async () => {
    if (!storyForm.imageUrl.trim() || !storyForm.text.trim()) {
      alert('사진과 텍스트를 모두 입력해주세요.')
      return
    }

    setIsUploading(true)
    
    try {
      // 실제로는 API 호출
      const newStory: Story = {
        id: Date.now().toString(),
        userId: user?.id || 'anonymous',
        userName: user?.user_metadata?.full_name || '사용자',
        imageUrl: storyForm.imageUrl,
        text: storyForm.text,
        isPublic: storyForm.isPublic,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
        isExpired: false
      }

      setStories(prev => [newStory, ...prev])
      setStoryForm({ imageUrl: '', text: '', isPublic: true })
      setShowUploadModal(false)
      
      // 업로드 후 자동으로 확장 상태로 변경
      setStoryState(prev => ({
        ...prev,
        isExpanded: true,
        visibleCount: Math.min(prev.maxVisibleCount, stories.length + 1)
      }))
    } catch (error) {
      console.error('스토리 업로드 실패:', error)
      alert('스토리 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 만료된 스토리 제거 (24시간마다)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setStories(prev => prev.filter(story => story.expiresAt > now))
    }, 60 * 60 * 1000) // 1시간마다 체크

    return () => clearInterval(interval)
  }, [])

  // 현재 표시할 스토리들
  const visibleStories = stories.slice(0, storyState.visibleCount)
  const hasMoreStories = stories.length > storyState.visibleCount

  return (
    <div className="mb-6">
      {/* 스토리 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" />
          오늘의 스토리
        </h3>
        
        <div className="flex items-center gap-2">
          {/* 스토리 업로드 버튼 */}
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600">
                <Plus className="w-4 h-4 mr-1" />
                스토리 올리기
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-xl">
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">새 스토리 작성</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700 mb-2 block">
                    사진 URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={storyForm.imageUrl}
                      onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                      className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStoryForm({ ...storyForm, imageUrl: 'https://picsum.photos/400/600?random=' + Date.now() })}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="text" className="text-sm font-medium text-gray-700 mb-2 block">
                    스토리 텍스트
                  </Label>
                  <Textarea
                    id="text"
                    placeholder="오늘 있었던 일을 간단히 적어주세요..."
                    value={storyForm.text}
                    onChange={(e) => setStoryForm({ ...storyForm, text: e.target.value })}
                    rows={3}
                    className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPublic"
                      checked={storyForm.isPublic}
                      onCheckedChange={(checked) => setStoryForm({ ...storyForm, isPublic: checked })}
                    />
                    <Label htmlFor="isPublic" className="text-sm text-gray-700">
                      공개하기
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    24시간 후 자동 삭제
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                    취소
                  </Button>
                  <Button 
                    onClick={handleStoryUpload}
                    disabled={isUploading || !storyForm.imageUrl.trim() || !storyForm.text.trim()}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    {isUploading ? '업로드 중...' : '스토리 올리기'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* 확장/축소 버튼 */}
          {stories.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleStoryExpansion}
              className="border-gray-300 hover:bg-gray-50"
            >
              {storyState.isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  줄이기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  늘리기
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 스토리 그리드 */}
      <div className="grid gap-4" style={{ 
        gridTemplateColumns: `repeat(${storyState.isExpanded ? Math.min(3, stories.length) : 1}, 1fr)` 
      }}>
        {visibleStories.map((story) => (
          <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="relative">
              {/* 스토리 이미지 */}
              <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                <img
                  src={story.imageUrl}
                  alt="스토리 이미지"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://picsum.photos/400/500?random=${story.id}`
                  }}
                />
                
                {/* 만료 시간 표시 */}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {Math.max(0, Math.floor((story.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)))}시간
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
              
              {/* 스토리 내용 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-brand-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{story.userName}</span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{story.text}</p>
                
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>{story.createdAt.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                  <span>24시간 후 삭제</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 더 많은 스토리가 있을 때 표시 */}
      {storyState.isExpanded && hasMoreStories && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            아래로 스크롤하여 더 많은 스토리를 확인하세요
          </p>
        </div>
      )}
    </div>
  )
}
