'use client'

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { X, Image, Video, Upload, Loader2, AlertCircle } from 'lucide-react'
import { FanroomWithDetails, FanroomPostWithAuthor } from '@/types/fanzone'
import { uploadFile, validateFileType, processMultipleFiles } from '@/lib/fanzone/storage'
import fanzoneEs from '@/i18n/community/es'

interface CreatePostModalProps {
  fanroom: FanroomWithDetails
  onClose: () => void
  onPostCreated: (post: FanroomPostWithAuthor) => void
}

/**
 * CreatePostModal - Modal para crear posts en FanRoom
 * Incluye: Texto, media upload, validación, preview
 */
export default function CreatePostModal({ 
  fanroom, 
  onClose, 
  onPostCreated 
}: CreatePostModalProps) {
  const [content, setContent] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Maneja selección de archivos
   */
  const handleFileSelect = async (files: FileList) => {
    try {
      const result = await processMultipleFiles(files, 'fanzone-media', 10)
      
      if (result.errors.length > 0) {
        setErrors(result.errors)
        return
      }

      setMediaFiles(result.validFiles)
      setErrors([])

      // Crear previews
      const previews = await Promise.all(
        result.validFiles.map(file => createFilePreview(file))
      )
      setMediaPreviews(previews)

    } catch (error) {
      console.error('Error processing files:', error)
      setErrors(['Error al procesar archivos'])
    }
  }

  /**
   * Crea preview de archivo
   */
  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Error al leer archivo'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Elimina archivo de la lista
   */
  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Maneja envío del post
   */
  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      setErrors(['Debes escribir algo o subir una imagen'])
      return
    }

    if (content.length > 2000) {
      setErrors(['El contenido no puede tener más de 2000 caracteres'])
      return
    }

    try {
      setUploading(true)
      setErrors([])

      // Subir archivos de media
      const mediaUrls: string[] = []
      
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i]
        const result = await uploadFile({
          bucket: 'fanzone-media',
          fanroomId: fanroom.id,
          postId: 'temp', // Se actualizará después de crear el post
          file,
          onProgress: (progress) => {
            const totalProgress = ((i + progress / 100) / mediaFiles.length) * 100
            setUploadProgress(totalProgress)
          }
        })

        if (result.success && result.url) {
          mediaUrls.push(result.url)
        } else {
          throw new Error(result.error || 'Error al subir archivo')
        }
      }

      // Crear post
      const response = await fetch(`/api/fanzone/fanrooms/${fanroom.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          media_urls: mediaUrls
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear post')
      }

      const data = await response.json()
      onPostCreated(data.post)
      onClose()

    } catch (error) {
      console.error('Error creating post:', error)
      setErrors([error instanceof Error ? error.message : 'Error desconocido'])
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  /**
   * Maneja click en área de upload
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Maneja drag and drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Crear post en {fanroom.name}</span>
            <Badge variant="outline" className="text-xs">
              {fanzoneEs.filters.categories[fanroom.category]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <div className="text-sm text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido del post */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ¿Qué quieres compartir?
            </label>
            <Textarea
              placeholder={fanzoneEs.posts.placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{content.length}/2000 caracteres</span>
              <span>{mediaFiles.length}/10 archivos</span>
            </div>
          </div>

          {/* Upload de media */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fotos y videos (opcional)
            </label>
            
            {/* Área de upload */}
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              onClick={handleUploadClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                JPG, PNG, WebP, MP4, WebM (máximo 50MB por archivo)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Preview de media */}
          {mediaPreviews.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista previa
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {preview.startsWith('data:video/') ? (
                        <video
                          src={preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo archivos...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading || (!content.trim() && mediaFiles.length === 0)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
