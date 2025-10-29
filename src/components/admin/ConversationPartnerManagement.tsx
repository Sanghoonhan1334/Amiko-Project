'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Edit, Check, X } from 'lucide-react'

export default function ConversationPartnerManagement() {
  const [partners, setPartners] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    language_level: '',
    country: '',
    status: 'online',
    interests: '',
    bio: '',
    avatar_url: '',
    meet_url: '' // Google Meet 링크
  })

  // 파트너 목록 조회
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/conversation-partners')
      if (response.ok) {
        const data = await response.json()
        setPartners(data.partners || [])
      }
    } catch (error) {
      console.error('파트너 조회 실패:', error)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  // 파트너 추가
  const handleAdd = async () => {
    try {
      const interests = formData.interests.split(',').map(i => i.trim()).filter(Boolean)
      
      const response = await fetch('/api/admin/conversation-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          interests
        })
      })

      if (response.ok) {
        await fetchPartners()
        resetForm()
      }
    } catch (error) {
      console.error('파트너 추가 실패:', error)
      alert('파트너 추가에 실패했습니다.')
    }
  }

  // 파트너 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/conversation-partners/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPartners()
      }
    } catch (error) {
      console.error('파트너 삭제 실패:', error)
      alert('파트너 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      language_level: '',
      country: '',
      status: 'online',
      interests: '',
      bio: '',
      avatar_url: '',
      meet_url: ''
    })
    setIsAdding(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">화상 채팅 파트너 관리</h3>
          <p className="text-sm text-gray-600">대화상대를 등록하고 관리합니다.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          파트너 추가
        </Button>
      </div>

      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? '파트너 수정' : '파트너 추가'}</CardTitle>
            <CardDescription>화상 채팅 파트너 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>이름</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="김민수"
                />
              </div>
              <div>
                <Label>국가</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="대한민국"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>언어 수준</Label>
                <Select
                  value={formData.language_level}
                  onValueChange={(value) => setFormData({ ...formData, language_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초급">초급</SelectItem>
                    <SelectItem value="중급">중급</SelectItem>
                    <SelectItem value="고급">고급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">온라인</SelectItem>
                    <SelectItem value="offline">오프라인</SelectItem>
                    <SelectItem value="busy">바쁨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>관심사 (쉼표로 구분)</Label>
              <Input
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="영화, 음악, 여행"
              />
            </div>

            <div>
              <Label>자기소개</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="안녕하세요! 한국어를 가르치고 싶은 김민수입니다..."
                rows={3}
              />
            </div>

            <div>
              <Label>프로필 이미지 URL (선택사항)</Label>
              <Input
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="/quizzes/mbti-with-kpop-stars/celebs/jin.webp"
              />
            </div>

            <div>
              <Label>Google Meet 링크 (선택사항, MVP 테스트용)</Label>
              <Input
                value={formData.meet_url}
                onChange={(e) => setFormData({ ...formData, meet_url: e.target.value })}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleAdd}>
                <Check className="w-4 h-4 mr-2" />
                저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 파트너 목록 */}
      <div className="space-y-3">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {partner.avatar_url ? (
                    <img
                      src={partner.avatar_url}
                      alt={partner.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {partner.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold">{partner.name}</h4>
                    <p className="text-sm text-gray-600">
                      {partner.country} · {partner.language_level}
                    </p>
                    <p className="text-sm text-gray-500">{partner.bio}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    partner.status === 'online' ? 'bg-green-100 text-green-700' :
                    partner.status === 'offline' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {partner.status === 'online' ? '온라인' :
                     partner.status === 'offline' ? '오프라인' : '바쁨'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(partner.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

