'use client'

import React, { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface Gallery {
  id: string
  slug: string
  name_ko: string
  icon: string
  color: string
}

interface PostCreateProps {
  gallery: Gallery
  onSuccess: () => void
  onCancel: () => void
}

export default function PostCreate({ gallery, onSuccess, onCancel }: PostCreateProps) {
  const { t, language } = useLanguage()
  const { user, refreshSession } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    setError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name}: 파일 크기는 5MB를 초과할 수 없습니다`)
        }

        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}: 이미지 파일만 업로드 가능합니다`)
        }

        // Base64로 변환
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target?.result as string
            resolve(result)
          }
          reader.onerror = () => reject(new Error('파일 읽기 실패'))
          reader.readAsDataURL(file)
        })
      })

      const uploadedImages = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedImages])
    } catch (err) {
      console.error('이미지 업로드 오류:', err)
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다')
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('로그인이 필요합니다')
      return
    }

    if (!title.trim()) {
      setError(t('community.galleryList.writePost') + ' - ' + t('community.galleryList.title') + ' ' + t('buttons.required'))
      return
    }

    if (!content.trim()) {
      setError(t('community.galleryList.writePost') + ' - ' + t('community.galleryList.content') + ' ' + t('buttons.required'))
      return
    }

    if (!user) {
      setError(t('community.galleryList.loginRequired'))
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      let response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          gallery_id: gallery.id,
          title: title.trim(),
          content: content.trim(),
          images: images
        })
      })

      // 인증 실패 시 토큰 갱신 후 재시도
      if (!response.ok && response.status === 401) {
        console.log('[POST_CREATE] 인증 실패, 토큰 갱신 시도...')
        const refreshSuccess = await refreshSession()
        
        if (refreshSuccess && user) {
          console.log('[POST_CREATE] 토큰 갱신 성공, 재시도...')
          response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.access_token}`
            },
            body: JSON.stringify({
              gallery_id: gallery.id,
              title: title.trim(),
              content: content.trim(),
              images: images
            })
          })
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '게시물 작성에 실패했습니다')
      }

      const data = await response.json()
      console.log('게시물 작성 성공:', data.post.id)
      
      // 성공 시 폼 초기화 및 콜백 호출
      setTitle('')
      setContent('')
      setImages([])
      onSuccess()
    } catch (err) {
      console.error('게시물 작성 오류:', err)
      setError(err instanceof Error ? err.message : '게시물 작성 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (title.trim() || content.trim() || images.length > 0) {
      if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: gallery.color + '20' }}
          >
            {gallery.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">새 글 작성</h1>
            <p className="text-sm text-gray-600">{gallery.name_ko}</p>
          </div>
        </div>
        
        <Button onClick={handleCancel} variant="outline">
          취소
        </Button>
      </div>

      {/* 작성 폼 */}
      <Card className="p-6">
        {/* 제목 입력 */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목 *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/200</p>
        </div>

        {/* 내용 입력 */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            내용 *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해주세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={8}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              간단한 마크다운 지원: **굵게**, *기울임*, 줄바꿈
            </p>
            <p className="text-xs text-gray-500">{content.length}자</p>
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 첨부
          </label>
          
          {/* 이미지 업로드 버튼 */}
          <div className="flex items-center space-x-4 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
            >
              {uploadingImages ? '업로드 중...' : '📷 이미지 선택'}
            </label>
            <span className="text-sm text-gray-500">
              최대 5MB, JPG/PNG/GIF 지원
            </span>
          </div>

          {/* 업로드된 이미지 미리보기 */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 작성 버튼 */}
        <div className="flex justify-end space-x-3">
          <Button onClick={handleCancel} variant="outline">
            취소
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {submitting ? '작성 중...' : '글 작성'}
          </Button>
        </div>
      </Card>

      {/* 작성 가이드 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">📝 작성 가이드</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 제목은 명확하고 구체적으로 작성해주세요</li>
          <li>• 내용은 상대방이 이해하기 쉽게 작성해주세요</li>
          <li>• 이미지는 최대 5MB까지 업로드 가능합니다</li>
          <li>• 다른 사용자를 존중하는 마음으로 작성해주세요</li>
        </ul>
      </Card>
    </div>
  )
}
