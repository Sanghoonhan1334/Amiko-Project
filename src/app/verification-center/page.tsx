'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowLeft, CheckCircle, AlertCircle, Phone, User } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import PhoneVerification from '@/components/auth/PhoneVerification'
import { countries } from '@/constants/countries'

export default function VerificationCenterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t, language } = useLanguage()
  
  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  const [isKorean, setIsKorean] = useState<boolean | null>(null) // 기본값: null (미검증)
  const [isKoreanDetermined, setIsKoreanDetermined] = useState(false) // 한국인 여부가 결정되었는지
  const [previousPage, setPreviousPage] = useState<string | null>(null)
  const [phoneVerified, setPhoneVerified] = useState(false) // SMS 인증 완료 여부
  const [showPhoneVerification, setShowPhoneVerification] = useState(false) // 전화번호 인증 UI 표시 여부
  const [selectedVerificationMethod, setSelectedVerificationMethod] = useState<string>('') // 선택한 인증 방법 (sms, whatsapp 등)
  
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('') // 전화번호 국가번호
  const [isUploadingImage, setIsUploadingImage] = useState(false) // 프로필 이미지 업로드 중 여부
  const [fieldErrors, setFieldErrors] = useState<{
    profile_image?: string
    spanish_name?: string
    phone?: string
    phone_verified?: string
    custom_interests?: string
    korean_level?: string
    spanish_level?: string
    occupation?: string
    university?: string
    major?: string
    grade?: string
    interests?: string
  }>({}) // 필드별 에러 메시지
  const [formData, setFormData] = useState({
    // 기본 정보
    full_name: '',
    korean_name: '',
    spanish_name: '',
    phone: '',
    one_line_intro: '',
    profile_image: null as File | null,
    profile_image_url: '' as string, // 업로드된 프로필 이미지 URL
    
    // 사용자 유형
    user_type: 'student', // 'student' | 'general'
    is_korean: undefined as boolean | undefined,
    
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
    language: undefined as string | undefined,
    
    // 언어 수준 (사용자 타입에 따라 동적으로 설정됨)
    korean_level: undefined as string | undefined,
    english_level: 'none',
    spanish_level: undefined as string | undefined
  })

  // 이전 페이지 저장
  useEffect(() => {
    const referrer = document.referrer
    if (referrer && referrer !== window.location.href) {
      const url = new URL(referrer)
      const pathname = url.pathname + url.search
      setPreviousPage(pathname)
      console.log('[VERIFICATION_CENTER] 이전 페이지 저장:', pathname)
    }
  }, [])

  // 사용자 타입에 따른 언어 수준 기본값 설정
  useEffect(() => {
    if (isKorean) {
      // 한국인: 한국어 모국어, 스페인어 초급
      setFormData(prev => ({
        ...prev,
        korean_level: 'native',
        spanish_level: 'beginner'
      }))
    } else {
      // 현지인: 스페인어 모국어, 한국어 초급
      setFormData(prev => ({
        ...prev,
        korean_level: 'beginner',
        spanish_level: 'native'
      }))
    }
  }, [isKorean])

  // 운영자 체크 및 사용자 타입 확인 로직
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user?.id && !user?.email) {
        setAdminCheckComplete(true)
        return
      }

      try {
        // 운영자 상태 확인
        const params = new URLSearchParams()
        if (user?.id) params.append('userId', user.id)
        if (user?.email) params.append('email', user.email)
        
        const adminResponse = await fetch(`/api/admin/check?${params.toString()}`)
        
        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          setIsAdmin(adminData.isAdmin || false)
          
          // 운영자라면 메인 페이지로 리다이렉트
          if (adminData.isAdmin) {
            console.log('운영자 확인됨, 메인 페이지로 리다이렉트')
            router.push('/main?tab=me')
            return
          }
        }

        // 사용자 프로필에서 한국인 여부 확인
        // 최신 데이터를 확실히 가져오기 위해 Supabase에서 직접 조회
        try {
          if (user?.id && !isKoreanDetermined) {
            // 먼저 Supabase에서 직접 is_korean과 country 조회 (최신 데이터 보장)
            try {
              const supabase = createSupabaseBrowserClient()
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_korean, country')
                .eq('id', user.id)
                .maybeSingle()
              
              if (!userError && userData) {
                const userIsKorean = userData.is_korean === true
                const userCountry = userData.country
                
                console.log('[VERIFICATION_CENTER] Supabase에서 직접 조회:', {
                  is_korean: userData.is_korean,
                  country: userCountry,
                  isKorean: userIsKorean
                })
                
                setIsKorean(userIsKorean)
                setIsKoreanDetermined(true)
                
                // 한국인이면 한국인 전용 페이지로 리다이렉트
                if (userIsKorean === true) {
                  console.log('[VERIFICATION_CENTER] 한국인 감지 - 한국인 전용 페이지로 리다이렉트')
                  router.push('/verification')
                  return
                }
              } else {
                console.warn('[VERIFICATION_CENTER] Supabase 조회 실패:', userError)
              }
            } catch (supabaseError) {
              console.error('[VERIFICATION_CENTER] Supabase 조회 오류:', supabaseError)
            }
            
            // Supabase 조회가 실패했거나 결과가 없으면 API로 조회 시도
            const profileResponse = await fetch(`/api/profile?userId=${user.id}`)
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              const userProfile = profileData.user || profileData.profile || profileData
              
              // API에서 가져온 is_korean 값 확인 (Supabase 조회가 실패한 경우에만 사용)
              if (!isKoreanDetermined && userProfile) {
                const apiIsKorean = userProfile.is_korean === true
                
                console.log('[VERIFICATION_CENTER] API에서 조회:', {
                  is_korean: userProfile.is_korean,
                  country: userProfile.country,
                  isKorean: apiIsKorean
                })
                
                setIsKorean(apiIsKorean)
                setIsKoreanDetermined(true)
                
                // 한국인이면 한국인 전용 페이지로 리다이렉트
                if (apiIsKorean === true) {
                  console.log('[VERIFICATION_CENTER] 한국인 감지 (API) - 한국인 전용 페이지로 리다이렉트')
                  router.push('/verification')
                  return
                }
              }
              
              // 인증 완료 여부 확인 - 실제 인증센터에서 인증을 완료한 경우만 인증완료로 표시
              // 회원가입 시 입력한 정보만으로는 인증완료로 처리하지 않음
              const isVerified = userProfile?.is_verified || 
                                userProfile?.verification_completed ||
                                (userProfile?.korean_name) ||
                                (userProfile?.spanish_name) ||
                                // full_name && phone 조건 제거 - 회원가입 시 자동으로 true가 되어 인증완료로 표시되는 문제 방지
                                (userProfile?.full_name && userProfile?.university && userProfile?.major)
              
              console.log('[VERIFICATION] 인증 상태 확인:', {
                is_verified: userProfile?.is_verified,
                verification_completed: userProfile?.verification_completed,
                korean_name: userProfile?.korean_name,
                spanish_name: userProfile?.spanish_name,
                full_name: userProfile?.full_name,
                phone: userProfile?.phone,
                university: userProfile?.university,
                major: userProfile?.major,
                isVerified: isVerified
              })
              
              // 이메일 인증 상태 확인 제거됨 - Level 2에서는 이메일 인증 불필요
              
              // 프로필 데이터가 있으면 폼에 채우기 (인증 여부 무관)
              if (userProfile) {
                console.log('[VERIFICATION] 기존 프로필 데이터 발견 - 폼에 채우기')
                setFormData(prev => ({
                  ...prev,
                  full_name: userProfile?.full_name || '',
                  korean_name: userProfile?.korean_name || '',
                  spanish_name: userProfile?.spanish_name || '',
                  one_line_intro: userProfile?.one_line_intro || userProfile?.bio || '',
                  user_type: userProfile?.user_type || 'student',
                  university: userProfile?.university || '',
                  major: userProfile?.major || '',
                  grade: userProfile?.grade || '',
                  occupation: userProfile?.occupation || '',
                  company: userProfile?.company || '',
                  work_experience: userProfile?.work_experience || userProfile?.career || '',
                  interests: userProfile?.interests || [],
                  language: userProfile?.language || userProfile?.native_language,
                  korean_level: userProfile?.korean_level,
                  english_level: userProfile?.english_level || 'none',
                  spanish_level: userProfile?.spanish_level,
                  profile_image_url: userProfile?.profile_image || userProfile?.avatar_url || ''
                }))
                console.log('[VERIFICATION] 기존 프로필 데이터 로드 완료:', userProfile)
                
                if (isVerified) {
                  console.log('[VERIFICATION] 인증 완료된 사용자 - 프로필 편집 모드')
                } else {
                  console.log('[VERIFICATION] 인증 미완료 사용자 - 부분 저장 데이터 복구')
                }
              }
            } else if (profileResponse.status === 404) {
              // 프로필이 설정되지 않은 경우 - 이미 Supabase에서 조회했으므로 추가 처리 불필요
              console.log('[VERIFICATION_CENTER] 프로필 미설정 - Supabase 조회 결과 사용')
              
              // isKoreanDetermined가 false면 기본값(현지인)으로 설정
              if (!isKoreanDetermined) {
                console.log('[VERIFICATION_CENTER] 기본값(현지인) 설정')
                setIsKorean(false)
                setIsKoreanDetermined(true)
              }
            }
          }
        } catch (profileError) {
          console.error('[VERIFICATION_CENTER] 프로필 확인 실패:', profileError)
          // is_korean은 회원가입 시 저장되므로 users 테이블에는 항상 존재해야 함
          // 에러 발생 시 기본값(false: 현지인)으로 fallback
          if (!isKoreanDetermined) {
            console.log('[VERIFICATION_CENTER] 에러 fallback - 현지인으로 설정')
            setIsKorean(false)
            setIsKoreanDetermined(true)
          }
        }
      } catch (error) {
        console.error('사용자 상태 확인 오류:', error)
      } finally {
        setAdminCheckComplete(true)
      }
    }

    checkUserStatus()
  }, [user?.id, user?.email, router])

  // isKorean이 false로 설정될 때 국가번호 자동 설정
  useEffect(() => {
    if (isKorean === false && !phoneCountryCode) {
      const userCountry = user?.user_metadata?.country || 'MX'
      const country = countries.find(c => c.code === userCountry)
      setPhoneCountryCode(country?.phoneCode || '+52')
      console.log('[VERIFICATION] 현지인 국가번호 설정:', country?.phoneCode || '+52')
    }
  }, [isKorean, phoneCountryCode, user?.user_metadata?.country])

  // isKorean이 null로 남아있는 경우 타임아웃 해결 (5초 후 자동으로 현지인으로 설정)
  useEffect(() => {
    if (isKorean === null && !isKoreanDetermined) {
      const timer = setTimeout(() => {
        console.log('[VERIFICATION] API 응답 지연 감지 - 현지인으로 기본 설정')
        setIsKorean(false)
        setIsKoreanDetermined(true)
      }, 5000) // 5초 후
      
      return () => clearTimeout(timer)
    }
  }, [isKorean, isKoreanDetermined])

  // 폼 데이터 변경 디버깅
  useEffect(() => {
    console.log('[FORM] 폼 데이터 변경됨:', formData)
  }, [formData])

  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      console.log(`[FORM] ${field} 변경:`, { 이전값: prev[field], 새값: value })
      
      // 전화번호 입력 시 포맷팅
      if (field === 'phone' && isKorean && value) {
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
  }, [isKorean])

  // 전화번호 입력 완료 시 자동으로 SMS 인증 시작
  useEffect(() => {
    if (!formData.phone || phoneVerified || showPhoneVerification) {
      return
    }

    // 국가번호가 선택되지 않았으면 인증 UI 표시하지 않음
    if (!phoneCountryCode) {
      return
    }

    // 전화번호 형식이 유효한지 확인 (한국인: 010-1234-5678 형식, 외국인: 숫자만)
    const isValidPhone = isKorean 
      ? /^010-\d{4}-\d{4}$/.test(formData.phone) 
      : /^\d{7,15}$/.test(formData.phone.replace(/\D/g, ''))
    
    if (isValidPhone) {
      // 약간의 딜레이 후 인증 UI 표시 (사용자가 입력을 완료할 시간을 줌)
      const timer = setTimeout(() => {
        setShowPhoneVerification(true)
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [formData.phone, phoneVerified, showPhoneVerification, isKorean, phoneCountryCode])

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
      // 이전 페이지로 돌아가기 (홈이 아닌)
      if (previousPage) {
        console.log('[VERIFICATION_CENTER] 이전 페이지로 이동:', previousPage)
        router.push(previousPage)
      } else {
        // 이전 페이지 정보가 없으면 메인 페이지로 이동
        console.log('[VERIFICATION_CENTER] 이전 페이지 정보 없음, 메인 페이지로 이동')
        router.push('/main?tab=me')
      }
    }
  }, [step, router, previousPage])

  // 프로필 이미지 업로드 함수 (서버 API 사용)
  const handleProfileImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      // 토큰 가져오기
      let token = localStorage.getItem('amiko_token')
      if (!token) {
        const supabase = createSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          token = session.access_token
          localStorage.setItem('amiko_token', token)
        } else {
          throw new Error(language === 'ko' ? '로그인이 필요합니다' : 'Se requiere iniciar sesión')
        }
      }

      // FormData 생성
      const formData = new FormData()
      formData.append('file', file)

      // 서버 API를 통해 업로드 (RLS 정책 우회)
      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || (language === 'ko' ? '이미지 업로드 실패' : 'Error al subir la imagen'))
      }

      const result = await response.json()
      const publicUrl = result.avatarUrl

      if (!publicUrl) {
        throw new Error(language === 'ko' ? '이미지 URL을 가져올 수 없습니다' : 'No se pudo obtener la URL de la imagen')
      }

      setFormData(prev => ({ ...prev, profile_image_url: publicUrl }))
      setFieldErrors(prev => ({ ...prev, profile_image: undefined }))
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      setFieldErrors(prev => ({ ...prev, profile_image: error instanceof Error ? error.message : (language === 'ko' ? '이미지 업로드 실패' : 'Error al subir la imagen') }))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const nextStep = useCallback(() => {
    // 필수 항목 검증
    const errors: typeof fieldErrors = {}
    
    if (!formData.profile_image_url) {
      errors.profile_image = language === 'ko' ? '프로필 사진을 등록해주세요' : 'Por favor suba una foto de perfil'
    }
    
    if ((isKorean === false || isKorean === null) && !formData.spanish_name) {
      errors.spanish_name = language === 'ko' ? '이름을 입력해주세요' : 'Por favor ingrese su nombre'
    }
    
    if (!formData.phone) {
      errors.phone = language === 'ko' ? '전화번호를 입력해주세요' : 'Por favor ingrese su número de teléfono'
    }
    
    if (!phoneVerified) {
      errors.phone_verified = language === 'ko' ? '전화번호 인증을 완료해주세요' : 'Por favor complete la verificación del teléfono'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    setFieldErrors({})
    if (step < 2) {
      setStep(step + 1)
    }
  }, [step, formData, phoneVerified, isKorean, language])

  // 운영자라면 로딩 중 표시
  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
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

  const handleSubmit = async () => {
    // 필수 항목 검증
    const errors: typeof fieldErrors = {}
    
    if (!formData.custom_interests?.trim()) {
      errors.custom_interests = language === 'ko' ? '자기소개를 입력해주세요' : 'Por favor ingrese una presentación'
    } else if (formData.custom_interests.trim().length < 20) {
      errors.custom_interests = language === 'ko' ? '최소 20자 이상 입력해주세요' : 'Por favor ingrese al menos 20 caracteres'
    }
    
    if (!formData.korean_level) {
      errors.korean_level = language === 'ko' ? '한국어 수준을 선택해주세요' : 'Por favor seleccione el nivel de coreano'
    }
    
    if (!formData.spanish_level) {
      errors.spanish_level = language === 'ko' ? '스페인어 수준을 선택해주세요' : 'Por favor seleccione el nivel de español'
    }
    
    if (formData.user_type === 'student') {
      if (!formData.university?.trim()) {
        errors.university = language === 'ko' ? '대학교명을 입력해주세요' : 'Por favor ingrese el nombre de su universidad'
      }
      if (!formData.major?.trim()) {
        errors.major = language === 'ko' ? '전공을 입력해주세요' : 'Por favor ingrese su carrera o especialidad'
      }
      if (!formData.grade) {
        errors.grade = language === 'ko' ? '학년을 선택해주세요' : 'Por favor seleccione su año de estudio'
      }
    } else if (formData.user_type === 'general') {
      if (!formData.occupation) {
        errors.occupation = language === 'ko' ? '현재 상태를 선택해주세요' : 'Por favor seleccione su estado actual'
      }
    }
    
    if (formData.interests.length === 0) {
      errors.interests = language === 'ko' ? '관심분야를 최소 1개 이상 선택해주세요' : 'Por favor seleccione al menos un interés'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      return
    }
    
    setFieldErrors({})
    setLoading(true)
    
    try {
      // 언어는 기존 사용자 언어를 유지하거나, formData에 명시적으로 설정된 경우에만 변경
      // is_korean 기반으로 자동 변경하지 않음 (멕시코 국적 + 한국 전화번호 사용자 지원)
      const dataToSubmit = {
        ...formData,
        is_korean: isKorean, // 실제 한국인 여부 사용 (null일 수 있음)
        language: formData.language || undefined, // 기존 언어 유지 (자동 변경하지 않음)
        profile_image: formData.profile_image_url || null, // 업로드된 이미지 URL 전송
        is_verified: true, // 인증 완료 상태
        verification_completed: true, // 인증 완료 플래그
        // custom_interests를 introduction 필드에도 저장
        introduction: formData.custom_interests
      }

      console.log('[VERIFICATION] 제출할 데이터:', {
        ...dataToSubmit,
        is_verified: dataToSubmit.is_verified,
        verification_completed: dataToSubmit.verification_completed,
        is_verified_type: typeof dataToSubmit.is_verified,
        verification_completed_type: typeof dataToSubmit.verification_completed
      })

      // 토큰 확인 및 갱신
      let token = localStorage.getItem('amiko_token')
      console.log('[VERIFICATION] 토큰 확인:', { hasToken: !!token, tokenLength: token?.length })
      
      // 토큰이 없으면 세션에서 가져오기 시도
      if (!token) {
        console.log('[VERIFICATION] 토큰이 없음, 세션에서 토큰 확인 시도')
        const sessionData = localStorage.getItem('amiko_session')
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData)
            if (session.user && session.expires_at > Date.now() / 1000) {
              // 세션이 유효하면 Supabase에서 새 토큰 가져오기
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              )
              
              const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
              if (currentSession && !sessionError) {
                token = currentSession.access_token
                localStorage.setItem('amiko_token', token)
                console.log('[VERIFICATION] 세션에서 토큰 복구 성공')
              }
            }
          } catch (error) {
            console.log('[VERIFICATION] 세션 파싱 오류:', error)
          }
        }
      }
      
      if (!token) {
        console.log('[VERIFICATION] 토큰이 없음, 로그인 페이지로 이동')
        alert(language === 'ko' ? '로그인이 필요합니다. 다시 로그인해주세요.' : 'Se requiere iniciar sesión. Por favor, inicie sesión nuevamente.')
        router.push('/sign-in')
        return
      }

      // Supabase 클라이언트로 토큰 갱신 시도
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (session && !refreshError) {
          token = session.access_token
          localStorage.setItem('amiko_token', token)
          console.log('[VERIFICATION] Supabase 토큰 갱신 성공')
        } else {
          console.error('[VERIFICATION] Supabase 토큰 갱신 실패:', refreshError)
          // 갱신 실패 시 현재 세션 다시 확인
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (currentSession) {
            token = currentSession.access_token
            localStorage.setItem('amiko_token', token)
            console.log('[VERIFICATION] 현재 세션으로 토큰 복구')
          } else {
            // 세션도 없으면 로그인 필요
            console.error('[VERIFICATION] 유효한 세션 없음, 로그인 필요')
            alert(language === 'ko' ? '로그인이 만료되었습니다. 다시 로그인해주세요.' : 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.')
            localStorage.removeItem('amiko_token')
            localStorage.removeItem('amiko_session')
            router.push('/sign-in')
            return
          }
        }
      } catch (refreshError) {
        console.error('[VERIFICATION] 토큰 갱신 중 오류:', refreshError)
        // 에러 발생 시에도 로그인으로
        alert(language === 'ko' ? '인증 오류가 발생했습니다. 다시 로그인해주세요.' : 'Error de autenticación. Por favor, inicie sesión nuevamente.')
        router.push('/sign-in')
        return
      }

      console.log('[VERIFICATION] 프로필 생성 요청 시작')
      console.log('[VERIFICATION] 사용자 정보:', { userId: user?.id, userEmail: user?.email })
      console.log('[VERIFICATION] 토큰 유효성:', { hasToken: !!token, tokenLength: token?.length })
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // encodeURIComponent 제거 (토큰은 이미 인코딩됨)
        },
        body: JSON.stringify(dataToSubmit)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[VERIFICATION] 프로필 생성 완료:', result)
        
        console.log('[VERIFICATION] 프로필 생성 완료 - 인증 상태는 자동으로 업데이트됩니다')
        
        // 인증 완료 플래그를 localStorage에 저장 (무한 루프 방지)
        localStorage.setItem('verification_just_completed', 'true')
        
        // 성공 메시지 표시 후 메인 페이지로 이동
        alert(language === 'ko' ? '인증이 완료되었습니다!' : '¡Verificación completada!')
        
        // 프로필 캐시가 업데이트될 시간을 주기 위해 약간의 딜레이
        setTimeout(() => {
        router.push('/main?tab=me')
        }, 500)
      } else {
        const errorData = await response.json()
        console.error('[VERIFICATION] 프로필 생성 실패:', errorData)
        
        if (response.status === 401) {
          // 인증 오류인 경우 로그인 페이지로 이동
          console.log('[VERIFICATION] 인증 오류, 로그인 페이지로 이동')
          alert(language === 'ko' ? '인증이 만료되었습니다. 다시 로그인해주세요.' : 'La autenticación ha expirado. Por favor, inicie sesión nuevamente.')
          localStorage.removeItem('amiko_token')
          router.push('/sign-in')
          return
        }
        
        throw new Error(errorData.error || '프로필 생성 실패')
      }
    } catch (error) {
      console.error('프로필 생성 오류:', error)
      alert(language === 'ko' ? '인증 중 오류가 발생했습니다. 다시 시도해주세요.' : 'Error durante la verificación. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pt-24 md:pt-36 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghosts" 
              onClick={goBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'ko' ? '상세 인증' : 'Verificación detallada'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'ko' ? '더 많은 기능을 이용하기 위해 추가 정보를 입력해주세요.' : 'Por favor, ingrese información adicional para utilizar más funciones.'}
              </p>
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {step === 1 
                ? (language === 'ko' ? '기본 정보' : 'Información básica')
                : (language === 'ko' ? '관심사 및 선호도' : 'Intereses y preferencias')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              // 1단계: 기본 정보
              <div className="space-y-4">
                {/* 프로필 사진 업로드 */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    {language === 'ko' ? '프로필 사진 *' : 'Foto de perfil *'}
                  </Label>
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
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleProfileImageUpload(file)
                        }}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <Label 
                        htmlFor="profile-image-upload"
                        className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {language === 'ko' ? '사진 선택' : 'Seleccionar foto'}
                      </Label>
                    </div>
                  </div>
                  {fieldErrors.profile_image && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.profile_image}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {language === 'ko' 
                      ? '자신의 얼굴이 나온 사진을 넣어주세요.'
                      : 'Por favor, suba una foto donde se vea su rostro.'}
                  </p>
                </div>

                {/* 이메일 인증 섹션 제거됨 - Level 2에서는 이메일 인증 불필요 (Level 1에서만 필요) */}

                {/* 사용자 타입 선택 - 회원가입 시 이미 결정되므로 제거 */}

                {/* 한국인인 경우에만 한국이름 필드 표시 */}
                {isKorean && (
                  <div>
                    <Label htmlFor="korean_name">{language === 'ko' ? '한국이름' : 'Nombre Coreano'} *</Label>
                    <Input
                      id="korean_name"
                      value={formData.korean_name}
                      onChange={(e) => handleInputChange('korean_name', e.target.value)}
                      placeholder={language === 'ko' ? '한국이름을 입력해주세요' : 'Ingrese su nombre coreano'}
                    />
                  </div>
                )}

                {/* 한국인이 아닌 경우 또는 null인 경우 이름 필드 표시 (필수) */}
                {(!isKorean || isKorean === null) && (
                  <div>
                    <Label htmlFor="spanish_name">Nombre completo *</Label>
                    <Input
                      id="spanish_name"
                      value={formData.spanish_name}
                      onChange={(e) => {
                        handleInputChange('spanish_name', e.target.value)
                        setFieldErrors(prev => ({ ...prev, spanish_name: undefined }))
                      }}
                      placeholder="Ingrese su nombre completo"
                      className={fieldErrors.spanish_name ? 'border-red-500' : ''}
                    />
                    {fieldErrors.spanish_name && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.spanish_name}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Este será su nombre principal en la plataforma
                    </p>
                  </div>
                )}

                {/* 한국인인 경우에만 스페인어 이름 필드 표시 (선택) */}
                {isKorean && (
                  <div>
                    <Label htmlFor="spanish_name">{language === 'ko' ? '스페인어 이름' : 'Nombre en Español'}</Label>
                    <Input
                      id="spanish_name"
                      value={formData.spanish_name}
                      onChange={(e) => handleInputChange('spanish_name', e.target.value)}
                      placeholder={language === 'ko' ? '스페인어 이름을 입력해주세요 (현지인들을 위해 권장)' : 'Ingrese su nombre en español (recomendado para comunicación con locales)'}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {language === 'ko' ? '현지인들과의 원활한 소통을 위해 스페인어 이름 입력을 권장합니다' : 'Se recomienda ingresar un nombre en español para facilitar la comunicación con los locales'}
                    </p>
                  </div>
                )}

                {/* 전화번호 입력 필드 */}
                <div>
                  <Label htmlFor="phone">{language === 'ko' ? '전화번호' : 'Número de teléfono'} *</Label>
                  <div className="flex gap-2">
                    {/* 국가번호 선택 */}
                    <Select 
                      value={phoneCountryCode} 
                      onValueChange={(value) => setPhoneCountryCode(value)}
                      disabled={phoneVerified}
                    >
                      <SelectTrigger className="w-[140px] border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                        <SelectValue placeholder={language === 'ko' ? '국가번호' : 'Código de país'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.phoneCode}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{country.phoneCode}</span>
                              <span className="text-sm text-gray-600">
                                {language === 'ko' 
                                  ? (country.code === 'KR' ? '한국' : country.code)
                                  : (country.code === 'MX' ? 'México' : country.code === 'KR' ? 'Corea' : country.code)
                                }
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* 전화번호 입력 */}
                    <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                        onChange={(e) => {
                          handleInputChange('phone', e.target.value)
                          setFieldErrors(prev => ({ ...prev, phone: undefined }))
                        }}
                      placeholder={isKorean ? "010-1234-5678" : "123456789"}
                        className={`!pl-10 ${fieldErrors.phone ? 'border-red-500' : ''}`}
                      disabled={phoneVerified}
                    />
                  </div>
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.phone}
                    </p>
                  )}
                  {fieldErrors.phone_verified && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.phone_verified}
                    </p>
                  )}
                  {phoneVerified && !fieldErrors.phone_verified && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {language === 'ko' ? '전화번호 인증 완료' : 'Verificación de teléfono completada'}
                    </p>
                  )}
                </div>

                {/* 전화번호 인증 UI - 전화번호 입력 시 자동 표시 */}
                {showPhoneVerification && !phoneVerified && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <PhoneVerification
                      phoneNumber={phoneCountryCode ? `${phoneCountryCode}${formData.phone.replace(/\D/g, '')}` : formData.phone}
                      nationality={isKorean ? 'KR' : (user?.user_metadata?.country || 'MX')}
                      onVerify={async (code: string) => {
                        try {
                          // 선택한 인증 방법을 API가 기대하는 channel 형식으로 변환
                          let channel = selectedVerificationMethod
                          if (selectedVerificationMethod === 'whatsapp') {
                            channel = 'wa'
                          } else if (selectedVerificationMethod === 'sms') {
                            channel = 'sms'
                          } else {
                            // 기본값: 한국인은 sms, 외국인은 wa
                            channel = isKorean ? 'sms' : 'wa'
                          }
                          
                          // 국가번호와 전화번호 결합
                          const fullPhoneNumber = phoneCountryCode 
                            ? `${phoneCountryCode}${formData.phone.replace(/\D/g, '')}`
                            : formData.phone
                          
                          const response = await fetch('/api/verify/check', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              channel: channel,
                              target: fullPhoneNumber,
                              code: code
                            })
                          })
                          const result = await response.json()
                          if (response.ok && result.ok) {
                            setPhoneVerified(true)
                            setShowPhoneVerification(false)
                            setFieldErrors(prev => ({ ...prev, phone_verified: undefined }))
                            // sms_verified_at은 API에서 자동으로 저장됨
                          } else {
                            alert(language === 'ko' ? '인증코드가 올바르지 않습니다.' : 'El código de verificación no es correcto.')
                          }
                        } catch (error) {
                          console.error('전화번호 인증 실패:', error)
                          alert(language === 'ko' ? '인증 중 오류가 발생했습니다.' : 'Error durante la verificación.')
                        }
                      }}
                      onResend={async (method: string) => {
                        try {
                          // 선택한 인증 방법 저장
                          setSelectedVerificationMethod(method)
                          
                          // PhoneVerification에서 전달하는 method를 API가 기대하는 channel 형식으로 변환
                          let channel = method
                          if (method === 'whatsapp') {
                            channel = 'wa'
                          } else if (method === 'sms') {
                            channel = 'sms'
                          } else {
                            // kakao 등 지원하지 않는 방법
                            throw new Error(language === 'ko' ? '지원하지 않는 인증 방법입니다.' : 'Método de verificación no compatible.')
                          }
                          
                          // 국가번호와 전화번호 결합
                          const fullPhoneNumber = phoneCountryCode 
                            ? `${phoneCountryCode}${formData.phone.replace(/\D/g, '')}`
                            : formData.phone
                          
                          if (!phoneCountryCode) {
                            throw new Error(language === 'ko' ? '국가번호를 선택해주세요.' : 'Por favor seleccione el código de país.')
                          }
                          
                          const response = await fetch('/api/verify/start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              channel: channel,
                              target: fullPhoneNumber,
                              nationality: isKorean ? 'KR' : (user?.user_metadata?.country || 'MX')
                            })
                          })
                          const result = await response.json()
                          if (!response.ok || !result.ok) {
                            // Rate limit 에러인 경우 특별 처리
                            if (result.error === 'RATE_LIMIT_EXCEEDED') {
                              // Rate limit 에러는 사용자에게 친절한 메시지 표시
                              const message = result.message || (language === 'ko' 
                                ? '인증코드 발송이 제한되었습니다. 잠시 후 다시 시도해주세요.\n\n만약 인증코드를 받으셨다면 그대로 사용하실 수 있습니다.'
                                : 'El envío del código de verificación está limitado. Por favor, intente nuevamente en unos momentos.\n\nSi recibió el código de verificación, puede usarlo normalmente.')
                              alert(message)
                              throw new Error('RATE_LIMIT_EXCEEDED')
                            }
                            throw new Error(result.error || (language === 'ko' ? '인증코드 발송 실패' : 'Error al enviar el código de verificación'))
                          }
                        } catch (error) {
                          console.error('인증코드 발송 실패:', error)
                          // Rate limit 에러는 이미 alert를 표시했으므로 다시 throw하지 않음
                          if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
                            throw error
                          }
                          throw error
                        }
                      }}
                      isLoading={loading}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="user_type">{language === 'ko' ? '구분' : 'Tipo de usuario'} *</Label>
                  <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ko' ? '선택해주세요' : 'Seleccione el tipo'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{language === 'ko' ? '대학생' : 'Estudiante'}</SelectItem>
                      <SelectItem value="general">
                        {language === 'ko' ? '일반인 (대학 미진학자 포함)' : 'Profesional (Incluye personas sin universidad)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ko' 
                      ? '대학을 다니지 않으신 경우 "일반인"을 선택해주세요. 직업 정보를 입력하시면 됩니다.'
                      : 'Si no asistió a la universidad, seleccione "Profesional". Puede ingresar información sobre su ocupación.'}
                  </p>
                </div>

              </div>
            ) : (
              // 2단계: 비공개 정보 및 관심사
              <div className="space-y-6">
                {/* 비공개 정보 섹션 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-blue-800">
                      {language === 'ko' ? '🔒 비공개 정보' : '🔒 Información privada'}
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    {language === 'ko' 
                      ? '아래 정보는 기본적으로 프로필에 공개되지 않습니다. 편집 모드에서 공개 설정을 변경할 수 있습니다.'
                      : 'La siguiente información no se mostrará públicamente en su perfil por defecto. Puede cambiar la configuración de privacidad en el modo de edición.'
                    }
                  </p>
                  
                  {/* 사용자 타입에 따른 비공개 정보 필드 */}
                  {formData.user_type === 'student' ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="university">
                          {language === 'ko' ? '대학교 *' : 'Universidad *'}
                        </Label>
                        <Input
                          id="university"
                          value={formData.university}
                          onChange={(e) => {
                            handleInputChange('university', e.target.value)
                            setFieldErrors(prev => ({ ...prev, university: undefined }))
                          }}
                          placeholder={language === 'ko' ? '대학교명을 입력해주세요' : 'Ingrese el nombre de su universidad'}
                          className={fieldErrors.university ? 'border-red-500' : ''}
                        />
                        {fieldErrors.university && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.university}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="major">
                          {language === 'ko' ? '전공 *' : 'Carrera/Especialidad *'}
                        </Label>
                        <Input
                          id="major"
                          value={formData.major}
                          onChange={(e) => {
                            handleInputChange('major', e.target.value)
                            setFieldErrors(prev => ({ ...prev, major: undefined }))
                          }}
                          placeholder={language === 'ko' ? '전공을 입력해주세요' : 'Ingrese su carrera o especialidad'}
                          className={fieldErrors.major ? 'border-red-500' : ''}
                        />
                        {fieldErrors.major && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.major}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="grade">
                          {language === 'ko' ? '학년 *' : 'Año de estudio *'}
                        </Label>
                        <Select 
                          value={formData.grade} 
                          onValueChange={(value) => {
                            handleInputChange('grade', value)
                            setFieldErrors(prev => ({ ...prev, grade: undefined }))
                          }}
                        >
                          <SelectTrigger className={fieldErrors.grade ? 'border-red-500' : ''}>
                            <SelectValue placeholder={language === 'ko' ? '학년을 선택해주세요' : 'Seleccione su año de estudio'} />
                          </SelectTrigger>
                          <SelectContent>
                            {language === 'ko' ? (
                              <>
                                <SelectItem value="1학년">1학년</SelectItem>
                                <SelectItem value="2학년">2학년</SelectItem>
                                <SelectItem value="3학년">3학년</SelectItem>
                                <SelectItem value="4학년">4학년</SelectItem>
                                <SelectItem value="대학원">대학원</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="1er año">1er año</SelectItem>
                                <SelectItem value="2do año">2do año</SelectItem>
                                <SelectItem value="3er año">3er año</SelectItem>
                                <SelectItem value="4to año">4to año</SelectItem>
                                <SelectItem value="5to año">5to año</SelectItem>
                                <SelectItem value="Posgrado">Posgrado</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {fieldErrors.grade && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.grade}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="occupation">
                          {language === 'ko' ? '현재 상태 *' : 'Estado actual *'}
                        </Label>
                        <Select 
                          value={formData.occupation || ''} 
                          onValueChange={(value) => {
                            handleInputChange('occupation', value)
                            setFieldErrors(prev => ({ ...prev, occupation: undefined }))
                          }}
                        >
                          <SelectTrigger className={fieldErrors.occupation ? 'border-red-500' : ''}>
                            <SelectValue placeholder={language === 'ko' ? '선택해주세요' : 'Seleccione su estado'} />
                          </SelectTrigger>
                          <SelectContent>
                            {language === 'ko' ? (
                              <>
                                <SelectItem value="직장인">직장인</SelectItem>
                                <SelectItem value="구직 중">구직 중 (현재 직장을 구하는 중)</SelectItem>
                                <SelectItem value="자영업">자영업</SelectItem>
                                <SelectItem value="프리랜서">프리랜서</SelectItem>
                                <SelectItem value="기타">기타</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Empleado">Empleado</SelectItem>
                                <SelectItem value="Buscando empleo">Buscando empleo (Actualmente buscando trabajo)</SelectItem>
                                <SelectItem value="Trabajador independiente">Trabajador independiente</SelectItem>
                                <SelectItem value="Freelancer">Freelancer</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {fieldErrors.occupation && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.occupation}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'ko' 
                            ? '현재 직장을 구하는 중이시라면 "구직 중"을 선택해주세요.'
                            : 'Si actualmente está buscando trabajo, seleccione "Buscando empleo".'}
                        </p>
                      </div>
                      
                      {/* 회사명 필드 - 직장인, 자영업, 프리랜서일 때만 표시 */}
                      {(formData.occupation === '직장인' || 
                        formData.occupation === 'Empleado' ||
                        formData.occupation === '자영업' ||
                        formData.occupation === 'Trabajador independiente' ||
                        formData.occupation === '프리랜서' ||
                        formData.occupation === 'Freelancer') && (
                      <div>
                        <Label htmlFor="company">
                            {language === 'ko' 
                              ? (formData.occupation === '자영업' || formData.occupation === 'Trabajador independiente' 
                                  ? '사업명/상호' 
                                  : formData.occupation === '프리랜서' || formData.occupation === 'Freelancer'
                                  ? '주요 활동 분야'
                                  : '회사/소속')
                              : (formData.occupation === 'Trabajador independiente'
                                  ? 'Nombre del negocio'
                                  : formData.occupation === 'Freelancer'
                                  ? 'Área principal de actividad'
                                  : 'Empresa/Organización')
                            }
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                            placeholder={
                              language === 'ko' 
                                ? (formData.occupation === '자영업' || formData.occupation === 'Trabajador independiente'
                                    ? '사업명 또는 상호를 입력해주세요 (선택사항)'
                                    : formData.occupation === '프리랜서' || formData.occupation === 'Freelancer'
                                    ? '주로 활동하는 분야를 입력해주세요 (예: 디자인, 번역 등)'
                                    : '회사명 또는 소속을 입력해주세요 (선택사항)')
                                : (formData.occupation === 'Trabajador independiente'
                                    ? 'Ingrese el nombre de su negocio (opcional)'
                                    : formData.occupation === 'Freelancer'
                                    ? 'Ingrese su área principal de actividad (ej: diseño, traducción, etc.)'
                                    : 'Ingrese el nombre de su empresa u organización (opcional)')
                            }
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'ko' 
                              ? '생략 가능합니다.'
                              : 'Puede omitir este campo.'}
                        </p>
                      </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 관심사/잘 아는 주제 및 선호도 */}
                {/* 한국인(isKorean === true): "잘 아는 주제" (한국어가 모국어라서 관심분야라고 하기 애매)
                    현지인(isKorean === false/null): "관심분야" (한국어를 배우는 입장이라 관심분야가 맞음) */}
                <div>
                  <Label className="text-lg font-medium mb-2 block">
                    {isKorean === true 
                      ? (language === 'ko' ? '잘 아는 주제 (최대 5개)' : 'Temas que conoce bien (máximo 5)')
                      : (language === 'ko' ? '관심분야 (최대 5개)' : 'Intereses (máximo 5)')
                    }
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">
                    {isKorean === true
                      ? (language === 'ko' 
                          ? '다른 사용자들에게 잘 대답해줄 수 있는 주제를 선택해주세요.' 
                          : 'Seleccione los temas sobre los que puede responder bien a otros usuarios.')
                      : (language === 'ko'
                          ? '관심 있는 주제를 선택해주세요.'
                          : 'Seleccione los temas de su interés.')
                    }
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(language === 'ko' 
                      ? ['한국어', '한국문화', '음식', '여행', '영화', '음악', '스포츠', '패션', '게임', '기술', '경제', '언어교환']
                      : ['Coreano', 'Cultura coreana', 'Comida', 'Viajes', 'Películas', 'Música', 'Deportes', 'Moda', 'Juegos', 'Tecnología', 'Economía', 'Intercambio de idiomas']
                    ).map(interest => (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          formData.interests.includes(interest)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:border-blue-300'
                        }`}
                        disabled={formData.interests.length >= 5 && !formData.interests.includes(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  {formData.interests.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {isKorean === true
                        ? (language === 'ko' ? '선택한 주제' : 'Temas seleccionados')
                        : (language === 'ko' ? '선택한 관심분야' : 'Intereses seleccionados')
                      }: {formData.interests.join(', ')} 
                      <span className="ml-2 text-blue-600">({formData.interests.length}/5)</span>
                    </p>
                  )}
                  {fieldErrors.interests && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.interests}
                    </p>
                  )}
                </div>

                {/* 언어 수준 */}
                <div>
                  <Label className="text-lg font-medium mb-4 block">
                    {language === 'ko' ? '언어 수준' : 'Nivel de idiomas'}
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="korean_level">
                        {language === 'ko' ? '한국어' : 'Coreano'}
                      </Label>
                      <Select 
                        value={formData.korean_level} 
                        onValueChange={(value) => {
                          handleInputChange('korean_level', value)
                          setFieldErrors(prev => ({ ...prev, korean_level: undefined }))
                        }}
                      >
                        <SelectTrigger className={fieldErrors.korean_level ? 'border-red-500' : ''}>
                          <SelectValue placeholder={language === 'ko' ? '수준 선택' : 'Seleccionar nivel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {language === 'ko' ? (
                            <>
                              <SelectItem value="none">불가능</SelectItem>
                              <SelectItem value="beginner">초급</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                              <SelectItem value="native">모국어</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="none">No disponible</SelectItem>
                              <SelectItem value="beginner">Principiante</SelectItem>
                              <SelectItem value="intermediate">Intermedio</SelectItem>
                              <SelectItem value="advanced">Avanzado</SelectItem>
                              <SelectItem value="native">Nativo</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {fieldErrors.korean_level && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.korean_level}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="english_level">
                        {language === 'ko' ? '영어' : 'Inglés'}
                      </Label>
                      <Select value={formData.english_level} onValueChange={(value) => handleInputChange('english_level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ko' ? '수준 선택' : 'Seleccionar nivel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {language === 'ko' ? (
                            <>
                              <SelectItem value="none">불가능</SelectItem>
                              <SelectItem value="beginner">초급</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                              <SelectItem value="native">모국어</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="none">No disponible</SelectItem>
                              <SelectItem value="beginner">Principiante</SelectItem>
                              <SelectItem value="intermediate">Intermedio</SelectItem>
                              <SelectItem value="advanced">Avanzado</SelectItem>
                              <SelectItem value="native">Nativo</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="spanish_level">
                        {language === 'ko' ? '스페인어' : 'Español'}
                      </Label>
                      <Select 
                        value={formData.spanish_level} 
                        onValueChange={(value) => {
                          handleInputChange('spanish_level', value)
                          setFieldErrors(prev => ({ ...prev, spanish_level: undefined }))
                        }}
                      >
                        <SelectTrigger className={fieldErrors.spanish_level ? 'border-red-500' : ''}>
                          <SelectValue placeholder={language === 'ko' ? '수준 선택' : 'Seleccionar nivel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {language === 'ko' ? (
                            <>
                              <SelectItem value="none">불가능</SelectItem>
                              <SelectItem value="beginner">초급</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                              <SelectItem value="native">모국어</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="none">No disponible</SelectItem>
                              <SelectItem value="beginner">Principiante</SelectItem>
                              <SelectItem value="intermediate">Intermedio</SelectItem>
                              <SelectItem value="advanced">Avanzado</SelectItem>
                              <SelectItem value="native">Nativo</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {fieldErrors.spanish_level && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.spanish_level}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 자기소개 (하나로 통합) */}
                <div>
                  <Label htmlFor="introduction">
                    {language === 'ko' ? '자기소개 * (최소 20자)' : 'Presentación * (mínimo 20 caracteres)'}
                  </Label>
                  <Textarea
                    id="introduction"
                    value={formData.custom_interests}
                    onChange={(e) => {
                      handleInputChange('custom_interests', e.target.value)
                      setFieldErrors(prev => ({ ...prev, custom_interests: undefined }))
                    }}
                    placeholder={language === 'ko' 
                      ? "자기소개를 입력해주세요 (최소 20자)" 
                      : "Escriba una presentación sobre usted (mínimo 20 caracteres)"
                    }
                    rows={4}
                    className={`${
                      formData.custom_interests && formData.custom_interests.length < 20
                        ? 'border-red-500 focus:border-red-500'
                        : fieldErrors.custom_interests
                        ? 'border-red-500'
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                  />
                  {formData.custom_interests && formData.custom_interests.length < 20 && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {language === 'ko' 
                        ? `최소 20자 이상 입력해주세요 (${formData.custom_interests.length}/20)`
                        : `Por favor ingrese al menos 20 caracteres (${formData.custom_interests.length}/20)`}
                    </p>
                  )}
                  {formData.custom_interests && formData.custom_interests.length >= 20 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'ko' 
                        ? `${formData.custom_interests.length}자 입력됨`
                        : `${formData.custom_interests.length} caracteres ingresados`}
                    </p>
                  )}
                  {fieldErrors.custom_interests && !formData.custom_interests && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.custom_interests}
                    </p>
                  )}
                  {!formData.custom_interests && (
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'ko' 
                        ? '자신을 소개하는 글을 20자 이상 입력해주세요.'
                        : 'Por favor escriba una presentación de al menos 20 caracteres sobre usted.'}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ko' 
                      ? '이 정보는 프로필에 공개됩니다'
                      : 'Esta información será visible en su perfil público'}
                  </p>
                </div>

                {/* 화상 채팅 파트너 자동 등록 안내 */}
                {isKorean && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Phone className="w-5 h-5 text-blue-600" />
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
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={goBack}
            disabled={loading || step === 1}
            className={`flex-1 font-medium ${
              step === 1 
                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
            }`}
          >
            {language === 'ko' ? '← 이전' : '← Anterior'}
          </Button>
          
          {step === 2 ? (
            <Button 
              onClick={handleSubmit}
              disabled={
                loading || 
                !formData.custom_interests?.trim() || // 자기소개 필수 (공백만 있는 경우도 체크)
                formData.custom_interests?.trim().length < 20 || // 자기소개 최소 20자 이상
                !formData.korean_level ||  // 한국어 수준 필수
                !formData.spanish_level || // 스페인어 수준 필수
                (formData.user_type === 'student' && (!formData.university?.trim() || !formData.major?.trim() || !formData.grade)) || // 대학생인 경우 대학교, 전공, 학년 필수
                (formData.user_type === 'general' && !formData.occupation) || // 일반인인 경우 직업 필수
                formData.interests.length === 0 // 관심사 최소 1개 이상 필수
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg disabled:bg-gray-400"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {language === 'ko' ? '처리 중...' : 'Procesando...'}
                </div>
              ) : (
                language === 'ko' ? '✅ 완료' : '✅ Completar'
              )}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              disabled={
                loading ||
                (isKorean === true && !formData.korean_name) ||
                ((isKorean === false || isKorean === null) && !formData.spanish_name)
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {language === 'ko' ? '다음 →' : 'Siguiente →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}