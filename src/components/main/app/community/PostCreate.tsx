'use client'

import React, { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { checkAuthAndRedirect } from '@/lib/auth-utils'

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
  const router = useRouter()
  const [title, setTitle] = useState('')

  // 인증 체크 - 인증이 안된 사용자는 인증센터로 리다이렉트
  React.useEffect(() => {
    if (user && !user.isVerified) {
      checkAuthAndRedirect(user, router, '게시물 작성')
    }
  }, [user, router])
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // 이미지 파일만 필터링
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        setError(`${file.name}은(는) 5MB를 초과합니다.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // 최대 5개 이미지 제한
    if (images.length + validFiles.length > 5) {
      setError('최대 5개까지 이미지를 업로드할 수 있습니다.')
      return
    }

    setUploadingImages(true)
    setError(null)

    try {
      // 토큰 가져오기
      if (!user?.access_token) {
        throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
      }

      // 각 이미지 파일을 Supabase Storage에 업로드
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'gallery-posts')

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(user.access_token)}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '이미지 업로드에 실패했습니다.')
        }

        const result = await response.json()
        return result.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedUrls])

      console.log('이미지 업로드 완료:', uploadedUrls)

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

    // 인증 체크 - 게시물 작성은 인증이 필요
    if (!checkAuthAndRedirect(user, router, '게시물 작성')) {
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
          'Authorization': `Bearer ${encodeURIComponent(user.access_token)}`
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
              'Authorization': `Bearer ${encodeURIComponent(user.access_token)}`
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 space-y-8">
            {/* 헤더 */}
            <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ backgroundColor: gallery.color + '20' }}
              >
                {gallery.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">새 글 작성</h1>
                <p className="text-sm text-gray-600 mt-1">{gallery.name_ko}</p>
              </div>
            </div>

            {/* 작성 폼 */}
            <div className="space-y-8">
              {/* 제목 입력 */}
              <div className="space-y-3">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                  제목 *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력해주세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">{title.length}/200</p>
              </div>

              {/* 내용 입력 */}
              <div className="space-y-3">
                <label htmlFor="content" className="block text-sm font-semibold text-gray-700">
                  내용 *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력해주세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                  rows={8}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    간단한 마크다운 지원: **굵게**, *기울임*, 줄바꿈
                  </p>
                  <p className="text-xs text-gray-500">{content.length}자</p>
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  이미지 첨부
                </label>
                
                {/* 이미지 업로드 버튼 */}
                <div className="flex items-center space-x-4">
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
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
                          className="w-full h-32 object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* 작성 버튼 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <Button 
                  onClick={handleCancel} 
                  variant="outline"
                  className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  취소
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '작성 중...' : '글 작성'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 작성 가이드 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
            📝 작성 가이드
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• 제목은 명확하고 구체적으로 작성해주세요</li>
            <li>• 내용은 상대방이 이해하기 쉽게 작성해주세요</li>
            <li>• 이미지는 최대 5MB까지 업로드 가능합니다</li>
            <li>• 다른 사용자를 존중하는 마음으로 작성해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
