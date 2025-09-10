'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Eye,
  User,
  Clock,
  Award,
  TrendingUp,
  Star,
  Search,
  Filter,
  Edit,
  Trash2,
  Flag,
  Pin
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import PostDetail from './PostDetail'

// 게시글 타입 정의
interface Post {
  id: number
  title: string
  content: string
  author: string
  authorType: 'korean' | 'latin'
  category: string
  views: number
  likes: number
  dislikes: number
  comments: number
  createdAt: string
  isNotice: boolean
  isBest: boolean
  isSurvey: boolean
  isVerified: boolean
  tags: string[]
}

// 목업 데이터
const mockPosts: Post[] = [
  {
    id: 929,
    title: '여러분이 가장 좋아하는 K-pop 그룹은? 💕',
    content: '안녕하세요! K-pop 팬 여러분들~ 저는 블랙핑크를 가장 좋아하는데, 여러분은 어떤 그룹을 가장 좋아하시나요? 그리고 그 이유도 함께 공유해주세요! 저는 블핑의 무대 매너와 퍼포먼스가 정말 대박이라고 생각해요 ✨',
    author: '블핑러버',
    authorType: 'korean',
    category: 'survey',
    views: 156,
    likes: 23,
    dislikes: 2,
    comments: 45,
    createdAt: '2024-09-01T10:30:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: true,
    isVerified: true,
    tags: ['설문', 'K-pop', '블랙핑크']
  },
  {
    id: 928,
    title: '뉴진스 하니의 새 앨범 너무 좋아요! [4]',
    content: '뉴진스 하니의 솔로 앨범 나왔는데 정말 너무 좋아요! 특히 타이틀곡이 너무 예뻐서 계속 듣고 있어요. 다들 어떻게 생각하시나요? 🎵',
    author: '뉴진스팬',
    authorType: 'korean',
    category: 'entertainment',
    views: 89,
    likes: 12,
    dislikes: 1,
    comments: 4,
    createdAt: '2024-08-31T15:20:00Z',
    isNotice: false,
    isBest: false,
    isSurvey: false,
    isVerified: false,
    tags: ['뉴진스', '하니', '솔로앨범']
  },
  {
    id: 927,
    title: 'BTS 콘서트 티켓 예매 성공했어요! 🎉',
    content: '드디어 BTS 콘서트 티켓 예매에 성공했어요! 정말 너무 기뻐서 소리질렀어요 ㅠㅠ 다들 응원해주세요! 어떤 곡을 가장 기대하시나요?',
    author: '아미',
    authorType: 'latin',
    category: 'entertainment',
    views: 67,
    likes: 8,
    dislikes: 0,
    comments: 12,
    createdAt: '2024-08-31T12:15:00Z',
    isNotice: false,
    isBest: false,
    isSurvey: false,
    isVerified: true,
    tags: ['BTS', '콘서트', '티켓']
  },
  {
    id: 926,
    title: '아이브 안유진이 정말 예뻐요 💖',
    content: '아이브 안유진이 정말 너무 예쁘고 귀여워요! 특히 최근 뮤직뱅크 MC하면서 보여준 모습이 정말 대박이었어요. 다들 어떻게 생각하시나요?',
    author: '아이브러버',
    authorType: 'korean',
    category: 'entertainment',
    views: 234,
    likes: 45,
    dislikes: 3,
    comments: 23,
    createdAt: '2024-08-31T09:45:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: false,
    isVerified: false,
    tags: ['아이브', '안유진', 'MC']
  },
  {
    id: 925,
    title: '르세라핌 카즈하 한국어 실력 대박! 🇯🇵',
    content: '르세라핌 카즈하가 한국어를 정말 잘하네요! 최근 인터뷰에서 보여준 한국어 실력이 정말 대단해요. 일본인인데 한국어를 이렇게 잘할 수 있다니... 정말 존경스러워요!',
    author: '르세라핌팬',
    authorType: 'korean',
    category: 'entertainment',
    views: 189,
    likes: 34,
    dislikes: 1,
    comments: 8,
    createdAt: '2024-08-30T16:30:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: false,
    isVerified: true,
    tags: ['르세라핌', '카즈하', '한국어']
  },
  {
    id: 924,
    title: '세븐틴 호시 댄스 실력 정말 대단해요! 💃',
    content: '세븐틴 호시의 댄스 실력이 정말 대단해요! 특히 최근 무대에서 보여준 퍼포먼스가 정말 압도적이었어요. 다들 어떻게 생각하시나요?',
    author: '캐럿',
    authorType: 'korean',
    category: 'entertainment',
    views: 445,
    likes: 67,
    dislikes: 12,
    comments: 89,
    createdAt: '2024-08-30T14:20:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: false,
    isVerified: false,
    tags: ['세븐틴', '호시', '댄스']
  },
  {
    id: 923,
    title: '투모로우바이투게더 콘서트 후기 🎤',
    content: '어제 투모로우바이투게더 콘서트 다녀왔어요! 정말 너무 좋았고, 특히 마지막 앵콜 무대가 정말 감동적이었어요. 다들 꼭 가보시길 추천드려요!',
    author: '모아',
    authorType: 'korean',
    category: 'entertainment',
    views: 567,
    likes: 89,
    dislikes: 23,
    comments: 156,
    createdAt: '2024-08-30T11:10:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: false,
    isVerified: false,
    tags: ['투모로우바이투게더', '콘서트', '후기']
  },
  {
    id: 922,
    title: '에스파 윈터 새 드라마 너무 기대돼요! [1]',
    content: '에스파 윈터가 새 드라마에 출연한다고 하네요! 정말 너무 기대돼요. 어떤 역할을 맡을지 궁금해요. 다들 어떻게 생각하시나요?',
    author: '마이',
    authorType: 'latin',
    category: 'entertainment',
    views: 78,
    likes: 15,
    dislikes: 0,
    comments: 1,
    createdAt: '2024-08-30T09:30:00Z',
    isNotice: false,
    isBest: false,
    isSurvey: false,
    isVerified: false,
    tags: ['에스파', '윈터', '드라마']
  },
  {
    id: 921,
    title: '새벽에 K-pop 노래 들으면서 공부 중 📚',
    content: '새벽에 K-pop 노래 들으면서 공부하고 있어요. 특히 BTS의 "Butter"가 정말 좋아요! 다들 어떤 곡 들으면서 공부하시나요?',
    author: '공부하는팬',
    authorType: 'korean',
    category: 'daily',
    views: 45,
    likes: 7,
    dislikes: 0,
    comments: 3,
    createdAt: '2024-08-28T01:47:00Z',
    isNotice: false,
    isBest: false,
    isSurvey: false,
    isVerified: false,
    tags: ['K-pop', '공부', 'BTS']
  },
  {
    id: 920,
    title: 'K-pop 팬 여러분들! 팬미팅 꿈꿔보신 적 있나요? 💭',
    content: 'K-pop 팬 여러분들! 혹시 본인이 좋아하는 아이돌과 팬미팅을 할 수 있다면 어떤 말을 하고 싶으신가요? 저는 정말 궁금해요!',
    author: '꿈꾸는팬',
    authorType: 'korean',
    category: 'daily',
    views: 234,
    likes: 56,
    dislikes: 2,
    comments: 34,
    createdAt: '2024-08-27T20:15:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: false,
    isVerified: false,
    tags: ['K-pop', '팬미팅', '꿈']
  },
  {
    id: 919,
    title: 'K-pop이 제일 좋아요! 🌟',
    content: 'K-pop이 정말 세계 최고라고 생각해요! 특히 한국 아이돌들의 실력과 열정이 정말 대단해요. 다들 어떻게 생각하시나요?',
    author: 'K-pop러버',
    authorType: 'korean',
    category: 'entertainment',
    views: 678,
    likes: 123,
    dislikes: 45,
    comments: 234,
    createdAt: '2024-08-27T18:30:00Z',
    isNotice: false,
    isBest: true,
    isSurvey: false,
    isVerified: false,
    tags: ['K-pop', '아이돌', '열정']
  }
]

export default function FreeBoard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // 상태 관리
  const [activeTab, setActiveTab] = useState<'all' | 'best' | 'notice'>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes'>('date')
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'daily'
  })
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // 초기 데이터 로드
  useEffect(() => {
    setPosts(mockPosts)
  }, [])

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...posts]

    // 탭별 필터링
    if (activeTab === 'best') {
      filtered = filtered.filter(post => post.isBest)
    } else if (activeTab === 'notice') {
      filtered = filtered.filter(post => post.isNotice)
    }

    // 검색 필터링
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'views':
          return b.views - a.views
        case 'likes':
          return b.likes - a.likes
        default:
          return 0
      }
    })

    setFilteredPosts(filtered)
    setCurrentPage(1)
  }, [posts, activeTab, searchTerm, sortBy])

  // 페이지네이션
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  // 글쓰기 처리
  const handleWritePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    const post: Post = {
      id: Math.max(...posts.map(p => p.id)) + 1,
      title: newPost.title,
      content: newPost.content,
      author: user?.user_metadata?.full_name || '익명',
      authorType: user?.user_metadata?.is_korean ? 'korean' : 'latin',
      category: newPost.category,
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      isNotice: false,
      isBest: false,
      isSurvey: false,
      isVerified: false,
      tags: []
    }

    setPosts(prev => [post, ...prev])
    setNewPost({ title: '', content: '', category: 'daily' })
    setShowWriteModal(false)
  }

  // 좋아요/싫어요 처리
  const handleLike = (postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ))
  }

  const handleDislike = (postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, dislikes: post.dislikes + 1 } : post
    ))
  }

  // 게시글 상세보기
  const handleViewPost = (postId: number) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, views: p.views + 1 } : p
      ))
      setSelectedPost(post)
    }
  }

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setSelectedPost(null)
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR', { 
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  // 아이콘 렌더링
  const getPostIcon = (post: Post) => {
    if (post.isNotice) return <Pin className="w-4 h-4 text-red-500" />
    if (post.isSurvey) return <Award className="w-4 h-4 text-green-500" />
    if (post.isVerified) return <Star className="w-4 h-4 text-blue-500" />
    return <MessageSquare className="w-4 h-4 text-gray-400" />
  }

  // 게시글 상세보기 모드
  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={handleBackToList}
        onLike={handleLike}
        onDislike={handleDislike}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">자유게시판</h2>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: 'date' | 'views' | 'likes') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">최신순</SelectItem>
              <SelectItem value="views">조회순</SelectItem>
              <SelectItem value="likes">추천순</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showWriteModal} onOpenChange={setShowWriteModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                글쓰기
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 글 작성</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">제목</label>
                  <Input
                    placeholder="제목을 입력하세요"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">카테고리</label>
                  <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">일상</SelectItem>
                      <SelectItem value="entertainment">연예</SelectItem>
                      <SelectItem value="politics">정치</SelectItem>
                      <SelectItem value="travel">여행</SelectItem>
                      <SelectItem value="food">음식</SelectItem>
                      <SelectItem value="finance">금융</SelectItem>
                      <SelectItem value="history">역사</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">내용</label>
                  <Textarea
                    placeholder="내용을 입력하세요"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={8}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowWriteModal(false)}>
                    취소
                  </Button>
                  <Button onClick={handleWritePost}>
                    글쓰기
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="제목, 내용, 작성자로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            전체글 ({filteredPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('best')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'best'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            개념글 ({posts.filter(p => p.isBest).length})
          </button>
          <button
            onClick={() => setActiveTab('notice')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notice'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            공지 ({posts.filter(p => p.isNotice).length})
          </button>
        </div>
      </div>

      {/* 게시글 목록 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  글쓴이
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  작성일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  조회
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  추천
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewPost(post.id)}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {post.isNotice ? (
                      <Badge variant="destructive" className="text-xs">공지</Badge>
                    ) : (
                      post.id
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPostIcon(post)}
                      <span className="text-sm font-medium text-gray-900">
                        {post.title}
                      </span>
                      {post.comments > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          [{post.comments}]
                        </Badge>
                      )}
                      {post.isBest && (
                        <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                          개념글
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <span>{post.author}</span>
                      {post.isVerified && (
                        <Star className="w-3 h-3 text-blue-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(post.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {post.views}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">{post.likes}</span>
                      <span className="text-red-600">-{post.dislikes}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
