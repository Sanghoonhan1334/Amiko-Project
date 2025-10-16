'use client'

import { useState } from 'react'
import { User, Upload, Camera } from 'lucide-react'

interface ProfileImageUploadProps {
  currentImage?: string
  userName?: string
  onImageUpdate?: (imageUrl: string) => void
}

export default function ProfileImageUpload({ currentImage, userName, onImageUpdate }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleImageUpload = async (file: File) => {
    if (!file) return

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.')
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('프로필 이미지 업로드 성공:', result)
        onImageUpdate?.(result.avatarUrl)
        alert('프로필 이미지가 성공적으로 업데이트되었습니다!')
      } else {
        const error = await response.json()
        console.error('프로필 이미지 업로드 실패:', error)
        alert(`업로드 실패: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleImageUpload(file)
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = Array.from(event.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      await handleImageUpload(imageFile)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="relative">
      <div 
        className={`w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-all duration-200 ${
          dragOver ? 'ring-4 ring-blue-300 scale-105' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="프로필" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 text-white" />
        )}
      </div>
      
      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
        <Camera className="w-4 h-4 text-white" />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
      </label>
      
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-blue-500" />
        </div>
      )}
    </div>
  )
}
