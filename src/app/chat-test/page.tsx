'use client'

import { useState, useEffect } from 'react'
import ChatRoom from '@/components/chat/ChatRoom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, Clock } from 'lucide-react'

interface Mentor {
  id: string
  name: string
  status: 'online' | 'busy' | 'offline'
  email?: string
  is_korean?: boolean
  specialties?: string[]
}

export default function ChatTestPage() {
  const [showChatRoom, setShowChatRoom] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)

  // 멘토 목록 조회
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/mentors/status')
        const data = await response.json()

        if (data.success && data.mentors) {
          const mentorList = data.mentors.map((mentor: any) => ({
            id: mentor.mentor_id,
            name: mentor.mentors?.name || '멘토',
            status: mentor.status,
            email: mentor.mentors?.email,
            is_korean: mentor.mentors?.is_korean,
            specialties: mentor.mentors?.specialties
          }))
          setMentors(mentorList)
        } else {
          // API 실패 시 기본 데이터 사용
          setMentors([
            { id: '550e8400-e29b-41d4-a716-446655440001', name: '김멘토', status: 'online' },
            { id: '550e8400-e29b-41d4-a716-446655440002', name: '이멘토', status: 'busy' },
            { id: '550e8400-e29b-41d4-a716-446655440003', name: '박멘토', status: 'offline' }
          ])
        }
      } catch (error) {
        console.error('멘토 목록 조회 실패:', error)
        // 에러 시 기본 데이터 사용
        setMentors([
          { id: '550e8400-e29b-41d4-a716-446655440001', name: '김멘토', status: 'online' },
          { id: '550e8400-e29b-41d4-a716-446655440002', name: '이멘토', status: 'busy' },
          { id: '550e8400-e29b-41d4-a716-446655440003', name: '박멘토', status: 'offline' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchMentors()
  }, [])

  const handleStartChat = (mentorId: string) => {
    setSelectedMentor(mentorId)
    setShowChatRoom(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100'
      case 'busy':
        return 'text-orange-600 bg-orange-100'
      case 'offline':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Users className="w-4 h-4" />
      case 'busy':
        return <Clock className="w-4 h-4" />
      case 'offline':
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">채팅 테스트</h1>
          <p className="text-gray-600">Amiko 채팅 규칙 모달과 채팅방을 테스트해보세요.</p>
        </div>

        {!showChatRoom ? (
          <div className="space-y-6">
            {/* 멘토 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  멘토 목록
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">멘토 목록을 불러오는 중...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {mentor.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{mentor.name}</h3>
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(mentor.status)}`}>
                            {getStatusIcon(mentor.status)}
                            <span>
                              {mentor.status === 'online' && '온라인'}
                              {mentor.status === 'busy' && '다른 상담 중'}
                              {mentor.status === 'offline' && '오프라인'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartChat(mentor.id)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={mentor.status === 'offline'}
                      >
                        채팅 시작
                      </Button>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 기능 설명 */}
            <Card>
              <CardHeader>
                <CardTitle>테스트 기능</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1">📌 채팅 규칙 모달</h4>
                    <p className="text-sm text-blue-700">
                      채팅 시작 시 Amiko 채팅 규칙 안내 모달이 표시됩니다. 동의 체크박스를 체크해야 채팅방에 입장할 수 있습니다.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">🚫 번호 교환 금지 배너</h4>
                    <p className="text-sm text-green-700">
                      채팅방 상단에 번호 교환 금지 안내 배너가 항상 표시됩니다.
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-1">👥 멘토 상태 표시</h4>
                    <p className="text-sm text-orange-700">
                      멘토의 상태(온라인/다른 상담 중/오프라인)에 따라 자동으로 안내 메시지가 표시됩니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChatRoom(false)
                  setSelectedMentor(null)
                }}
              >
                ← 목록으로 돌아가기
              </Button>
            </div>
            <ChatRoom mentorId={selectedMentor || undefined} />
          </div>
        )}
      </div>
    </div>
  )
}
