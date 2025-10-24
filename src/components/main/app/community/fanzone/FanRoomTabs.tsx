'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Image, Users, FileText, Plus } from 'lucide-react'
import FanPostList from './FanPostList'
import FanMediaGrid from './FanMediaGrid'
import FanChat from './FanChat'

interface FanRoomTabsProps {
  fanroom: any
  activeTab: string
  onTabChange: (tab: string) => void
}

/**
 * FanRoomTabs - Sistema de tabs para FanRoom
 * Incluye: Posts, Media, Chat, Miembros
 */
export default function FanRoomTabs({ 
  fanroom, 
  activeTab, 
  onTabChange 
}: FanRoomTabsProps) {
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Configuración de tabs
  const tabs = [
    {
      id: 'posts',
      label: 'Posts',
      icon: FileText,
      count: 0, // 실제 데이터로 업데이트 예정
      disabled: false
    },
    {
      id: 'media',
      label: 'Media',
      icon: Image,
      count: 0, // 실제 데이터로 업데이트 예정
      disabled: false
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      count: 0, // 실제 데이터로 업데이트 예정
      disabled: fanroom.visibility === 'private' && !fanroom.isMember
    },
    {
      id: 'members',
      label: 'Miembros',
      icon: Users,
      count: fanroom.member_count || fanroom.memberCount || 0,
      disabled: false
    }
  ]

  /**
   * Renderiza el contenido del tab activo
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <FanPostList
            fanroom={fanroom}
            onCreatePost={() => setShowCreatePost(true)}
          />
        )
      case 'media':
        return (
          <FanMediaGrid fanroom={fanroom} />
        )
      case 'chat':
        return (
          <FanChat fanroom={fanroom} />
        )
      case 'members':
        return (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Lista de Miembros
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Aquí aparecerán todos los miembros del FanRoom
            </p>
          </div>
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
          role="tablist"
          aria-label="Secciones del FanRoom"
          className="flex items-center gap-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <Button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                aria-disabled={tab.disabled}
                id={`tab-${tab.id}`}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => !tab.disabled && onTabChange(tab.id)}
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
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="min-h-[400px]"
      >
        {renderTabContent()}
      </div>

      {/* FAB para crear contenido */}
      {activeTab === 'posts' && fanroom.isMember && (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
          <Button
            size="lg"
            onClick={() => setShowCreatePost(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      {/* Modal de creación de post */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Crear post</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatePost(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ¿Qué quieres compartir?
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                    rows={4}
                    placeholder="Comparte algo con tu comunidad..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fotos y videos (opcional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                    Cancelar
                  </Button>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
