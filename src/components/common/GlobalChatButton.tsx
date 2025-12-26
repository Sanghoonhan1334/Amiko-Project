'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import ChatRoomClient from '@/components/main/app/community/ChatRoomClient'

interface ChatRoom {
  id: string
  name: string
  type: 'country' | 'fanclub'
  description?: string
  participant_count: number
  max_participants: number
  thumbnail_url?: string
  created_at: string
}

export default function GlobalChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [amikoRoom, setAmikoRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { t, language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  // 아미코 채팅방 ID 가져오기
  useEffect(() => {
    // 인증센터 페이지에서는 채팅방 정보 가져오지 않음
    if (pathname?.startsWith('/verification')) {
      return
    }
    const fetchAmikoRoom = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const response = await fetch('/api/chat/rooms')
        const data = await response.json()
        
        if (data.success && data.rooms) {
          // country 타입 중 "아미코 채팅방" 찾기
          let amikoRoomData = data.rooms.find((room: any) => 
            room.type === 'country' && (
              room.name?.toLowerCase().includes('amiko') || 
              room.name?.toLowerCase().includes('아미코')
            )
          )
          
          // 아미코 채팅방이 없으면 생성 또는 복구
          if (!amikoRoomData) {
            const createResponse = await fetch('/api/chat/rooms/create-amiko', {
              method: 'POST'
            })
            const createData = await createResponse.json()
            
            if (createData.success && createData.room) {
              amikoRoomData = createData.room
            }
          }
          
          if (amikoRoomData) {
            setAmikoRoom(amikoRoomData)
          }
        }
      } catch (error) {
        console.error('아미코 채팅방 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && user) {
      fetchAmikoRoom()
    }
  }, [isOpen, user])

  const handleToggle = () => {
    // 인증 체크 강화
    if (authLoading) return // 로딩 중일 때는 대기
    if (!user) {
      router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    if (isOpen) {
      // 닫기 애니메이션
      setIsClosing(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 300) // 애니메이션 시간과 동일
    } else {
      // 열기 애니메이션
      setIsOpen(true)
      setIsOpening(true)
      setTimeout(() => {
        setIsOpening(false)
      }, 300)
    }
  }
  
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 300)
  }

  // 인증센터 페이지에서는 플로팅 버튼 숨김
  if (pathname?.startsWith('/verification')) {
    return null
  }

  if (!user) {
    return null // 인증되지 않은 사용자에게는 플로팅 버튼 숨김
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={handleToggle}
        className="fixed bottom-20 sm:bottom-8 md:bottom-20 right-2 sm:right-8 md:right-16 z-50 w-11 h-11 sm:w-14 sm:h-14 md:w-14 md:h-14 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        aria-label={language === 'ko' ? '전체 채팅 열기' : 'Abrir chat global'}
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6 transition-transform" />
        ) : (
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
        )}
        {/* 알림 뱃지 (선택사항) */}
        {/* <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
          3
        </span> */}
      </button>

      {/* 채팅 모달/사이드바 - 인증된 사용자만 */}
      {(isOpen || isClosing || isOpening) && user && (
        <div className={`fixed top-16 bottom-0 right-0 left-0 sm:left-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-96 z-[60] bg-white shadow-2xl flex flex-col rounded-t-xl sm:rounded-l-2xl sm:rounded-r-none sm:rounded-t-none overflow-hidden ${
          isClosing 
            ? 'animate-[slideDownMobile_0.3s_ease-out_forwards] sm:animate-[slideOutRight_0.3s_ease-out_forwards]'
            : isOpening
            ? 'animate-[slideUpMobile_0.3s_ease-out] sm:animate-[slideInRight_0.3s_ease-out]'
            : ''
        }`}>
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-2 sm:p-4 flex items-center justify-between rounded-t-xl sm:rounded-tl-2xl">
              <div>
                <h2 className="font-semibold text-sm sm:text-lg">{language === 'ko' ? '전체 채팅' : 'Chat Global'}</h2>
                <p className="text-xs sm:text-sm opacity-90">Amiko Chat</p>
              </div>
              <button
                onClick={handleClose}
                className="p-0 hover:opacity-80 transition-opacity flex items-center justify-center"
                aria-label={language === 'ko' ? '닫기' : 'Cerrar'}
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white font-bold stroke-[3]" />
              </button>
            </div>

            {/* 채팅 내용 */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {!user ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-600 text-xs sm:text-sm mb-4">{language === 'ko' ? '로그인이 필요합니다.' : 'Inicio de sesión requerido.'}</p>
                    <button
                      onClick={() => router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname))}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                    >
                      {language === 'ko' ? '로그인하기' : 'Iniciar sesión'}
                    </button>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-pink-500 mx-auto mb-2 sm:mb-4" />
                    <p className="text-gray-600 text-xs sm:text-sm">{language === 'ko' ? '채팅방 로딩 중...' : 'Cargando chat...'}</p>
                  </div>
                </div>
              ) : amikoRoom ? (
                <div className="mobile-chat-small flex-1 flex flex-col min-h-0">
                  <ChatRoomClient roomId={amikoRoom.id} hideHeader={true} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600 text-xs sm:text-sm">{language === 'ko' ? '채팅방을 찾을 수 없습니다.' : 'No se encontró la sala de chat.'}</p>
                </div>
              )}
            </div>
          </div>
      )}
    </>
  )
}

