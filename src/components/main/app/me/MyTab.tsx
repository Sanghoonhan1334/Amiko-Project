'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProfileSkeleton } from '@/components/ui/skeleton'

import { 
  Edit3, 
  Save, 
  X, 
  Gift, 
  Bell, 
  Mail, 
  Settings,
  Heart,
  Calendar,
  MessageSquare,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Camera,
  Plus,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import StorySettings from './StorySettings'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import { KoreanUserProfile, LatinUserProfile } from '@/types/user'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import ChargingTab from '../charging/ChargingTab'
import PointsCard from './PointsCard'
import ChargingHeader from './ChargingHeader'

export default function MyTab() {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    korean_name: '',
    spanish_name: '',
    nickname: '',
    phone: '',
    one_line_intro: '',
    introduction: '',
    language: 'ko',
    user_type: 'student',
    university: '',
    major: '',
    grade: '',
    occupation: '',
    company: '',
    career: '',
    interests: [] as string[],
    profile_images: [] as string[]
  })
  const [newInterest, setNewInterest] = useState('')
  const [showInterestSelector, setShowInterestSelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 인증센터에서 가져온 관심사 목록
  const availableInterests = [
    '한국어', '한국문화', '음식', '여행', '영화', '음악', '스포츠', 
    '패션', '게임', '기술', '경제', '언어교환', 'K-POP', '드라마', 
    '맛집', '독서', '댄스', '미술', '자연', '반려동물', '커피', '뷰티'
  ]
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState({ loading: true, smsVerified: false })
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean
    status: 'none' | 'email' | 'sms' | 'full'
    message: string
  }>({
    isVerified: false,
    status: 'none',
    message: '인증이 필요합니다'
  })
  const [notificationSettings, setNotificationSettings] = useState({
    webPush: true,
    email: false,
    marketing: false
  })

  // 프로필 사진 스와이프 관련 상태
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // 편집 폼 초기화
  const initializeEditForm = (profileData: any) => {
    setEditForm({
      full_name: profileData?.name || profileData?.full_name || '',
      korean_name: profileData?.korean_name || '',
      spanish_name: profileData?.spanish_name || '',
      nickname: profileData?.nickname || '',
      phone: profileData?.phone || '',
      one_line_intro: profileData?.bio || profileData?.one_line_intro || '',
      introduction: profileData?.introduction || '',
      language: profileData?.native_language || profileData?.language || 'ko',
      user_type: profileData?.userType || profileData?.user_type || 'student',
      university: profileData?.university || '',
      major: profileData?.major || '',
      grade: profileData?.grade || '',
      occupation: profileData?.occupation || '',
      company: profileData?.company || '',
      career: profileData?.career || '',
      interests: profileData?.interests || [],
      profile_images: profileData?.profileImages?.map((img: any) => img.src) || profileData?.profile_images || []
    })
  }

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!user || !token) {
      alert('로그인이 필요합니다.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setIsEditing(false)
        alert('프로필이 성공적으로 저장되었습니다!')
      } else {
        throw new Error('프로필 저장 실패')
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error)
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }


  // 관심사 제거
  const handleRemoveInterest = (interestToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }))
  }

  // 관심사 선택 함수
  const handleInterestSelect = (interest: string) => {
    if (editForm.interests.includes(interest)) {
      // 이미 선택된 관심사면 제거
      setEditForm(prev => ({
        ...prev,
        interests: prev.interests.filter(i => i !== interest)
      }))
    } else if (editForm.interests.length < 5) {
      // 최대 5개까지만 선택 가능
      setEditForm(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }))
    }
  }

  // 닉네임 검증
  const validateNickname = (nickname: string) => {
    const nicknameRegex = /^[a-zA-Z0-9_!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]*$/
    return nicknameRegex.test(nickname)
  }

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
        
        // 프로필 다시 로드하여 업데이트된 이미지 반영
        await loadProfile()
        
        alert('프로필 이미지가 성공적으로 업데이트되었습니다!')
      } else {
        const error = await response.json()
        console.error('프로필 이미지 업로드 실패:', error)
        alert(`업로드 실패: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error)
      alert('업로드 중 오류가 발생했습니다.')
    }
  }

  // 프로필 이미지 삭제 핸들러
  const handleDeleteProfileImage = async () => {
    try {
      const response = await fetch('/api/profile/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('프로필 이미지 삭제 성공');
        await loadProfile(); // 프로필 다시 로드하여 업데이트된 상태 반영
        alert('프로필 사진이 삭제되었습니다.');
      } else {
        const error = await response.json();
        console.error('프로필 이미지 삭제 실패:', error);
        alert(`삭제 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 인덱스별 프로필 이미지 삭제 핸들러
  const handleDeleteProfileImageByIndex = async (index: number) => {
    try {
      const response = await fetch('/api/profile/delete-image-by-index', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index })
      });

      if (response.ok) {
        console.log(`프로필 이미지 ${index + 1} 삭제 성공`);
        await loadProfile(); // 프로필 다시 로드하여 업데이트된 상태 반영
        alert(`프로필 사진 ${index + 1}이 삭제되었습니다.`);
    } else {
        const error = await response.json();
        console.error('프로필 이미지 삭제 실패:', error);
        alert(`삭제 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 프로필 데이터 로드 함수
  const loadProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // API 호출 시도 (실패해도 빈 프로필 사용)
      if (token) {
        try {
          const response = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            setProfile(data.user || data.profile)
            initializeEditForm(data.user || data.profile)
            setLoading(false)
            return
          }
        } catch (error) {
          console.log('API 호출 실패, 빈 프로필 사용')
        }
      }
      
      // API 실패 시 빈 프로필 설정
      setProfile(null)
      initializeEditForm(null)
    } catch (error) {
      console.error('프로필 로드 중 오류:', error)
      // 오류 시 빈 프로필 설정
      setProfile(null)
      initializeEditForm(null)
    } finally {
      setLoading(false)
    }
  }

  // 프로필 데이터 로드
  useEffect(() => {
    loadProfile()
  }, [user, token])

  // 인증 상태 확인
  const checkVerificationStatus = async () => {
    if (!user || !token) {
      setVerificationStatus({
        isVerified: false,
        status: 'none',
        message: '로그인이 필요합니다'
      })
          return
        }
        
    try {
      const response = await fetch(`/api/verification?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const verification = data.verification
        
        setVerificationStatus({
          isVerified: verification.status === 'approved',
          status: verification.status === 'approved' ? 'full' : 'none',
          message: verification.message
        })
      } else {
        setVerificationStatus({
          isVerified: false,
          status: 'none',
          message: '인증 정보를 확인할 수 없습니다'
        })
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)
      setVerificationStatus({
        isVerified: false,
        status: 'none',
        message: '인증 상태를 확인할 수 없습니다'
      })
    }
  }

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user) {
        setAuthStatus({ loading: false, smsVerified: false })
        return
      }
        
      // 실제 인증 상태 확인 (나중에 API 연동)
      setAuthStatus({ loading: false, smsVerified: true })
    }

    checkAuthStatus()
    checkVerificationStatus()
  }, [user, token])

  // 알림 설정 변경 핸들러
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 프로필 사진 스와이프 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const endX = e.changedTouches[0].clientX
    const diff = startX - endX
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 왼쪽으로 스와이프 (다음 사진)
        setCurrentImageIndex(prev => 
          prev < (profile?.profile_images?.length || 1) - 1 ? prev + 1 : 0
        )
      } else {
        // 오른쪽으로 스와이프 (이전 사진)
        setCurrentImageIndex(prev => 
          prev > 0 ? prev - 1 : (profile?.profile_images?.length || 1) - 1
        )
      }
    }
    
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const endX = e.clientX
    const diff = startX - endX
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 왼쪽으로 드래그 (다음 사진)
        setCurrentImageIndex(prev => 
          prev < (profile?.profile_images?.length || 1) - 1 ? prev + 1 : 0
        )
      } else {
        // 오른쪽으로 드래그 (이전 사진)
        setCurrentImageIndex(prev => 
          prev > 0 ? prev - 1 : (profile?.profile_images?.length || 1) - 1
        )
      }
    }
    
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // 관리자 여부 확인 (더 포괄적인 체크)
  const isAdmin = user?.email === 'admin@amiko.com' || user?.user_metadata?.role === 'admin'

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('myTab.loading')}</p>
      </div>
      </div>
    )
  }

  // 운영자는 대시보드만 표시
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full">
          <AnalyticsDashboard />
        </div>
      </div>
    )
  }

  // 프로필이 없을 때의 상태
  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full">
          {/* 빈 프로필 상태 */}
          <div className="relative h-80 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">프로필을 설정해주세요</h2>
              <p className="text-sm">편집 버튼을 눌러 프로필을 완성해보세요</p>
          </div>
        </div>

          {/* 편집 버튼 (모바일) */}
          <div className="px-4 py-2 bg-white md:hidden">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-800">{t('profile.myProfile')}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm text-white"
              >
                <Edit3 className="w-4 h-4" />
              </button>
      </div>
        </div>

          {/* 기본 정보 섹션 (편집 모드) */}
          <div className="px-4 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-800">{t('profile.academicCareerInfo')}</h2>
          </div>
            <p className="text-gray-600 text-sm">프로필을 설정해주세요</p>
        </div>
            </div>
          </div>
    )
  }

  // 틴더 스타일 메인 레이아웃
                    return (
    <div className="min-h-screen bg-white">
      {/* 틴더 스타일 풀스크린 컨테이너 */}
      <div className="w-full">
        
        {/* 프로필 헤더 섹션 - 1:1 비율 정사각형 */}
        <div className="relative flex justify-center">
          {/* 프로필 사진 스와이프 영역 - 최대 400px, 1:1 비율 */}
          <div 
            className="relative w-full max-w-sm aspect-square bg-gray-100 overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* 프로필 사진들 */}
            <div
              className="flex h-full transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentImageIndex * 100}%)`,
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {/* 모든 프로필 사진들을 하나의 배열로 합치기 */}
                {(() => {
                const allImages = []
                if (profile?.avatar_url) {
                  allImages.push({ src: profile.avatar_url, type: 'avatar', index: 0 })
                }
                if (profile?.profile_images?.length > 0) {
                  profile.profile_images.forEach((src, index) => {
                    allImages.push({ src, type: 'profile_image', index })
                  })
                }
                return allImages
              })().map((imageData, globalIndex) => (
                <div key={`${imageData.type}-${imageData.index}`} className="w-full h-full flex-shrink-0 relative group">
                  <img
                    src={imageData.src}
                    alt={`프로필 ${globalIndex + 1}`}
                        className="w-full h-full object-cover"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  {/* 사진 인디케이터 */}
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                    {globalIndex + 1}/{(() => {
                      const allImages = []
                      if (profile?.avatar_url) allImages.push(profile.avatar_url)
                      if (profile?.profile_images?.length > 0) allImages.push(...profile.profile_images)
                      return allImages.length
                })()}
              </div>
                  {/* 데스크톱용 호버 버튼들 - 모바일에서는 숨김 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center hidden md:flex">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      {/* 사진 변경 버튼 (첫 번째 사진에만) */}
                      {globalIndex === 0 && (
                        <label className="bg-white bg-opacity-90 rounded-full p-2 cursor-pointer hover:bg-opacity-100 transition-all">
                          <Camera className="w-5 h-5 text-gray-700" />
                  <input
                    type="file"
                    accept="image/*"
                            onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                  </label>
                      )}
                      {/* 사진 삭제 버튼 */}
                      <button
                        onClick={() => {
                          if (confirm(`프로필 사진 ${globalIndex + 1}을 삭제하시겠습니까?`)) {
                            if (imageData.type === 'avatar') {
                              handleDeleteProfileImage()
                            } else {
                              handleDeleteProfileImageByIndex(imageData.index)
                            }
                          }
                        }}
                        className="bg-red-500 bg-opacity-90 rounded-full p-2 cursor-pointer hover:bg-opacity-100 transition-all"
                        title={`프로필 사진 ${globalIndex + 1} 삭제`}
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                      </div>
                  </div>
                  
                  {/* 모바일용 항상 보이는 작은 버튼들 */}
                  <div className="absolute top-2 left-2 flex gap-1 md:hidden">
                    {/* 사진 변경 버튼 (첫 번째 사진에만) */}
                    {globalIndex === 0 && (
                      <label className="bg-black bg-opacity-50 rounded-full p-1.5 cursor-pointer touch-manipulation">
                        <Camera className="w-3 h-3 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    {/* 사진 삭제 버튼 */}
                      <button
                      onClick={() => {
                        if (confirm(`프로필 사진 ${globalIndex + 1}을 삭제하시겠습니까?`)) {
                          if (imageData.type === 'avatar') {
                            handleDeleteProfileImage()
                          } else {
                            handleDeleteProfileImageByIndex(imageData.index)
                          }
                        }
                      }}
                      className="bg-red-500 bg-opacity-80 rounded-full p-1.5 cursor-pointer touch-manipulation"
                      title={`프로필 사진 ${globalIndex + 1} 삭제`}
                    >
                      <X className="w-3 h-3 text-white" />
                      </button>
                        </div>
                    </div>
                  ))}
              
              {/* 프로필 사진이 없는 경우 */}
              {(() => {
                const hasImages = profile?.avatar_url || (profile?.profile_images?.length > 0)
                return !hasImages ? (
                <div className="w-full h-full flex-shrink-0 relative bg-gray-200 flex items-center justify-center">
                  <label className="text-center text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                    <Camera className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">프로필 사진을 추가해주세요</p>
                    <p className="text-xs mt-1 text-gray-400">클릭하여 업로드</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                ) : null
              })()}
              </div>

            {/* 하단 인디케이터 점들 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {(() => {
                const totalImages = (profile?.avatar_url ? 1 : 0) + (profile?.profile_images?.length || 0)
                return totalImages > 1 ? Array.from({ length: totalImages }, (_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                )) : null
              })()}
            </div>

            {/* 스와이프 힌트 (프로필 사진이 여러 장 있을 때만 표시) */}
            {(() => {
              const totalImages = (profile?.avatar_url ? 1 : 0) + (profile?.profile_images?.length || 0)
              return totalImages > 1 && currentImageIndex === 0 ? (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                  ← 스와이프해서 더 보기 →
                </div>
              ) : null
            })()}
          </div>

          {/* 프로필 정보 오버레이 제거 - 깔끔한 사진만 표시 */}
        </div>

        {/* 편집 버튼 (모바일) */}
        <div className="px-4 py-2 bg-white md:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">{t('profile.myProfile')}</h1>
            <div className="flex items-center gap-2">
              {isEditing ? (
                  <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                      onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm text-white"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                  </>
                ) : (
                <button
                    onClick={() => setIsEditing(true)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
                  >
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
                )}
            </div>
              </div>
            </div>

        {/* 관심사 섹션 */}
        <div className="px-4 py-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <h2 className="font-semibold text-gray-800">{t('profile.interests')}</h2>
            </div>
            
            {/* 프로필 편집 버튼 (인증 완료시만) - 데스크톱에서만 표시 */}
            {verificationStatus.isVerified && (
              <div className="hidden md:flex items-center gap-2">
                {isEditing ? (
                  <>
                    {/* 취소 버튼 */}
                    <Button 
                      onClick={() => setIsEditing(false)}
                      size="sm" 
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                    >
                      <X className="w-3 h-3 mr-1" />
                      취소
                    </Button>
                    {/* 저장 버튼 */}
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      size="sm" 
                      className="text-xs px-3 py-1 h-7 bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <Save className="w-3 h-3 mr-1" />
                      )}
                      저장
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="text-xs px-3 py-1 h-7 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    {t('profile.editProfile')}
                  </Button>
                )}
              </div>
            )}
            </div>

          {isEditing ? (
            <div className="space-y-3">
              {/* 기존 관심사 표시 */}
              <div className="flex flex-wrap gap-2">
                {editForm.interests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200 flex items-center gap-1 max-w-full truncate"
                  >
                    {(() => {
                      // 임시 하드코딩 번역 (디버깅용)
                      const hardcodedTranslations: Record<string, Record<string, string>> = {
                        ko: {
                          'profile.interests.여행': '여행',
                          'profile.interests.한국문화': '한국문화',
                          'profile.interests.음악': '음악',
                          'profile.interests.영화': '영화',
                          'profile.interests.스포츠': '스포츠',
                          'profile.interests.패션': '패션',
                          'profile.interests.게임': '게임',
                          'profile.interests.기술': '기술',
                          'profile.interests.경제': '경제',
                          'profile.interests.언어교환': '언어교환',
                          'profile.interests.K-POP': 'K-POP',
                          'profile.interests.드라마': '드라마',
                          'profile.interests.맛집': '맛집',
                          'profile.interests.독서': '독서',
                          'profile.interests.댄스': '댄스',
                          'profile.interests.미술': '미술',
                          'profile.interests.자연': '자연',
                          'profile.interests.반려동물': '반려동물',
                          'profile.interests.커피': '커피',
                          'profile.interests.뷰티': '뷰티',
                          'profile.interests.음식': '음식',
                          'profile.interests.한국어': '한국어',
                          '여행': '여행',
                          '한국문화': '한국문화',
                          '음악': '음악',
                          '영화': '영화',
                          '스포츠': '스포츠',
                          '패션': '패션',
                          '게임': '게임',
                          '기술': '기술',
                          '경제': '경제',
                          '언어교환': '언어교환',
                          'K-POP': 'K-POP',
                          '드라마': '드라마',
                          '맛집': '맛집',
                          '독서': '독서',
                          '댄스': '댄스',
                          '미술': '미술',
                          '자연': '자연',
                          '반려동물': '반려동물',
                          '커피': '커피',
                          '뷰티': '뷰티',
                          '음식': '음식',
                          '한국어': '한국어'
                        },
                        es: {
                          'profile.interests.여행': 'Viajes',
                          'profile.interests.한국문화': 'Cultura Coreana',
                          'profile.interests.음악': 'Música',
                          'profile.interests.영화': 'Películas',
                          'profile.interests.스포츠': 'Deportes',
                          'profile.interests.패션': 'Moda',
                          'profile.interests.게임': 'Juegos',
                          'profile.interests.기술': 'Tecnología',
                          'profile.interests.경제': 'Economía',
                          'profile.interests.언어교환': 'Intercambio de Idiomas',
                          'profile.interests.K-POP': 'K-POP',
                          'profile.interests.드라마': 'Dramas',
                          'profile.interests.맛집': 'Restaurantes',
                          'profile.interests.독서': 'Lectura',
                          'profile.interests.댄스': 'Baile',
                          'profile.interests.미술': 'Arte',
                          'profile.interests.자연': 'Naturaleza',
                          'profile.interests.반려동물': 'Mascotas',
                          'profile.interests.커피': 'Café',
                          'profile.interests.뷰티': 'Belleza',
                          'profile.interests.음식': 'Comida',
                          'profile.interests.한국어': 'Coreano',
                          '여행': 'Viajes',
                          '한국문화': 'Cultura Coreana',
                          '음악': 'Música',
                          '영화': 'Películas',
                          '스포츠': 'Deportes',
                          '패션': 'Moda',
                          '게임': 'Juegos',
                          '기술': 'Tecnología',
                          '경제': 'Economía',
                          '언어교환': 'Intercambio de Idiomas',
                          'K-POP': 'K-POP',
                          '드라마': 'Dramas',
                          '맛집': 'Restaurantes',
                          '독서': 'Lectura',
                          '댄스': 'Baile',
                          '미술': 'Arte',
                          '자연': 'Naturaleza',
                          '반려동물': 'Mascotas',
                          '커피': 'Café',
                          '뷰티': 'Belleza',
                          '음식': 'Comida',
                          '한국어': 'Coreano'
                        }
                      }
                      
                      const currentLang = language || 'ko'
                      const hardcoded = hardcodedTranslations[currentLang]?.[interest]
                      if (hardcoded) {
                        return hardcoded
                      }
                      
                      // interest가 이미 번역 키 형태인 경우 처리
                      if (interest.startsWith('profile.interests.')) {
                        const cleanInterest = interest.replace('profile.interests.', '')
                        return t(`profile.interests.${cleanInterest}`) || cleanInterest
                      }
                      return t(`profile.interests.${interest}`) || t(`profile.${interest}`) || interest
                    })()}
                    <button
                      onClick={() => handleRemoveInterest(interest)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* 관심사 선택 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'ko' ? `관심사 선택 (${editForm.interests.length}/5)` : `Seleccionar intereses (${editForm.interests.length}/5)`}
                  </span>
                  <Button
                    onClick={() => setShowInterestSelector(!showInterestSelector)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {showInterestSelector 
                      ? (language === 'ko' ? '숨기기' : 'Ocultar')
                      : (language === 'ko' ? '관심사 선택' : 'Seleccionar')
                    }
                  </Button>
                </div>

                {/* 관심사 선택 그리드 */}
                {showInterestSelector && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableInterests.map(interest => (
                      <Button
                        key={interest}
                        variant={editForm.interests.includes(interest) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInterestSelect(interest)}
                        disabled={!editForm.interests.includes(interest) && editForm.interests.length >= 5}
                        className={`text-xs transition-all duration-200 ${
                          editForm.interests.includes(interest)
                            ? 'bg-blue-200 text-blue-800 border-blue-300 shadow-sm'
                            : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        {(() => {
                          // 하드코딩된 번역 적용
                          const hardcodedTranslations: Record<string, Record<string, string>> = {
                            ko: {
                              '한국어': '한국어',
                              '한국문화': '한국문화',
                              '음식': '음식',
                              '여행': '여행',
                              '영화': '영화',
                              '음악': '음악',
                              '스포츠': '스포츠',
                              '패션': '패션',
                              '게임': '게임',
                              '기술': '기술',
                              '경제': '경제',
                              '언어교환': '언어교환',
                              'K-POP': 'K-POP',
                              '드라마': '드라마',
                              '맛집': '맛집',
                              '독서': '독서',
                              '댄스': '댄스',
                              '미술': '미술',
                              '자연': '자연',
                              '반려동물': '반려동물',
                              '커피': '커피',
                              '뷰티': '뷰티'
                            },
                            es: {
                              '한국어': 'Coreano',
                              '한국문화': 'Cultura Coreana',
                              '음식': 'Comida',
                              '여행': 'Viajes',
                              '영화': 'Películas',
                              '음악': 'Música',
                              '스포츠': 'Deportes',
                              '패션': 'Moda',
                              '게임': 'Juegos',
                              '기술': 'Tecnología',
                              '경제': 'Economía',
                              '언어교환': 'Intercambio de Idiomas',
                              'K-POP': 'K-POP',
                              '드라마': 'Dramas',
                              '맛집': 'Restaurantes',
                              '독서': 'Lectura',
                              '댄스': 'Baile',
                              '미술': 'Arte',
                              '자연': 'Naturaleza',
                              '반려동물': 'Mascotas',
                              '커피': 'Café',
                              '뷰티': 'Belleza'
                            }
                          }
                          
                          const currentLang = language || 'ko'
                          return hardcodedTranslations[currentLang]?.[interest] || interest
                        })()}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
                </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile?.interests?.length > 0 ? (
                profile.interests.map((interest: string, index: number) => {
                  console.log('Interest:', interest, 'Translation:', t(`profile.interests.${interest}`))
                  return (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200 max-w-full truncate"
                    >
                      {(() => {
                        // 임시 하드코딩 번역 (디버깅용)
                        const hardcodedTranslations: Record<string, Record<string, string>> = {
                          ko: {
                            'profile.interests.여행': '여행',
                            'profile.interests.한국문화': '한국문화',
                            'profile.interests.음악': '음악',
                            'profile.interests.영화': '영화',
                            'profile.interests.스포츠': '스포츠',
                            'profile.interests.패션': '패션',
                            'profile.interests.게임': '게임',
                            'profile.interests.기술': '기술',
                            'profile.interests.경제': '경제',
                            'profile.interests.언어교환': '언어교환',
                            'profile.interests.K-POP': 'K-POP',
                            'profile.interests.드라마': '드라마',
                            'profile.interests.맛집': '맛집',
                            'profile.interests.독서': '독서',
                            'profile.interests.댄스': '댄스',
                            'profile.interests.미술': '미술',
                            'profile.interests.자연': '자연',
                            'profile.interests.반려동물': '반려동물',
                            'profile.interests.커피': '커피',
                            'profile.interests.뷰티': '뷰티',
                            'profile.interests.음식': '음식',
                            'profile.interests.한국어': '한국어',
                            '여행': '여행',
                            '한국문화': '한국문화',
                            '음악': '음악',
                            '영화': '영화',
                            '스포츠': '스포츠',
                            '패션': '패션',
                            '게임': '게임',
                            '기술': '기술',
                            '경제': '경제',
                            '언어교환': '언어교환',
                            'K-POP': 'K-POP',
                            '드라마': '드라마',
                            '맛집': '맛집',
                            '독서': '독서',
                            '댄스': '댄스',
                            '미술': '미술',
                            '자연': '자연',
                            '반려동물': '반려동물',
                            '커피': '커피',
                            '뷰티': '뷰티',
                            '음식': '음식',
                            '한국어': '한국어'
                          },
                          es: {
                            'profile.interests.여행': 'Viajes',
                            'profile.interests.한국문화': 'Cultura Coreana',
                            'profile.interests.음악': 'Música',
                            'profile.interests.영화': 'Películas',
                            'profile.interests.스포츠': 'Deportes',
                            'profile.interests.패션': 'Moda',
                            'profile.interests.게임': 'Juegos',
                            'profile.interests.기술': 'Tecnología',
                            'profile.interests.경제': 'Economía',
                            'profile.interests.언어교환': 'Intercambio de Idiomas',
                            'profile.interests.K-POP': 'K-POP',
                            'profile.interests.드라마': 'Dramas',
                            'profile.interests.맛집': 'Restaurantes',
                            'profile.interests.독서': 'Lectura',
                            'profile.interests.댄스': 'Baile',
                            'profile.interests.미술': 'Arte',
                            'profile.interests.자연': 'Naturaleza',
                            'profile.interests.반려동물': 'Mascotas',
                            'profile.interests.커피': 'Café',
                            'profile.interests.뷰티': 'Belleza',
                            'profile.interests.음식': 'Comida',
                            'profile.interests.한국어': 'Coreano',
                            '여행': 'Viajes',
                            '한국문화': 'Cultura Coreana',
                            '음악': 'Música',
                            '영화': 'Películas',
                            '스포츠': 'Deportes',
                            '패션': 'Moda',
                            '게임': 'Juegos',
                            '기술': 'Tecnología',
                            '경제': 'Economía',
                            '언어교환': 'Intercambio de Idiomas',
                            'K-POP': 'K-POP',
                            '드라마': 'Dramas',
                            '맛집': 'Restaurantes',
                            '독서': 'Lectura',
                            '댄스': 'Baile',
                            '미술': 'Arte',
                            '자연': 'Naturaleza',
                            '반려동물': 'Mascotas',
                            '커피': 'Café',
                            '뷰티': 'Belleza',
                            '음식': 'Comida',
                            '한국어': 'Coreano'
                          }
                        }
                        
                        const currentLang = language || 'ko'
                        const hardcoded = hardcodedTranslations[currentLang]?.[interest]
                        if (hardcoded) {
                          console.log('Hardcoded translation found:', interest, '->', hardcoded)
                          return hardcoded
                        }
                        
                        // interest가 이미 번역 키 형태인 경우 처리
                        if (interest.startsWith('profile.interests.')) {
                          const cleanInterest = interest.replace('profile.interests.', '')
                          const translated = t(`profile.interests.${cleanInterest}`)
                          console.log('Clean interest:', cleanInterest, 'Translation:', translated)
                          return translated || cleanInterest
                        }
                        
                        const translated = t(`profile.interests.${interest}`) || t(`profile.${interest}`) || interest
                        console.log('Regular interest:', interest, 'Translation:', translated)
                        return translated
                      })()}
                    </span>
                  )
                })
              ) : (
                <span className="px-3 py-1 bg-white text-gray-500 rounded-full text-sm border border-gray-200">
                  {t('profile.noInterestsSet')}
                </span>
              )}
              </div>
            )}
        </div>
        
        {/* 기본 정보 섹션 */}
        <div className="px-4 py-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-800">{t('profile.academicCareerInfo')}</h2>
          </div>

                {isEditing ? (
            <div className="space-y-4">
              {/* 기본 정보 입력 필드들 */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-gray-600 text-sm block mb-1">{t('profile.koreanName')}</label>
                  <Input
                    value={editForm.korean_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, korean_name: e.target.value }))}
                    placeholder={t('profile.koreanName') + '을 입력하세요'}
                    className="text-sm"
                  />
              </div>
              
                <div>
                  <label className="text-gray-600 text-sm block mb-1">{t('profile.nickname')}</label>
                  <Input
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder={t('profile.nickname') + '을 입력하세요'}
                    className={`text-sm ${editForm.nickname && !validateNickname(editForm.nickname) ? 'border-red-500' : ''}`}
                  />
                  {editForm.nickname && !validateNickname(editForm.nickname) && (
                    <p className="text-red-500 text-xs mt-1">
                      {language === 'ko' ? '알파벳, 숫자, 특수문자만 사용 가능합니다' : 'Solo se permiten letras, números y caracteres especiales'}
                    </p>
                )}
              </div>

                <div>
                  <label className="text-gray-600 text-sm block mb-1">{t('profile.spanishName')}</label>
                    <Input
                    value={editForm.spanish_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, spanish_name: e.target.value }))}
                    placeholder={t('profile.spanishName') + '을 입력하세요'}
                    className="text-sm"
                  />
                  </div>
                
                <div>
                  <label className="text-gray-600 text-sm block mb-1">사용자 타입</label>
                  <Select value={editForm.user_type} onValueChange={(value) => setEditForm(prev => ({ ...prev, user_type: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="worker">직장인</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              
                {/* 사용자 타입에 따른 입력 필드 */}
                {editForm.user_type === 'student' ? (
                <>
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">대학교</label>
                      <Input
                        value={editForm.university}
                        onChange={(e) => setEditForm(prev => ({ ...prev, university: e.target.value }))}
                        placeholder="대학교를 입력하세요"
                        className="text-sm"
                      />
                  </div>
                  
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">전공</label>
                      <Input
                        value={editForm.major}
                        onChange={(e) => setEditForm(prev => ({ ...prev, major: e.target.value }))}
                        placeholder="전공을 입력하세요"
                        className="text-sm"
                      />
                  </div>
                    
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">학년</label>
                      <Input
                        value={editForm.grade}
                        onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                        placeholder="학년을 입력하세요"
                        className="text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">{t('profile.occupation')}</label>
                      <Input
                        value={editForm.occupation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, occupation: e.target.value }))}
                        placeholder={t('profile.occupation') + '을 입력하세요'}
                        className="text-sm"
                      />
                  </div>
                  
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">{t('profile.company')}</label>
                      <Input
                        value={editForm.company}
                        onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                        placeholder={t('profile.company') + '을 입력하세요'}
                        className="text-sm"
                      />
                  </div>
                    
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">{t('profile.experience')}</label>
                    <Input
                        value={editForm.career}
                        onChange={(e) => setEditForm(prev => ({ ...prev, career: e.target.value }))}
                        placeholder={t('profile.experience') + '을 입력하세요'}
                        className="text-sm"
                      />
                </div>
                  </>
                )}
                
                <div>
                  <label className="text-gray-600 text-sm block mb-1">{t('profile.selfIntroduction')}</label>
                <Textarea
                    value={editForm.introduction}
                    onChange={(e) => setEditForm(prev => ({ ...prev, introduction: e.target.value }))}
                    placeholder={t('profile.selfIntroduction') + '를 입력하세요'}
                    className="text-sm min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 한국이름 */}
              <div className="flex items-center justify-between">
                <span className='text-gray-600 text-sm'>{t('profile.koreanName')}</span>
                <span className="text-gray-800 text-sm font-medium truncate max-w-[60%] text-right">
                  {profile?.korean_name || t('profile.koreanName') + ' 없음'}
                </span>
            </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 닉네임 */}
              <div className="flex items-center justify-between">
                <span className='text-gray-600 text-sm'>{t('profile.nickname')}</span>
                <span className="text-gray-800 text-sm font-medium truncate max-w-[60%] text-right">
                  {profile?.nickname || t('profile.nickname') + ' 미설정'}
                </span>
                </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 스페인어 이름 */}
              <div className="flex items-center justify-between">
                <span className='text-gray-600 text-sm'>{t('profile.spanishName')}</span>
                <span className="text-gray-800 text-sm font-medium truncate max-w-[60%] text-right">
                  {profile?.spanish_name || t('profile.spanishName') + ' 없음'}
                </span>
          </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 사용자 타입에 따른 정보 표시 */}
              {profile?.userType === 'student' || profile?.user_type === 'student' ? (
                <>
                  {/* 학력 정보 (대학생인 경우) */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">대학교</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {profile?.university || '대학교 없음'}
                    </span>
      </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">전공</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {profile?.major || '전공 없음'}
                    </span>
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">학년</span>
                    <span className="text-gray-800 text-sm font-medium">
                      {profile?.grade || '학년 없음'}
                    </span>
              </div>
                </>
              ) : (
                <>
                  {/* 직업 정보 (직장인인 경우) */}
                  <div className="flex items-center justify-between">
                    <span className='text-gray-600 text-sm'>{t('profile.occupation')}</span>
                    <span className="text-gray-800 text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.occupation || t('profile.occupation') + ' 없음'}
                    </span>
            </div>
            
                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className='text-gray-600 text-sm'>{t('profile.company')}</span>
                    <span className="text-gray-800 text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.company || t('profile.company') + ' 없음'}
                    </span>
          </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className='text-gray-600 text-sm'>{t('profile.experience')}</span>
                    <span className="text-gray-800 text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.career || t('profile.noExperience')}
                    </span>
              </div>
                </>
              )}

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 자기소개 */}
              <div className="flex items-start justify-between">
                <span className='text-gray-600 text-sm'>{t('profile.selfIntroduction')}</span>
                <span className="text-gray-800 text-sm font-medium text-right max-w-[60%]">
                  {profile?.introduction || t('profile.noSelfIntroduction')}
                </span>
          </div>
        </div>
      )}
                  </div>

        {/* 스토리 설정 섹션 */}
        <div className="px-4 py-4 bg-white">
      <StorySettings />
            </div>
        
        {/* 알림 설정 섹션 */}
        <div className="px-4 py-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-800">{t('myTab.notificationSettings')}</h2>
        </div>
        
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-purple-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
              <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200 text-xs">{t('myTab.webPushNotification')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('myTab.webPushDescription')}</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.webPush}
              onCheckedChange={(checked) => handleNotificationChange('webPush', checked)}
            />
          </div>
          
            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-purple-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
              <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200 text-xs">{t('myTab.emailNotification')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('myTab.emailDescription')}</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          
            <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-purple-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200 text-xs">{t('myTab.marketingNotification')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('myTab.marketingDescription')}</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.marketing}
              onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
            />
          </div>
        </div>
      </div>

          {/* 충전소 섹션 구분선 */}
          <div className="mx-4 my-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <img src="/charging-title.png" alt="충전소" className="w-5 h-5" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('storeTab.title')}</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            </div>
          </div>

          {/* 충전소 섹션 */}
          <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-t border-blue-200 dark:border-blue-800">
            <ChargingHeader />
            <PointsCard />
            <ChargingTab />
          </div>


        {/* 하단 여백 */}
        <div className="h-20"></div>
        
      </div>
    </div>
  )
}