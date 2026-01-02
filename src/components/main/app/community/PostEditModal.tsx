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
import { X, PlayCircle } from 'lucide-react'

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
  const { token, user, session, refreshSession } = useAuth()
  
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
  const [fileTypes, setFileTypes] = useState<string[]>([]) // 파일 타입 저장 (image/video 구분용)

  // 모달이 열릴 때 게시글 정보로 폼 초기화
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setCategory(post.category || '자유게시판')
      const existingImages = post.images || []
      setUploadedImages(existingImages)
      setImagePreviews(existingImages)
      // 기존 이미지들은 모두 이미지로 간주 (URL에서 타입 추론 불가)
      setFileTypes(existingImages.map(() => 'image/jpeg'))
      setError('')
    }
  }, [post])

  // 이미지/영상 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      // 토큰 가져오기 - 여러 방법 시도
      let currentToken = session?.access_token || token
      
      if (!currentToken) {
        // 방법 1: localStorage에서 토큰 가져오기
        currentToken = localStorage.getItem('amiko_token')
      }
      
      // 토큰이 없거나 만료된 경우 세션 갱신 시도
      if (!currentToken) {
        console.log('[PostEditModal] 토큰이 없어 세션 갱신 시도...')
        const refreshed = await refreshSession()
        if (refreshed) {
          // refreshSession 후 localStorage에서 토큰 가져오기
          currentToken = localStorage.getItem('amiko_token')
          // 또는 세션에서 직접 가져오기 (상태가 업데이트되지 않았을 수 있음)
          if (!currentToken && session?.access_token) {
            currentToken = session.access_token
          }
        }
      } else {
        // 토큰이 있지만 만료되었을 수 있으므로, 세션 갱신 시도
        console.log('[PostEditModal] 토큰이 있지만 만료되었을 수 있으므로 세션 갱신 시도...')
        const refreshed = await refreshSession()
        if (refreshed) {
          // 갱신된 토큰 사용
          currentToken = localStorage.getItem('amiko_token') || session?.access_token || currentToken
        }
      }
      
      if (!currentToken) {
        throw new Error(language === 'es' ? 'Sesión expirada. Por favor, inicia sesión nuevamente.' : '세션이 만료되었습니다. 다시 로그인해주세요.')
      }
      
      console.log('[PostEditModal] 토큰 확인:', { 
        hasToken: !!currentToken, 
        tokenLength: currentToken?.length,
        fromSession: !!session?.access_token,
        fromLocalStorage: !!localStorage.getItem('amiko_token')
      })
      // 파일 타입 검증 (MIME 타입 또는 확장자 기반)
      const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.avi']
      
      const invalidFiles = Array.from(files).filter(file => {
        const hasValidMimeType = validMimeTypes.includes(file.type)
        const fileName = file.name.toLowerCase()
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
        return !hasValidMimeType && !hasValidExtension
      })
      
      if (invalidFiles.length > 0) {
        console.error('[PostEditModal] 지원하지 않는 파일 타입:', invalidFiles.map(f => ({ name: f.name, type: f.type })))
        setError(language === 'es' ? 'Tipo de archivo no permitido. Solo se permiten imágenes, videos y GIFs.' : '지원하지 않는 파일 형식입니다. 이미지, 영상, GIF만 업로드 가능합니다.')
        setUploadingImages(false)
        return
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        // 이미지와 영상의 크기 제한을 다르게 설정 (MIME 타입 또는 확장자 기반)
        const fileName = file.name.toLowerCase()
        const isVideo = file.type.startsWith('video/') || ['.mp4', '.mov', '.webm', '.avi'].some(ext => fileName.endsWith(ext))
        const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024 // 영상: 100MB, 이미지: 5MB
        
        console.log('[PostEditModal] 파일 업로드 시작:', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          isVideo,
          maxSize
        })
        
        if (file.size > maxSize) {
          throw new Error(
            language === 'es' 
              ? `El tamaño del archivo no puede exceder ${isVideo ? '100MB' : '5MB'}.`
              : `파일 크기는 ${isVideo ? '100MB' : '5MB'}를 초과할 수 없습니다.`
          )
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('[PostEditModal] 업로드 실패:', {
            status: response.status,
            error: data.error,
            details: data.details,
            fileType: file.type,
            fileName: file.name,
            fileSize: file.size
          })
          throw new Error(data.error || data.details || (language === 'es' ? 'Error al subir el archivo.' : '파일 업로드 실패'))
        }

        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...urls])
      
      // 미리보기 생성 및 파일 타입 저장
      const previews = Array.from(files).map(file => URL.createObjectURL(file))
      const types = Array.from(files).map(file => file.type)
      setImagePreviews(prev => [...prev, ...previews])
      setFileTypes(prev => [...prev, ...types])
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      setError(error instanceof Error ? error.message : (language === 'es' ? 'Error al subir el archivo.' : '파일 업로드에 실패했습니다.'))
    } finally {
      setUploadingImages(false)
    }
  }

  // 이미지 제거
  const handleRemoveImage = (index: number) => {
    // URL 해제 (메모리 누수 방지)
    if (imagePreviews[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviews[index])
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setFileTypes(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!post || !title.trim() || !content.trim()) {
      setError(t('freeboard.editError'))
      return
    }

    setLoading(true)
    setError('')

    try {
      // 토큰 가져오기 - 여러 방법 시도
      let currentToken = session?.access_token || token
      
      if (!currentToken) {
        currentToken = localStorage.getItem('amiko_token')
      }
      
      // 토큰이 없거나 만료되었을 수 있으므로 세션 갱신 시도
      if (!currentToken) {
        console.log('[PostEditModal] 토큰이 없어 세션 갱신 시도...')
        const refreshed = await refreshSession()
        if (refreshed) {
          currentToken = localStorage.getItem('amiko_token') || session?.access_token
        }
      } else {
        // 토큰이 있지만 만료되었을 수 있으므로 세션 갱신 시도
        console.log('[PostEditModal] 토큰이 있지만 만료되었을 수 있으므로 세션 갱신 시도...')
        const refreshed = await refreshSession()
        if (refreshed) {
          currentToken = localStorage.getItem('amiko_token') || session?.access_token || currentToken
        }
      }
      
      if (!currentToken) {
        setError(language === 'es' ? 'Sesión expirada. Por favor, inicia sesión nuevamente.' : '세션이 만료되었습니다. 다시 로그인해주세요.')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
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
    // 모든 blob URL 해제 (메모리 누수 방지)
    imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    })
    setTitle('')
    setContent('')
    setCategory('자유게시판')
    setUploadedImages([])
    setImagePreviews([])
    setFileTypes([])
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

          {/* 이미지/영상 업로드 */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">{t('community.attachImage')}</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.gif"
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
                {uploadingImages ? (language === 'es' ? 'Subiendo...' : '업로드 중...') : (language === 'es' ? 'Seleccionar archivo (imagen/video/GIF)' : '파일 선택 (이미지/영상/GIF)')}
              </label>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'es' ? 'Imágenes (máx. 5MB), videos y GIFs (máx. 100MB) permitidos' : '이미지 (최대 5MB), 영상 및 GIF (최대 100MB) 지원'}
              </div>
              
              {/* 이미지/영상 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {imagePreviews.map((preview, index) => {
                    const fileType = fileTypes[index] || ''
                    const isVideo = fileType.startsWith('video/')
                    
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <div className="relative w-full h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                            <video
                              src={preview}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white">
                              <PlayCircle className="w-8 h-8" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={preview}
                            alt={`첨부 파일 ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200"
                          />
                        )}
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
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
