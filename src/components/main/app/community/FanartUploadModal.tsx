'use client'

import { useState } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface FanartUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FanartUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: FanartUploadModalProps) {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [category, setCategory] = useState('Portrait')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = ['Portrait', 'Group', 'Chibi', 'Digital', 'Traditional', 'Other']

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError(t('community.uploadErrorImageRequired'))
        return
      }
      
      setSelectedFile(file)
      setError(null)

      // Preview 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t('community.uploadErrorTitleRequired'))
      return
    }

    if (!selectedFile) {
      setError(t('community.uploadErrorImageRequired'))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // 먼저 파일 업로드
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'fan-art')

      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error(t('community.uploadErrorFileFailed'))
      }

      const uploadData = await uploadRes.json()
      const imageUrl = uploadData.url

      // Fan art 생성
      const postData = {
        title,
        content,
        image_url: imageUrl,
        category,
      }

      const postRes = await fetch('/api/fanart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      })

      if (!postRes.ok) {
        throw new Error(t('community.fanartUploadErrorCreateFailed'))
      }

      // 성공
      setTitle('')
      setContent('')
      setSelectedFile(null)
      setPreview(null)
      setCategory('Portrait')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('community.uploadErrorGeneric'))
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('community.fanartUploadTitle')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('community.uploadTitleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 bg-white border-gray-300"
                placeholder={t('community.fanartUploadTitlePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('community.fanartUploadCategoryLabel')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 bg-white border-gray-300"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('community.fanartUploadImageLabel')}
              </label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={handleFileSelect}
                />
                {preview ? (
                  <div className="space-y-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setPreview(null)
                      }}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      {t('community.uploadRemoveImage')}
                    </button>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {t('community.fanartUploadClickToUpload')}
                    </p>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('community.uploadDescriptionLabel')}
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 bg-white border-gray-300"
                placeholder={t('community.fanartUploadDescPlaceholder')}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={isUploading}
              >
                {t('community.uploadCancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('community.uploadUploading')}
                  </>
                ) : (
                  t('community.uploadSubmit')
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

