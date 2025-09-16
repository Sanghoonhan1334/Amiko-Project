'use client'

import { useState } from 'react'
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

export default function VerificationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
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
    korean_level: '',
    english_level: 'none',
    spanish_level: 'none'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const interestOptions = [
    // 한국 문화 관련
    '한국 문화', '한국 역사', '한국 전통문화', '한국 현대문화',
    '한국 음식', '한국 드라마', '한국 영화', '한국 음악', 'K-POP',
    '한국어 문법', '한국어 회화', '한국어 발음', '한국어 작문',
    
    // 취미 & 활동
    '요리', '베이킹', '운동', '축구', '농구', '테니스', '수영',
    '독서', '글쓰기', '그림그리기', '악기연주', '노래',
    '여행', '사진촬영', '게임', '패션', '뷰티', '메이크업'
  ]

  const languageLevelOptions = [
    { value: 'none', label: '못함' },
    { value: 'beginner', label: '초급 (기본적인 인사, 간단한 대화)' },
    { value: 'elementary', label: '초중급 (일상 대화, 기본 문법)' },
    { value: 'intermediate', label: '중급 (자유로운 대화, 복잡한 문법)' },
    { value: 'upper_intermediate', label: '중상급 (뉴스 이해, 토론 가능)' },
    { value: 'advanced', label: '고급 (전문 분야 대화, 작문 가능)' },
    { value: 'native', label: '원어민 수준' }
  ]

  // 프로필 사진 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      
      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }
      
      setFormData({ ...formData, profile_image: file })
    }
  }

  // 프로필 사진 미리보기 URL 생성
  const getImagePreview = () => {
    if (formData.profile_image) {
      return URL.createObjectURL(formData.profile_image)
    }
    return null
  }


  const gradeOptions = [
    '1학년', '2학년', '3학년', '4학년', '대학원', '졸업생'
  ]

  const occupationOptions = [
    '회사원', '공무원', '교사', '의사', '변호사', '엔지니어',
    '디자이너', '마케터', '영업', '연구원', '자영업', '프리랜서',
    '주부', '무직', '기타'
  ]

  const workExperienceOptions = [
    '신입 (1년 미만)', '주니어 (1-3년)', '미들 (3-7년)', 
    '시니어 (7-15년)', '엑스퍼트 (15년 이상)'
  ]

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = '이름을 입력해주세요.'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.'
    } else if (!/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.'
    }
    
    // 대학생인 경우
    if (formData.user_type === 'student') {
      if (!formData.university.trim()) {
        newErrors.university = '대학교명을 입력해주세요.'
      }
      
      if (!formData.major.trim()) {
        newErrors.major = '전공을 입력해주세요.'
      }
      
      if (!formData.grade) {
        newErrors.grade = '학년을 선택해주세요.'
      }
    }
    
    // 일반인인 경우
    if (formData.user_type === 'general') {
      if (!formData.occupation.trim()) {
        newErrors.occupation = '직업을 선택해주세요.'
      }
      
      if (formData.occupation !== '무직' && !formData.company.trim()) {
        newErrors.company = '회사명을 입력해주세요.'
      }
      
      if (!formData.work_experience) {
        newErrors.work_experience = '경력을 선택해주세요.'
      }
    }
    
    if (!formData.one_line_intro.trim()) {
      newErrors.one_line_intro = '자기소개를 입력해주세요.'
    } else if (formData.one_line_intro.length < 10) {
      newErrors.one_line_intro = '자기소개는 최소 10자 이상 입력해주세요.'
    }
    
    // 언어 수준 검증 (비한국인인 경우에만 한국어 수준 필수)
    if (!formData.is_korean && !formData.korean_level) {
      newErrors.korean_level = '한국어 수준을 선택해주세요.'
    }
    
    if (formData.interests.length === 0) {
      newErrors.interests = '관심 분야를 최소 1개 이상 선택해주세요. 대화하기 편한 분야를 선택하면 더 좋은 매칭이 가능합니다.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (formData.matching_preferences.length === 0) {
      newErrors.matching_preferences = '선호하는 매칭 방식을 최소 1개 이상 선택해주세요.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return
    
    setLoading(true)
    
    try {
      // 프로필 사진을 Base64로 변환
      let profileImageBase64 = null
      if (formData.profile_image) {
        profileImageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(formData.profile_image!)
        })
      }

      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify({
          ...formData,
          profile_image: profileImageBase64,
          english_level: formData.english_level === 'none' ? 'none' : formData.english_level,
          spanish_level: formData.spanish_level === 'none' ? 'none' : formData.spanish_level,
          email: user?.email // 사용자 이메일 포함
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert('인증 정보가 성공적으로 제출되었습니다! 검토 후 결과를 알려드리겠습니다.')
        router.push('/main')
      } else {
        alert(`인증 제출 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('인증 제출 오류:', error)
      alert('인증 제출 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }


  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }


  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('verification.loginRequired')}</CardTitle>
            <CardDescription>
              {t('verification.loginRequiredDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              {t('auth.signIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('verification.title')}</h1>
            <p className="text-gray-600">{t('verification.subtitle')}</p>
          </div>
        </div>

        {/* 정보 공개/비공개 안내 */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800">{t('verification.infoCollectionGuide')}</CardTitle>
            <CardDescription className="text-blue-700">
              {t('verification.infoCollectionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 공개 정보 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('verification.publicInfo')}
                </h4>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• {t('verification.name')}</li>
                  <li>• {t('verification.major')}</li>
                  <li>• {t('verification.languageLevel')}</li>
                  <li>• {t('verification.interests')}</li>
                  <li>• {t('verification.introduction')}</li>
                </ul>
                <p className="text-xs text-green-600 mt-2">
                  {t('verification.publicInfoDescription')}
                </p>
              </div>

              {/* 비공개 정보 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-red-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {t('verification.privateInfo')}
                </h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• {t('verification.phone')}</li>
                  <li>• {t('verification.university')}</li>
                  <li>• {t('verification.studentId')}</li>
                  <li>• {t('verification.occupation')}</li>
                  <li>• {t('verification.experience')}</li>
                  <li>• {t('verification.availableTime')}</li>
                </ul>
                <p className="text-xs text-red-600 mt-2">
                  {t('verification.privateInfoDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 진행 단계 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 1 ? <CheckCircle className="w-4 h-4" /> : 1}
            </div>
            <div className={`w-16 h-1 ${
              step > 1 ? 'bg-blue-500' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 2 ? <CheckCircle className="w-4 h-4" /> : 2}
            </div>
          </div>
        </div>

        {/* 단계별 폼 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {step === 1 && t('verification.basicInfoStep')}
              {step === 2 && t('verification.matchingStep')}
            </CardTitle>
            <CardDescription>
              {step === 1 && t('verification.basicInfoDescription')}
              {step === 2 && t('verification.matchingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1단계: 기본 정보 */}
            {step === 1 && (
              <div className="space-y-6">
                {/* 사용자 유형 선택 */}
                <div className="space-y-4">
                  <Label>{t('verification.userType')} *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.user_type === 'student' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, user_type: 'student' }))}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎓</div>
                        <h3 className="font-semibold">{t('verification.student')}</h3>
                        <p className="text-sm text-gray-600">{t('verification.studentDescription')}</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.user_type === 'general' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, user_type: 'general' }))}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">👔</div>
                        <h3 className="font-semibold">{t('verification.general')}</h3>
                        <p className="text-sm text-gray-600">{t('verification.generalDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 한국인/비한국인 선택 */}
                <div className="space-y-4">
                  <Label>{t('verification.nationality')} *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.is_korean 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, is_korean: true, korean_level: 'native', spanish_level: 'none' }))}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🇰🇷</div>
                        <h3 className="font-semibold">{t('verification.korean')}</h3>
                        <p className="text-sm text-gray-600">{t('verification.koreanDescription')}</p>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        !formData.is_korean 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, is_korean: false, korean_level: '', spanish_level: 'native' }))}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🌍</div>
                        <h3 className="font-semibold">{t('verification.nonKorean')}</h3>
                        <p className="text-sm text-gray-600">{t('verification.nonKoreanDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 프로필 사진 업로드 */}
                <div className="space-y-4">
                  <Label>{t('verification.profilePhoto')}</Label>
                  <div className="flex items-center gap-4">
                    {/* 미리보기 */}
                    <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {getImagePreview() ? (
                        <img 
                          src={getImagePreview()!} 
                          alt={t('verification.profilePreview')} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-2xl">👤</span>
                      )}
                    </div>
                    
                    {/* 업로드 버튼 */}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        📷 {t('verification.selectPhoto')}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">{t('verification.photoRequirements')}</p>
                    </div>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('verification.name')} *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder={t('verification.namePlaceholder')}
                    />
                    {errors.full_name && <p className="text-sm text-red-500">{errors.full_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('verification.phone')} *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={t('verification.phonePlaceholder')}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  {/* 대학생 정보 */}
                  {formData.user_type === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="university">{t('verification.university')} *</Label>
                        <Input
                          id="university"
                          value={formData.university}
                          onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                          placeholder={t('verification.universityPlaceholder')}
                        />
                        {errors.university && <p className="text-sm text-red-500">{errors.university}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="major">{t('verification.major')} *</Label>
                        <Input
                          id="major"
                          value={formData.major}
                          onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                          placeholder={t('verification.majorPlaceholder')}
                        />
                        {errors.major && <p className="text-sm text-red-500">{errors.major}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grade">{t('verification.grade')} *</Label>
                        <Select value={formData.grade} onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('verification.gradePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map(grade => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.grade && <p className="text-sm text-red-500">{errors.grade}</p>}
                      </div>
                    </>
                  )}

                  {/* 일반인 정보 */}
                  {formData.user_type === 'general' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">직업 *</Label>
                        <Select value={formData.occupation} onValueChange={(value) => setFormData(prev => ({ ...prev, occupation: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="직업을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {occupationOptions.map(occupation => (
                              <SelectItem key={occupation} value={occupation}>
                                {occupation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.occupation && <p className="text-sm text-red-500">{errors.occupation}</p>}
                      </div>

                      {formData.occupation && formData.occupation !== '무직' && (
                        <div className="space-y-2">
                          <Label htmlFor="company">회사명 *</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="회사명을 입력하세요"
                          />
                          {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="work_experience">경력 *</Label>
                        <Select value={formData.work_experience} onValueChange={(value) => setFormData(prev => ({ ...prev, work_experience: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="경력을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {workExperienceOptions.map(experience => (
                              <SelectItem key={experience} value={experience}>
                                {experience}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.work_experience && <p className="text-sm text-red-500">{errors.work_experience}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="one_line_intro">자기소개 *</Label>
                    <Textarea
                      id="one_line_intro"
                      value={formData.one_line_intro}
                      onChange={(e) => setFormData(prev => ({ ...prev, one_line_intro: e.target.value }))}
                      placeholder="간단한 자기소개를 입력해주세요 (최소 10자 이상)"
                      rows={3}
                    />
                    {errors.one_line_intro && <p className="text-sm text-red-500">{errors.one_line_intro}</p>}
                  </div>

                  {/* 언어 수준 선택 */}
                  <div className="space-y-4 md:col-span-2">
                    <Label>언어 수준 * (대화 가능한 언어의 수준을 선택해주세요)</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 한국어 수준 - 한국인이 아닌 경우에만 표시 */}
                      {!formData.is_korean && (
                        <div className="space-y-2">
                          <Label htmlFor="korean_level">한국어 수준 *</Label>
                          <Select value={formData.korean_level} onValueChange={(value) => setFormData(prev => ({ ...prev, korean_level: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="한국어 수준 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {languageLevelOptions.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.korean_level && <p className="text-sm text-red-500">{errors.korean_level}</p>}
                        </div>
                      )}

                      {/* 영어 수준 */}
                      <div className="space-y-2">
                        <Label htmlFor="english_level">영어 수준</Label>
                        <Select value={formData.english_level} onValueChange={(value) => setFormData(prev => ({ ...prev, english_level: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="영어 수준 선택 (선택사항)" />
                          </SelectTrigger>
                          <SelectContent>
                            {languageLevelOptions.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 스페인어 수준 - 한국인인 경우에만 표시 */}
                      {formData.is_korean && (
                        <div className="space-y-2">
                          <Label htmlFor="spanish_level">스페인어 수준</Label>
                          <Select value={formData.spanish_level} onValueChange={(value) => setFormData(prev => ({ ...prev, spanish_level: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="스페인어 수준 선택 (선택사항)" />
                            </SelectTrigger>
                            <SelectContent>
                              {languageLevelOptions.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 관심 분야 선택 */}
                  <div className="space-y-3 md:col-span-2">
                    <Label>관심 분야 * (최소 1개 이상 선택)</Label>
                    <p className="text-sm text-gray-600">
                      {formData.user_type === 'student' 
                        ? '대화하기 편한 분야나 좋아하는 주제를 선택해주세요' 
                        : '대화하기 편한 분야나 전문 분야를 선택해주세요'
                      }
                    </p>
                    
                    {/* 간단한 관심사 옵션들 */}
                    <div className="space-y-3">
                      {/* 한국 문화 관련 */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">🇰🇷 한국 문화 관련</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['한국 문화', '한국 역사', '한국 전통문화', '한국 현대문화', '한국 음식', '한국 드라마', '한국 영화', '한국 음악', 'K-POP', '한국어 문법', '한국어 회화', '한국어 발음'].map(interest => (
                            <Button
                              key={interest}
                              variant={formData.interests.includes(interest) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleInterestToggle(interest)}
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
                      </div>

                      {/* 취미 & 활동 */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">🎨 취미 & 활동</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['요리', '베이킹', '운동', '축구', '농구', '테니스', '수영', '독서', '글쓰기', '그림그리기', '악기연주', '노래', '여행', '사진촬영', '게임', '패션', '뷰티', '메이크업'].map(interest => (
                            <Button
                              key={interest}
                              variant={formData.interests.includes(interest) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleInterestToggle(interest)}
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
                      </div>

                      {/* 기타 관심 분야 */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">✏️ 기타</h4>
                        <div className="space-y-2">
                          <Label htmlFor="custom_interests">직접 입력 (선택사항)</Label>
                          <Input
                            id="custom_interests"
                            value={formData.custom_interests}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_interests: e.target.value }))}
                            placeholder="예: 요가, 독서모임, 요리클래스, 여행계획 등"
                            className="text-sm"
                          />
                          <p className="text-xs text-gray-500">
                            위에서 선택한 항목 외에 추가로 관심 있는 분야가 있다면 자유롭게 입력해주세요.
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* 선택된 관심사 요약 */}
                    {(formData.interests.length > 0 || formData.custom_interests.trim()) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          선택된 관심 분야 ({formData.interests.length + (formData.custom_interests.trim() ? 1 : 0)}개):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {formData.interests.map(interest => (
                            <span 
                              key={interest}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {interest}
                              <button
                                onClick={() => handleInterestToggle(interest)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {formData.custom_interests.trim() && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              {formData.custom_interests}
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, custom_interests: '' }))}
                                className="ml-1 text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {errors.interests && <p className="text-sm text-red-500">{errors.interests}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* 2단계: 매칭 방식 선택 */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>선호하는 매칭 방식은 무엇인가요? * (둘 다 고르셔도 됩니다)</Label>
                  <p className="text-sm text-gray-600">
                    실제 서비스에서는 두 방식 모두 사용할 수 있지만, 선호도를 파악하기 위한 질문입니다.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 즉석 매칭 */}
                    <div 
                      className={`p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                        formData.matching_preferences.includes('instant')
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          matching_preferences: prev.matching_preferences.includes('instant')
                            ? prev.matching_preferences.filter(p => p !== 'instant')
                            : [...prev.matching_preferences, 'instant']
                        }))
                      }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3">🎲</div>
                        <h3 className="font-semibold text-lg mb-2">즉석 매칭</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          지금 접속 중인 사용자와 무작위로 연결됩니다
                        </p>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          놀이터 느낌 • 빠른 대화 시작
                        </div>
                      </div>
                    </div>
                    
                    {/* 선택적 매칭 */}
                    <div 
                      className={`p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                        formData.matching_preferences.includes('selective')
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          matching_preferences: prev.matching_preferences.includes('selective')
                            ? prev.matching_preferences.filter(p => p !== 'selective')
                            : [...prev.matching_preferences, 'selective']
                        }))
                      }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3">🔍</div>
                        <h3 className="font-semibold text-lg mb-2">선택적 매칭</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          관심사와 언어 수준을 보고 원하는 사람을 찾아 대화 신청
                        </p>
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          맞춤형 • 신중한 선택
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      💡 <strong>참고:</strong> 실제 서비스에서는 두 방식 모두 자유롭게 사용할 수 있습니다!
                    </p>
                  </div>
                  
                  {errors.matching_preferences && <p className="text-sm text-red-500">{errors.matching_preferences}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            이전
          </Button>
          
          {step < 2 ? (
            <Button onClick={handleNext}>
              다음
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '제출 중...' : '인증 제출'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
