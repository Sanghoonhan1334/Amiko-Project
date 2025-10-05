'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface Post {
  id: string
  title: string
  content: string
  category: string
}

interface PostEditModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPost: Post) => void
}

const categories = [
  { value: '자유게시판', label: '자유게시판' },
  { value: 'K-POP', label: 'K-POP' },
  { value: 'K-Drama', label: 'K-Drama' },
  { value: 'K-Food', label: 'K-Food' },
  { value: 'K-Language', label: 'K-Language' },
  { value: 'K-Culture', label: 'K-Culture' },
  { value: '일상', label: '일상' },
  { value: '여행', label: '여행' },
  { value: '패션', label: '패션' },
  { value: '뷰티', label: '뷰티' },
  { value: '게임', label: '게임' },
  { value: '음악', label: '음악' },
  { value: '영화', label: '영화' },
  { value: '책', label: '책' },
  { value: '스포츠', label: '스포츠' },
  { value: '건강', label: '건강' },
  { value: '음식', label: '음식' },
  { value: '반려동물', label: '반려동물' },
  { value: '공부', label: '공부' },
  { value: '직장', label: '직장' },
  { value: '연애', label: '연애' },
  { value: '기타', label: '기타' }
]

export default function PostEditModal({ post, isOpen, onClose, onSave }: PostEditModalProps) {
  const { t } = useLanguage()
  const { token } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('자유게시판')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 모달이 열릴 때 게시글 정보로 폼 초기화
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setCategory(post.category)
      setError('')
    }
  }, [post])

  const handleSave = async () => {
    if (!post || !title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '게시글 수정에 실패했습니다.')
      }

      onSave({
        id: post.id,
        title: title.trim(),
        content: content.trim(),
        category
      })
      
      alert('게시글이 성공적으로 수정되었습니다.')
      onClose()
    } catch (err) {
      console.error('게시글 수정 오류:', err)
      setError(err instanceof Error ? err.message : '게시글 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setCategory('자유게시판')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>게시글 수정</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={8}
              maxLength={5000}
            />
            <div className="text-sm text-gray-500 text-right">
              {content.length}/5000
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '수정 중...' : '수정하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
