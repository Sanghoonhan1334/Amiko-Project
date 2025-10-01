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
import { ArrowLeft, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export default function VerificationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // ✅ 모든 hooks를 조건부 렌더링 전에 먼저 선언
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  
  const [formData, setFormData] = useState({
    // 기본 정보
    full_name: '',
    phone: '',
    one_line_intro: '',
    profile_image: null as File | null,
    
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
    spanish_level: 'beginner' // 스페인어 학습자들을 위해 초급으로 기본 설정
  })

  // 운영자 체크 로직
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
      router.push('/main')
    }
  }, [step, router])

  const nextStep = useCallback(() => {
    if (step < 2) {
      setStep(step + 1)
    }
  }, [step])

  // 운영자라면 로딩 중 표시
  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">운영자 상태 확인 중...</p>
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

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const dataToSubmit = {
        ...formData,
        is_korean: true, // 한국 사용자로 고정
        language: 'ko' // 한국어로 고정
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
        alert('인증이 완료되었습니다!')
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
      alert('인증 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
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
                <div>
                  <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 mb-2 block">실명 *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="실제 이름을 입력해주세요"
                    className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">연락처 *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="010-1234-5678"
                    className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                  />
                </div>

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

                <div>
                  <Label htmlFor="one_line_intro">한 줄 소개 *</Label>
                  <Input
                    id="one_line_intro"
                    value={formData.one_line_intro}
                    onChange={(e) => handleInputChange('one_line_intro', e.target.value)}
                    placeholder="간단한 자기소개를 입력해주세요"
                  />
                </div>
              </div>
            ) : (
              // 2단계: 관심사 및 선호도
              <div className="space-y-6">
                {/* 관심사 선택 */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">관심사 (최대 5개)</Label>
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
                    선택된 관심사: {formData.interests.length}/5
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 자기소개 */}
                <div>
                  <Label htmlFor="introduction" className="text-sm font-semibold text-gray-700 mb-2 block">자기소개</Label>
                  <Textarea
                    id="introduction"
                    value={formData.custom_interests}
                    onChange={(e) => handleInputChange('custom_interests', e.target.value)}
                    placeholder="좀 더 자세한 자기소개를 입력해주세요"
                    rows={4}
                    className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                  />
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
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6"
            >
              {loading ? '처리 중...' : '완료'}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              disabled={!formData.full_name || !formData.phone}
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