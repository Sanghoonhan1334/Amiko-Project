'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useAuth } from '@/context/AuthContext'
import { GripVertical } from 'lucide-react'

interface Gallery {
  id: string
  slug: string
  name_ko: string
  name_es?: string
  description_ko: string
  description_es?: string
  icon: string
  color: string
  post_count: number
  comment_count: number
  is_active: boolean
  sort_order: number
}

interface GalleryListProps {
  onGallerySelect: (gallery: Gallery) => void
  onPopularPosts?: () => void
}

export default function GalleryList({ onGallerySelect, onPopularPosts }: GalleryListProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadGalleries()
  }, [])

  const loadGalleries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/galleries')
      
      if (!response.ok) {
        throw new Error('갤러리를 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setGalleries(data.galleries || [])
    } catch (err) {
      console.error('갤러리 로드 오류:', err)
      setError(err instanceof Error ? err.message : t('community.galleryList.errors.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  const getGalleryName = (gallery: Gallery) => {
    return language === 'ko' ? gallery.name_ko : (gallery.name_es || gallery.name_ko)
  }

  const getGalleryDescription = (gallery: Gallery) => {
    return language === 'ko' ? gallery.description_ko : (gallery.description_es || gallery.description_ko)
  }

  // 드래그 완료 핸들러
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    
    const items = Array.from(galleries.filter(g => g.is_active))
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    // sort_order 업데이트
    const updatedGalleries = items.map((gallery, index) => ({
      ...gallery,
      sort_order: index
    }))
    
    // 즉시 UI 업데이트
    setGalleries(updatedGalleries)
    
    // DB에 저장
    try {
      setIsSaving(true)
      const response = await fetch('/api/galleries/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          galleries: updatedGalleries.map(g => ({
            id: g.id,
            sort_order: g.sort_order
          }))
        })
      })
      
      if (!response.ok) {
        throw new Error('순서 저장에 실패했습니다')
      }
      
      console.log('✅ 갤러리 순서가 저장되었습니다')
    } catch (err) {
      console.error('순서 저장 오류:', err)
      // 실패 시 다시 로드
      loadGalleries()
      alert('순서 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('buttons.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadGalleries}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  const activeGalleries = galleries
    .filter(gallery => gallery.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      {/* 헤더 - 모바일에서 숨김 */}
      <div className="text-center hidden md:block">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {t('community.galleryList.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('community.galleryList.subtitle')}
        </p>
        
        {/* 인기글 버튼 */}
        {onPopularPosts && (
          <div className="flex justify-center">
            <button
              onClick={onPopularPosts}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔥 {t('community.galleryList.popularPosts')}
            </button>
          </div>
        )}
      </div>

      {/* 순서 변경 안내 */}
      {user?.is_admin && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🎯 관리자님, 갤러리를 드래그하여 순서를 변경할 수 있습니다! {isSaving && '(저장 중...)'}
          </p>
        </div>
      )}

      {/* 갤러리 그리드 - 드래그 앤 드롭 지원 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="galleries" direction="horizontal" isDropDisabled={!user?.is_admin}>
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {activeGalleries.map((gallery, index) => (
                <Draggable 
                  key={gallery.id} 
                  draggableId={gallery.id} 
                  index={index}
                  isDragDisabled={!user?.is_admin}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                      }}
                    >
                      <Card 
                        className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-gray-600 dark:border-gray-400 dark:border-gray-600 dark:hover:border-gray-600 dark:border-gray-400 bg-white dark:bg-gray-800 group ${
                          snapshot.isDragging ? 'shadow-2xl ring-2 ring-purple-500' : ''
                        }`}
                        onClick={() => !snapshot.isDragging && onGallerySelect(gallery)}
                      >
                        <div className="p-6 relative">
                          {/* 드래그 핸들 (관리자만 표시) */}
                          {user?.is_admin && (
                            <div 
                              {...provided.dragHandleProps}
                              className="absolute top-2 right-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 cursor-grab active:cursor-grabbing rounded-lg p-2 shadow-md z-10"
                              onClick={(e) => e.stopPropagation()}
                              title="드래그하여 순서 변경"
                            >
                              <GripVertical className="w-6 h-6" />
                            </div>
                          )}

                          {/* 갤러리 아이콘과 색상 */}
                          <div 
                            className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl flex items-center justify-center text-3xl md:text-4xl lg:text-5xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-200"
                            style={{ backgroundColor: gallery.color + '20' }}
                          >
                            {gallery.icon || '📁'}
                          </div>

                          {/* 갤러리 이름 */}
                          <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
                            {getGalleryName(gallery)}
                          </h3>

                          {/* 갤러리 설명 */}
                          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-4 text-center line-clamp-2">
                            {getGalleryDescription(gallery)}
                          </p>

                          {/* 통계 정보 */}
                          <div className="flex justify-center space-x-4 text-xs md:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <span className="mr-1">📝</span>
                              <span>{gallery.post_count}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="mr-1">💬</span>
                              <span>{gallery.comment_count}</span>
                            </div>
                          </div>

                          {/* 활성 상태 표시 */}
                          {gallery.post_count > 0 && (
                            <div className="mt-3 flex justify-center">
                              <Badge 
                                variant="secondary" 
                                className="text-xs bg-green-100 text-green-700 border-green-200"
                              >
                                활성
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 갤러리가 없는 경우 */}
      {galleries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📁</div>
          <p className="text-gray-600">{t('community.galleryList.noPosts')}</p>
        </div>
      )}
    </div>
  )
}
