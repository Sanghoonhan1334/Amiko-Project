'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'
import { InterestBadges } from './TranslatedInterests'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Briefcase,
  Heart,
  MessageSquare,
  Star,
  X,
  Languages,
  Loader2
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  nickname?: string
  korean_name?: string
  spanish_name?: string
  email: string
  profile_image?: string
  bio?: string
  location?: string
  university?: string
  major?: string
  grade?: string
  occupation?: string
  company?: string
  work_experience?: string
  interests?: string[]
  language_levels?: {
    korean?: string
    english?: string
    spanish?: string
  }
  user_type?: 'student' | 'general'
  is_korean?: boolean
  created_at: string
  join_date?: string
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { t, language } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 번역 상태
  const [translating, setTranslating] = useState(false)
  const [translatedFields, setTranslatedFields] = useState<{
    bio?: string
    university?: string
    major?: string
    occupation?: string
    company?: string
    work_experience?: string
  }>({})
  const [translationMode, setTranslationMode] = useState<'none' | 'ko-to-es' | 'es-to-ko'>('none')

  // 목업 프로필 데이터
  const mockProfiles: Record<string, UserProfile> = {
    '1': {
      id: '1',
      full_name: '김민수',
      nickname: '민수킹',
      korean_name: '김민수',
      spanish_name: null,
      email: 'minsu@example.com',
      profile_image: '/celebs/jin.webp',
      bio: '안녕하세요! 한국어를 가르치고 싶은 김민수입니다. 다양한 문화에 관심이 많아요!',
      location: '서울, 한국',
      university: '서울대학교',
      major: '스페인어문학과',
      grade: '4학년',
      occupation: null,
      company: null,
      work_experience: null,
      interests: ['영화', '음악', '여행', '요리', '댄스'],
      language_levels: {
        korean: '고급',
        english: '중급',
        spanish: '중급'
      },
      user_type: 'student',
      is_korean: true,
      created_at: '2024-01-15T10:30:00Z',
      join_date: '2024-01-15T10:30:00Z'
    },
    '2': {
      id: '2',
      full_name: '이지은',
      nickname: '지은이',
      korean_name: '이지은',
      spanish_name: null,
      email: 'jieun@example.com',
      profile_image: '/celebs/rm.jpg',
      bio: 'K-POP과 한국 드라마를 좋아하는 이지은이에요. 함께 한국 문화를 나눠요!',
      location: '부산, 한국',
      university: '부산대학교',
      major: '국어국문학과',
      grade: '3학년',
      occupation: null,
      company: null,
      work_experience: null,
      interests: ['K-POP', '드라마', '패션', '맛집', '애니메이션'],
      language_levels: {
        korean: '고급',
        english: '초급',
        spanish: '초급'
      },
      user_type: 'student',
      is_korean: true,
      created_at: '2024-02-20T14:15:00Z',
      join_date: '2024-02-20T14:15:00Z'
    },
    '3': {
      id: '3',
      full_name: '박준호',
      nickname: '준호스포츠',
      korean_name: '박준호',
      spanish_name: null,
      email: 'junho@example.com',
      profile_image: '/celebs/suga.jpg',
      bio: '스포츠와 게임을 좋아하는 박준호입니다. 활발한 대화를 좋아해요!',
      location: '대구, 한국',
      university: null,
      major: null,
      grade: null,
      occupation: '소프트웨어 개발자',
      company: '네이버',
      work_experience: '3년',
      interests: ['스포츠', '게임', '기술', '독서', '사진'],
      language_levels: {
        korean: '고급',
        english: '중급',
        spanish: '고급'
      },
      user_type: 'general',
      is_korean: true,
      created_at: '2024-03-10T09:45:00Z',
      join_date: '2024-03-10T09:45:00Z'
    },
    '4': {
      id: '4',
      full_name: 'Carlos Rodriguez',
      nickname: 'CarlosKR',
      korean_name: null,
      spanish_name: 'Carlos Rodriguez',
      email: 'carlos@example.com',
      profile_image: null,
      bio: '한국어를 배우고 있는 카를로스입니다. 한국 문화에 매료되었어요!',
      location: '멕시코시티, 멕시코',
      university: 'UNAM',
      major: '한국어문학과',
      grade: '2학년',
      occupation: null,
      company: null,
      work_experience: null,
      interests: ['한국어', 'K-POP', '요리', '여행', '커피'],
      language_levels: {
        korean: '중급',
        english: '고급',
        spanish: '고급'
      },
      user_type: 'student',
      is_korean: false,
      created_at: '2024-01-25T16:20:00Z',
      join_date: '2024-01-25T16:20:00Z'
    },
    '5': {
      id: '5',
      full_name: 'Ana Martinez',
      nickname: 'AnaKdrama',
      korean_name: null,
      spanish_name: 'Ana Martinez',
      email: 'ana@example.com',
      profile_image: null,
      bio: '한국 드라마를 사랑하는 아나입니다. 언어교환을 통해 소통하고 싶어요!',
      location: '마드리드, 스페인',
      university: '마드리드 대학교',
      major: '아시아학과',
      grade: '3학년',
      occupation: null,
      company: null,
      work_experience: null,
      interests: ['한국 드라마', 'K-POP', '패션', '언어교환', '뷰티'],
      language_levels: {
        korean: '초급',
        english: '중급',
        spanish: '고급'
      },
      user_type: 'student',
      is_korean: false,
      created_at: '2024-02-05T11:30:00Z',
      join_date: '2024-02-05T11:30:00Z'
    }
  }

  // 프로필 데이터 가져오기
  const fetchUserProfile = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // 목업 데이터가 있으면 사용
      if (mockProfiles[id]) {
        setProfile(mockProfiles[id])
        setLoading(false)
        return
      }

      // 실제 API 호출
      const response = await fetch(`/api/user/${id}`)
      
      if (!response.ok) {
        throw new Error('프로필을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setProfile(data.profile)
    } catch (err) {
      console.error('프로필 조회 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // userId가 변경될 때마다 프로필 데이터 가져오기
  useEffect(() => {
    if (userId && isOpen) {
      fetchUserProfile(userId)
    }
  }, [userId, isOpen])

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setProfile(null)
      setError(null)
      setTranslatedFields({})
      setTranslationMode('none')
    }
  }, [isOpen])


  // 번역 함수들
  const handleTranslateToSpanish = async () => {
    if (translating) return
    await performTranslation('ko', 'es')
  }

  const handleTranslateToKorean = async () => {
    if (translating) return
    await performTranslation('es', 'ko')
  }

  const performTranslation = async (sourceLang: 'ko' | 'es', targetLang: 'ko' | 'es') => {
    if (!profile) return

    setTranslating(true)
    try {
      const fieldsToTranslate = [
        { key: 'bio', value: profile.bio },
        { key: 'university', value: profile.university },
        { key: 'major', value: profile.major },
        { key: 'occupation', value: profile.occupation },
        { key: 'company', value: profile.company },
        { key: 'work_experience', value: profile.work_experience }
      ].filter(field => field.value && field.value.trim())

      const translatedFieldsData: any = {}
      
      for (const field of fieldsToTranslate) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: field.value,
              targetLang: targetLang,
              sourceLang: sourceLang
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              translatedFieldsData[field.key] = data.translatedText
            }
          }
        } catch (error) {
          console.error(`번역 실패 (${field.key}):`, error)
        }
      }

      setTranslatedFields(translatedFieldsData)
      setTranslationMode(sourceLang === 'ko' ? 'ko-to-es' : 'es-to-ko')
      toast.success('번역이 완료되었습니다.')
    } catch (error) {
      console.error('번역 오류:', error)
      toast.error('번역 중 오류가 발생했습니다.')
    } finally {
      setTranslating(false)
    }
  }

  const handleShowOriginal = () => {
    setTranslationMode('none')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // 필드 값 가져오기 (번역 여부에 따라)
  const getFieldValue = (field: keyof typeof translatedFields, originalValue?: string) => {
    if (!originalValue) return ''
    return translationMode !== 'none' && translatedFields[field] ? translatedFields[field] : originalValue
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="user-profile-modal" style={{ zIndex: 99999 }}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl z-[99999]" 
        style={{ 
          backgroundColor: 'white !important',
          background: 'white !important',
          zIndex: '99999 !important',
          position: 'relative !important'
        }}
      >
        <DialogHeader className="bg-white" style={{ 
          backgroundColor: 'white !important',
          background: 'white !important'
        }}>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900" style={{ 
              color: 'rgb(17 24 39) !important'
            }}>{t('userProfile.title')}</DialogTitle>
            
            {/* 번역 드롭다운 */}
            {profile && !loading && (
              <div className="flex items-center">
                {translationMode === 'none' ? (
                  <Select onValueChange={(value) => {
                    if (value === 'ko-to-es') {
                      handleTranslateToSpanish()
                    } else if (value === 'es-to-ko') {
                      handleTranslateToKorean()
                    }
                  }}>
                    <SelectTrigger className="w-40 text-xs">
                      <div className="flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        <SelectValue placeholder={language === 'ko' ? '번역 선택' : 'Traducción'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="z-[100000]">
                      <SelectItem value="ko-to-es" disabled={translating}>
                        {language === 'ko' ? '한국어 → 스페인어' : 'Coreano → Español'}
                      </SelectItem>
                      <SelectItem value="es-to-ko" disabled={translating}>
                        {language === 'ko' ? '스페인어 → 한국어' : 'Español → Coreano'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    onClick={handleShowOriginal}
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1"
                  >
                    <Languages className="w-3 h-3" />
                    {language === 'ko' ? '원본 보기' : 'Ver Original'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {loading && (
          <div className="space-y-3 md:space-y-6 bg-white" style={{ 
            backgroundColor: 'white !important',
            background: 'white !important'
          }}>
            {/* 프로필 헤더 스켈레톤 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 bg-gray-200 rounded-full animate-pulse"></div>
              
              <div className="h-6 md:h-8 bg-gray-200 rounded-lg w-32 mx-auto mb-2 animate-pulse"></div>
              
              {/* 닉네임 스켈레톤 */}
              <div className="h-4 md:h-5 bg-gray-200 rounded w-20 mx-auto mb-2 animate-pulse"></div>
              
              {/* 한국이름/스페인어 이름 스켈레톤 */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-3 md:h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              
              {/* 가입일/위치 스켈레톤 */}
              <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="h-3 md:h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>

              {/* 배지 스켈레톤 */}
              <div className="flex justify-center gap-1 md:gap-2 mb-3 md:mb-4">
                <div className="h-5 md:h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                <div className="h-5 md:h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              </div>
            </div>

            {/* 자기소개 스켈레톤 */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
              <div className="h-4 md:h-5 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-3 md:h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>

            {/* 학업/직업 정보 스켈레톤 */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
              <div className="h-4 md:h-5 bg-gray-200 rounded w-20 mb-2 md:mb-3 animate-pulse"></div>
              
              <div className="space-y-1 md:space-y-2">
                <div className="h-3 md:h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-3/5 animate-pulse"></div>
              </div>
            </div>

            {/* 언어 수준 스켈레톤 */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
              <div className="h-4 md:h-5 bg-gray-200 rounded w-20 mb-2 md:mb-3 animate-pulse"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <div className="h-8 md:h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-8 md:h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-8 md:h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* 관심사 스켈레톤 */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg border">
              <div className="h-4 md:h-5 bg-gray-200 rounded w-16 mb-2 md:mb-3 animate-pulse"></div>
              
              <div className="flex flex-wrap gap-1 md:gap-2">
                <div className="h-6 md:h-7 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                <div className="h-6 md:h-7 bg-gray-200 rounded-full w-12 animate-pulse"></div>
                <div className="h-6 md:h-7 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                <div className="h-6 md:h-7 bg-gray-200 rounded-full w-10 animate-pulse"></div>
                <div className="h-6 md:h-7 bg-gray-200 rounded-full w-18 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => userId && fetchUserProfile(userId)}
              className="mt-4"
              variant="outline"
            >
              다시 시도
            </Button>
          </div>
        )}

        {profile && !loading && (
          <div className="space-y-3 md:space-y-6 bg-white" style={{ 
            backgroundColor: 'white !important',
            background: 'white !important'
          }}>
            {/* 프로필 헤더 */}
            <div className="text-center">
              <Avatar className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4">
                <AvatarImage src={profile.profile_image} alt={profile.full_name} />
                <AvatarFallback className="text-lg md:text-2xl bg-blue-100 text-blue-600">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1" style={{ 
                color: 'rgb(17 24 39) !important'
              }}>
                {profile.full_name}
              </h2>
              
              {/* 닉네임 표시 */}
              {profile.nickname && (
                <p className="text-sm md:text-base text-gray-600 mb-2" style={{ 
                  color: 'rgb(75 85 99) !important'
                }}>
                  @{profile.nickname}
                </p>
              )}
              
              {/* 한국이름/스페인어 이름 */}
              <div className="flex items-center justify-center gap-2 mb-3 text-xs md:text-sm text-gray-500">
                {profile.korean_name && (
                  <span>🇰🇷 {profile.korean_name}</span>
                )}
                {profile.spanish_name && (
                  <span>🌍 {profile.spanish_name}</span>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {formatDate(profile.join_date || profile.created_at)} {t('userProfile.joinedOn')}
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                    {profile.location}
                  </div>
                )}
              </div>

              {/* 사용자 타입 배지 */}
              <div className="flex justify-center gap-1 md:gap-2 mb-3 md:mb-4">
                <Badge variant={profile.is_korean ? "default" : "secondary"} className="text-xs">
                  {profile.is_korean ? "🇰🇷 한국인" : "🌍 외국인"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {profile.user_type === 'student' ? "🎓 학생" : "💼 직장인"}
                </Badge>
              </div>
            </div>

              {/* 자기소개 */}
            {profile.bio && (
              <Card className="p-3 md:p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                  <User className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profileModal.selfIntroduction')}
                </h3>
                <p className="text-gray-700 text-sm md:text-base">{getFieldValue('bio', profile.bio)}</p>
              </Card>
            )}

            {/* 학업/직업 정보 */}
            <Card className="p-3 md:p-4">
              <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                {profile.user_type === 'student' ? (
                  <>
                    <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
                    {t('profileModal.academicInfo')}
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
                    직업 정보
                  </>
                )}
              </h3>
              
              <div className="space-y-1 md:space-y-2">
                {profile.user_type === 'student' ? (
                  <>
                    {profile.university && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('profileModal.university')}:</span>
                        <span className="font-medium">{getFieldValue('university', profile.university)}</span>
                      </div>
                    )}
                    {profile.major && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('profileModal.major')}:</span>
                        <span className="font-medium">{getFieldValue('major', profile.major)}</span>
                      </div>
                    )}
                    {profile.grade && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('profileModal.year')}:</span>
                        <span className="font-medium">{profile.grade}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {profile.occupation && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">직업:</span>
                        <span className="font-medium">{getFieldValue('occupation', profile.occupation)}</span>
                      </div>
                    )}
                    {profile.company && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">회사:</span>
                        <span className="font-medium">{getFieldValue('company', profile.company)}</span>
                      </div>
                    )}
                    {profile.work_experience && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">경력:</span>
                        <span className="font-medium">{getFieldValue('work_experience', profile.work_experience)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* 언어 수준 */}
            {profile.language_levels && (
              <Card className="p-3 md:p-4">
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profileModal.languageLevel')}
                </h3>
                
                <div className="space-y-1 md:space-y-2">
                  {profile.language_levels.korean && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('profileModal.korean')}:</span>
                      <Badge variant="outline" className="text-xs">{profile.language_levels.korean}</Badge>
                    </div>
                  )}
                  {profile.language_levels.english && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('profileModal.english')}:</span>
                      <Badge variant="outline" className="text-xs">{profile.language_levels.english}</Badge>
                    </div>
                  )}
                  {profile.language_levels.spanish && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('profileModal.spanish')}:</span>
                      <Badge variant="outline" className="text-xs">{profile.language_levels.spanish}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 관심 분야 */}
            {profile.interests && profile.interests.length > 0 && (
              <Card className="p-3 md:p-4">
                <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Heart className="w-3 h-3 md:w-4 md:h-4" />
                  {t('profile.interests')}
                </h3>
                
                <InterestBadges interests={profile.interests} />
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
