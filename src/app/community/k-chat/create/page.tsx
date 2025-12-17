'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function CreateChatRoomPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fanclub_name: ''
  })

  // 로그인 체크
  if (!user) {
    router.push('/sign-in')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert(t('community.chatRoomNameRequired') || '채팅방 이름을 입력해주세요.')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: 'fanclub',
          fanclub_name: formData.fanclub_name.trim() || formData.name.trim(),
          description: formData.description.trim() || '',
          created_by: user.id
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(t('community.chatRoomCreated') || '채팅방이 생성되었습니다!')
        router.push('/community/k-chat')
      } else {
        alert(data.error || t('community.chatRoomCreateFailed') || '채팅방 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error)
      alert(t('community.chatRoomCreateError') || '채팅방 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t('community.back') || '뒤로'}</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('community.chatRoomCreate') || '채팅방 만들기'}
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('community.chatRoomName') || '채팅방 이름'} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('community.chatRoomNamePlaceholder') || '예: K-POP 토론방'}
              maxLength={50}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/50
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('community.chatRoomDescription') || '설명'}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('community.chatRoomDescriptionPlaceholder') || '채팅방에 대한 간단한 설명을 입력하세요'}
              rows={4}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={creating}
              className="flex-1"
            >
              {t('community.chatRoomCancel') || '취소'}
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.name.trim()}
              className="flex-1"
            >
              {creating 
                ? (t('community.chatRoomCreating') || '생성 중...') 
                : (t('community.chatRoomCreate') || '만들기')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}








