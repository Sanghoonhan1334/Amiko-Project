'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, BarChart3, Users, Clock, MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface Poll {
  id: string
  title: string
  description: string
  category: string
  created_at: string
  expires_at: string | null
  total_votes: number
  poll_options: PollOption[]
  poll_comments: PollComment[]
}

interface PollOption {
  id: string
  option_text: string
  option_image_url?: string
  vote_count: number
}

interface PollComment {
  id: string
  content: string
  created_at: string
  user_id: string
  users: {
    full_name: string
    avatar_url?: string
  }
}

export default function PollBoard() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)

  // 투표 생성 상태
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    category: 'general',
    options: [{ text: '', image_url: '' }, { text: '', image_url: '' }],
    expires_at: '',
    allow_multiple: false
  })

  const categories = [
    { value: 'all', label: '전체', icon: '🗳️' },
    { value: 'K-POP', label: 'K-POP', icon: '🎵' },
    { value: 'K-Drama', label: 'K-Drama', icon: '📺' },
    { value: 'general', label: '일반', icon: '💬' },
    { value: 'fanart', label: '팬아트', icon: '🎨' },
    { value: 'beauty', label: '뷰티', icon: '💄' }
  ]

  useEffect(() => {
    fetchPolls()
  }, [selectedCategory])

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/polls?${params}`)
      const data = await response.json()

      if (data.success) {
        setPolls(data.data)
      }
    } catch (error) {
      console.error('투표 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePoll = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!newPoll.title.trim() || newPoll.options.filter(opt => opt.text.trim()).length < 2) {
      alert('제목과 최소 2개의 선택지를 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newPoll.title,
          description: newPoll.description,
          category: newPoll.category,
          options: newPoll.options.filter(opt => opt.text.trim()),
          expires_at: newPoll.expires_at || null,
          allow_multiple: newPoll.allow_multiple
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateDialog(false)
        setNewPoll({
          title: '',
          description: '',
          category: 'general',
          options: [{ text: '', image_url: '' }, { text: '', image_url: '' }],
          expires_at: '',
          allow_multiple: false
        })
        fetchPolls()
      } else {
        alert(data.error || '투표 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 생성 실패:', error)
      alert('투표 생성 중 오류가 발생했습니다.')
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poll_id: pollId,
          option_id: optionId
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchPolls()
      } else {
        alert(data.error || '투표에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 실패:', error)
      alert('투표 중 오류가 발생했습니다.')
    }
  }

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, { text: '', image_url: '' }]
    }))
  }

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOption = (index: number, field: 'text' | 'image_url', value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">투표를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🗳️ 투표게시판</h1>
            <p className="text-gray-600">다양한 주제로 투표하고 의견을 나눠보세요!</p>
          </div>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              투표 만들기
            </Button>
          )}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* 투표 목록 */}
        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">투표가 없습니다</h3>
              <p className="text-gray-600 mb-4">첫 번째 투표를 만들어보세요!</p>
              {user && (
                <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-500 hover:bg-blue-600">
                  투표 만들기
                </Button>
              )}
            </div>
          ) : (
            polls.map(poll => (
              <div key={poll.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                {/* 투표 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {categories.find(cat => cat.value === poll.category)?.label || poll.category}
                      </span>
                      {isExpired(poll.expires_at) && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          마감됨
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-gray-600 mb-3">{poll.description}</p>
                    )}
                  </div>
                </div>

                {/* 투표 통계 */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{poll.total_votes}명 참여</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(poll.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{poll.poll_comments.length}개 댓글</span>
                  </div>
                </div>

                {/* 투표 선택지 */}
                <div className="space-y-2 mb-4">
                  {poll.poll_options.map(option => {
                    const percentage = poll.total_votes > 0 ? (option.vote_count / poll.total_votes) * 100 : 0
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={isExpired(poll.expires_at)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          isExpired(poll.expires_at)
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{option.option_text}</span>
                          <span className="text-sm text-gray-500">
                            {option.vote_count}표 ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        {poll.total_votes > 0 && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* 투표 상세 보기 버튼 */}
                <Button
                  variant="outline"
                  onClick={() => setSelectedPoll(poll)}
                  className="w-full"
                >
                  투표 상세 보기
                </Button>
              </div>
            ))
          )}
        </div>

        {/* 투표 생성 다이얼로그 */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 투표 만들기</DialogTitle>
              <DialogDescription>
                재미있는 투표를 만들어서 다른 사용자들과 의견을 나눠보세요!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium mb-2">투표 제목 *</label>
                <Input
                  value={newPoll.title}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="투표 제목을 입력하세요"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium mb-2">설명 (선택사항)</label>
                <Textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="투표에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <select
                  value={newPoll.category}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.filter(cat => cat.value !== 'all').map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 선택지 */}
              <div>
                <label className="block text-sm font-medium mb-2">선택지 *</label>
                <div className="space-y-2">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder={`선택지 ${index + 1}`}
                        className="flex-1"
                      />
                      {newPoll.options.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    선택지 추가
                  </Button>
                </div>
              </div>

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-medium mb-2">마감일 (선택사항)</label>
                <Input
                  type="datetime-local"
                  value={newPoll.expires_at}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleCreatePoll}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  투표 만들기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
