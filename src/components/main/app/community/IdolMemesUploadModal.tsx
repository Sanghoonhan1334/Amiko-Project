'use client'

import { useState } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

interface IdolMemesUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  theme: 'day' | 'night'
}

export default function IdolMemesUploadModal({
  isOpen,
  onClose,
  onSuccess,
  theme,
}: IdolMemesUploadModalProps) {
  const { user, token } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDark = theme === 'night'

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)

      // Preview 생성
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Por favor ingresa un título')
      return
    }

    if (!selectedFile) {
      setError('Por favor selecciona una imagen o video')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // 먼저 파일 업로드
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'idol-memes')

      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Error al subir el archivo')
      }

      const uploadData = await uploadRes.json()
      const mediaUrl = uploadData.url

      // 게시글 생성
      const postData = {
        title,
        content,
        media_url: mediaUrl,
        media_type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
        category: 'all',
      }

      const postRes = await fetch('/api/idol-memes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      })

      if (!postRes.ok) {
        throw new Error('Error al crear la publicación')
      }

      // 성공
      setTitle('')
      setContent('')
      setSelectedFile(null)
      setPreview(null)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Foto de Ídolo
            </h2>
            <button
              onClick={onClose}
              className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Ingresa el título de la foto"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Subir Foto
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDark ? 'border-gray-700' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  id="media-upload"
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
                      Eliminar imagen
                    </button>
                  </div>
                ) : (
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Haz clic para subir una imagen o video
                    </p>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Descripción
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Ingresa una descripción de la foto"
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
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  'Subir'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
