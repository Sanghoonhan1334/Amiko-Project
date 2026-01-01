'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Video, Phone, Camera, Upload, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowLeft, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import PhoneVerification from '@/components/auth/PhoneVerification'

export default function VerificationPage() {
  const router = useRouter()
  const { user, token: authToken, refreshSession } = useAuth()
  const { t, language } = useLanguage()
  
  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false) // SMS 인증 완료 여부
  const [showPhoneVerification, setShowPhoneVerification] = useState(false) // 전화번호 인증 UI 표시 여부
  const [isUploadingImage, setIsUploadingImage] = useState(false) // 프로필 이미지 업로드 중 여부
  const [fieldErrors, setFieldErrors] = useState<{
    profile_image?: string
    korean_name?: string
    phone?: string
    phone_verified?: string
  }>({}) // 필드별 에러 메시지
  
  const [formData, setFormData] = useState({
    // 기본 정보
    full_name: '',
    korean_name: '', // 한국 이름
    spanish_name: '', // 스페인어 이름
    phone: '',
    one_line_intro: '',
    profile_image: null as File | null,
    profile_image_url: '' as string, // 업로드된 프로필 이미지 URL
    
    // 사용자 유형
    user_type: 'student', // 'student' | 'general'
    is_korean: true,
    
    // 대학생 정보 (student일 때만)
    university: '',
    major: '',
    grade: '',
    
    // 일반인 정보 (general일 때만)
    occupation: '',
    company: '',
    work_experience: '',
    
    // 추가 정보
    interests: [] as string[],
    custom_interests: '',
    matching_preferences: [] as string[], // 'instant' | 'selective'
    language: 'ko',
    
    // 언어 수준
    korean_level: 'native', // 한국인은 기본적으로 모국어
    english_level: 'none',
    spanish_level: 'beginner', // 스페인어 학습자들을 위해 초급으로 기본 설정
    
  })

  // 운영자 체크 및 사용자 타입 확인 로직
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id && !user?.email) {
        setAdminCheckComplete(true)
        return
      }

      try {
        const params = new URLSearchParams()
        if (user?.id) params.append('userId', user.id)
        if (user?.email) params.append('email', user.email)
        
        const response = await fetch(`/api/admin/check?${params.toString()}`)
        
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin || false)
          
          // 운영자라면 메인 페이지로 리다이렉트
          if (data.isAdmin) {
            console.log('운영자 확인됨, 메인 페이지로 리다이렉트')
            router.push('/main?tab=me')
            return
          }
        }
        
        // 사용자 타입 확인 - 한국인이 아니면 현지인 전용 페이지로 리다이렉트
        try {
          const { createSupabaseBrowserClient } = await import('@/lib/supabase-client')
          const supabase = createSupabaseBrowserClient()
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_korean')
            .eq('id', user.id)
            .maybeSingle()
          
          if (!userError && userData) {
            const isKorean = userData.is_korean === true
            if (!isKorean) {
              console.log('[VERIFICATION] 현지인 감지 - 현지인 전용 페이지로 리다이렉트')
              router.push('/verification-center')
              return
            }
          }
        } catch (e) {
          console.error('[VERIFICATION] 사용자 타입 확인 오류:', e)
        }
      } catch (error) {
        console.error('운영자 상태 확인 실패:', error)
      } finally {
        setAdminCheckComplete(true)
      }
    }

    checkAdminStatus()
  }, [user?.id, user?.email, router])

  // 폼 데이터 변경 디버깅
  useEffect(() => {
    console.log('[FORM] 폼 데이터 변경됨:', formData)
  }, [formData])

  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      console.log(`[FORM] ${field} 변경:`, { 이전값: prev[field], 새값: value })
      
      // 전화번호 입력 시 포맷팅 (한국인: 010-XXXX-XXXX)
      if (field === 'phone' && value) {
        const digits = value.replace(/\D/g, '')
        let formattedValue = digits
        if (digits.length > 3 && digits.length <= 7) {
          formattedValue = `${digits.substring(0, 3)}-${digits.substring(3)}`
        } else if (digits.length > 7) {
          formattedValue = `${digits.substring(0, 3)}-${digits.substring(3, 7)}-${digits.substring(7, 11)}`
        }
        value = formattedValue
      }
      
      return {
        ...prev,
        [field]: value
      }
    })
  }, [])

  // 전화번호 입력 완료 시 자동으로 SMS 인증 시작
  useEffect(() => {
    if (!formData.phone || phoneVerified || showPhoneVerification) {
      return
    }

    // 전화번호 형식이 유효한지 확인 (한국인: 010-1234-5678 형식)
    const isValidPhone = /^010-\d{4}-\d{4}$/.test(formData.phone)
    
    if (isValidPhone) {
      // 약간의 딜레이 후 인증 UI 표시 (사용자가 입력을 완료할 시간을 줌)
      const timer = setTimeout(() => {
        setShowPhoneVerification(true)
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [formData.phone, phoneVerified, showPhoneVerification])

  const handleInterestToggle = useCallback((interest: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interest)
      console.log(`[FORM] 관심사 토글:`, { 관심사: interest, 선택됨: !isSelected })
      return {
        ...prev,
        interests: isSelected 
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest]
      }
    })
  }, [])

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push('/main')
    }
  }, [step, router])

  const nextStep = useCallback(() => {
    if (step < 2) {
      // 필수 필드 검증
      const errors: typeof fieldErrors = {}
      
      if (!formData.profile_image_url) {
        errors.profile_image = '프로필 사진을 업로드해주세요'
      }
      
      if (!formData.korean_name || formData.korean_name.trim() === '') {
        errors.korean_name = '한국 이름을 입력해주세요'
      }
      
      if (!formData.phone || formData.phone.trim() === '') {
        errors.phone = '연락처를 입력해주세요'
      } else if (!phoneVerified) {
        errors.phone_verified = '전화번호 인증을 완료해주세요'
      }
      
      // 에러가 있으면 표시하고 진행하지 않음
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }
      
      // 에러가 없으면 초기화하고 다음 단계로
      setFieldErrors({})
      setStep(step + 1)
    }
  }, [step, formData.profile_image_url, formData.korean_name, formData.phone, phoneVerified, fieldErrors])

  // 운영자라면 로딩 중 표시
  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{language === 'ko' ? '검증 중...' : 'Verificando...'}</p>
        </div>
      </div>
    )
  }

  // 운영자가 이미 리다이렉트되었는지 확인 (추가 안전장치)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-600">메인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              인증을 위해 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
      // 토큰 확인
      let token = authToken || localStorage.getItem('amiko_token')
      
      // 토큰이 없으면 갱신 시도
      if (!token && refreshSession) {
        const refreshed = await refreshSession()
        if (refreshed) {
          token = localStorage.getItem('amiko_token')
        }
      }

      if (!token) {
        alert('인증이 필요합니다. 다시 로그인해주세요.')
        return
      }

      const formDataToUpload = new FormData()
      formDataToUpload.append('file', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToUpload
      })

      if (response.ok) {
        const result = await response.json()
        console.log('프로필 이미지 업로드 성공:', result)
        
        // 업로드된 이미지 URL 저장
        const imageUrl = result.avatar_url || result.avatarUrl
        if (imageUrl) {
          setFormData(prev => ({
            ...prev,
            profile_image_url: imageUrl
          }))
          // 프로필 사진 업로드 성공 시 에러 제거
          if (fieldErrors.profile_image) {
            setFieldErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors.profile_image
              return newErrors
            })
          }
          alert('프로필 이미지가 업로드되었습니다!')
        }
      } else {
        const error = await response.json()
        console.error('프로필 이미지 업로드 실패:', error)
        alert(`업로드 실패: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const dataToSubmit = {
        ...formData,
        is_korean: true, // 한국 사용자로 고정
        language: 'ko', // 한국어로 고정
        profile_image: formData.profile_image_url || null, // 업로드된 이미지 URL 전송
        is_verified: true, // 인증 완료 상태
        verification_completed: true, // 인증 완료 플래그
        // 한국 이름과 스페인어 이름 저장
        korean_name: formData.korean_name || null,
        spanish_name: formData.spanish_name || null,
        // full_name도 korean_name으로 설정 (하위 호환성)
        full_name: formData.korean_name || formData.full_name || null,
        // 자기소개를 introduction으로도 저장 (custom_interests는 자기소개 필드)
        introduction: formData.custom_interests || null
      }
      
      // File 객체는 제거하고 URL만 전송
      delete (dataToSubmit as any).profile_image_file
      
      console.log('[VERIFICATION] 제출할 데이터:', {
        ...dataToSubmit,
        is_verified: dataToSubmit.is_verified,
        verification_completed: dataToSubmit.verification_completed,
        korean_name: dataToSubmit.korean_name,
        introduction: dataToSubmit.introduction
      })

      // 토큰 확인 및 갱신 - AuthContext의 token을 우선 사용
      let token = authToken || localStorage.getItem('amiko_token')
      console.log('[VERIFICATION] 토큰 확인:', { 
        hasAuthToken: !!authToken, 
        hasLocalToken: !!localStorage.getItem('amiko_token'),
        tokenLength: token?.length 
      })
      
      // 토큰이 없거나 만료되었을 가능성이 있으면 갱신 시도
      if (!token || !authToken) {
        console.log('[VERIFICATION] 토큰이 없거나 AuthContext에 없음, 세션 갱신 시도')
        
        // AuthContext의 refreshSession 사용
        if (refreshSession) {
          const refreshed = await refreshSession()
          if (refreshed) {
            // 갱신 후 localStorage에서 최신 토큰 가져오기
            token = localStorage.getItem('amiko_token')
            console.log('[VERIFICATION] AuthContext 세션 갱신 성공, 새 토큰:', token ? '있음' : '없음')
          }
        }
        
        // 여전히 토큰이 없으면 Supabase로 직접 갱신 시도
      if (!token) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (session && !refreshError) {
          token = session.access_token
          localStorage.setItem('amiko_token', token)
          console.log('[VERIFICATION] Supabase 토큰 갱신 성공')
        } else {
          console.log('[VERIFICATION] Supabase 토큰 갱신 실패:', refreshError)
        }
      } catch (refreshError) {
        console.log('[VERIFICATION] 토큰 갱신 중 오류:', refreshError)
          }
        }
      }
      
      if (!token) {
        console.log('[VERIFICATION] 토큰이 없음, 로그인 페이지로 이동')
        alert('로그인이 필요합니다. 다시 로그인해주세요.')
        router.push('/sign-in')
        return
      }

      console.log('[VERIFICATION] 프로필 생성 요청 시작')
      console.log('[VERIFICATION] 사용자 정보:', { userId: user?.id, userEmail: user?.email })
      
      let response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify(dataToSubmit)
      })

      // 401 오류 발생 시 토큰 갱신 후 재시도
      if (response.status === 401) {
        console.log('[VERIFICATION] 401 오류 발생, 토큰 갱신 후 재시도')
        
        // 토큰 갱신 시도
        let refreshed = false
        if (refreshSession) {
          refreshed = await refreshSession()
          if (refreshed) {
            token = localStorage.getItem('amiko_token')
            console.log('[VERIFICATION] 토큰 갱신 성공, 재시도')
          }
        }
        
        // refreshSession이 실패했거나 없으면 Supabase로 직접 갱신
        if (!refreshed) {
          try {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
            
            if (session && !refreshError) {
              token = session.access_token
              localStorage.setItem('amiko_token', token)
              refreshed = true
              console.log('[VERIFICATION] Supabase 토큰 갱신 성공, 재시도')
            }
          } catch (refreshError) {
            console.log('[VERIFICATION] 토큰 갱신 실패:', refreshError)
          }
        }
        
        // 토큰 갱신 성공 시 재시도
        if (refreshed && token) {
          response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${encodeURIComponent(token)}`
            },
            body: JSON.stringify(dataToSubmit)
          })
        }
      }

      if (response.ok) {
        const result = await response.json()
        console.log('[VERIFICATION] 프로필 생성 완료:', result)
        
        console.log('[VERIFICATION] 프로필 생성 완료 - 인증 상태는 자동으로 업데이트됩니다')
        // 화상 채팅 파트너는 /api/profile에서 Level 2 인증 완료 시 자동으로 등록됨
        
        // 인증 완료 플래그 설정 (헤더와 MyTab에서 인증 상태를 다시 체크하도록)
        localStorage.setItem('verification_just_completed', 'true')
        
        // 데이터베이스 업데이트가 완료될 시간을 주기 위해 약간의 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 성공 메시지 표시 후 메인 페이지로 이동
        alert('인증이 완료되었습니다!')
        router.push('/main?tab=me')
      } else {
        const errorData = await response.json()
        console.error('[VERIFICATION] 프로필 생성 실패:', errorData)
        
        if (response.status === 401) {
          // 재시도 후에도 401 오류인 경우 로그인 페이지로 이동
          console.log('[VERIFICATION] 재시도 후에도 인증 오류, 로그인 페이지로 이동')
          alert('인증이 만료되었습니다. 다시 로그인해주세요.')
          localStorage.removeItem('amiko_token')
          router.push('/sign-in')
          return
        }
        
        throw new Error(errorData.error || '프로필 생성 실패')
      }
    } catch (error) {
      console.error('프로필 생성 오류:', error)
      alert('인증 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 md:pt-36 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('verification.title')}</h1>
              <p className="text-gray-600">{t('verification.subtitle')}</p>
            </div>
          </div>
          
          {/* 진행 단계 */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* 폼 */}
        <Card className="mb-8 bg-gradient-to-br from-white to-blue-50 border border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              {step === 1 ? '기본 정보' : '관심사 및 선호도'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {step === 1 ? '프로필을 완성하기 위해 기본 정보를 입력해주세요' : '더 나은 매칭을 위해 관심사와 선호도를 설정해주세요'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {step === 1 ? (
              // 1단계: 기본 정보
              <div className="space-y-4">
                {/* 프로필 사진 업로드 */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">프로필 사진 *</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transition-all duration-200 ${
                        isUploadingImage ? 'opacity-50' : ''
                      }`}>
                        {formData.profile_image_url ? (
                          <img 
                            src={formData.profile_image_url} 
                            alt="프로필" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-white" />
                        )}
                      </div>
                      
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      
                      <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        프로필 사진을 업로드해주세요. (5MB 이하)
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        자신의 얼굴이 나온 사진을 넣어주세요.
                      </p>
                      {formData.profile_image_url && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          프로필 사진 업로드 완료
                        </p>
                      )}
                      {fieldErrors.profile_image && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {fieldErrors.profile_image}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="korean_name" className="text-sm font-semibold text-gray-700 mb-2 block">한국 이름 *</Label>
                  <Input
                    id="korean_name"
                    value={formData.korean_name}
                    onChange={(e) => {
                      handleInputChange('korean_name', e.target.value)
                      // 입력 시작 시 에러 제거
                      if (fieldErrors.korean_name) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.korean_name
                          return newErrors
                        })
                      }
                    }}
                    placeholder="한국 이름을 입력해주세요"
                    className={`border-2 rounded-lg ${
                      fieldErrors.korean_name 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.korean_name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.korean_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spanish_name" className="text-sm font-semibold text-gray-700 mb-2 block">스페인어 이름 (선택)</Label>
                  <Input
                    id="spanish_name"
                    value={formData.spanish_name}
                    onChange={(e) => handleInputChange('spanish_name', e.target.value)}
                    placeholder="스페인어 이름이 있으면 입력해주세요"
                    className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">연락처 *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    id="phone"
                      type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      handleInputChange('phone', e.target.value)
                      // 입력 시작 시 에러 제거
                      if (fieldErrors.phone || fieldErrors.phone_verified) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.phone
                          delete newErrors.phone_verified
                          return newErrors
                        })
                      }
                    }}
                    placeholder="010-1234-5678"
                      className={`border-2 rounded-lg !pl-10 ${
                        fieldErrors.phone || fieldErrors.phone_verified
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-blue-200 focus:border-blue-500'
                      }`}
                      disabled={phoneVerified}
                    />
                  </div>
                  {phoneVerified && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      전화번호 인증 완료
                    </p>
                  )}
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.phone}
                    </p>
                  )}
                  {fieldErrors.phone_verified && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.phone_verified}
                    </p>
                  )}
                </div>

                {/* 전화번호 인증 UI - 전화번호 입력 시 자동 표시 */}
                {showPhoneVerification && !phoneVerified && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <PhoneVerification
                      phoneNumber={formData.phone}
                      nationality="KR"
                      onVerify={async (code: string) => {
                        try {
                          const response = await fetch('/api/verify/check', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              channel: 'sms',
                              target: formData.phone,
                              code: code,
                              nationality: 'KR'
                            })
                          })
                          const result = await response.json()
                          if (response.ok && result.ok) {
                            setPhoneVerified(true)
                            setShowPhoneVerification(false)
                            // 전화번호 인증 완료 시 에러 제거
                            if (fieldErrors.phone_verified) {
                              setFieldErrors(prev => {
                                const newErrors = { ...prev }
                                delete newErrors.phone_verified
                                return newErrors
                              })
                            }
                            // sms_verified_at은 API에서 자동으로 저장됨
                          } else {
                            alert('인증코드가 올바르지 않습니다.')
                          }
                        } catch (error) {
                          console.error('전화번호 인증 실패:', error)
                          alert('인증 중 오류가 발생했습니다.')
                        }
                      }}
                      onResend={async (method: string) => {
                        try {
                          const response = await fetch('/api/verify/start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              channel: method,
                              target: formData.phone,
                              nationality: 'KR'
                            })
                          })
                          const result = await response.json()
                          if (!response.ok || !result.ok) {
                            throw new Error(result.error || '인증코드 발송 실패')
                          }
                        } catch (error) {
                          console.error('인증코드 발송 실패:', error)
                          throw error
                        }
                      }}
                      isLoading={loading}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="user_type" className="text-sm font-semibold text-gray-700 mb-2 block">구분 *</Label>
                  <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
                    <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">대학생</SelectItem>
                      <SelectItem value="general">일반인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.user_type === 'student' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="university">대학교 *</Label>
                      <Input
                        id="university"
                        value={formData.university}
                        onChange={(e) => handleInputChange('university', e.target.value)}
                        placeholder="대학교명을 입력해주세요"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="major">전공 *</Label>
                      <Input
                        id="major"
                        value={formData.major}
                        onChange={(e) => handleInputChange('major', e.target.value)}
                        placeholder="전공을 입력해주세요"
                      />
                    </div>

                    <div>
                      <Label htmlFor="grade">학년 *</Label>
                      <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="학년을 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1학년">1학년</SelectItem>
                          <SelectItem value="2학년">2학년</SelectItem>
                          <SelectItem value="3학년">3학년</SelectItem>
                          <SelectItem value="4학년">4학년</SelectItem>
                          <SelectItem value="대학원">대학원</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {formData.user_type === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="occupation">직업 *</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        placeholder="직업을 입력해주세요"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="company">소속 *</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="회사명 또는 소속을 입력해주세요"
                      />
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // 2단계: 관심사 및 선호도
              <div className="space-y-6">
                {/* 관심사 선택 */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">내가 잘 대답해줄 수 있는 분야 (최대 5개)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['한국어', '한국문화', '음식', '여행', '영화', '음악', '스포츠', '패션', '게임', '기술', '경제', '언어교환'].map(interest => (
                      <Button
                        key={interest}
                        variant={formData.interests.includes(interest) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInterestToggle(interest)}
                        disabled={!formData.interests.includes(interest) && formData.interests.length >= 5}
                        className={`text-xs transition-all duration-200 ${
                          formData.interests.includes(interest)
                            ? 'bg-blue-200 text-blue-800 border-blue-300 shadow-sm'
                            : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('verification.selectedInterests', { count: formData.interests.length })}
                  </p>
                </div>

                {/* 언어 수준 */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">언어 수준</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="korean_level" className="text-sm font-semibold text-gray-700 mb-2 block">한국어</Label>
                      <Select value={formData.korean_level} onValueChange={(value) => handleInputChange('korean_level', value)}>
                        <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                          <SelectValue placeholder="수준 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">불가능</SelectItem>
                          <SelectItem value="beginner">초급</SelectItem>
                          <SelectItem value="intermediate">중급</SelectItem>
                          <SelectItem value="advanced">고급</SelectItem>
                          <SelectItem value="native">모국어</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="english_level" className="text-sm font-semibold text-gray-700 mb-2 block">영어</Label>
                      <Select value={formData.english_level} onValueChange={(value) => handleInputChange('english_level', value)}>
                        <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                          <SelectValue placeholder="수준 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">불가능</SelectItem>
                          <SelectItem value="beginner">초급</SelectItem>
                          <SelectItem value="intermediate">중급</SelectItem>
                          <SelectItem value="advanced">고급</SelectItem>
                          <SelectItem value="native">모국어</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="spanish_level" className="text-sm font-semibold text-gray-700 mb-2 block">스페인어</Label>
                      <Select value={formData.spanish_level} onValueChange={(value) => handleInputChange('spanish_level', value)}>
                        <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                          <SelectValue placeholder="수준 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">불가능</SelectItem>
                          <SelectItem value="beginner">초급</SelectItem>
                          <SelectItem value="intermediate">중급</SelectItem>
                          <SelectItem value="advanced">고급</SelectItem>
                          <SelectItem value="native">모국어</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 자기소개 */}
                <div>
                  <Label htmlFor="introduction" className="text-sm font-semibold text-gray-700 mb-2 block">
                    자기소개 * (최소 20자)
                  </Label>
                  <Textarea
                    id="introduction"
                    value={formData.custom_interests}
                    onChange={(e) => handleInputChange('custom_interests', e.target.value)}
                    placeholder="좀 더 자세한 자기소개를 입력해주세요 (최소 20자)"
                    rows={4}
                    className={`border-2 rounded-lg ${
                      formData.custom_interests && formData.custom_interests.length < 20
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {formData.custom_interests && formData.custom_interests.length < 20 && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        최소 20자 이상 입력해주세요 ({formData.custom_interests.length}/20)
                      </p>
                    )}
                    {formData.custom_interests && formData.custom_interests.length >= 20 && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {formData.custom_interests.length}자 입력됨
                      </p>
                    )}
                    {!formData.custom_interests && (
                      <p className="text-sm text-gray-500">
                        최소 20자 이상 입력해주세요
                      </p>
                    )}
                  </div>
                </div>

                {/* 화상 채팅 파트너 자동 등록 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        {language === 'ko' ? '화상 채팅 파트너 자동 등록' : 'Registro automático como socio de videollamada'}
                      </p>
                      <p className="text-xs text-blue-700">
                        {language === 'ko' 
                          ? '인증 완료 시 화상 채팅 파트너로 자동 등록됩니다.'
                          : 'Se registrará automáticamente como socio de videollamada al completar la verificación.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={goBack}
            disabled={loading}
            className="border-2 border-gray-300 hover:border-gray-400"
          >
            이전
          </Button>
          
          {step === 2 ? (
            <Button 
              onClick={handleSubmit}
              disabled={loading || !formData.korean_name || !formData.custom_interests || formData.custom_interests.length < 20}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '완료'}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6"
            >
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}