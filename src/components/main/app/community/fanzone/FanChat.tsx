'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Users, Wifi, WifiOff, Loader2 } from 'lucide-react'

interface FanChatProps {
  fanroom: any
}

/**
 * FanChat - Chat en tiempo real del FanRoom con datos mock
 */
export default function FanChat({ fanroom }: FanChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // Datos mock de mensajes
  const mockMessages = [
    {
      id: '1',
      message: '¡Hola ARMY! 🥺💜',
      user: {
        id: 'user-1',
        name: 'María González',
        avatar: null
      },
      createdAt: '2024-01-20T15:30:00Z'
    },
    {
      id: '2',
      message: '¿Alguien más está emocionado por el comeback?',
      user: {
        id: 'user-2',
        name: 'Ana Rodríguez',
        avatar: null
      },
      createdAt: '2024-01-20T15:32:00Z'
    },
    {
      id: '3',
      message: '¡SÍ! No puedo esperar más 🎵',
      user: {
        id: 'user-3',
        name: 'Carlos Méndez',
        avatar: null
      },
      createdAt: '2024-01-20T15:33:00Z'
    },
    {
      id: '4',
      message: 'El concierto en México fue increíble ✨',
      user: {
        id: 'user-4',
        name: 'Sofia López',
        avatar: null
      },
      createdAt: '2024-01-20T15:35:00Z'
    },
    {
      id: '5',
      message: '¡Qué suerte! Yo no pude ir 😭',
      user: {
        id: 'user-5',
        name: 'Laura García',
        avatar: null
      },
      createdAt: '2024-01-20T15:36:00Z'
    }
  ]

  /**
   * Maneja envío de mensaje
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setNewMessage('')
      
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  /**
   * Maneja tecla Enter
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  /**
   * Formatea hora del mensaje
   */
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  /**
   * Renderiza un mensaje individual
   */
  const renderMessage = (message: any, index: number) => {
    const previousMessage = index > 0 ? mockMessages[index - 1] : undefined
    const showDate = previousMessage ? 
      new Date(message.createdAt).toDateString() !== new Date(previousMessage.createdAt).toDateString() : 
      true
    const isOwnMessage = message.user.id === 'current-user-id' // TODO: Obtener ID del usuario actual

    return (
      <div key={message.id} className="space-y-2">
        {/* Separador de fecha */}
        {showDate && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              {new Date(message.createdAt).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Badge>
          </div>
        )}

        {/* Mensaje */}
        <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
            {message.user.avatar ? (
              <img
                src={message.user.avatar}
                alt={message.user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-xs">
                {message.user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Contenido del mensaje */}
          <div className={`flex-1 max-w-xs md:max-w-md ${isOwnMessage ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-2xl ${
              isOwnMessage 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
            
            <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
              isOwnMessage ? 'justify-end' : 'justify-start'
            }`}>
              <span>{message.user.name}</span>
              <span>•</span>
              <span>{formatMessageTime(message.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-96 flex flex-col">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{fanroom.activeMembers} en línea</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map((message, index) => renderMessage(message, index))}
        
        {/* Indicador de escritura */}
        {typingUsers.size > 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Array.from(typingUsers).join(', ')} está escribiendo...
              </span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input de mensaje */}
      {fanroom.isMember ? (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Únete al FanRoom para participar en el chat
          </p>
        </div>
      )}
    </div>
  )
}
