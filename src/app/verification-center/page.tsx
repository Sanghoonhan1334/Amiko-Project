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
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export default function VerificationCenterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  const [isKorean, setIsKorean] = useState<boolean | null>(null) // 기본값: null (미검증)
  const [isKoreanDetermined, setIsKoreanDetermined] = useState(false) // 한국인 여부가 결정되었는지
  const [previousPage, setPreviousPage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    // 기본 정보
    full_name: '',
    korean_name: '',
    spanish_name: '',
    nickname: '',
    one_line_intro: '',
    profile_image: null as File | null,
    
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
        try {
          const token = localStorage.getItem('amiko_token')
          if (token && user?.id) {
            const profileResponse = await fetch(`/api/profile?userId=${user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              const userProfile = profileData.user || profileData.profile
              
              // 인증 완료 여부 확인 - 더 유연한 조건으로 변경
              const isVerified = userProfile?.is_verified || 
                                userProfile?.verification_completed ||
                                (userProfile?.korean_name && userProfile?.nickname) ||
                                (userProfile?.spanish_name && userProfile?.nickname) ||
                                (userProfile?.full_name && userProfile?.phone) ||
                                (userProfile?.full_name && userProfile?.university && userProfile?.major)
              
              console.log('[VERIFICATION] 인증 상태 확인:', {
                is_verified: userProfile?.is_verified,
                verification_completed: userProfile?.verification_completed,
                korean_name: userProfile?.korean_name,
                spanish_name: userProfile?.spanish_name,
                nickname: userProfile?.nickname,
                full_name: userProfile?.full_name,
                phone: userProfile?.phone,
                university: userProfile?.university,
                major: userProfile?.major,
                isVerified: isVerified
              })
              
              // 이미 인증 완료된 사용자도 프로필 수정을 위해 접근 가능하도록 변경
              if (isVerified) {
                console.log('[VERIFICATION] 이미 인증 완료된 사용자 - 프로필 편집 모드로 진입')
                // 리다이렉트하지 않고 프로필 데이터를 불러와서 편집 가능하게 함
                // 기존 프로필 데이터를 폼에 채워넣기
                setFormData(prev => ({
                  ...prev,
                  full_name: userProfile?.full_name || '',
                  korean_name: userProfile?.korean_name || '',
                  spanish_name: userProfile?.spanish_name || '',
                  nickname: userProfile?.nickname || '',
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
                  spanish_level: userProfile?.spanish_level
                }))
                console.log('[VERIFICATION] 기존 프로필 데이터 로드 완료:', userProfile)
              }
              
              // 한국인 여부 확인 - users 테이블의 is_korean 값 사용
              const finalIsKorean = userProfile?.is_korean === true
              
              console.log('[VERIFICATION] 사용자 타입 확인:', { 
                isKorean: finalIsKorean,
                is_korean_from_profile: userProfile?.is_korean,
                phone: userProfile?.phone,
                email: user?.email
              })
              
              // 디버깅: isKorean 상태 변경 추적
              console.log('[VERIFICATION] isKorean 상태 변경:', {
                from: '기존값',
                to: finalIsKorean,
                reason: 'users 테이블의 is_korean 값',
                alreadyDetermined: isKoreanDetermined
              })
              
              // 이미 결정되지 않은 경우에만 설정
              if (!isKoreanDetermined) {
                setIsKorean(finalIsKorean)
                setIsKoreanDetermined(true)
              }
            } else if (profileResponse.status === 404) {
              // 프로필이 설정되지 않은 경우 (드물지만 발생 가능)
              console.log('[VERIFICATION] 프로필 미설정 - 기본값 사용')
              // is_korean은 회원가입 시 저장되므로 users 테이블에는 항상 존재
              // 만약 여기 도달하면 데이터 불일치이므로 로그만 남김
            }
          }
        } catch (profileError) {
          console.error('[VERIFICATION] 프로필 확인 실패:', profileError)
          // is_korean은 회원가입 시 저장되므로 users 테이블에는 항상 존재해야 함
          // 에러 발생 시 기본값(false: 현지인)으로 fallback
          if (!isKoreanDetermined) {
            console.log('[VERIFICATION] 에러 fallback - 현지인으로 설정')
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

  // 폼 데이터 변경 디버깅
  useEffect(() => {
    console.log('[FORM] 폼 데이터 변경됨:', formData)
  }, [formData])

  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      console.log(`[FORM] ${field} 변경:`, { 이전값: prev[field], 새값: value })
      return {
        ...prev,
        [field]: value
      }
    })
  }, [])

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

  const nextStep = useCallback(() => {
    if (step < 2) {
      setStep(step + 1)
    }
  }, [step])

  // 운영자라면 로딩 중 표시
  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{t('phoneVerification.adminCheckStatus')}</p>
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
    setLoading(true)
    
    try {
      const dataToSubmit = {
        ...formData,
        is_korean: isKorean, // 실제 한국인 여부 사용 (null일 수 있음)
        language: isKorean === true ? 'ko' : isKorean === false ? 'es' : undefined, // null이면 undefined
        is_verified: true, // 인증 완료 상태
        verification_completed: true // 인증 완료 플래그
      }

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
        alert('로그인이 필요합니다. 다시 로그인해주세요.')
        router.push('/sign-in')
        return
      }

      // Supabase 클라이언트로 토큰 갱신 시도
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

      console.log('[VERIFICATION] 프로필 생성 요청 시작')
      console.log('[VERIFICATION] 사용자 정보:', { userId: user?.id, userEmail: user?.email })
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify(dataToSubmit)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[VERIFICATION] 프로필 생성 완료:', result)
        
        console.log('[VERIFICATION] 프로필 생성 완료 - 인증 상태는 자동으로 업데이트됩니다')
        
        // 성공 메시지 표시 후 메인 페이지로 이동
        alert(isKorean ? '인증이 완료되었습니다!' : '¡Verificación completada!')
        router.push('/main?tab=me')
      } else {
        const errorData = await response.json()
        console.error('[VERIFICATION] 프로필 생성 실패:', errorData)
        
        if (response.status === 401) {
          // 인증 오류인 경우 로그인 페이지로 이동
          console.log('[VERIFICATION] 인증 오류, 로그인 페이지로 이동')
          alert('인증이 만료되었습니다. 다시 로그인해주세요.')
          localStorage.removeItem('amiko_token')
          router.push('/sign-in')
          return
        }
        
        throw new Error(errorData.error || '프로필 생성 실패')
      }
    } catch (error) {
      console.error('프로필 생성 오류:', error)
      alert(isKorean ? '인증 중 오류가 발생했습니다. 다시 시도해주세요.' : 'Error durante la verificación. Inténtalo de nuevo.')
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
                {isKorean ? '상세 인증' : 'Verificación detallada'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {isKorean ? '더 많은 기능을 이용하기 위해 추가 정보를 입력해주세요.' : 'Por favor, ingrese información adicional para utilizar más funciones.'}
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
                ? (isKorean ? '기본 정보' : 'Información básica')
                : (isKorean ? '관심사 및 선호도' : 'Intereses y preferencias')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              // 1단계: 기본 정보
              <div className="space-y-4">
                {/* 사용자 타입 선택 - 회원가입 시 이미 결정되므로 제거 */}

                {/* 한국인인 경우에만 한국이름 필드 표시 */}
                {isKorean && (
                  <div>
                    <Label htmlFor="korean_name">한국이름 *</Label>
                    <Input
                      id="korean_name"
                      value={formData.korean_name}
                      onChange={(e) => handleInputChange('korean_name', e.target.value)}
                      placeholder="한국이름을 입력해주세요"
                    />
                  </div>
                )}

                {/* 한국인이 아닌 경우 이름 필드 표시 (필수) */}
                {!isKorean && (
                  <div>
                    <Label htmlFor="spanish_name">Nombre completo *</Label>
                    <Input
                      id="spanish_name"
                      value={formData.spanish_name}
                      onChange={(e) => handleInputChange('spanish_name', e.target.value)}
                      placeholder="Ingrese su nombre completo"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Este será su nombre principal en la plataforma
                    </p>
                  </div>
                )}

                {/* 한국인인 경우에만 스페인어 이름 필드 표시 (선택) */}
                {isKorean && (
                  <div>
                    <Label htmlFor="spanish_name">스페인어 이름</Label>
                    <Input
                      id="spanish_name"
                      value={formData.spanish_name}
                      onChange={(e) => handleInputChange('spanish_name', e.target.value)}
                      placeholder="스페인어 이름을 입력해주세요 (현지인들을 위해 권장)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      현지인들과의 원활한 소통을 위해 스페인어 이름 입력을 권장합니다
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="nickname">{isKorean ? '닉네임' : 'Apodo'} *</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => handleInputChange('nickname', e.target.value)}
                    placeholder={isKorean ? '커뮤니티에서 사용할 닉네임을 입력해주세요' : 'Ingrese un apodo para usar en la comunidad'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {isKorean ? '커뮤니티 게시글, 댓글 등에서 사용됩니다' : 'Se utiliza en publicaciones y comentarios de la comunidad'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="user_type">{isKorean ? '구분' : 'Tipo de usuario'} *</Label>
                  <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isKorean ? '선택해주세요' : 'Seleccione el tipo'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{isKorean ? '대학생' : 'Estudiante'}</SelectItem>
                      <SelectItem value="general">{isKorean ? '일반인' : 'Profesional'}</SelectItem>
                    </SelectContent>
                  </Select>
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
                      {isKorean ? '🔒 비공개 정보' : '🔒 Información privada'}
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    {isKorean 
                      ? '아래 정보는 기본적으로 프로필에 공개되지 않습니다. 편집 모드에서 공개 설정을 변경할 수 있습니다.'
                      : 'La siguiente información no se mostrará públicamente en su perfil por defecto. Puede cambiar la configuración de privacidad en el modo de edición.'
                    }
                  </p>
                  
                  {/* 사용자 타입에 따른 비공개 정보 필드 */}
                  {formData.user_type === 'student' ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="university">
                          {isKorean ? '대학교 *' : 'Universidad *'}
                        </Label>
                        <Input
                          id="university"
                          value={formData.university}
                          onChange={(e) => handleInputChange('university', e.target.value)}
                          placeholder={isKorean ? '대학교명을 입력해주세요' : 'Ingrese el nombre de su universidad'}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="major">
                          {isKorean ? '전공 *' : 'Carrera/Especialidad *'}
                        </Label>
                        <Input
                          id="major"
                          value={formData.major}
                          onChange={(e) => handleInputChange('major', e.target.value)}
                          placeholder={isKorean ? '전공을 입력해주세요' : 'Ingrese su carrera o especialidad'}
                        />
                      </div>

                      <div>
                        <Label htmlFor="grade">
                          {isKorean ? '학년 *' : 'Año de estudio *'}
                        </Label>
                        <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={isKorean ? '학년을 선택해주세요' : 'Seleccione su año de estudio'} />
                          </SelectTrigger>
                          <SelectContent>
                            {isKorean ? (
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
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="occupation">
                          {isKorean ? '직업 *' : 'Profesión *'}
                        </Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                          placeholder={isKorean ? '직업을 입력해주세요' : 'Ingrese su profesión'}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company">
                          {isKorean ? '회사 *' : 'Empresa/Organización *'}
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder={isKorean ? '회사명 또는 소속을 입력해주세요' : 'Ingrese el nombre de su empresa u organización'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 관심사 및 선호도 */}
                {/* 관심사 선택 */}
                <div>
                  <Label className="text-lg font-medium mb-4 block">
                    {isKorean ? '관심사 (최대 5개)' : 'Intereses (máximo 5)'}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(isKorean 
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
                      {isKorean ? '선택됨' : 'Seleccionados'}: {formData.interests.join(', ')} 
                      <span className="ml-2 text-blue-600">({formData.interests.length}/5)</span>
                    </p>
                  )}
                </div>

                {/* 언어 수준 */}
                <div>
                  <Label className="text-lg font-medium mb-4 block">
                    {isKorean ? '언어 수준' : 'Nivel de idiomas'}
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="korean_level">
                        {isKorean ? '한국어' : 'Coreano'}
                      </Label>
                      <Select value={formData.korean_level} onValueChange={(value) => handleInputChange('korean_level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isKorean ? '수준 선택' : 'Seleccionar nivel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {isKorean ? (
                            <>
                              <SelectItem value="beginner">초급</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                              <SelectItem value="native">모국어</SelectItem>
                            </>
                          ) : (
                            <>
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
                      <Label htmlFor="english_level">
                        {isKorean ? '영어' : 'Inglés'}
                      </Label>
                      <Select value={formData.english_level} onValueChange={(value) => handleInputChange('english_level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isKorean ? '수준 선택' : 'Seleccionar nivel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {isKorean ? (
                            <>
                              <SelectItem value="none">불가능</SelectItem>
                              <SelectItem value="beginner">초급</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="none">No disponible</SelectItem>
                              <SelectItem value="beginner">Principiante</SelectItem>
                              <SelectItem value="intermediate">Intermedio</SelectItem>
                              <SelectItem value="advanced">Avanzado</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="spanish_level">
                        {isKorean ? '스페인어' : 'Español'}
                      </Label>
                      <Select value={formData.spanish_level} onValueChange={(value) => handleInputChange('spanish_level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isKorean ? '수준 선택' : 'Seleccionar nivel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {isKorean ? (
                            <>
                              <SelectItem value="none">불가능</SelectItem>
                              <SelectItem value="beginner">초급</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="native">Nativo</SelectItem>
                              <SelectItem value="advanced">Avanzado</SelectItem>
                              <SelectItem value="intermediate">Intermedio</SelectItem>
                              <SelectItem value="beginner">Principiante</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 한 줄 소개 */}
                <div>
                  <Label htmlFor="one_line_intro">
                    {isKorean ? '한 줄 소개 *' : 'Presentación breve *'}
                  </Label>
                  <Input
                    id="one_line_intro"
                    value={formData.one_line_intro}
                    onChange={(e) => handleInputChange('one_line_intro', e.target.value)}
                    placeholder={isKorean 
                      ? "간단한 자기소개를 입력해주세요 (가능하다면 스페인어로)" 
                      : "Escriba una breve presentación sobre usted"
                    }
                  />
                  {isKorean && (
                    <p className="text-sm text-gray-500 mt-1">
                      현지인들과의 소통을 위해 스페인어로 작성하시는 것을 권장합니다
                    </p>
                  )}
                  {!isKorean && (
                    <p className="text-sm text-gray-500 mt-1">
                      Esta información será visible en su perfil público
                    </p>
                  )}
                </div>

                {/* 자기소개 */}
                <div>
                  <Label htmlFor="introduction">
                    {isKorean ? '자기소개' : 'Presentación detallada'}
                  </Label>
                  <Textarea
                    id="introduction"
                    value={formData.custom_interests}
                    onChange={(e) => handleInputChange('custom_interests', e.target.value)}
                    placeholder={isKorean 
                      ? "좀 더 자세한 자기소개를 입력해주세요" 
                      : "Escriba una presentación más detallada sobre usted"
                    }
                    rows={4}
                  />
                </div>
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
            {isKorean ? '← 이전' : '← Anterior'}
          </Button>
          
          {step === 2 ? (
            <Button 
              onClick={handleSubmit}
              disabled={loading || !formData.one_line_intro}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isKorean ? '처리 중...' : 'Procesando...'}
                </div>
              ) : (
                isKorean ? '✅ 완료' : '✅ Completar'
              )}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              disabled={
                isKorean === null ||
                !formData.nickname || 
                (isKorean && !formData.korean_name) ||
                (!isKorean && !formData.spanish_name)
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isKorean ? '다음 →' : 'Siguiente →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}