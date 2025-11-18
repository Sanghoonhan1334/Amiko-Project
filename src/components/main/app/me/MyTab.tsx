'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { extractCountryCodeFromPhone } from '@/lib/timezone-converter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProfileSkeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  AlertCircle,
  Trophy,
  Users,
  Newspaper,
  Clock,
  TrendingUp,
  Copy,
  Check,
  Video,
  ChevronUp,
  ChevronDown,
  Fingerprint,
  Smartphone,
  Lock
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import PointsRanking from '@/components/admin/PointsRanking'
import EventManagement from '@/components/admin/EventManagement'
import StorySettings from './StorySettings'
import { KoreanUserProfile, LatinUserProfile } from '@/types/user'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { checkAuthAndRedirect } from '@/lib/auth-utils'
import { checkWebAuthnSupport, getBiometricAuthStatus, startBiometricRegistration, deleteBiometricCredential, checkPlatformAuthenticatorAvailable } from '@/lib/webauthnClient'
import { isAndroidDevice } from '@/lib/share-utils'
import ChargingTab from '../charging/ChargingTab'
import PointsCard from './PointsCard'
import ChargingHeader from './ChargingHeader'
// 🚀 최적화: React Query hook 추가
import { useEventPoints } from '@/hooks/useEventPoints'
import UserBadge from '@/components/common/UserBadge'
import { getUserLevel } from '@/lib/user-level'
import AuthConfirmDialog from '@/components/common/AuthConfirmDialog'

export default function MyTab() {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  // 추천인 기능 비활성화: 코드/복사 상태 제거
  const referralCode: string | null = null
  const [isPartnerRegistered, setIsPartnerRegistered] = useState(false)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [dailyMissions, setDailyMissions] = useState<any>(null)
  const [dailyEarnedPoints, setDailyEarnedPoints] = useState(0)
  const [isMissionsExpanded, setIsMissionsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  
  // 🚀 최적화: React Query로 포인트 및 랭킹 데이터 관리
  const { 
    data: eventData, 
    isLoading: pointsLoading, 
    error: queryError,
    refetch 
  } = useEventPoints()
  
  // React Query에서 가져온 데이터 분리
  const rankingData = eventData?.rankingData || {
    ranking: [],
    userRank: null,
    totalUsers: 0
  }

  // 인증 체크 - 인증이 안된 사용자는 인증센터로 리다이렉트
  useEffect(() => {
    if (user) {
      // 사용자 프로필 정보를 가져와서 인증 상태 확인
      const checkVerificationStatus = async () => {
        try {
          // 방금 인증 완료한 사용자는 체크 스킵 (무한 루프 방지)
          const justCompleted = localStorage.getItem('verification_just_completed')
          if (justCompleted === 'true') {
            console.log('[MYTAB] 방금 인증 완료한 사용자, 인증 체크 스킵')
            localStorage.removeItem('verification_just_completed')
            return
          }
          
          // 먼저 운영자 확인
          const adminCheck = await fetch(`/api/admin/check?userId=${user.id}`)
          const adminResult = await adminCheck.json()
          
          if (adminResult.isAdmin) {
            console.log('운영자 확인됨, 인증 체크 스킵')
            return
          }
          
          const response = await fetch(`/api/profile?userId=${user.id}`)
          const result = await response.json()
          
          if (response.ok && result.user) {
            // 프로필 있음 → 인증 상태 확인 (is_verified 플래그 우선)
            const isVerified = !!(
              result.user.is_verified ||  // 👈 인증센터에서 설정한 플래그
              result.user.verification_completed ||  // 👈 인증 완료 플래그
              result.user.email_verified_at || 
              result.user.sms_verified_at || 
              result.user.kakao_linked_at || 
              result.user.wa_verified_at ||
              (result.user.korean_name && result.user.nickname) ||
              (result.user.spanish_name && result.user.nickname) ||
              (result.user.full_name && result.user.phone) ||
              (result.user.full_name && result.user.university && result.user.major)
            )
            
            console.log('인증 상태 확인:', {
              is_verified: result.user.is_verified,
              verification_completed: result.user.verification_completed,
              email_verified_at: result.user.email_verified_at,
              sms_verified_at: result.user.sms_verified_at,
              full_name: result.user.full_name,
              phone: result.user.phone,
              university: result.user.university,
              major: result.user.major,
              korean_name: result.user.korean_name,
              spanish_name: result.user.spanish_name,
              nickname: result.user.nickname,
              isVerified: isVerified
            })
            
            if (!isVerified) {
              console.log('사용자가 인증되지 않음, 인증 다이얼로그 표시')
              // 현재 경로가 이미 verification-center가 아닌 경우에만 다이얼로그 표시
              if (window.location.pathname !== '/verification-center') {
                setShowAuthDialog(true)
              }
            }
          } else {
            // 프로필 없음 또는 API 실패 → 인증 다이얼로그 표시
            console.log('프로필이 없거나 API 실패, 인증 다이얼로그 표시')
            if (window.location.pathname !== '/verification-center') {
              setShowAuthDialog(true)
            }
          }
        } catch (error) {
          console.error('인증 상태 확인 실패:', error)
          // 오류 발생 시에도 인증 다이얼로그 표시 (신규 가입자일 가능성)
          if (window.location.pathname !== '/verification-center') {
            console.log('오류 발생으로 인증 다이얼로그 표시')
            setShowAuthDialog(true)
          }
        }
      }
      
      // 1초 딜레이를 두어 무한 루프 방지
      const timeoutId = setTimeout(checkVerificationStatus, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [user, router])

  // URL 해시로 레벨 또는 포인트 섹션으로 스크롤
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkHashAndScroll = () => {
      const hash = window.location.hash
      if (hash === '#my-level' || hash === '#my-points') {
        const targetId = hash.substring(1) // # 제거
        
        const scrollToTarget = () => {
          const element = document.getElementById(targetId)
          if (element) {
            // 요소 위치 계산
            const elementTop = element.offsetTop
            const offset = 80 // 헤더 높이 고려
            
            // scrollIntoView와 window.scrollTo 모두 시도
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            window.scrollTo({ top: elementTop - offset, behavior: 'smooth' })
            return true
          }
          return false
        }
        
        // 모바일에서는 더 긴 딜레이 필요
        const isMobile = window.innerWidth < 768
        const delays = isMobile ? [500, 1000, 1500, 2000] : [300, 600, 1000, 1500]
        
        delays.forEach((delay) => {
          setTimeout(() => {
            scrollToTarget()
          }, delay)
        })
      }
    }
    
    // 초기 체크 (마운트 시에만)
    // hashchange 이벤트는 헤더에서 직접 마이페이지 클릭 시 발생하지 않으므로 제거
    checkHashAndScroll()
  }, [])

  // 추천인 코드 조회 비활성화

  // 일일 미션 데이터 가져오기
  useEffect(() => {
    if (user?.id) {
      fetchDailyMissions()
    }
  }, [user?.id])

  // 포인트 업데이트 이벤트 리스너
  useEffect(() => {
    const handlePointsUpdate = () => {
      console.log('[MYTAB] pointsUpdated 이벤트 수신, 포인트 및 미션 리프레시')
      refetch() // 랭킹 및 월간/총 포인트 리프레시
      fetchDailyMissions() // 일일 미션 리프레시
    }

    window.addEventListener('pointsUpdated', handlePointsUpdate)
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate)
    }
  }, [user?.id, refetch])

  const fetchDailyMissions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/points/daily-activity?userId=${user?.id}&date=${today}`)
      if (response.ok) {
        const data = await response.json()
        setDailyMissions(data.missions)
        setDailyEarnedPoints(data.earnedPoints)
      }
    } catch (error) {
      console.error('일일 미션 데이터 가져오기 실패:', error)
    }
  }

  // 체크마크 생성 헬퍼 함수
  const renderCheckmarks = (count: number, max: number) => {
    const completedCount = Math.min(count, max)
    const checks = '✓'.repeat(completedCount)
    const empties = '○'.repeat(max - completedCount)
    const completedClass = completedCount === max ? 'text-green-500' : 'text-gray-400'
    
    return (
      <>
        <span className={completedClass}>{checks}</span>
        {empties && <span className="text-gray-300">{empties}</span>}
      </>
    )
  }

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

  // 추천인 코드 복사 함수
  const copyReferralCode = async () => {
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('복사 실패:', error)
      }
    }
  }

  // 파트너 등록 여부 확인
  useEffect(() => {
    const checkPartnerStatus = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/conversation-partners/check?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setIsPartnerRegistered(data.isRegistered)
          }
        } catch (error) {
          console.error('파트너 상태 확인 실패:', error)
        }
      }
    }
    checkPartnerStatus()
  }, [user])

  // 파트너 등록
  const registerAsPartner = async () => {
    if (!user || !profile) return

    // 한국인인지 확인 (인증센터에서 확인된 정보)
    const isKoreanUser = !!(profile.is_korean || profileUser?.is_korean)

    if (!isKoreanUser) {
      alert('한국인만 화상 채팅 파트너로 등록할 수 있습니다.')
      return
    }

    try {
      const response = await fetch('/api/conversation-partners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: profile.korean_name || profile.full_name || user.email.split('@')[0],
          language_level: '중급', // 기본값
          country: '대한민국',
          status: 'online',
          interests: profile.interests || [],
          bio: profile.one_line_intro || profile.introduction || '',
          avatar_url: profile.avatar_url,
          is_korean: true // 인증센터에서 확인된 한국인
        })
      })

      if (response.ok) {
        setIsPartnerRegistered(true)
        setShowPartnerForm(false)
        alert('화상 채팅 파트너로 등록되었습니다!')
      } else {
        const result = await response.json()
        alert(result.error || '파트너 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('파트너 등록 실패:', error)
      alert('파트너 등록에 실패했습니다.')
    }
  }

  const [showInterestSelector, setShowInterestSelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState<string[]>([])
  const compactSwitchClass = 'origin-right scale-75 sm:scale-100'

  const handleAccountDeletion = useCallback(async () => {
    if (!token) {
      setDeleteError(language === 'ko' ? '다시 로그인 후 시도해주세요.' : 'Inicia sesión nuevamente e inténtalo otra vez.')
      return
    }

    setIsDeletingAccount(true)
    setDeleteError(null)

    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok || result?.error) {
        setDeleteError(
          result?.error ||
            result?.message ||
            (language === 'ko'
              ? '계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.'
              : 'No se pudo eliminar la cuenta. Inténtalo de nuevo más tarde.')
        )
        setIsDeletingAccount(false)
        return
      }

      // 삭제 성공 메시지 표시
      const successMessage = result?.message || 
        (result?.success === false || (result?.warnings && result.warnings.length > 0)
          ? (language === 'ko'
              ? '계정 삭제가 완료되었지만 일부 데이터 정리에 실패했습니다.'
              : 'La cuenta se eliminó, pero hubo problemas al limpiar algunos datos.')
          : (language === 'ko'
              ? '계정이 삭제되었습니다.'
              : 'La cuenta se ha eliminado correctamente.'))
      
      // 다이얼로그 닫기 및 로딩 상태 해제
      setIsDeletingAccount(false)
      setShowDeleteDialog(false)
      
      // 성공 메시지 표시
      alert(successMessage)

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (storageError) {
          console.warn('[ACCOUNT_DELETE] 스토리지 정리 중 오류:', storageError)
        }
      }

      // 로그인 페이지로 리다이렉트
      router.push('/sign-in?accountDeleted=1')
      router.refresh()
    } catch (error) {
      console.error('[ACCOUNT_DELETE] 요청 실패:', error)
      setDeleteError(
        language === 'ko'
          ? '계정 삭제 요청 중 오류가 발생했습니다.'
          : 'Ocurrió un error al procesar la eliminación de la cuenta.'
      )
      setIsDeletingAccount(false)
    }
  }, [language, router, token])

  // 인증센터에서 가져온 관심사 목록
  const availableInterests = [
    '한국어', '한국문화', '음식', '여행', '영화', '음악', '스포츠', 
    '패션', '게임', '기술', '경제', '언어교환', 'K-POP', '드라마', 
    '맛집', '독서', '댄스', '미술', '자연', '반려동물', '커피', '뷰티'
  ]
  const [profile, setProfile] = useState<any>(null)
  const [profileUser, setProfileUser] = useState<any>(null)
  
  // 한국인 여부 확인 (인증센터에서 확인된 정보)
  const isKorean = !!(profile?.is_korean || profileUser?.is_korean)

  // NOTE: showPartnerSection은 verificationStatus 선언 이후에 계산해야 하므로 아래에서 설정합니다.
  const [loading, setLoading] = useState(true)
  const [isUploadingImage, setIsUploadingImage] = useState(false) // 프로필 이미지 업로드 로딩
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
  
  // 보안 설정 상태
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricCredentials, setBiometricCredentials] = useState<any[]>([])

  // 파트너 섹션 노출 여부 계산 및 디버깅 로그 (verificationStatus 선언 이후)
  // 국가 코드 우선: users.phone_country → 없으면 전화번호에서 추론
  const phoneCountryField = (profile as any)?.phone_country || (profileUser as any)?.phone_country || null
  const phoneFromAny = profile?.phone || profileUser?.phone || user?.user_metadata?.phone || null
  const parsedCountryCode = extractCountryCodeFromPhone(phoneFromAny)
  const effectiveCountryCode = phoneCountryField || parsedCountryCode || null
  const isByKoreanPhone = effectiveCountryCode === '82'
  const adminOverride = Boolean((profile as any)?.admin_partner_override)

  // 최종 표시 조건(국가코드 기반): (+82 전화) OR (관리자 오버라이드)
  const showPartnerSection = Boolean(
    isByKoreanPhone || adminOverride
  )

  // 디버그 로그/표시는 비활성화 (안정화 완료)

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
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Se requiere inicio de sesión.')
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
        alert(language === 'ko' ? '프로필이 성공적으로 저장되었습니다!' : '¡Perfil guardado exitosamente!')
      } else {
        throw new Error('프로필 저장 실패')
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error)
      alert(language === 'ko' ? '프로필 저장에 실패했습니다. 다시 시도해주세요.' : 'Error al guardar el perfil. Inténtelo de nuevo.')
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
        
    setIsUploadingImage(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('프로필 이미지 업로드 성공:', result)
        
        // 프로필 상태 직접 업데이트
        if (result.avatar_url) {
          setProfile(prev => ({
            ...prev,
            avatar_url: result.avatar_url
          }))
        }
        
        // 프로필 다시 로드하여 업데이트된 이미지 반영
        await loadProfile()
        
        alert(t('profile.imageUpdatedSuccessfully'))
      } else {
        const error = await response.json()
        console.error('프로필 이미지 업로드 실패:', error)
        alert(`${t('profile.uploadFailed')}: ${error.error || t('profile.unknownError')}`)
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error)
      alert(t('profile.uploadError'))
    } finally {
      setIsUploadingImage(false)
    }
  }

  // 프로필 이미지 삭제 핸들러
  const handleDeleteProfileImage = async () => {
    try {
      const response = await fetch('/api/profile/delete-image', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('프로필 이미지 삭제 성공');
        await loadProfile(); // 프로필 다시 로드하여 업데이트된 상태 반영
        alert(language === 'ko' ? '프로필 사진이 삭제되었습니다.' : 'Foto de perfil eliminada.');
      } else {
        const error = await response.json();
        console.error('프로필 이미지 삭제 실패:', error);
        const errorMsg = language === 'ko' ? error.error_ko : error.error_es;
        alert(language === 'ko' ? `삭제 실패: ${errorMsg || '알 수 없는 오류'}` : `Error al eliminar: ${errorMsg || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 오류:', error);
      alert(language === 'ko' ? '삭제 중 오류가 발생했습니다.' : 'Error durante la eliminación.');
    }
  };

  // 인덱스별 프로필 이미지 삭제 핸들러
  const handleDeleteProfileImageByIndex = async (index: number) => {
    try {
      const response = await fetch('/api/profile/delete-image-by-index', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index })
      });

      if (response.ok) {
        console.log(`프로필 이미지 ${index + 1} 삭제 성공`);
        await loadProfile(); // 프로필 다시 로드하여 업데이트된 상태 반영
        alert(language === 'ko' ? `프로필 사진 ${index + 1}이 삭제되었습니다.` : `Foto ${index + 1} eliminada.`);
    } else {
        const error = await response.json();
        console.error('프로필 이미지 삭제 실패:', error);
        const errorMsg = language === 'ko' ? error.error_ko : error.error_es;
        alert(language === 'ko' ? `삭제 실패: ${errorMsg || '알 수 없는 오류'}` : `Error al eliminar: ${errorMsg || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 오류:', error);
      alert(language === 'ko' ? '삭제 중 오류가 발생했습니다.' : 'Error durante la eliminación.');
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
            setProfileUser(data.user) // user 객체도 따로 저장
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

  // 지문 인증 상태 확인
  useEffect(() => {
    const checkBiometric = async () => {
      // WebAuthn 기본 지원 확인
      const support = checkWebAuthnSupport()
      const isAndroid = isAndroidDevice()
      const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const hasPublicKeyCredential = typeof window !== 'undefined' && !!window.PublicKeyCredential
      // WebAuthn은 HTTPS 또는 localhost에서만 작동
      // 로컬 네트워크 IP는 HTTP이지만, Android에서는 실제로 작동할 수 있으므로 허용
      const isHTTPS = typeof window !== 'undefined' && (
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        // 로컬 네트워크 IP도 허용 (실제로는 제한적이지만 시도)
        window.location.hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      )
      
      console.log('[BIOMETRIC] 초기 확인:', {
        isSupported: support.isSupported,
        isAndroid,
        isMobile,
        hasPublicKeyCredential,
        isHTTPS,
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
      })
      
      // Android 기기에서는 PublicKeyCredential만 있으면 지원하는 것으로 간주
      // (Android/Chrome에서는 isUserVerifyingPlatformAuthenticatorAvailable()이 false를 반환할 수 있음)
      // 또는 모바일 기기면 지문 인증이 가능할 가능성이 높음
      // HTTP 환경에서는 WebAuthn이 작동하지 않으므로 HTTPS 또는 localhost/로컬 IP 확인
      
      // Android 또는 모바일 기기이고 PublicKeyCredential이 있으면 지원하는 것으로 간주
      // Android Chrome에서는 실제로 지문 인증이 가능하므로, PublicKeyCredential만 있으면 OK
      if ((isAndroid || isMobile) && hasPublicKeyCredential && isHTTPS) {
        console.log('[BIOMETRIC] 모바일 기기 + WebAuthn 지원 + HTTPS = 지문 인증 사용 가능')
        setBiometricSupported(true)
        
        if (user?.id) {
          try {
            // 등록된 지문 확인
            const status = await getBiometricAuthStatus(user.id)
            console.log('[BIOMETRIC] 상태 확인 결과:', status)
            
            if (status.success && status.data) {
              const hasCredentials = status.data.hasCredentials && status.data.credentials.length > 0
              setBiometricEnabled(hasCredentials)
              setBiometricCredentials(status.data.credentials || [])
            } else {
              setBiometricEnabled(false)
              setBiometricCredentials([])
            }
          } catch (error) {
            console.error('[BIOMETRIC] 상태 확인 실패:', error)
            setBiometricEnabled(false)
            setBiometricCredentials([])
          }
        }
        return
      }
      
      // HTTPS가 아닌 경우 (로컬 네트워크는 허용)
      // Android Chrome에서는 로컬 네트워크에서도 WebAuthn이 작동할 수 있으므로 시도
      if ((isAndroid || isMobile) && !isHTTPS) {
        console.warn('[BIOMETRIC] 모바일 기기지만 HTTPS가 아님')
        console.warn('[BIOMETRIC] 현재 프로토콜:', typeof window !== 'undefined' ? window.location.protocol : 'N/A')
        console.warn('[BIOMETRIC] WebAuthn은 HTTPS에서만 완전히 작동하지만, Android에서는 시도해봅니다')
        // Android에서는 HTTP에서도 시도 (실제로는 제한적이지만)
        if (isAndroid && hasPublicKeyCredential) {
          console.log('[BIOMETRIC] Android 기기 - HTTP 환경이지만 시도')
          setBiometricSupported(true)
          // 등록된 지문 확인은 생략 (HTTP에서는 API 호출이 제한적일 수 있음)
          setBiometricEnabled(false)
          setBiometricCredentials([])
          return
        }
        setBiometricSupported(false)
        setBiometricEnabled(false)
        setBiometricCredentials([])
        return
      }
      
      // Android 기기인데 PublicKeyCredential이 없는 경우 (드물지만 가능)
      if (isAndroid && !hasPublicKeyCredential) {
        console.warn('[BIOMETRIC] Android 기기지만 PublicKeyCredential 없음')
        setBiometricSupported(false)
        setBiometricEnabled(false)
        setBiometricCredentials([])
        return
      }
      
      if (!support.isSupported) {
        console.log('[BIOMETRIC] WebAuthn 기본 지원 안 됨')
        setBiometricSupported(false)
        setBiometricEnabled(false)
        setBiometricCredentials([])
        return
      }
      
      // iOS/Desktop: 플랫폼 인증기 사용 가능 여부 확인 (비동기)
      try {
        const platformAvailable = await checkPlatformAuthenticatorAvailable()
        console.log('[BIOMETRIC] 플랫폼 인증기 사용 가능:', platformAvailable)
        
        const isActuallySupported = platformAvailable || support.isSupported
        
        console.log('[BIOMETRIC] 최종 지원 여부:', isActuallySupported, {
          platformAvailable,
          basicSupport: support.isSupported
        })
        
        setBiometricSupported(isActuallySupported)
        
        if (isActuallySupported && user?.id) {
          try {
            // 등록된 지문 확인
            const status = await getBiometricAuthStatus(user.id)
            console.log('[BIOMETRIC] 상태 확인 결과:', status)
            
            if (status.success && status.data) {
              const hasCredentials = status.data.hasCredentials && status.data.credentials.length > 0
              setBiometricEnabled(hasCredentials)
              setBiometricCredentials(status.data.credentials || [])
            } else {
              // 에러가 있거나 데이터가 없으면 false로 설정
              setBiometricEnabled(false)
              setBiometricCredentials([])
            }
          } catch (error) {
            console.error('[BIOMETRIC] 상태 확인 실패:', error)
            setBiometricEnabled(false)
            setBiometricCredentials([])
          }
        } else {
          // 지원하지 않거나 사용자가 없으면 false
          setBiometricEnabled(false)
          setBiometricCredentials([])
        }
      } catch (error) {
        console.error('[BIOMETRIC] 플랫폼 인증기 확인 실패:', error)
        // 에러가 나도 기본 WebAuthn 지원이 있으면 사용 가능으로 간주
        setBiometricSupported(support.isSupported)
        setBiometricEnabled(false)
        setBiometricCredentials([])
      }
    }
    
    checkBiometric()
  }, [user?.id])

  // 지문 등록 핸들러
  const handleEnableBiometric = async () => {
    if (!user?.id) {
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Se requiere inicio de sesión.')
      return
    }
    
    try {
      const result = await startBiometricRegistration(
        user.id,
        user.email || '',
        user.user_metadata?.full_name || user.email || ''
      )
      
      if (result.success) {
        alert(language === 'ko' ? '지문 인증이 등록되었습니다!' : '¡Autenticación de huella registrada!')
        
        // 상태 재확인
        const status = await getBiometricAuthStatus(user.id)
        if (status.success && status.data) {
          setBiometricEnabled(status.data.hasCredentials && status.data.credentials.length > 0)
          setBiometricCredentials(status.data.credentials || [])
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('지문 등록 실패:', error)
      
      // 에러 타입에 따라 다른 메시지
      const errorMsg = error instanceof Error ? error.message : ''
      
      if (errorMsg.includes('abort') || errorMsg.includes('cancel')) {
        // 사용자가 취소한 경우
        console.log('사용자가 지문 등록을 취소함')
      } else {
        alert(language === 'ko' 
          ? '지문 등록에 실패했습니다. 기기가 지문 인증을 지원하는지 확인해주세요.'
          : 'Error al registrar huella. Verifique que su dispositivo soporte autenticación biométrica.')
      }
      
      // 토글을 다시 꺼진 상태로
      setBiometricEnabled(false)
    }
  }

  // 지문 해제 핸들러
  const handleDisableBiometric = async () => {
    if (!user?.id || biometricCredentials.length === 0) {
      setBiometricEnabled(false)
      return
    }
    
    const confirmMsg = language === 'ko'
      ? '지문 인증을 해제하시겠습니까?'
      : '¿Desactivar autenticación de huella?'
      
    if (!confirm(confirmMsg)) {
      // 취소하면 토글을 다시 켜진 상태로
      setBiometricEnabled(true)
      return
    }
    
    try {
      // 모든 등록된 인증기 삭제
      for (const cred of biometricCredentials) {
        await deleteBiometricCredential(user.id, cred.id)
      }
      
      alert(language === 'ko' ? '지문 인증이 해제되었습니다.' : 'Autenticación de huella desactivada.')
      setBiometricEnabled(false)
      setBiometricCredentials([])
    } catch (error) {
      console.error('지문 해제 실패:', error)
      alert(language === 'ko' 
        ? '지문 해제에 실패했습니다.'
        : 'Error al desactivar huella.')
      // 실패하면 토글을 다시 켜진 상태로
      setBiometricEnabled(true)
    }
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

    // avatar_url과 profile_images를 모두 포함한 실제 전체 이미지 수
    const totalImages = (profile?.avatar_url ? 1 : 0) + (profile?.profile_images?.length || 0)

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 왼쪽으로 스와이프 (다음 사진)
        setCurrentImageIndex(prev => 
          prev < totalImages - 1 ? prev + 1 : 0
        )
      } else {
        // 오른쪽으로 스와이프 (이전 사진)
        setCurrentImageIndex(prev => 
          prev > 0 ? prev - 1 : totalImages - 1
        )
      }
    }
    
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // 버튼이나 input 요소에서 발생한 이벤트는 무시
    const target = e.target as HTMLElement
    if (target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('label')) {
      return
    }
    
    e.preventDefault()
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    // 버튼이나 input 요소에서 발생한 이벤트는 무시
    const target = e.target as HTMLElement
    if (target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('label')) {
      return
    }
    
    const endX = e.clientX
    const diff = startX - endX
    const threshold = 50

    // avatar_url과 profile_images를 모두 포함한 실제 전체 이미지 수
    const totalImages = (profile?.avatar_url ? 1 : 0) + (profile?.profile_images?.length || 0)

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        const newIndex = currentImageIndex < totalImages - 1 ? currentImageIndex + 1 : 0
        setCurrentImageIndex(newIndex)
      } else {
        const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : totalImages - 1
        setCurrentImageIndex(newIndex)
      }
    }
    
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // 관리자 여부 확인 (더 포괄적인 체크)
  const isAdmin = user?.email === 'admin@amiko.com' || user?.email === 'info@helloamiko.com' || user?.user_metadata?.role === 'admin'

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('myTab.loading')}</p>
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
              <h2 className="text-lg font-semibold mb-2">{t('profile.setupProfile')}</h2>
              <p className="text-sm">{t('profile.editToComplete')}</p>
          </div>
        </div>

          {/* 편집 버튼 (모바일) */}
          <div className="px-4 py-2 bg-white md:hidden">
            <div className="flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">{t('profile.myProfile')}</h1>
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
            <p className="text-gray-600 text-sm">{t('profile.setupProfile')}</p>
        </div>
            </div>
          </div>
    )
  }

  // 운영자는 대시보드만 표시 (일반 프로필 렌더링 전에 체크)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full p-4 space-y-6">
          {/* 운영자 대시보드 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">운영진 대시보드</h1>
            <p className="text-blue-100">서비스 현황과 사용자 활동을 한눈에 확인하세요</p>
          </div>

          {/* 아코디언 형식의 관리 섹션 */}
          <Accordion type="single" collapsible className="w-full space-y-4">
            {/* 포인트 랭킹 */}
            <AccordionItem value="points" className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">포인트 랭킹</h3>
                    <p className="text-sm text-gray-600">누적 점수와 월별 점수 랭킹</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <PointsRanking />
              </AccordionContent>
            </AccordionItem>

            {/* 이벤트 관리 */}
            <AccordionItem value="events" className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">이벤트 관리</h3>
                    <p className="text-sm text-gray-600">추천인 & 월별 포인트 이벤트</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <EventManagement />
              </AccordionContent>
            </AccordionItem>

            {/* 사용자 관리 */}
            <AccordionItem value="users" className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">사용자 관리</h3>
                    <p className="text-sm text-gray-600">전체 사용자 및 권한 관리</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="text-center py-8 text-gray-500">
                  사용자 관리 기능은 별도 페이지로 이동합니다.
                  <br />
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/admin/users'}>
                    사용자 관리 페이지로 이동
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 뉴스 관리 */}
            <AccordionItem value="news" className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">뉴스 관리</h3>
                    <p className="text-sm text-gray-600">뉴스 작성 및 수정</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="text-center py-8 text-gray-500">
                  뉴스 관리 기능은 별도 페이지로 이동합니다.
                  <br />
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/admin/news'}>
                    뉴스 관리 페이지로 이동
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 예약 관리 */}
            <AccordionItem value="bookings" className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">예약 관리</h3>
                    <p className="text-sm text-gray-600">예약 현황 및 관리</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="text-center py-8 text-gray-500">
                  예약 관리 기능은 별도 페이지로 이동합니다.
                  <br />
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/admin/bookings'}>
                    예약 관리 페이지로 이동
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 결제 관리 */}
            <AccordionItem value="payments" className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">결제 관리</h3>
                    <p className="text-sm text-gray-600">결제 내역 및 환불 관리</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="text-center py-8 text-gray-500">
                  결제 관리 기능은 별도 페이지로 이동합니다.
                  <br />
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/admin/payments'}>
                    결제 관리 페이지로 이동
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 분석 대시보드 */}
            <AccordionItem value="analytics" className="border-2 border-blue-200 rounded-xl overflow-hidden bg-blue-50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-gray-900">서비스 분석</h3>
                    <p className="text-sm text-gray-600">뉴스, 사용자, 트렌드 분석</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <AnalyticsDashboard />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    )
  }

  // 틴더 스타일 메인 레이아웃
  return (
    <>
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
              
              // 이미지가 없으면 카메라 UI 표시
              if (allImages.length === 0) {
                return (
                  <div className="w-full h-full flex-shrink-0 relative bg-gray-200 flex items-center justify-center">
                    <label className="text-center text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                      <Camera className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-sm">
                        {language === 'es' ? 'Por favor agrega una foto de perfil' : '프로필 사진을 추가해주세요'}
                      </p>
                      <p className="text-xs mt-1 text-gray-400">
                        {language === 'es' ? 'Haz clic para subir' : '클릭하여 업로드'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )
              }
              
              // 이미지가 있으면 이미지들 표시
              return (
                <div
                  className="flex h-full transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${currentImageIndex * 100}%)`,
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  {allImages.map((imageData, globalIndex) => (
                    <div 
                      key={`${imageData.type}-${imageData.index}`} 
                      className="w-full h-full flex-shrink-0 relative group"
                    >
                      <img
                        src={imageData.src}
                        alt={`프로필 ${globalIndex + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
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
                          const confirmMsg = language === 'ko' 
                            ? `프로필 사진 ${globalIndex + 1}을 삭제하시겠습니까?`
                            : `¿Eliminar foto de perfil ${globalIndex + 1}?`
                          if (confirm(confirmMsg)) {
                            if (imageData.type === 'avatar') {
                              handleDeleteProfileImage()
                            } else {
                              handleDeleteProfileImageByIndex(imageData.index)
                            }
                          }
                        }}
                        className="bg-red-500 bg-opacity-90 rounded-full p-2 cursor-pointer hover:bg-opacity-100 transition-all"
                        title={language === 'ko' ? `프로필 사진 ${globalIndex + 1} 삭제` : `Eliminar foto ${globalIndex + 1}`}
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
                        const confirmMsg = language === 'ko' 
                          ? `프로필 사진 ${globalIndex + 1}을 삭제하시겠습니까?`
                          : `¿Eliminar foto de perfil ${globalIndex + 1}?`
                        if (confirm(confirmMsg)) {
                          if (imageData.type === 'avatar') {
                            handleDeleteProfileImage()
                          } else {
                            handleDeleteProfileImageByIndex(imageData.index)
                          }
                        }
                      }}
                      className="bg-red-500 bg-opacity-80 rounded-full p-1.5 cursor-pointer touch-manipulation"
                      title={language === 'ko' ? `프로필 사진 ${globalIndex + 1} 삭제` : `Eliminar foto ${globalIndex + 1}`}
                    >
                      <X className="w-3 h-3 text-white" />
                      </button>
                        </div>
                    </div>
                  ))}
                </div>
              )
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
                {language === 'ko' ? '← 스와이프해서 더 보기 →' : '← Desliza para ver más →'}
              </div>
            ) : null
          })()}
          
          {/* 이미지 업로드 로딩 오버레이 */}
          {isUploadingImage && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-semibold text-lg">
                  {language === 'es' ? 'Subiendo foto...' : '사진 업로드 중...'}
                </p>
                <p className="text-white/80 text-sm mt-2">
                  {language === 'es' ? 'Por favor espera' : '잠시만 기다려주세요'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 프로필 정보 오버레이 제거 - 깔끔한 사진만 표시 */}

        {/* 편집 버튼 (모바일) */}
        <div className="px-4 py-2 bg-white md:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-semibold text-gray-800">{t('profile.myProfile')}</h1>
            <div className="flex items-center gap-2">
              {isEditing ? (
                  <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
                    title={language === 'ko' ? '취소' : 'Cancelar'}
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                      onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm text-white"
                    title={language === 'ko' ? '저장' : 'Guardar'}
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
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">{t('profile.interests')}</h2>
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
                      {language === 'ko' ? '취소' : 'Cancelar'}
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
                      {language === 'ko' ? '저장' : 'Guardar'}
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
                    className="px-2 py-1 sm:px-3 bg-white text-gray-700 rounded-full text-xs sm:text-sm border border-gray-200 flex items-center gap-1 max-w-full truncate"
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
                      
                      // interest가 이미 번역 키 형태인 경우 처리 (profile.interests. 제거)
                      if (interest.startsWith('profile.interests.')) {
                        const cleanInterest = interest.replace('profile.interests.', '')
                        // 현지인(스페인어)이면 그냥 스페인어로 표시
                        if (currentLang === 'es') {
                          return cleanInterest
                        }
                        // 한국어 사용자면 번역 시도
                        const translated = t(`profile.interests.${cleanInterest}`)
                        return translated || cleanInterest
                      }
                      
                      // 일반적인 경우: 그대로 번역 시도
                      const translated = t(`profile.interests.${interest}`)
                      // 번역이 실패하면 (키 그대로 반환되면) 원본 반환
                      if (translated && !translated.startsWith('profile.interests.')) {
                        return translated
                      }
                      return interest
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
                        
                        // interest가 이미 번역 키 형태인 경우 처리 (profile.interests. 제거)
                        if (interest.startsWith('profile.interests.')) {
                          const cleanInterest = interest.replace('profile.interests.', '')
                          // 현지인(스페인어)이면 그냥 스페인어로 표시
                          if (currentLang === 'es') {
                            return cleanInterest
                          }
                          // 한국어 사용자면 번역 시도
                          const translated = t(`profile.interests.${cleanInterest}`)
                          return translated || cleanInterest
                        }
                        
                        // 일반적인 경우: 그대로 번역 시도
                        const translated = t(`profile.interests.${interest}`)
                        // 번역이 실패하면 (키 그대로 반환되면) 원본 반환
                        if (translated && !translated.startsWith('profile.interests.')) {
                          return translated
                        }
                        return interest
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
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">{t('profile.academicCareerInfo')}</h2>
          </div>

                {isEditing ? (
            <div className="space-y-4">
              {/* 기본 정보 입력 필드들 */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.koreanName')}</label>
                  <Input
                    value={editForm.korean_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, korean_name: e.target.value }))}
                    placeholder={language === 'ko' ? '한국이름을 입력하세요' : 'Ingrese su nombre coreano'}
                    className="text-sm"
                  />
              </div>
              
                <div>
                  <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.nickname')}</label>
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
                  <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.spanishName')}</label>
                    <Input
                    value={editForm.spanish_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, spanish_name: e.target.value }))}
                    placeholder={t('profile.spanishName') + '을 입력하세요'}
                    className="text-sm"
                  />
                  </div>
                
                <div>
                  <label className="text-gray-600 text-sm block mb-1">{language === 'ko' ? '사용자 타입' : 'Tipo de usuario'}</label>
                  <Select value={editForm.user_type} onValueChange={(value) => setEditForm(prev => ({ ...prev, user_type: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{language === 'ko' ? '학생' : 'Estudiante'}</SelectItem>
                      <SelectItem value="worker">{language === 'ko' ? '직장인' : 'Trabajador'}</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              
                {/* 사용자 타입에 따른 입력 필드 */}
                {editForm.user_type === 'student' ? (
                <>
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.university')}</label>
                      <Input
                        value={editForm.university}
                        onChange={(e) => setEditForm(prev => ({ ...prev, university: e.target.value }))}
                        placeholder={language === 'ko' ? '대학교를 입력하세요' : 'Ingrese su universidad'}
                        className="text-sm"
                      />
                  </div>
                  
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.major')}</label>
                      <Input
                        value={editForm.major}
                        onChange={(e) => setEditForm(prev => ({ ...prev, major: e.target.value }))}
                        placeholder={language === 'ko' ? '전공을 입력하세요' : 'Ingrese su carrera'}
                        className="text-sm"
                      />
                  </div>
                    
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.grade')}</label>
                      <Input
                        value={editForm.grade}
                        onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                        placeholder={language === 'ko' ? '학년을 입력하세요' : 'Ingrese su año de estudio'}
                        className="text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.occupation')}</label>
                      <Input
                        value={editForm.occupation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, occupation: e.target.value }))}
                        placeholder={t('profile.occupation') + '을 입력하세요'}
                        className="text-sm"
                      />
                  </div>
                  
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.company')}</label>
                      <Input
                        value={editForm.company}
                        onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                        placeholder={t('profile.company') + '을 입력하세요'}
                        className="text-sm"
                      />
                  </div>
                    
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">{t('profile.experience')}</label>
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
                    placeholder={language === 'ko' ? '자기소개를 입력하세요' : 'Ingrese su autopresentación'}
                    className="text-sm min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 한국이름 */}
              <div className="flex items-center justify-between">
                <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.koreanName')}</span>
                <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                  {profile?.korean_name || (language === 'ko' ? '없음' : 'Sin nombre coreano')}
                </span>
            </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 닉네임 */}
              <div className="flex items-center justify-between">
                <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.nickname')}</span>
                <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                  {profile?.nickname || (language === 'ko' ? '미설정' : 'Sin apodo')}
                </span>
                </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 스페인어 이름 */}
              <div className="flex items-center justify-between">
                <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.spanishName')}</span>
                <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                  {profile?.spanish_name || (language === 'ko' ? '없음' : 'Sin nombre español')}
                </span>
          </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 사용자 타입에 따른 정보 표시 */}
              {profile?.userType === 'student' || profile?.user_type === 'student' ? (
                <>
                  {/* 학력 정보 (대학생인 경우) */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">{t('profile.university')}</span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium">
                      {profile?.university || (language === 'ko' ? '대학교 없음' : 'Sin universidad')}
                    </span>
      </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">{t('profile.major')}</span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium">
                      {profile?.major || (language === 'ko' ? '전공 없음' : 'Sin carrera')}
                    </span>
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">{t('profile.grade')}</span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium">
                      {profile?.grade || (language === 'ko' ? '학년 없음' : 'Sin año de estudio')}
                    </span>
              </div>
                </>
              ) : (
                <>
                  {/* 직업 정보 (직장인인 경우) */}
                  <div className="flex items-center justify-between">
                    <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.occupation')}</span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.occupation || t('profile.occupation') + ' 없음'}
                    </span>
            </div>
            
                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.company')}</span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.company || t('profile.company') + ' 없음'}
                    </span>
          </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.experience')}</span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.career || t('profile.noExperience')}
                    </span>
              </div>
                </>
              )}

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 자기소개 */}
              <div className="flex items-start justify-between">
                <span className='text-gray-600 text-xs sm:text-sm'>{t('profile.selfIntroduction')}</span>
                <span className="text-gray-800 text-xs sm:text-sm font-medium text-right max-w-[60%]">
                  {profile?.introduction || t('profile.noSelfIntroduction')}
                </span>
          </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 포인트 현황 & 오늘의 미션 */}
              <div className="space-y-4 bg-white">
                {/* 포인트 요약 */}
                <div id="my-points" className="grid grid-cols-2 gap-3 scroll-mt-20">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-3 sm:p-4 text-white shadow-sm">
                    <p className="text-xs sm:text-sm font-semibold mb-1">{t('eventTab.pointSystem.pointsSummary.monthlyPoints')}</p>
                    <p className="text-xl sm:text-2xl font-bold">{rankingData.userRank?.monthly_points || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-3 sm:p-4 text-white shadow-sm">
                    <p className="text-xs sm:text-sm font-semibold mb-1">{t('eventTab.pointSystem.pointsSummary.totalPoints')}</p>
                    <p className="text-xl sm:text-2xl font-bold">{rankingData.userRank?.total_points || 0}</p>
                  </div>
                </div>

                {/* 내 등급 카드 - 총 포인트 아래 */}
                <div id="my-level" className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-3 sm:p-4 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-300">{t('myTab.myLevel')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 p-2 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-600">
                    {pointsLoading ? (
                      <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 animate-pulse">...</div>
                    ) : (
                      <UserBadge totalPoints={rankingData.userRank?.total_points || 0} size="lg" />
                    )}
                  </div>
                </div>

                {/* 오늘의 미션 */}
                {dailyMissions && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <button 
                      onClick={() => setIsMissionsExpanded(!isMissionsExpanded)}
                      className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <span className="text-lg">🎯</span>
                      <div className="flex-1 text-left">
                        <h3 className="text-sm font-bold text-gray-800">{t('eventTab.pointSystem.dailyMission.title')}</h3>
                        <p className="text-xs text-gray-600">{t('eventTab.pointSystem.dailyMission.subtitle')}</p>
                      </div>
                      <div className={`transition-transform duration-300 ${isMissionsExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </div>
                    </button>

                    {/* 오늘 획득 포인트 - 항상 보임 */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs sm:text-sm text-gray-600">{t('eventTab.pointSystem.dailyMission.todayEarned')}</span>
                        <span className="text-xs sm:text-sm font-bold text-blue-600">{dailyEarnedPoints} / 75</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min((dailyEarnedPoints / 75) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* 미션 목록 - 접으면 숨김 */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMissionsExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-1 text-xs sm:text-sm">
                      {/* 출석체크 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.attendance.count, 1)} {t('eventTab.pointSystem.dailyMission.missions.attendance.title')}
                        </span>
                        <span className="text-xs text-green-600 font-bold">+{dailyMissions.attendance.points}</span>
                      </div>
                      
                      {/* 댓글 작성 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.comments.count, dailyMissions.comments.max)} {t('eventTab.pointSystem.dailyMission.missions.comments.title')} ({dailyMissions.comments.count}/{dailyMissions.comments.max})
                        </span>
                        <span className="text-xs text-blue-600 font-bold">+{dailyMissions.comments.points}</span>
                      </div>
                      
                      {/* 좋아요 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.likes.count, dailyMissions.likes.max)} {t('eventTab.pointSystem.dailyMission.missions.likes.title')} ({dailyMissions.likes.count}/{dailyMissions.likes.max})
                        </span>
                        <span className="text-xs text-pink-600 font-bold">+{dailyMissions.likes.points}</span>
                      </div>
                      
                      {/* 자유게시판 작성 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.freeboardPost.count, 1)} {t('eventTab.pointSystem.dailyMission.missions.freeboardPost.title')}
                        </span>
                        <span className="text-xs text-indigo-600 font-bold">+{dailyMissions.freeboardPost.points}</span>
                      </div>
                      
                      {/* 스토리 작성 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.storyPost.count, 1)} {t('eventTab.pointSystem.dailyMission.missions.storyPost.title')}
                        </span>
                        <span className="text-xs text-purple-600 font-bold">+{dailyMissions.storyPost.points}</span>
                      </div>
                      
                      {/* 팬아트 업로드 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.fanartUpload.count, 1)} {t('eventTab.pointSystem.dailyMission.missions.fanartUpload.title')}
                        </span>
                        <span className="text-xs text-pink-600 font-bold">+{dailyMissions.fanartUpload.points}</span>
                      </div>
                      
                      {/* 아이돌 사진 업로드 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.idolPhotoUpload.count, 1)} {t('eventTab.pointSystem.dailyMission.missions.idolPhotoUpload.title')}
                        </span>
                        <span className="text-xs text-amber-600 font-bold">+{dailyMissions.idolPhotoUpload.points}</span>
                      </div>
                      
                      {/* 팬아트 좋아요 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.fanartLikes.count, dailyMissions.fanartLikes.max)} {t('eventTab.pointSystem.dailyMission.missions.fanartLikes.title')} ({dailyMissions.fanartLikes.count}/{dailyMissions.fanartLikes.max})
                        </span>
                        <span className="text-xs text-pink-600 font-bold">+{dailyMissions.fanartLikes.points}</span>
                      </div>
                      
                      {/* 아이돌 사진 좋아요 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.idolPhotoLikes.count, dailyMissions.idolPhotoLikes.max)} {t('eventTab.pointSystem.dailyMission.missions.idolPhotoLikes.title')} ({dailyMissions.idolPhotoLikes.count}/{dailyMissions.idolPhotoLikes.max})
                        </span>
                        <span className="text-xs text-amber-600 font-bold">+{dailyMissions.idolPhotoLikes.points}</span>
                      </div>
                      
                      {/* 투표 참여 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.pollVote.count, dailyMissions.pollVote.max)} {t('eventTab.pointSystem.dailyMission.missions.pollVotes.title')} ({dailyMissions.pollVote.count}/{dailyMissions.pollVote.max})
                        </span>
                        <span className="text-xs text-cyan-600 font-bold">+{dailyMissions.pollVote.points}</span>
                      </div>
                      
                      {/* 뉴스 댓글 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.newsComment.count, dailyMissions.newsComment.max)} {t('eventTab.pointSystem.dailyMission.missions.newsComments.title')} ({dailyMissions.newsComment.count}/{dailyMissions.newsComment.max})
                        </span>
                        <span className="text-xs text-blue-600 font-bold">+{dailyMissions.newsComment.points}</span>
                      </div>
                      
                      {/* 공유 */}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-700 flex items-center gap-2">
                          {renderCheckmarks(dailyMissions.share.count, dailyMissions.share.max)} {t('eventTab.pointSystem.dailyMission.missions.share.title')} ({dailyMissions.share.count}/{dailyMissions.share.max})
                        </span>
                        <span className="text-xs text-orange-600 font-bold">+{dailyMissions.share.points}</span>
                      </div>
                    </div>
                  </div>
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 추천인 코드 - 눈에 띄게 */}
              {referralCode && (
                <>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-purple-600" />
                        <span className='text-gray-700 font-semibold'>{t('profile.myReferralCode')}</span>
                      </div>
                      <Button
                        onClick={copyReferralCode}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 text-xs ml-1">{t('profile.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-xs ml-1">{t('profile.copy')}</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-3">
                      <code className="text-2xl font-mono font-bold text-purple-700 tracking-wider">
                        {referralCode}
                      </code>
                    </div>
                    <p className="text-xs text-gray-600">
                      {t('profile.shareReferralMessage')}
                    </p>
                  </div>
                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>
                </>
              )}

              {/* 내 추천인 현황 */}
              {referralCode && (
                <>
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span className='text-gray-700 font-semibold'>{t('eventTab.attendanceCheck.specialEvents.referralEvents.myStatus.title')}</span>
                    </div>

                    {/* 총 추천인 수 */}
                    <div className="flex items-center justify-between bg-white border border-indigo-200 rounded-lg p-3">
                      <span className="text-sm text-gray-600">{t('eventTab.attendanceCheck.specialEvents.referralEvents.myStatus.description')}</span>
                      <Badge className="bg-indigo-500 text-white">0명</Badge>
                    </div>

                    {/* 추천인 목록 */}
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">{t('eventTab.attendanceCheck.specialEvents.referralEvents.myStatus.noReferrals')}</p>
                    </div>
                  </div>
                  
                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>
                </>
              )}

              {/* 접근 조건을 만족하지 못하는 경우 안내 배너 */}
              {!showPartnerSection && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <div className="space-y-1">
                    <p className="font-medium">라틴아메리카에 거주하는 한국이시면 국적 인증이 필요합니다.</p>
                    <p className="font-medium">Si eres coreano residente en Latinoamérica, necesitas verificar tu nacionalidad.</p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      {language === 'ko' ? '전화번호 수정' : 'Editar número'}
                    </Button>
                    <Button size="sm" onClick={() => router.push('/verification')}>
                      {language === 'ko' ? '국적 인증하기' : 'Verificar nacionalidad'}
                    </Button>
                  </div>
                </div>
              )}

              {/* 화상 채팅 파트너 등록 (한국인만, 인증 완료 또는 KR 국가)
                  추가 안전장치: 국가 코드가 KR인 경우만 허용
                  디버깅 로그는 컴포넌트 상단 useEffect에서 출력 */}
              {showPartnerSection && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <span className='text-sm sm:text-base text-gray-700 font-semibold'>화상 채팅 파트너</span>
                    </div>
                    {isPartnerRegistered ? (
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                        등록됨
                      </span>
                    ) : (
                      <Button
                        onClick={() => setShowPartnerForm(!showPartnerForm)}
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        {showPartnerForm ? (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            취소
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            등록하기
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {showPartnerForm && !isPartnerRegistered && (
                    <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600">
                        화상 채팅 파트너로 등록하면 다른 사용자들과 언어교환을 할 수 있습니다.
                      </p>
                      <Button
                        onClick={registerAsPartner}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        파트너로 등록하기
                      </Button>
                    </div>
                  )}

                  {isPartnerRegistered && (
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200">
                      <p className="text-xs sm:text-sm text-green-700 font-medium">
                        ✅ 화상 채팅 파트너로 등록되어 있습니다!
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        화상 채팅 페이지에서 다른 사용자들이 찾을 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
                  </div>

        {/* 설정 섹션 */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 p-5 border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {language === 'ko' ? '계정 및 환경 설정' : 'Configuraciones de cuenta'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettingsExpanded(prev => (prev.length > 0 ? [] : ['stories', 'security', 'notifications']))
                }
                className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                {settingsExpanded.length > 0
                  ? language === 'ko'
                    ? '모두 접기'
                    : 'Cerrar todo'
                  : language === 'ko'
                  ? '모두 펼치기'
                  : 'Abrir todo'}
              </button>
            </div>

            <Accordion type="multiple" value={settingsExpanded} onValueChange={setSettingsExpanded}>
              <AccordionItem value="stories" className="border-b border-gray-100">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {language === 'ko' ? '스토리 및 콘텐츠 관리' : 'Historias y contenido'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'ko'
                          ? '스토리 노출, 저장소, 개별 스토리를 한 곳에서 조정하세요.'
                          : 'Controla visibilidad, almacenamiento y ajustes individuales.'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <StorySettings />
                </AccordionContent>
              </AccordionItem>

              {process.env.NEXT_PUBLIC_BIOMETRIC_ENABLED === 'true' && (
              <AccordionItem value="security" className="border-b border-gray-100">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {language === 'ko' ? '보안 및 보호 옵션' : 'Seguridad y protección'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'ko'
                          ? '지문 로그인과 등록된 기기를 확인하세요.'
                          : 'Revisa el inicio con huella y los dispositivos registrados.'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 space-y-3">
                  {biometricSupported ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-emerald-200">
                        <div className="flex items-center gap-3">
                          <Fingerprint className="w-5 h-5 text-emerald-600" />
                          <div>
                            <div className="font-medium text-gray-800 text-sm">
                              {language === 'ko' ? '지문 인증 로그인' : 'Inicio con huella digital'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {language === 'ko' ? '빠르고 안전하게 로그인하세요' : 'Inicia sesión rápido y seguro'}
                            </div>
                          </div>
                        </div>
                        <Switch
                      className={compactSwitchClass}
                          checked={biometricEnabled}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleEnableBiometric()
                            } else {
                              handleDisableBiometric()
                            }
                          }}
                        />
                      </div>

                      {biometricEnabled && biometricCredentials.length > 0 && (
                        <div className="bg-white/60 rounded-lg p-3 space-y-2 border border-emerald-100">
                          <p className="text-xs font-medium text-emerald-800">
                            {language === 'ko' ? '등록된 기기:' : 'Dispositivos registrados:'}
                          </p>
                          {biometricCredentials.map((cred, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-emerald-700">
                              <Smartphone className="w-3 h-3" />
                              <span>{cred.deviceName}</span>
                              <span className="text-emerald-500">•</span>
                              <span className="text-gray-500">{new Date(cred.lastUsedAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white/70 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-700">
                      {language === 'ko'
                        ? '현재 기기는 지문 인증을 지원하지 않습니다. 지원 기기에서 다시 시도해주세요.'
                        : 'El dispositivo actual no admite huella digital. Inténtalo desde un dispositivo compatible.'}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
              )}

              <AccordionItem value="notifications">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {language === 'ko' ? '알림 설정' : 'Notificaciones'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'ko'
                          ? '이메일, 푸시 등 수신 방식을 직접 선택할 수 있어요.'
                          : 'Elige cómo recibir correos, avisos push y marketing.'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{t('myTab.webPushNotification')}</div>
                        <div className="text-xs text-gray-600">{t('myTab.webPushDescription')}</div>
                      </div>
                    </div>
                    <Switch
                      className={compactSwitchClass}
                      checked={notificationSettings.webPush}
                      onCheckedChange={(checked) => handleNotificationChange('webPush', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{t('myTab.emailNotification')}</div>
                        <div className="text-xs text-gray-600">{t('myTab.emailDescription')}</div>
                      </div>
                    </div>
                    <Switch
                      className={compactSwitchClass}
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-gray-800 text-xs">{t('myTab.marketingNotification')}</div>
                        <div className="text-xs text-gray-600">{t('myTab.marketingDescription')}</div>
                      </div>
                    </div>
                    <Switch
                      className={compactSwitchClass}
                      checked={notificationSettings.marketing}
                      onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                disabled={!token}
                className="w-full justify-center px-4 py-3 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setDeleteConfirmText('')
                  setDeleteError(null)
                  setShowDeleteDialog(true)
                }}
              >
                {language === 'ko' ? '계정 삭제' : 'Eliminar cuenta'}
              </Button>
            </div>
          </div>
        </div>

        {/* 충전소 섹션 구분선 */}
        <div className="mx-4 my-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
              <img src="/misc/charging-title.png" alt="충전소" className="w-5 h-5" />
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

    <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) {
            setDeleteConfirmText('')
            setDeleteError(null)
            setIsDeletingAccount(false)
          }
        }}
      >
        <DialogContent
          className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl"
          showCloseButton={!isDeletingAccount}
        >
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '계정을 정말 삭제할까요?' : '¿Eliminar tu cuenta permanentemente?'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko'
                ? '계정을 삭제하면 개인정보와 포인트, 설정이 영구적으로 삭제되며 복구할 수 없습니다.'
                : 'La eliminación eliminará permanentemente tus datos personales, puntos y ajustes. No podrás deshacer esta acción.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-gray-600">
            <p>
              {language === 'ko'
                ? '삭제를 진행하려면 아래 확인 문구를 입력해주세요.'
                : 'Para continuar, escribe la palabra de confirmación abajo.'}
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">{language === 'ko' ? '삭제 시 처리 내용' : 'Lo que sucederá'}</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  {language === 'ko'
                    ? '개인정보, 알림 설정, 선호도 등 계정 정보가 모두 삭제됩니다.'
                    : 'Se eliminarán tu información personal, ajustes y preferencias.'}
                </li>
                <li>
                  {language === 'ko'
                    ? '작성한 게시글과 댓글은 더 이상 노출되지 않거나 “탈퇴한 사용자”로 표시됩니다.'
                    : 'Tus publicaciones y comentarios dejarán de mostrarse o aparecerán como “usuario eliminado”.'}
                </li>
                <li>
                  {language === 'ko'
                    ? '삭제 후에는 동일 이메일로 재가입이 가능하지만 기존 데이터는 복구되지 않습니다.'
                    : 'Podrás crear una nueva cuenta con el mismo correo, pero los datos anteriores no se podrán recuperar.'}
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              {language === 'ko'
                ? '"DELETE" 를 대문자로 입력해주세요.'
                : 'Escribe “DELETE” en mayúsculas para confirmar.'}
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              placeholder="DELETE"
              disabled={isDeletingAccount}
            />
          </div>

          {deleteError && (
            <p className="text-sm text-red-500">
              {deleteError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={isDeletingAccount}
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmText('')
                setDeleteError(null)
              }}
            >
              {language === 'ko' ? '취소' : 'Cancelar'}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
              onClick={handleAccountDeletion}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAccount
                ? language === 'ko'
                  ? '삭제 중...'
                  : 'Eliminando...'
                : language === 'ko'
                ? '완전히 삭제하기'
                : 'Eliminar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 인증 확인 다이얼로그 */}
      <AuthConfirmDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title={language === 'ko' ? '인증이 필요합니다' : 'Se requiere autenticación'}
        description={language === 'ko' 
          ? '프로필을 보려면 인증센터에서 프로필을 완성해주세요. 인증센터로 이동하시겠습니까?'
          : 'Para ver tu perfil, completa tu perfil en el centro de autenticación. ¿Deseas ir al centro de autenticación?'}
        confirmText={language === 'ko' ? '인증센터로 이동' : 'Ir al centro de autenticación'}
        cancelText={language === 'ko' ? '취소' : 'Cancelar'}
      />
    </>
  )
}