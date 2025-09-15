'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Users, Clock, AlertCircle } from 'lucide-react'
import ChatRulesModal from './ChatRulesModal'
import { useLanguage } from '@/context/LanguageContext'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: Date
  isFromMentor: boolean
}

interface Mentor {
  id: string
  name: string
  status: 'online' | 'busy' | 'offline'
  avatar?: string
}

interface ChatRoomProps {
  mentorId?: string
  onClose?: () => void
}

export default function ChatRoom({ mentorId, onClose }: ChatRoomProps) {
  const { t } = useLanguage()
  const [showRulesModal, setShowRulesModal] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [isChatActive, setIsChatActive] = useState(false)

  // 멘토 정보 로드
  useEffect(() => {
    const fetchMentorStatus = async () => {
      if (!mentorId) return

      try {
        const response = await fetch(`/api/mentors/status?mentorId=${mentorId}`)
        const data = await response.json()

        if (data.success && data.mentor) {
          setMentor({
            id: data.mentor.mentor_id,
            name: data.mentor.mentors?.name || '멘토',
            status: data.mentor.status,
            avatar: data.mentor.mentors?.avatar_url
          })
        } else {
          // API 실패 시 기본값 사용
          setMentor({
            id: mentorId,
            name: '김멘토',
            status: 'online'
          })
        }
      } catch (error) {
        console.error('멘토 상태 조회 실패:', error)
        // 에러 시 기본값 사용
        setMentor({
          id: mentorId,
          name: '김멘토',
          status: 'online'
        })
      }
    }

    fetchMentorStatus()
  }, [mentorId])

  // 채팅 규칙 동의 후 채팅 활성화
  const handleAgreeToRules = () => {
    setShowRulesModal(false)
    setIsChatActive(true)
    
    // 채팅방 입장 알림 메시지 추가
    const welcomeMessage: Message = {
      id: 'welcome',
      content: 'Amiko 채팅방에 오신 것을 환영합니다! 안전하고 즐거운 대화를 나누세요.',
      sender: 'Amiko',
      timestamp: new Date(),
      isFromMentor: false
    }
    setMessages([welcomeMessage])
  }

  // 메시지 전송
  const handleSendMessage = () => {
    if (!newMessage.trim() || !isChatActive) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: '나',
      timestamp: new Date(),
      isFromMentor: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // 멘토 응답 시뮬레이션 (실제로는 WebSocket 등으로 처리)
    setTimeout(() => {
      const mentorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: '안녕하세요! 무엇을 도와드릴까요?',
        sender: mentor?.name || '멘토',
        timestamp: new Date(),
        isFromMentor: true
      }
      setMessages(prev => [...prev, mentorResponse])
    }, 1000)
  }

  // 멘토 상태에 따른 안내 메시지
  const getMentorStatusMessage = () => {
    if (!mentor) return null

    switch (mentor.status) {
      case 'offline':
        return {
          icon: <Clock className="w-4 h-4" />,
          message: '현재 오프라인입니다. 접속 시 알림을 받습니다.',
          color: 'text-gray-600 bg-gray-100'
        }
      case 'busy':
        return {
          icon: <Users className="w-4 h-4" />,
          message: '현재 다른 상담 중입니다. 잠시 후 다시 시도해주세요.',
          color: 'text-orange-600 bg-orange-100'
        }
      case 'online':
        return {
          icon: <Users className="w-4 h-4" />,
          message: '온라인 상태입니다.',
          color: 'text-green-600 bg-green-100'
        }
      default:
        return null
    }
  }

  const statusInfo = getMentorStatusMessage()

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg shadow-lg">
      {/* 채팅 규칙 모달 */}
      <ChatRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        onAgree={handleAgreeToRules}
      />

      {/* 채팅 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {mentor?.name?.charAt(0) || 'M'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{mentor?.name || '멘토'}</h3>
              {statusInfo && (
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                  {statusInfo.icon}
                  <span>{statusInfo.message}</span>
                </div>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* 번호 교환 금지 배너 */}
      <div className="bg-red-50 border-b border-red-200 p-3">
        <div className="flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">번호 교환은 불가합니다 🙏 Amiko 안에서만 대화하세요.</span>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromMentor ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.isFromMentor
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.isFromMentor ? 'text-gray-500' : 'text-blue-100'
              }`}>
                {message.timestamp.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isChatActive ? "메시지를 입력하세요..." : "채팅 규칙에 동의한 후 사용 가능합니다"}
            disabled={!isChatActive}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isChatActive || !newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
