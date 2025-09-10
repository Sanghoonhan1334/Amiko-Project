'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  User,
  Clock,
  Star,
  Flag,
  Edit,
  Trash2,
  Send
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface Comment {
  id: number
  postId: number
  author: string
  content: string
  createdAt: string
  likes: number
  dislikes: number
}

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

interface PostDetailProps {
  post: Post
  onBack: () => void
  onLike: (postId: number) => void
  onDislike: (postId: number) => void
}

// 목업 댓글 데이터
const mockComments: Comment[] = [
  {
    id: 1,
    postId: 929,
    author: '아미',
    content: '저는 BTS를 가장 좋아해요! 특히 지민의 보컬이 정말 대박이에요 💜',
    createdAt: '2024-09-01T11:30:00Z',
    likes: 5,
    dislikes: 0
  },
  {
    id: 2,
    postId: 929,
    author: '블링크',
    content: '블랙핑크 최고! 제니의 랩 실력이 정말 대단해요 💖',
    createdAt: '2024-09-01T12:15:00Z',
    likes: 3,
    dislikes: 1
  },
  {
    id: 3,
    postId: 928,
    author: '뉴진스팬',
    content: '하니 솔로 앨범 정말 너무 좋아요! 목소리가 정말 예뻐요 🎵',
    createdAt: '2024-08-31T16:00:00Z',
    likes: 2,
    dislikes: 0
  },
  {
    id: 4,
    postId: 927,
    author: '아미',
    content: '축하해요! BTS 콘서트 정말 대박일 거예요! 저도 꼭 가보고 싶어요 🎉',
    createdAt: '2024-08-31T13:00:00Z',
    likes: 4,
    dislikes: 0
  },
  {
    id: 5,
    postId: 926,
    author: '다이브',
    content: '안유진이 정말 예뻐요! MC하면서 보여준 모습이 너무 멋있어요 💕',
    createdAt: '2024-08-31T10:00:00Z',
    likes: 6,
    dislikes: 0
  }
]

export default function PostDetail({ post, onBack, onLike, onDislike }: PostDetailProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(mockComments.filter(c => c.postId === post.id))
  const [newComment, setNewComment] = useState('')
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set())
  const [dislikedComments, setDislikedComments] = useState<Set<number>>(new Set())

  // 댓글 작성
  const handleCommentSubmit = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Math.max(...comments.map(c => c.id)) + 1,
      postId: post.id,
      author: user?.user_metadata?.full_name || '익명',
      content: newComment,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0
    }

    setComments(prev => [comment, ...prev])
    setNewComment('')
  }

  // 댓글 좋아요/싫어요
  const handleCommentLike = (commentId: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment
    ))
    setLikedComments(prev => new Set([...prev, commentId]))
  }

  const handleCommentDislike = (commentId: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId ? { ...comment, dislikes: comment.dislikes + 1 } : comment
    ))
    setDislikedComments(prev => new Set([...prev, commentId]))
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
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        목록으로
      </Button>

      {/* 게시글 상세 */}
      <Card className="p-6">
        {/* 게시글 헤더 */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {post.isNotice && <Badge variant="destructive">공지</Badge>}
            {post.isBest && <Badge variant="default" className="bg-yellow-100 text-yellow-800">개념글</Badge>}
            {post.isSurvey && <Badge variant="default" className="bg-green-100 text-green-800">설문</Badge>}
            <Badge variant="outline">{post.category}</Badge>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
                {post.isVerified && <Star className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(post.createdAt)}</span>
              </div>
              <span>조회 {post.views}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Flag className="w-4 h-4" />
              </Button>
              {user?.user_metadata?.full_name === post.author && (
                <>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 추천/비추천 버튼 */}
        <div className="flex items-center gap-4 border-t border-gray-200 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onLike(post.id)}
            className="flex items-center gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            추천 {post.likes}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onDislike(post.id)}
            className="flex items-center gap-2"
          >
            <ThumbsDown className="w-4 h-4" />
            비추천 {post.dislikes}
          </Button>
        </div>
      </Card>

      {/* 댓글 섹션 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          댓글 ({comments.length})
        </h3>

        {/* 댓글 작성 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button onClick={handleCommentSubmit} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{comment.author}</span>
                  <span className="text-sm text-gray-500">{formatTime(comment.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCommentLike(comment.id)}
                    disabled={likedComments.has(comment.id)}
                    className="text-xs"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {comment.likes}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCommentDislike(comment.id)}
                    disabled={dislikedComments.has(comment.id)}
                    className="text-xs"
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    {comment.dislikes}
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        )}
      </Card>
    </div>
  )
}
