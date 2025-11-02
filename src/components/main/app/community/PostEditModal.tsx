'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { X } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  category: string
  images?: string[]
}

interface PostEditModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPost: Post) => void
}

export default function PostEditModal({ post, isOpen, onClose, onSave }: PostEditModalProps) {
  const { t, language } = useLanguage()
  const { token } = useAuth()
  
  const categories = [
    { value: '공지사항', label: language === 'ko' ? '📢 공지사항' : '📢 Anuncios' },
    { value: '자유게시판', label: t('community.categories.free') },
    { value: 'K-POP', label: t('community.categories.kpop') },
    { value: 'K-Drama', label: t('community.categories.kdrama') },
    { value: '뷰티', label: t('community.categories.beauty') },
    { value: '한국어공부', label: t('community.categories.koreanStudy') },
    { value: '스페인어공부', label: t('community.categories.spanishStudy') }
  ]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('자유게시판')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  // 모달이 열릴 때 게시글 정보로 폼 초기화
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setCategory(post.category || '자유게시판')
      setUploadedImages(post.images || [])
      setImagePreviews(post.images || [])
      setError('')
    }
  }, [post])

  // 이미지 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(language === 'es' ? 'El tamaño del archivo no puede exceder 5MB.' : '파일 크기는 5MB를 초과할 수 없습니다.')
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error(language === 'es' ? 'Error al subir la imagen' : '이미지 업로드 실패')
        }

        const data = await response.json()
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...urls])
      
      // 미리보기 생성
      const previews = Array.from(files).map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...previews])
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      setError(error instanceof Error ? error.message : (language === 'es' ? 'Error al subir la imagen.' : '이미지 업로드에 실패했습니다.'))
    } finally {
      setUploadingImages(false)
    }
  }

  // 이미지 제거
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!post || !title.trim() || !content.trim()) {
      setError(t('freeboard.editError'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          images: uploadedImages
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('freeboard.editFailed'))
      }

      onSave({
        id: post.id,
        title: title.trim(),
        content: content.trim(),
        category,
        images: uploadedImages
      })
      
      alert(t('freeboard.editSuccess'))
      onClose()
    } catch (err) {
      console.error('게시글 수정 오류:', err)
      setError(err instanceof Error ? err.message : t('freeboard.editFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setCategory('자유게시판')
    setUploadedImages([])
    setImagePreviews([])
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>{t('freeboard.editPost')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t('freeboard.title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('freeboard.titlePlaceholder')}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('freeboard.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('freeboard.content')}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('freeboard.contentPlaceholder')}
              rows={8}
              maxLength={2000}
            />
            <div className="text-sm text-gray-500 text-right">
              {content.length}/2000
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">{t('community.attachImage')}</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-200 font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>📷</span>
                {uploadingImages ? (language === 'es' ? 'Subiendo...' : '업로드 중...') : t('community.selectImage')}
              </label>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('community.imageRestrictions')}
              </div>
              
              {/* 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`첨부 이미지 ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {t('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('freeboard.editing') : t('freeboard.editButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
