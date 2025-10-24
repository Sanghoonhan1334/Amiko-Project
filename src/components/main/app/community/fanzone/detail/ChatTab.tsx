'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Users, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { FanroomWithDetails, FanroomChatWithUser } from '@/types/fanzone'
import fanzoneEs from '@/i18n/community/es'

interface ChatTabProps {
  fanroom: FanroomWithDetails
  messages: FanroomChatWithUser[]
  loading: boolean
  onLoadMore?: () => void
}

/**
 * ChatTab - Tab de chat en tiempo real del FanRoom
 * Implementa Supabase Realtime para mensajes en vivo
 */
export default function ChatTab({ 
  fanroom, 
  messages, 
  loading, 
  onLoadMore 
}: ChatTabProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Scroll automático a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Manejar conexión/desconexión
  useEffect(() => {
    // TODO: Implementar Supabase Realtime
    // const channel = supabase
    //   .channel(`fanzone_chat_${fanroom.id}`)
    //   .on('presence', { event: 'sync' }, () => {
    //     // Manejar usuarios en línea
    //   })
    //   .on('broadcast', { event: 'typing' }, (payload) => {
    //     // Manejar indicador de escritura
    //   })
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'fanroom_chat',
    //     filter: `fanroom_id=eq.${fanroom.id}`
    //   }, (payload) => {
    //     // Manejar nuevos mensajes
    //   })
    //   .subscribe()

    // return () => {
    //   supabase.removeChannel(channel)
    // }
  }, [fanroom.id])

  /**
   * Maneja envío de mensaje
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      
      const response = await fetch(`/api/fanzone/fanrooms/${fanroom.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Error al enviar mensaje')
      }

      setNewMessage('')
      
      // Detener indicador de escritura
      setIsTyping(false)
      
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  /**
   * Maneja cambio en el input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    // Indicador de escritura
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      // TODO: Enviar evento de typing a través de Supabase Realtime
    }

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Detener indicador después de 3 segundos sin escribir
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 3000)
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
   * Determina si mostrar fecha entre mensajes
   */
  const shouldShowDate = (currentMessage: FanroomChatWithUser, previousMessage?: FanroomChatWithUser) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.created_at).toDateString()
    const previousDate = new Date(previousMessage.created_at).toDateString()
    
    return currentDate !== previousDate
  }

  /**
   * Renderiza un mensaje individual
   */
  const renderMessage = (message: FanroomChatWithUser, index: number) => {
    const previousMessage = index > 0 ? messages[index - 1] : undefined
    const showDate = shouldShowDate(message, previousMessage)
    const isOwnMessage = message.user_id === 'current-user-id' // TODO: Obtener ID del usuario actual

    return (
      <div key={message.id} className="space-y-2">
        {/* Separador de fecha */}
        {showDate && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              {new Date(message.created_at).toLocaleDateString('es-MX', {
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
            {message.user?.user_metadata?.avatar_url ? (
              <img
                src={message.user.user_metadata.avatar_url}
                alt={message.user.user_metadata.full_name || 'Usuario'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-xs">
                {(message.user?.user_metadata?.full_name || message.user?.email || 'U').charAt(0).toUpperCase()}
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
              <span>{message.user?.user_metadata?.full_name || message.user?.email || 'Usuario'}</span>
              <span>•</span>
              <span>{formatMessageTime(message.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-96 flex flex-col">
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="h-96 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {fanzoneEs.chat.noMessages}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {fanzoneEs.chat.noMessagesDesc}
              </p>
            </div>
          </Card>
        </div>

        {/* Input de mensaje */}
        {fanroom.is_member && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={fanzoneEs.chat.placeholder}
                value={newMessage}
                onChange={handleInputChange}
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
        )}
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
            {isConnected ? fanzoneEs.chat.connected : fanzoneEs.chat.disconnected}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{fanroom.active_members} en línea</span>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => renderMessage(message, index))}
        
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      {fanroom.is_member ? (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={fanzoneEs.chat.placeholder}
              value={newMessage}
              onChange={handleInputChange}
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
