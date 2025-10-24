'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Image, Users, FileText, Plus } from 'lucide-react'
import { FanroomWithDetails, FanroomTabState } from '@/types/fanzone'
import PostsTab from './PostsTab'
import MediaTab from './MediaTab'
import ChatTab from './ChatTab'
import MembersTab from './MembersTab'
import CreatePostModal from './CreatePostModal'
import fanzoneEs from '@/i18n/community/es'

interface FanzoneDetailTabsProps {
  fanroom: FanroomWithDetails
  tabState: FanroomTabState
  onTabChange: (tab: 'posts' | 'media' | 'chat' | 'members') => void
  onLoadMore?: (tab: 'posts' | 'media' | 'chat' | 'members') => void
}

/**
 * FanzoneDetailTabs - Sistema de tabs accesible para FanRoom
 * Implementa roving tabindex y aria-selected para accesibilidad
 */
export default function FanzoneDetailTabs({ 
  fanroom, 
  tabState, 
  onTabChange,
  onLoadMore 
}: FanzoneDetailTabsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const tabListRef = useRef<HTMLDivElement>(null)

  // Configuración de tabs
  const tabs = [
    {
      id: 'posts' as const,
      label: fanzoneEs.detail.tabs.posts,
      icon: FileText,
      count: tabState.posts.length,
      disabled: false
    },
    {
      id: 'media' as const,
      label: fanzoneEs.detail.tabs.media,
      icon: Image,
      count: tabState.media.length,
      disabled: false
    },
    {
      id: 'chat' as const,
      label: fanzoneEs.detail.tabs.chat,
      icon: MessageSquare,
      count: tabState.chatMessages.length,
      disabled: fanroom.visibility === 'private' && !fanroom.is_member
    },
    {
      id: 'members' as const,
      label: fanzoneEs.detail.tabs.members,
      icon: Users,
      count: fanroom.member_count,
      disabled: false
    }
  ]

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tabListRef.current?.contains(document.activeElement)) return

      const currentIndex = tabs.findIndex(tab => tab.id === tabState.activeTab)
      let nextIndex = currentIndex

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
          break
        case 'ArrowRight':
          e.preventDefault()
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
          break
        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break
        case 'End':
          e.preventDefault()
          nextIndex = tabs.length - 1
          break
        default:
          return
      }

      // Encontrar el siguiente tab habilitado
      while (tabs[nextIndex].disabled && nextIndex !== currentIndex) {
        nextIndex = e.key === 'ArrowLeft' ? 
          (nextIndex > 0 ? nextIndex - 1 : tabs.length - 1) :
          (nextIndex < tabs.length - 1 ? nextIndex + 1 : 0)
      }

      if (!tabs[nextIndex].disabled) {
        onTabChange(tabs[nextIndex].id)
        tabRefs.current[nextIndex]?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [tabState.activeTab, onTabChange])

  /**
   * Maneja click en tab
   */
  const handleTabClick = (tabId: 'posts' | 'media' | 'chat' | 'members') => {
    onTabChange(tabId)
  }

  /**
   * Renderiza el contenido del tab activo
   */
  const renderTabContent = () => {
    switch (tabState.activeTab) {
      case 'posts':
        return (
          <PostsTab
            fanroom={fanroom}
            posts={tabState.posts}
            loading={tabState.loading.posts}
            onCreatePost={() => setShowCreateModal(true)}
            onLoadMore={() => onLoadMore?.('posts')}
          />
        )
      case 'media':
        return (
          <MediaTab
            fanroom={fanroom}
            media={tabState.media}
            loading={tabState.loading.media}
            onLoadMore={() => onLoadMore?.('media')}
          />
        )
      case 'chat':
        return (
          <ChatTab
            fanroom={fanroom}
            messages={tabState.chatMessages}
            loading={tabState.loading.chat}
            onLoadMore={() => onLoadMore?.('chat')}
          />
        )
      case 'members':
        return (
          <MembersTab
            fanroom={fanroom}
            members={tabState.members}
            loading={tabState.loading.members}
            onLoadMore={() => onLoadMore?.('members')}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <Card className="p-1">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Secciones del FanRoom"
          className="flex items-center gap-1"
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = tabState.activeTab === tab.id
            
            return (
              <Button
                key={tab.id}
                ref={(el) => (tabRefs.current[index] = el)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                aria-disabled={tab.disabled}
                id={`tab-${tab.id}`}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => !tab.disabled && handleTabClick(tab.id)}
                disabled={tab.disabled}
                className={`flex-1 justify-start gap-2 px-3 py-2 ${
                  isActive 
                    ? 'bg-purple-500 text-white hover:bg-purple-600' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                } ${
                  tab.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
                tabIndex={isActive ? 0 : -1}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-auto text-xs ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${tabState.activeTab}`}
        aria-labelledby={`tab-${tabState.activeTab}`}
        className="min-h-[400px]"
      >
        {renderTabContent()}
      </div>

      {/* FAB para crear contenido */}
      {tabState.activeTab === 'posts' && fanroom.is_member && (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
          <Button
            size="lg"
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      {/* Modal de creación de post */}
      {showCreateModal && (
        <CreatePostModal
          fanroom={fanroom}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={(post) => {
            // Actualizar estado local
            setShowCreateModal(false)
            // TODO: Actualizar lista de posts
            console.log('Post created:', post)
          }}
        />
      )}
    </div>
  )
}
