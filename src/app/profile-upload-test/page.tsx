'use client'

import { useState, useEffect } from 'react'
import ProfileImageUpload from '@/components/profile/ProfileImageUpload'
export default function ProfileUploadTestPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 임시로 하드코딩된 사용자 정보 사용
    setUser({
      id: '5f83ab21-fd61-4666-94b5-087d73477476',
      email: 'han133334@naver.com',
      full_name: 'han133334',
      avatar_url: null
    })
    setLoading(false)
  }, [])

  const handleImageUpdate = (imageUrl: string) => {
    setUser((prev: any) => ({
      ...prev,
      avatar_url: imageUrl
    }))
    console.log('프로필 이미지 업데이트됨:', imageUrl)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">로그인이 필요합니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">프로필 이미지 업로드 테스트</h1>
        
        <div className="text-center mb-6">
          <ProfileImageUpload
            currentImage={user.avatar_url}
            userName={user.full_name}
            onImageUpdate={handleImageUpdate}
          />
          <p className="mt-2 text-sm text-gray-600">
            {user.full_name || user.email}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">사용법:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 카메라 아이콘을 클릭하여 이미지 선택</li>
            <li>• 또는 이미지를 드래그 앤 드롭</li>
            <li>• 이미지 파일만 업로드 가능 (5MB 제한)</li>
            <li>• 업로드 후 스토리에서 확인 가능</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/community/stories" 
            className="text-blue-500 hover:text-blue-700 underline"
          >
            스토리 페이지에서 확인하기 →
          </a>
        </div>
      </div>
    </div>
  )
}
