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
  MessageSquare
} from 'lucide-react'
import StorySettings from './StorySettings'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import { KoreanUserProfile, LatinUserProfile } from '@/types/user'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

// 목업 데이터 - 현지인 사용자 프로필
const mockLatinUserProfile: LatinUserProfile = {
  id: 'user1',
  name: '마리아 곤잘레스',
  email: 'maria.gonzalez@email.com',
  avatar: '👩‍🎓',
  isKorean: false,
  country: 'MX',
  university: '서울대학교',
  major: '한국어교육학과',
  grade: '3학년',
  userType: 'student',
  introduction: '안녕하세요! 한국어를 공부하고 있는 마리아입니다. 한국 문화와 언어에 관심이 많아서 한국에 왔어요. 함께 한국어를 배워봐요! 😊',
  availableTime: ['평일저녁', '주말오후'],
  interests: ['한국어', '한국문화', '요리', '여행', '음악'],
  joinDate: '2023-09-01',
  level: '중급',
  exchangeCount: 12,
  points: 2847,
  storySettings: {
    autoPublic: true,
    showInProfile: true
  },
  coupons: [
    {
      id: '1',
      type: '15분 상담',
      quantity: 2,
      expiresAt: undefined,
      isUsed: false,
      price: '$2'
    }
  ],
  purchaseHistory: [
    {
      id: '1',
      item: '15분 상담 쿠폰 2장',
      amount: 2,
      date: '2024-01-15',
      status: 'completed'
    }
  ]
}

// 목업 데이터 - 한국인 사용자 프로필
const mockKoreanUserProfile: KoreanUserProfile = {
  id: 'user2',
  name: '김민지',
  email: 'kim.minji@email.com',
  avatar: '👩‍💼',
  isKorean: true,
  country: 'KR',
  university: '연세대학교',
  major: '국제학과',
  grade: '4학년',
  userType: 'student',
  introduction: '안녕하세요! 한국인 김민지입니다. 라틴 문화에 관심이 많아서 스페인어를 공부하고 있어요. 서로의 문화를 나누며 소통하고 싶어요! 😊',
  availableTime: ['평일오후', '주말전체'],
  interests: ['스페인어', '라틴문화', '여행', '음악', '요리'],
  joinDate: '2023-08-15',
  level: '고급',
  exchangeCount: 25,
  points: 4567,
  koreanRank: 8,
  totalKoreanUsers: 150,
  storySettings: {
    autoPublic: true,
    showInProfile: true
  }
}

  // Mock user profile for testing verification guard
  const mockUserProfileForGuard = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: '👤',
    isKorean: false,
    country: 'BR',
    introduction: 'Test user for verification guard',
    availableTime: ['평일오후'],
    interests: ['한국어'],
    userType: 'student',
    exchangeCount: 0,
    points: 0,
    joinDate: '2024-01-01',
    level: '초급',
    storySettings: {
      autoPublic: true,
      showInProfile: true
    },
    kakao_linked_at: null,
    wa_verified_at: null,
    sms_verified_at: null,
    email_verified_at: null
  }

  // Mock verified user profile for testing success state
  const mockVerifiedUserProfileForGuard = {
    id: 'user-2',
    name: 'Verified User',
    email: 'verified@example.com',
    avatar: '✅',
    isKorean: false,
    country: 'BR',
    introduction: 'Verified user for testing success state',
    availableTime: ['평일오후'],
    interests: ['한국어'],
    userType: 'student',
    exchangeCount: 0,
    points: 0,
    joinDate: '2024-01-01',
    level: '초급',
    storySettings: {
      autoPublic: true,
      showInProfile: true
    },
    kakao_linked_at: null,
    wa_verified_at: '2024-01-15T10:00:00Z',
    sms_verified_at: null,
    email_verified_at: null
  }








// 목업 데이터 - 알림 설정
const mockNotificationSettings = {
  webPush: true,
  email: false,
  sms: false,
  marketing: true
}

export default function MyTab() {
  const { t } = useLanguage()
  const { user, token, refreshSession } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [notificationSettings, setNotificationSettings] = useState(mockNotificationSettings)
  const [loading, setLoading] = useState(true)
  const [profileImages, setProfileImages] = useState<File[]>([])
  const [mainProfileImage, setMainProfileImage] = useState<string | null>(null)
  
  // 인증 상태 확인
  const [authStatus, setAuthStatus] = useState({
    emailVerified: false,
    smsVerified: false,
    loading: true
  })
  
  // 운영자 상태 확인 (false: 로딩 중/일반 사용자, true: 운영자)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  
  // 운영자 상태 확인 함수
  const checkAdminStatus = async () => {
    if (!user?.id && !user?.email) return
    
    try {
      const params = new URLSearchParams()
      if (user?.id) params.append('userId', user.id)
      if (user?.email) params.append('email', user.email)
      
      const response = await fetch(`/api/admin/check?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
        console.log('MyTab: 운영자 상태 확인됨:', data.isAdmin)
      } else {
        console.log('MyTab: 운영자 상태 확인 실패:', response.status)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('MyTab: 운영자 상태 확인 실패:', error)
      setIsAdmin(false)
    } finally {
      setAdminCheckComplete(true)
    }
  }
  
  // 현재 메인 프로필 이미지를 가져오는 함수 (서버 데이터 우선)
  const getCurrentMainImage = () => {
    console.log('[PROFILE] getCurrentMainImage 호출:', {
      profile_main_profile_image: !!profile?.main_profile_image,
      profile_profile_images_length: profile?.profile_images?.length,
      profile_profile_image: !!profile?.profile_image,
      mainProfileImage: !!mainProfileImage
    })
    
    // 서버 데이터를 우선으로 확인
    if (profile?.main_profile_image && profile.main_profile_image.trim() !== '') {
      console.log('[PROFILE] main_profile_image 사용:', profile.main_profile_image.substring(0, 50) + '...')
      return profile.main_profile_image
    }
    if (profile?.profile_images && profile.profile_images.length > 0 && profile.profile_images[0] && profile.profile_images[0].trim() !== '') {
      console.log('[PROFILE] profile_images[0] 사용:', profile.profile_images[0].substring(0, 50) + '...')
      return profile.profile_images[0]
    }
    if (profile?.profile_image && profile.profile_image.trim() !== '') {
      console.log('[PROFILE] profile_image 사용:', profile.profile_image.substring(0, 50) + '...')
      return profile.profile_image
    }
    // 서버 데이터가 없을 때만 로컬 상태 사용
    if (mainProfileImage && mainProfileImage.trim() !== '') {
      console.log('[PROFILE] mainProfileImage 사용:', mainProfileImage.substring(0, 50) + '...')
      return mainProfileImage
    }
    console.log('[PROFILE] 이미지 없음')
    return null
  }
  
  // 실제 사용자 데이터 로드 함수
  const loadUserProfile = async (showLoading = true) => {
      if (!user?.id || !token) {
        console.log('사용자 ID 또는 토큰이 없어서 프로필 로드 건너뜀')
        if (showLoading) setLoading(false)
        return
      }

      // 운영자 체크 먼저 수행
      console.log('현재 isAdmin 상태:', isAdmin)
      if (isAdmin) {
        console.log('운영자 확인됨, 프로필 로드 건너뛰기')
        if (showLoading) setLoading(false)
        return
      }

      try {
        if (showLoading) setLoading(true)
        console.log('프로필 로드 시작:', { userId: user.id, token: !!token })
        
        const response = await fetch(`/api/profile?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(token)}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('프로필 로드 응답:', { 
          status: response.status, 
          statusText: response.statusText,
          ok: response.ok 
        })

        const result = await response.json()
        console.log('프로필 로드 데이터:', result)

        if (response.ok) {
          const newProfile = {
            ...result.user,
            ...result.profile,
            points: result.points?.total_points || 0,
            daily_points: result.points?.daily_points || 0
          }
          console.log('설정할 프로필 데이터:', newProfile)
          console.log('프로필 이미지 데이터 확인:', {
            profile_images: newProfile.profile_images,
            profile_images_length: newProfile.profile_images?.length,
            profile_images_first: newProfile.profile_images?.[0]?.substring(0, 50) + '...',
            profile_image: newProfile.profile_image,
            main_profile_image: newProfile.main_profile_image
          })
          setProfile(newProfile)
          
          // 프로필 이미지 설정 (서버 데이터로 복원)
          if (newProfile.profile_images && newProfile.profile_images.length > 0) {
            setMainProfileImage(newProfile.main_profile_image || newProfile.profile_images[0])
            console.log('[PROFILE] 프로필 이미지 설정됨:', newProfile.main_profile_image || newProfile.profile_images[0])
          } else if (newProfile.profile_image) {
            setMainProfileImage(newProfile.profile_image)
            console.log('[PROFILE] 단일 프로필 이미지 설정됨:', newProfile.profile_image)
          } else {
            // 서버에 이미지가 없을 때는 기존 상태 유지
            console.log('[PROFILE] 서버에 프로필 이미지 없음, 기존 상태 유지')
          }
          
          // 헤더 포인트 업데이트 이벤트 발생
          window.dispatchEvent(new CustomEvent('pointsUpdated'))
        } else {
          console.error('프로필 로드 실패:', result.error)
          console.error('응답 상태:', response.status)
          console.error('사용자 ID:', user?.id)
          
          // 인증이 필요한 경우
          if (result.needsVerification) {
            console.log('프로필이 없습니다. 기본 프로필을 생성합니다.')
            
            // 기본 프로필 생성 시도
            try {
              const initResponse = await fetch('/api/profile/init', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${encodeURIComponent(token)}`
                }
              })
              
              if (initResponse.ok) {
                console.log('기본 프로필이 생성되었습니다.')
                // 프로필 다시 로드
                const profileResponse = await fetch(`/api/profile?userId=${user.id}`, {
                  headers: {
                    'Authorization': `Bearer ${encodeURIComponent(token)}`,
                    'Content-Type': 'application/json'
                  }
                })
                const profileResult = await profileResponse.json()
                
                if (profileResponse.ok) {
                  const newProfile = {
                    ...profileResult.user,
                    ...profileResult.profile,
                    points: profileResult.points?.total_points || 0,
                    daily_points: profileResult.points?.daily_points || 0
                  }
                  setProfile(newProfile)
                  
                  // 프로필 이미지 설정 (서버 데이터로 복원)
                  if (newProfile.profile_images && newProfile.profile_images.length > 0) {
                    setMainProfileImage(newProfile.main_profile_image || newProfile.profile_images[0])
                    console.log('[PROFILE] 초기화 시 프로필 이미지 설정됨:', newProfile.main_profile_image || newProfile.profile_images[0])
                  } else if (newProfile.profile_image) {
                    setMainProfileImage(newProfile.profile_image)
                    console.log('[PROFILE] 초기화 시 단일 프로필 이미지 설정됨:', newProfile.profile_image)
                  } else {
                    console.log('[PROFILE] 초기화 시 서버에 프로필 이미지 없음, 기존 상태 유지')
                  }
                }
              } else {
                console.log('프로필 생성 실패.')
                if (!isAdmin) {
                  router.push('/verification')
                } else {
                  console.log('운영자 계정: isAdmin 상태로 대시보드 표시')
                  // isAdmin이 true면 자동으로 AnalyticsDashboard 렌더링됨
                }
              }
            } catch (error) {
              console.error('프로필 초기화 오류:', error)
              if (!isAdmin) {
                router.push('/verification')
              } else {
                console.log('운영자 계정: 오류 발생 시에도 isAdmin 상태로 대시보드 표시')
                // isAdmin이 true면 자동으로 AnalyticsDashboard 렌더링됨
              }
            }
            return
          }
        }
      } catch (error) {
        console.error('프로필 로드 오류:', error)
      } finally {
        if (showLoading) setLoading(false)
      }
  }

  // 운영자 상태 확인 (한 번만 실행)
  useEffect(() => {
    if (user?.id && !adminCheckComplete) {
      checkAdminStatus()
    }
  }, [user?.id]) // adminCheckComplete 제거로 무한 루프 방지

  // 실제 사용자 데이터 로드 (운영자 체크 완료 후)
  useEffect(() => {
    // 운영자 상태 확인이 완료된 후에만 실행
    if (user?.id && adminCheckComplete) {
      if (isAdmin) {
        // 운영자인 경우 바로 대시보드 표시
        console.log('운영자 확인됨, 대시보드 표시')
        setLoading(false)
      } else {
        // 일반 사용자인 경우 프로필 로드
        loadUserProfile()
      }
    }
  }, [user?.id, adminCheckComplete, isAdmin])

  // 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user?.id) {
        setAuthStatus({ emailVerified: false, smsVerified: false, loading: false })
        return
      }

      try {
        const response = await fetch(`/api/auth/status?userId=${user.id}`)
        const result = await response.json()

        if (response.ok) {
          setAuthStatus({
            emailVerified: result.emailVerified || false,
            smsVerified: result.smsVerified || false,
            loading: false
          })
        } else {
          setAuthStatus({ emailVerified: false, smsVerified: false, loading: false })
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
        setAuthStatus({ emailVerified: false, smsVerified: false, loading: false })
      }
    }

    checkAuthStatus()
  }, [user?.id])
  
  // 관심사 번역 함수
  
  const translateInterestTag = (interest: string) => {
    const interestMap: { [key: string]: string } = {
      '한국어': t('profile.koreanLanguage'),
      '한국문화': t('profile.koreanCulture'),
      '요리': t('profile.cooking'),
      '여행': t('profile.travel'),
      '음악': t('profile.music'),
      '영화': '영화', // 기본값
      '패션': '패션', // 기본값
      '스포츠': '스포츠' // 기본값
    }
    return interestMap[interest] || interest
  }
  
  const translateCouponType = (type: string) => {
    if (type.includes('15분')) {
      return t('profile.consultation15min')
    }
    return type
  }
  
  // 프로필 사진 업로드 핸들러 (여러 개)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles: File[] = []
      
      Array.from(files).forEach(file => {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}: ${t('myTab.fileSizeLimit')}`)
          return
        }
        
        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          alert(`${file.name}: ${t('myTab.imageOnly')}`)
          return
        }
        
        newFiles.push(file)
      })
      
      if (newFiles.length > 0) {
        setProfileImages(prev => [...prev, ...newFiles])
        
        // 첫 번째 사진을 Base64로 변환하여 대표 사진으로 설정
        if (profileImages.length === 0 && newFiles.length > 0) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64String = e.target?.result as string
            setMainProfileImage(base64String)
            console.log('[PROFILE] 첫 번째 이미지를 Base64로 설정:', base64String.substring(0, 50) + '...')
          }
          reader.readAsDataURL(newFiles[0])
        }
      }
    }
  }

  // 대표 프로필 사진 설정
  const setMainImage = (imageUrl: string) => {
    // blob URL인 경우 Base64로 변환
    if (imageUrl.startsWith('blob:')) {
      // blob URL에서 File 객체를 찾아서 Base64로 변환
      const fileIndex = profileImages.findIndex(file => URL.createObjectURL(file) === imageUrl)
      if (fileIndex !== -1) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64String = e.target?.result as string
          setMainProfileImage(base64String)
          console.log('[PROFILE] blob URL을 Base64로 변환:', base64String.substring(0, 50) + '...')
        }
        reader.readAsDataURL(profileImages[fileIndex])
      }
    } else {
      // 이미 Base64인 경우 그대로 사용
      setMainProfileImage(imageUrl)
    }
  }

  // 프로필 사진 삭제
  const removeImage = (index: number) => {
    setProfileImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      // 대표 사진이 삭제된 경우 첫 번째 사진을 대표로 설정
      if (getCurrentMainImage() === URL.createObjectURL(prev[index]) && newImages.length > 0) {
        setMainProfileImage(URL.createObjectURL(newImages[0]))
      } else if (newImages.length === 0) {
        setMainProfileImage(null)
      }
      return newImages
    })
  }

  // 프로필 편집 처리
  const handleSaveProfile = async () => {
    try {
      // 프로필 사진들을 Base64로 변환
      let profileImagesBase64: string[] = []
      if (profileImages.length > 0) {
        profileImagesBase64 = await Promise.all(
          profileImages.map(file => 
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
          )
        )
      }

      // 기존 프로필 이미지들과 새로 업로드된 이미지들을 합치기
      const existingImages = profile?.profile_images || []
      const allProfileImages = [...existingImages, ...profileImagesBase64]
      
      // 대표 프로필 이미지 결정: mainProfileImage 상태를 우선 사용
      let finalMainImage = mainProfileImage
      if (!finalMainImage || finalMainImage.trim() === '') {
        // mainProfileImage가 없으면 새로 업로드한 첫 번째 이미지 사용
        if (profileImagesBase64.length > 0) {
          finalMainImage = profileImagesBase64[0]
        } else if (allProfileImages.length > 0) {
          // 기존 이미지가 있으면 첫 번째 이미지 사용
          finalMainImage = allProfileImages[0]
        }
      }
      
      const requestData = {
        ...profile,
        profile_images: allProfileImages,
        main_profile_image: finalMainImage
      }
      
      console.log('프로필 저장 요청 데이터:', {
        existing_images_count: existingImages.length,
        new_images_count: profileImagesBase64.length,
        total_images_count: allProfileImages.length,
        main_profile_image: finalMainImage ? '있음' : '없음',
        main_profile_image_preview: finalMainImage?.substring(0, 50) + '...',
        full_request_data: requestData
      })

      let response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })

      // 인증 실패 시 토큰 갱신 시도
      if (response.status === 401) {
        console.log('[PROFILE] 인증 실패, 토큰 갱신 시도')
        const refreshSuccess = await refreshSession()
        if (refreshSuccess) {
          // 갱신된 토큰으로 다시 시도
          response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
          })
        }
      }

      console.log('프로필 저장 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const responseData = await response.json()
      console.log('프로필 저장 응답 데이터:', responseData)
      console.log('프로필 저장 응답 데이터 타입:', typeof responseData)
      console.log('프로필 저장 응답 데이터 키들:', Object.keys(responseData))
      console.log('프로필 저장 성공 여부:', response.ok)
      console.log('저장된 사용자 데이터:', responseData.user)

      if (response.ok) {
        setIsEditing(false)
        setProfileImages([]) // 업로드 후 초기화
        
        // 서버에서 최신 프로필 데이터 다시 로드
        await loadUserProfile(false)
        
        alert(t('myTab.profileSaved'))
      } else {
        console.error('프로필 저장 실패:', responseData)
        alert(`${t('myTab.profileSaveFailed')}: ${responseData.error || t('myTab.unknownError')}`)
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error)
      alert(t('myTab.profileSaveError'))
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // 원래 데이터로 되돌리기 위해 다시 로드
    if (user?.id) {
      const loadUserProfile = async () => {
        try {
          const response = await fetch(`/api/profile?userId=${user.id}`)
          const result = await response.json()
          if (response.ok) {
            const newProfile = {
              ...result.user,
              ...result.profile,
              points: result.points?.total_points || 0,
              daily_points: result.points?.daily_points || 0
            }
            setProfile(newProfile)
            
            // 프로필 이미지 설정 (서버 데이터로 복원)
            if (newProfile.profile_images && newProfile.profile_images.length > 0) {
              setMainProfileImage(newProfile.main_profile_image || newProfile.profile_images[0])
              console.log('[PROFILE] 취소 시 프로필 이미지 설정됨:', newProfile.main_profile_image || newProfile.profile_images[0])
            } else if (newProfile.profile_image) {
              setMainProfileImage(newProfile.profile_image)
              console.log('[PROFILE] 취소 시 단일 프로필 이미지 설정됨:', newProfile.profile_image)
            } else {
              console.log('[PROFILE] 취소 시 서버에 프로필 이미지 없음, 기존 상태 유지')
            }
          }
        } catch (error) {
          console.error('프로필 로드 오류:', error)
        }
      }
      loadUserProfile()
    }
  }

  // 알림 설정 변경
  const handleNotificationChange = (key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 여기서 실제 API 호출
    console.log('알림 설정 변경:', key, value)
  }



  // 리더보드 순위 색상
  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
    if (rank <= 10) return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300'
    return 'bg-gradient-to-r from-brand-100 to-brand-200 text-brand-700 border-brand-300'
  }

  // 로딩 중일 때
  if (loading && !isAdmin) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <ProfileSkeleton />
      </div>
    )
  }

  // 운영자일 때 분석 대시보드 표시 (로딩 중이어도 표시)
  if (isAdmin) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <AnalyticsDashboard />
      </div>
    )
  }

  // 프로필이 없을 때
  if (!profile) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4 font-['Inter']">{t('myTab.profileLoadFailed')}</p>
            <Button onClick={() => window.location.reload()}>
              {t('buttons.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto -mt-4 sm:-mt-4 md:-mt-4 lg:-mt-4 px-1 sm:px-1 md:px-2 lg:px-4 xl:px-6">
      {/* 인증이 필요한 경우 인증하기 버튼 표시 */}
      {authStatus.loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">인증 상태 확인 중...</p>
          </div>
        </div>
      ) : !authStatus.smsVerified && !profile ? (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200/50 rounded-3xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <Settings className="w-10 h-10 text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">인증 후 이용가능합니다</h2>
          
          
          <div className="mt-8 space-y-3">
            {!isAdmin && (
              <Button 
                onClick={() => router.push('/verification')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 text-lg"
              >
                <Settings className="w-5 h-5 mr-2" />
                인증하기
              </Button>
            )}
            
          </div>
        </div>
      ) : (
        <>
          {/* 내 프로필 - 맨 위로 이동 */}
          <div className="bg-gradient-to-br from-brand-50 to-mint-50 border-2 border-brand-200/50 rounded-3xl p-3 sm:p-6 pt-2 sm:pt-6">
        <div className="space-y-4 sm:space-y-6">
          {/* 프로필 사진 관리 - 맨 위로 이동 */}
          <div className="flex flex-col items-center gap-4">
            {/* 대표 프로필 사진 */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-brand-100 to-mint-100 rounded-full flex items-center justify-center text-4xl sm:text-6xl shadow-lg border-4 border-white overflow-hidden">
                {(() => {
                  const currentImage = getCurrentMainImage()
                  console.log('이미지 표시 로직 확인:', {
                    currentImage: !!currentImage,
                    mainProfileImage: !!mainProfileImage,
                    profile_images_exists: !!profile?.profile_images,
                    profile_images_length: profile?.profile_images?.length,
                    profile_image_exists: !!profile?.profile_image,
                    main_profile_image_exists: !!profile?.main_profile_image
                  })
                  
                  if (currentImage && currentImage.trim() !== '') {
                    console.log('현재 이미지 사용:', currentImage.substring(0, 50) + '...')
                    return (
                      <img 
                        src={currentImage} 
                        alt="대표 프로필 사진" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('이미지 로드 실패:', e)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )
                  } else {
                    console.log('기본 텍스트 표시 - currentImage:', currentImage)
                    return (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <div className="text-2xl mb-2">📷</div>
                        <div className="text-sm text-gray-600 font-medium leading-tight">
                          {t('myTab.addProfilePhoto')}
                        </div>
                      </div>
                    )
                  }
                })()}
              </div>
              
              {/* 편집 모드일 때 프로필 사진 업로드 버튼 */}
              {isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload-edit"
                  />
                  <label
                    htmlFor="profile-image-upload-edit"
                    className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 cursor-pointer transition-colors"
                  >
                    📷
                  </label>
                </div>
              )}
            </div>

            {/* 프로필 사진 목록 (편집 모드일 때만) */}
            {isEditing && profileImages.length > 0 && (
              <div className="w-full max-w-xs">
                <p className="text-xs text-gray-600 mb-2 text-center font-['Inter']">{t('myTab.uploadedPhotos')}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {profileImages.map((file, index) => (
                    <div key={index} className="relative">
                      <div 
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          getCurrentMainImage() === URL.createObjectURL(file) 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            const base64String = e.target?.result as string
                            setMainProfileImage(base64String)
                            console.log('[PROFILE] 히스토리에서 Base64로 설정:', base64String.substring(0, 50) + '...')
                          }
                          reader.readAsDataURL(file)
                        }}
                      >
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`${t('myTab.profilePhoto')} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      {/* 대표 사진 표시 */}
                      {getCurrentMainImage() === URL.createObjectURL(file) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                          ★
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500 font-['Inter']">{t('profile.joinDate')}: {profile?.joinDate || user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : 'N/A'}</p>
              {isEditing && (
                <p className="text-xs text-blue-500 mt-1 font-['Inter']">{t('myTab.photoSelectionTip')}</p>
              )}
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 px-2 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 font-['Inter']">{t('profile.myProfile')}</h2>
              <div className="flex flex-wrap gap-2">
                {/* 사용자 타입 표시 */}
                <Badge
                  variant="outline"
                  className="text-xs border-blue-300 text-blue-600"
                >
                  {profile.is_korean ? `🇰🇷 ${t('myTab.korean')}` : `🌎 ${t('myTab.local')}`}
                </Badge>
                
                {/* 직장인/학생 구분 표시 및 편집 */}
              {isEditing ? (
                <Select 
                  value={profile.user_type || 'student'} 
                  onValueChange={(value) => setProfile({ ...profile, user_type: value })}
                >
                  <SelectTrigger className="w-32 border-purple-300 text-purple-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">🎓 {t('myTab.student')}</SelectItem>
                    <SelectItem value="professional">💼 {t('myTab.professional')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs border-purple-300 text-purple-600"
                >
                  {profile.user_type === 'professional' ? `💼 ${t('myTab.professional')}` : `🎓 ${t('myTab.student')}`}
                </Badge>
              )}
                
                {/* 인증 상태 표시 */}
                <Badge
                  variant="outline"
                  className="text-xs border-green-300 text-green-600"
                >
                  🔒 {t('myTab.profileVerified')}
                </Badge>
                
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleSaveProfile}
                      className="bg-brand-500 hover:bg-brand-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t('buttons.save')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('buttons.cancel')}
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('profile.edit')}
                  </Button>
                )}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block font-['Inter']">{t('profile.name')}</label>
                {isEditing ? (
                  <Input
                    value={profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.email || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="border-brand-200 focus:border-brand-500"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.email || t('myTab.noName')}</p>
                )}
              </div>
              
              {/* 스페인어 이름 필드 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block font-['Inter']">{t('profile.spanishName')}</label>
                {isEditing ? (
                  <Input
                    value={profile.spanish_name || ''}
                    onChange={(e) => setProfile({ ...profile, spanish_name: e.target.value })}
                    className="border-brand-200 focus:border-brand-500"
                    placeholder={t('profile.spanishNamePlaceholder')}
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profile.spanish_name || t('profile.noSpanishName')}</p>
                )}
              </div>
              
              {/* 학생인 경우에만 대학교/전공 표시 */}
              {profile.user_type === 'student' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">{t('profile.university')}</label>
                    {isEditing ? (
                      <Input
                        value={profile.university || ''}
                        onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                        className="border-brand-200 focus:border-brand-500"
                        placeholder={t('myTab.universityPlaceholder')}
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{profile.university || t('myTab.noUniversity')}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">{t('profile.major')}</label>
                    {isEditing ? (
                      <Input
                        value={profile.major || ''}
                        onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                        className="border-brand-200 focus:border-brand-500"
                        placeholder={t('myTab.majorPlaceholder')}
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{profile.major || t('myTab.noMajor')}</p>
                    )}
                  </div>
                </>
              )}
              
              {/* 직장인인 경우 직업/회사 표시 */}
              {profile.user_type === 'professional' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">{t('myTab.occupation')}</label>
                    {isEditing ? (
                      <Input
                        value={profile.occupation || ''}
                        onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                        className="border-brand-200 focus:border-brand-500"
                        placeholder={t('myTab.occupationPlaceholder')}
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{profile.occupation || t('myTab.noOccupation')}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">{t('myTab.company')}</label>
                    {isEditing ? (
                      <Input
                        value={profile.company || ''}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        className="border-brand-200 focus:border-brand-500"
                        placeholder={t('myTab.companyPlaceholder')}
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{profile.company || t('myTab.noCompany')}</p>
                    )}
                  </div>
                </>
              )}
              
              {/* 학생인 경우에만 학년 표시 */}
              {profile.user_type === 'student' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">{t('profile.year')}</label>
                  {isEditing ? (
                    <Select value={profile.grade || ''} onValueChange={(value) => setProfile({ ...profile, grade: value })}>
                      <SelectTrigger className="border-brand-200 focus:border-brand-500">
                        <SelectValue placeholder={t('myTab.gradePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1학년">{t('myTab.grade1')}</SelectItem>
                        <SelectItem value="2학년">{t('myTab.grade2')}</SelectItem>
                        <SelectItem value="3학년">{t('myTab.grade3')}</SelectItem>
                        <SelectItem value="4학년">{t('myTab.grade4')}</SelectItem>
                        <SelectItem value="대학원">{t('myTab.graduate')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.grade || t('myTab.noGrade')}</p>
                  )}
                </div>
              )}
              
              {/* 직장인인 경우 경력 표시 */}
              {profile.user_type === 'professional' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">{t('myTab.experience')}</label>
                  {isEditing ? (
                    <Input
                      value={profile.work_experience || ''}
                      onChange={(e) => setProfile({ ...profile, work_experience: e.target.value })}
                      className="border-brand-200 focus:border-brand-500"
                      placeholder={t('myTab.experiencePlaceholder')}
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.work_experience || t('myTab.noExperience')}</p>
                  )}
                </div>
              )}
            </div>

            {/* 소개 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block">{t('profile.selfIntroduction')}</label>
              {isEditing ? (
                <Textarea
                  value={profile.one_line_intro || profile.introduction || ''}
                  onChange={(e) => setProfile({ ...profile, one_line_intro: e.target.value })}
                  rows={3}
                  className="border-brand-200 focus:border-brand-500"
                  placeholder={t('myTab.introductionPlaceholder')}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{profile.one_line_intro || profile.introduction || t('myTab.noIntroduction')}</p>
              )}
            </div>


            {/* 관심사 */}
            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 block">{t('profile.interests')}</label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {['한국어', '한국문화', '요리', '여행', '음악', '영화', '패션', '스포츠'].map((interest) => (
                    <Button
                      key={interest}
                      variant={(profile?.interests || []).includes(interest) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentInterests = profile?.interests || []
                        const newInterests = currentInterests.includes(interest)
                          ? currentInterests.filter((i: string) => i !== interest)
                          : [...currentInterests, interest]
                        setProfile({ ...profile, interests: newInterests })
                      }}
                      className={(profile?.interests || []).includes(interest) 
                        ? 'bg-mint-500 hover:bg-mint-600' 
                        : 'border-mint-200 text-mint-700 hover:bg-mint-50'
                      }
                    >
                      {translateInterestTag(interest)}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.interests && profile.interests.length > 0 ? (
                    profile.interests.map((interest: string) => (
                      <Badge key={interest} className="bg-mint-100 text-mint-700 border-mint-300">
                        <Heart className="w-3 h-3 mr-1" />
                        {translateInterestTag(interest)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">{t('myTab.noInterests')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 인증 가드 제거 - 운영자는 자동으로 통과 */}


      {/* 현지인 전용: 나의 쿠폰/구매내역 리스트 */}
      {!profile?.isKorean && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* 쿠폰 리스트 */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-brand-50 to-brand-100 border-2 border-brand-200/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
                <Gift className="w-4 h-4 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-800">{t('profile.myCoupons')}</h3>
            </div>
            
            <div className="space-y-3">
              {(profile?.coupons || []).map((coupon: any) => (
                <div key={coupon.id} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-brand-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${coupon.isUsed ? 'bg-gray-300' : 'bg-brand-500'}`} />
                    <div>
                      <div className="font-medium text-gray-800">{translateCouponType(coupon.type)}</div>
                      <div className="text-sm text-gray-600">{coupon.quantity}장 • {coupon.price}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{t('profile.expirationDate')}</div>
                    <div className="text-sm font-medium text-gray-700">
                      {coupon.expiresAt ? coupon.expiresAt : t('profile.noExpiration')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 구매내역 리스트 */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-mint-50 to-mint-100 border-2 border-mint-200/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-mint-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-mint-600" />
              </div>
              <h3 className="font-semibold text-gray-800">{t('profile.purchaseHistory')}</h3>
            </div>
            
            <div className="space-y-3">
              {(profile?.purchaseHistory || []).map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-mint-200">
                  <div>
                    <div className="font-medium text-gray-800">
                      {purchase.item === '15분 상담 쿠폰 2장' ? t('myTab.consultation15min2') : purchase.item}
                    </div>
                    <div className="text-sm text-gray-600">{purchase.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">${purchase.amount}</div>
                    <Badge className={`mt-1 ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {purchase.status === 'completed' ? t('myTab.completed') : 
                       purchase.status === 'pending' ? t('myTab.pending') : t('myTab.cancelled')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* 스토리 설정 */}
      <StorySettings />

      {/* 알림 설정 */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200/50 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
            <Settings className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">{t('myTab.notificationSettings')}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-800">{t('myTab.webPushNotification')}</div>
                <div className="text-sm text-gray-600">{t('myTab.webPushDescription')}</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.webPush}
              onCheckedChange={(checked) => handleNotificationChange('webPush', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-800">{t('myTab.emailNotification')}</div>
                <div className="text-sm text-gray-600">{t('myTab.emailDescription')}</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-800">{t('myTab.marketingNotification')}</div>
                <div className="text-sm text-gray-600">{t('myTab.marketingDescription')}</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.marketing}
              onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
            />
          </div>
        </div>
      </div>

      {/* 추후 연동 포인트 주석 */}
      {/* 
      TODO: Supabase users 테이블과 연동
      TODO: 포인트 시스템 연동
      TODO: 쿠폰 시스템 연동
      TODO: 리워드 시스템 연동
      TODO: 알림 설정 저장/동기화
      */}
        </>
      )}
    </div>
  )
}
