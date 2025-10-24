'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  TrendingUp, 
  Brain, 
  Newspaper, 
  Activity,
  Heart,
  MessageSquare,
  Eye,
  Clock,
  Users,
  Star
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'

interface RecentStory {
  id: string
  title: string
  content: string
  author: string
  likes: number
  comments: number
  createdAt: string
  image?: string
}

interface PopularPost {
  id: string
  title: string
  content: string
  author: string
  likes: number
  comments: number
  views: number
  createdAt: string
  category: string
}

interface PopularTest {
  id: string
  title: string
  description: string
  participants: number
  image: string
  category: string
  rating: number
}

interface KoreanNews {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  category: string
  readTime: number
}

interface RecentActivity {
  id: string
  type: 'post' | 'test' | 'comment' | 'like'
  title: string
  user: string
  createdAt: string
}

export default function CommunityTabNew() {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const router = useRouter()
  
  const [recentStories, setRecentStories] = useState<RecentStory[]>([])
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([])
  const [popularTests, setPopularTests] = useState<PopularTest[]>([])
  const [koreanNews, setKoreanNews] = useState<KoreanNews[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  
  // 좋아요 상태 관리 (Optimistic UI)
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  const [storyLikeCounts, setStoryLikeCounts] = useState<Record<string, number>>({})
  const [isLiking, setIsLiking] = useState<Set<string>>(new Set())
  
  // 댓글 상태 관리
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedStoryForComment, setSelectedStoryForComment] = useState<RecentStory | null>(null)
  const [commentText, setCommentText] = useState('')
  const [storyComments, setStoryComments] = useState<Record<string, any[]>>({})
  const [isCommenting, setIsCommenting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 실제 스토리 API 호출
        const storiesResponse = await fetch('/api/stories?isPublic=true&limit=3')
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json()
          const stories = storiesData.stories || []
          
          // 좋아요 수 상태 초기화 (API에서 0으로 설정되므로 0으로 초기화)
          const initialLikeCounts: Record<string, number> = {}
          stories.forEach((story: any) => {
            initialLikeCounts[story.id] = 0 // API에서 임시로 0으로 설정하고 있음
          })
          setStoryLikeCounts(initialLikeCounts)
          
          setRecentStories(stories.map((story: any) => ({
            id: story.id,
            title: story.text || '스토리',
            content: story.text || '',
            author: story.user_name || '익명',
            likes: story.likes || 0,
            comments: story.comment_count || 0,
            createdAt: new Date(story.created_at).toLocaleDateString('ko-KR'),
            image: story.image_url
          })))
        } else {
          // API 실패 시 목업 데이터 사용
          setRecentStories([
            {
              id: '1',
              title: '한국에서의 첫 여행 경험',
              content: '서울 여행에서 겪은 재미있는 에피소드들을 공유합니다...',
              author: 'Maria_Seoul',
              likes: 45,
              comments: 12,
              createdAt: '1시간 전',
              image: '/community.jpeg'
            },
            {
              id: '2',
              title: '한국어 배우기 팁',
              content: '한국어를 배우면서 느낀 점들과 유용한 방법들을...',
              author: 'Carlos_Kpop',
              likes: 32,
              comments: 8,
              createdAt: '3시간 전'
            }
          ])
        }
          
          setPopularPosts([
            {
              id: '1',
              title: '한국 드라마 추천 좀 해주세요',
              content: '로맨스 장르 좋아하는데 어떤 드라마가 인기인가요?',
              author: 'Ana_Drama',
              likes: 89,
              comments: 45,
              views: 1234,
              createdAt: '2시간 전',
              category: '문화'
            },
            {
              id: '2',
              title: '한국 음식 레시피 공유',
              content: '김치찌개 만드는 방법을 알고 싶어요',
              author: 'Luis_Food',
              likes: 67,
              comments: 23,
              views: 892,
              createdAt: '5시간 전',
              category: '음식'
            },
            {
              id: '3',
              title: 'K-POP 아이돌 추천',
              content: '처음 K-POP 들어보는데 어떤 그룹부터 시작하면 좋을까요?',
              author: 'Sofia_Kpop',
              likes: 156,
              comments: 78,
              views: 2156,
              createdAt: '1일 전',
              category: '음악'
            }
          ])
          
          setPopularTests([
            {
              id: '1',
              title: '내가 가장 잘 맞는 K-POP 아이돌은?',
              description: '성격으로 알아보는 나의 아이돌',
              participants: 1250,
              image: '/quizzes/mbti-with-kpop-stars/cover/cover.png',
              category: 'meme',
              rating: 4.8
            },
            {
              id: '2',
              title: '한국어 실력 테스트',
              description: '나의 한국어 수준은?',
              participants: 890,
              image: '/quizzes/mbti-with-kpop-stars/celebs/jennie.png',
              category: 'culture',
              rating: 4.6
            },
            {
              id: '3',
              title: '내 성격은 어떤 한국 드라마 주인공?',
              description: '성격으로 알아보는 드라마 캐릭터',
              participants: 634,
              image: '/quizzes/mbti-with-kpop-stars/celebs/iu.png',
              category: 'personality',
              rating: 4.7
            }
          ])
          
          setKoreanNews([
            {
              id: '1',
              title: '한국의 새로운 K-컬처 정책 발표',
              summary: '정부가 K-컬처 확산을 위한 새로운 지원 정책을 발표했습니다.',
              source: '연합뉴스',
              publishedAt: '2시간 전',
              category: '문화',
              readTime: 3
            },
            {
              id: '2',
              title: '한국 전통 음식의 세계적 인기 상승',
              summary: '김치와 한식이 전 세계적으로 인기를 끌고 있습니다.',
              source: '문화일보',
              publishedAt: '4시간 전',
              category: '음식',
              readTime: 5
            },
            {
              id: '3',
              title: '한국어 학습자 급증, 온라인 교육 시장 확대',
              summary: '해외 한국어 학습자가 급증하면서 온라인 교육 시장이 확대되고 있습니다.',
              source: '교육뉴스',
              publishedAt: '6시간 전',
              category: '교육',
              readTime: 4
            }
          ])
          
          setRecentActivities([
            {
              id: '1',
              type: 'post',
              title: '새 게시글: 한국 여행 추천',
              user: 'Maria_Seoul',
              createdAt: '10분 전'
            },
            {
              id: '2',
              type: 'test',
              title: '심리테스트 완료: 내가 가장 잘 맞는 K-POP 아이돌',
              user: 'Carlos_Kpop',
              createdAt: '25분 전'
            },
            {
              id: '3',
              type: 'comment',
              title: '댓글 작성: 한국 드라마 추천 게시글',
              user: 'Ana_Drama',
              createdAt: '1시간 전'
            },
            {
              id: '4',
              type: 'like',
              title: '좋아요: 한국 음식 레시피 게시글',
              user: 'Luis_Food',
              createdAt: '2시간 전'
            }
          ])
          
          setLoading(false)
      } catch (error) {
        console.error('데이터 로딩 오류:', error)
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 좋아요 처리 함수 (Optimistic UI)
  const handleStoryLike = async (storyId: string) => {
    if (!user || !token) {
      alert('로그인이 필요합니다.')
      return
    }

    if (isLiking.has(storyId)) return // 이미 처리 중이면 무시

    const isCurrentlyLiked = likedStories.has(storyId)
    const currentCount = storyLikeCounts[storyId] || 0

    // 1. 즉시 UI 업데이트 (Optimistic)
    setIsLiking.add(storyId)
    setLikedStories(prev => {
      const newSet = new Set(prev)
      if (isCurrentlyLiked) {
        newSet.delete(storyId)
      } else {
        newSet.add(storyId)
      }
      return newSet
    })
    setStoryLikeCounts(prev => ({
      ...prev,
      [storyId]: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
    }))

    try {
      // 2. 서버에 요청
      console.log('[STORY_LIKE] 좋아요 토글 시도:', { storyId, isCurrentlyLiked })
      
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        }
      })

      if (!response.ok) {
        throw new Error(`좋아요 처리 실패: ${response.status}`)
      }

      const result = await response.json()
      console.log('[STORY_LIKE] 좋아요 토글 성공:', result)

      // 3. 서버 응답으로 최종 상태 동기화
      setStoryLikeCounts(prev => ({
        ...prev,
        [storyId]: result.like_count || (isCurrentlyLiked ? currentCount - 1 : currentCount + 1)
      }))

    } catch (error) {
      console.error('[STORY_LIKE] 좋아요 토글 실패:', error)
      
      // 4. 실패 시 원래 상태로 롤백
      setLikedStories(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyLiked) {
          newSet.add(storyId)
        } else {
          newSet.delete(storyId)
        }
        return newSet
      })
      setStoryLikeCounts(prev => ({
        ...prev,
        [storyId]: currentCount
      }))
      
      alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLiking(prev => {
        const newSet = new Set(prev)
        newSet.delete(storyId)
        return newSet
      })
    }
  }

  // 댓글 모달 열기
  const handleOpenCommentModal = async (story: RecentStory) => {
    setSelectedStoryForComment(story)
    setShowCommentModal(true)
    setCommentText('')
    
    // 댓글 로드
    await loadStoryComments(story.id)
  }

  // 댓글 모달 닫기
  const handleCloseCommentModal = () => {
    setShowCommentModal(false)
    setSelectedStoryForComment(null)
    setCommentText('')
  }

  // 스토리 댓글 로드
  const loadStoryComments = async (storyId: string) => {
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/stories/${storyId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setStoryComments(prev => ({
          ...prev,
          [storyId]: data.comments || []
        }))
      }
    } catch (error) {
      console.error('댓글 로드 실패:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!selectedStoryForComment || !commentText.trim() || !user || !token) {
      return
    }

    setIsCommenting(true)
    try {
      console.log('[STORY_COMMENTS_POST] 댓글 작성 요청:', {
        storyId: selectedStoryForComment.id,
        content: commentText
      })

      const response = await fetch(`/api/stories/${selectedStoryForComment.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({
          content: commentText.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.')
      }

      const result = await response.json()
      console.log('[STORY_COMMENTS_POST] 댓글 작성 성공:', result)

      // 댓글 목록에 추가
      setStoryComments(prev => ({
        ...prev,
        [selectedStoryForComment.id]: [
          ...(prev[selectedStoryForComment.id] || []),
          result.comment
        ]
      }))

      // 댓글 수 증가
      setRecentStories(prev => prev.map(story => 
        story.id === selectedStoryForComment.id 
          ? { ...story, comments: story.comments + 1 }
          : story
      ))

      setCommentText('')
      
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      alert('댓글 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsCommenting(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'test': return <Brain className="w-4 h-4 text-purple-500" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-500" />
      case 'like': return <Heart className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {/* 최근 스토리 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 인기 게시글 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 인기 심리테스트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* 인기 한국 뉴스 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        
        {/* 최근 활동 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* 최근 스토리 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.recentStories')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/stories')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentStories.map((story) => (
            <Card key={story.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {story.image && (
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                      {story.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {story.author}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStoryLike(story.id)
                          }}
                          disabled={isLiking.has(story.id)}
                          className={`flex items-center gap-1 transition-colors ${
                            likedStories.has(story.id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-500 hover:text-red-500'
                          } ${isLiking.has(story.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <Heart 
                            className={`w-3 h-3 ${likedStories.has(story.id) ? 'fill-current' : ''}`} 
                          />
                          <span>{storyLikeCounts[story.id] ?? 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCommentModal(story)
                          }}
                          className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{story.comments}</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {story.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 인기 게시글 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.popularPosts')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/free-board')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {popularPosts.map((post) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    {formatNumber(post.views)}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>by {post.author}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comments}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.createdAt}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 인기 심리테스트 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.popularTests')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/tests')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {popularTests.map((test) => (
            <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3 flex items-center justify-center">
                  <img
                    src={test.image}
                    alt={test.title}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
                  {test.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                  {test.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{formatNumber(test.participants)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-500">{test.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 인기 한국 뉴스 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.community.popularNews')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/community/news')}
          >
                {t('home.community.seeMore')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {koreanNews.map((news) => (
            <Card key={news.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {news.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {news.readTime}분
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{news.source}</span>
                  <span>{news.publishedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('home.community.recentActivities')}
          </h2>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-2">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {activity.user} • {activity.createdAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instagram 스타일 댓글 모달 */}
      {showCommentModal && selectedStoryForComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Instagram 스타일 헤더 */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <button
                onClick={handleCloseCommentModal}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold">댓글</h3>
              <div className="w-6 h-6"></div> {/* 공간 맞추기 */}
            </div>

            {/* 스토리 카드 */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-pink-500 rounded-full p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    {selectedStoryForComment.image ? (
                      <img
                        src={selectedStoryForComment.image}
                        alt={selectedStoryForComment.title}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {selectedStoryForComment.author?.[0] || '?'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{selectedStoryForComment.author}</span>
                    <span className="text-xs text-gray-500">{selectedStoryForComment.createdAt}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {selectedStoryForComment.title}
                  </p>
                </div>
              </div>
            </div>

            {/* 댓글 목록 - Instagram 스타일 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-500">댓글을 불러오는 중...</span>
                </div>
              ) : storyComments[selectedStoryForComment.id]?.length > 0 ? (
                storyComments[selectedStoryForComment.id].map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {comment.author?.profile_image ? (
                        <img
                          src={comment.author.profile_image}
                          alt={comment.author.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {comment.author?.full_name?.[0] || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {comment.author?.full_name || '익명'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-3">
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          좋아요
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          답글
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">아직 댓글이 없습니다</p>
                  <p className="text-gray-400 text-sm mt-1">첫 댓글을 작성해보세요!</p>
                </div>
              )}
            </div>

            {/* 댓글 작성 - Instagram 스타일 */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="내 프로필"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {user?.user_metadata?.full_name?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글 달기..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 text-sm"
                    maxLength={500}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitComment()
                      }
                    }}
                  />
                  {commentText.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || isCommenting}
                        className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCommenting ? '게시 중...' : '게시'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {commentText.length > 400 && (
                <div className="text-xs text-gray-400 mt-2 text-right">
                  {commentText.length}/500
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
