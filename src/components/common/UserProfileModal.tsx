'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { InterestBadges } from './TranslatedInterests'
import UserBadge from './UserBadge'
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
  Loader2,
  Flag,
  Lock
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
  total_points?: number
  is_vip?: boolean
  academic_info_public?: boolean
  job_info_public?: boolean
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

const REASONS = [
  { key: 'spam', ko: '스팸 / 광고', es: 'Spam o publicidad no deseada' },
  { key: 'harassment', ko: '혐오 / 괴롭힘', es: 'Acoso u ofensas' },
  { key: 'inappropriate', ko: '부적절한 콘텐츠', es: 'Contenido inapropiado' },
  { key: 'other', ko: '기타', es: 'Otro' }
]

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
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
    interests?: string[]
  }>({})
  const [translationMode, setTranslationMode] = useState<'none' | 'ko-to-es' | 'es-to-ko'>('none')

  // 신고 상태
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  // 목업 프로필 데이터
  const mockProfiles: Record<string, UserProfile> = {
    '1': {
      id: '1',
      full_name: '김민수',
      nickname: '민수킹',
      korean_name: '김민수',
      spanish_name: null,
      email: 'minsu@example.com',
      profile_image: '/quizzes/mbti-with-kpop-stars/celebs/jin.webp',
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
      profile_image: '/quizzes/mbti-with-kpop-stars/celebs/rm.jpg',
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
      profile_image: '/quizzes/mbti-with-kpop-stars/celebs/suga.jpg',
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
    console.log('[UserProfileModal] 프로필 조회 시작:', { userId: id })
    setLoading(true)
    setError(null)
    
    try {
      // 목업 데이터가 있으면 사용
      if (mockProfiles[id]) {
        console.log('[UserProfileModal] 목업 데이터 사용:', id)
        setProfile(mockProfiles[id])
        setLoading(false)
        return
      }

      // 실제 API 호출
      console.log('[UserProfileModal] API 호출:', `/api/user/${id}`)
      const response = await fetch(`/api/user/${id}`)
      
      if (!response.ok) {
        let errorData = {}
        try {
          const text = await response.text()
          errorData = text ? JSON.parse(text) : {}
        } catch (e) {
          console.error('[UserProfileModal] 에러 응답 파싱 실패:', e)
        }
        
        const errorMessage = errorData.error || `프로필을 불러오는데 실패했습니다. (HTTP ${response.status})`
        console.error('[UserProfileModal] 프로필 API 에러:', { 
          status: response.status, 
          statusText: response.statusText,
          url: `/api/user/${id}`,
          userId: id,
          error: errorData,
          errorString: JSON.stringify(errorData, null, 2)
        })
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.profile) {
        throw new Error('프로필 데이터가 없습니다.')
      }
      setProfile(data.profile)
    } catch (err) {
      console.error('프로필 조회 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 신고 제출 함수
  const handleSubmitReport = async () => {
    if (!token) {
      setError(language === 'ko' 
        ? '신고하려면 먼저 로그인하세요.' 
        : 'Debes iniciar sesión para enviar una denuncia.')
      return
    }
    
    if (!reportReason) {
      setError(language === 'ko' 
        ? '신고 사유를 선택하세요.' 
        : 'Selecciona un motivo de denuncia.')
      return
    }

    if (!userId) {
      setError(language === 'ko' 
        ? '사용자 ID가 없습니다.' 
        : 'ID de usuario no encontrado.')
      return
    }

    try {
      setReportSubmitting(true)
      setReportSuccess(false)
      setError(null)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId: userId,
          reportType: 'account',
          reason: reportReason,
          details: reportDetails.trim()
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || result.message || '신고에 실패했습니다.')
      }

      setReportSuccess(true)
      setReportReason('')
      setReportDetails('')
      setError(null)
    } catch (err) {
      console.error('[UserProfileModal] report error:', err)
      setError(language === 'ko' 
        ? '신고를 제출하는 중 문제가 발생했습니다.' 
        : 'Ocurrió un problema al enviar la denuncia.')
    } finally {
      setReportSubmitting(false)
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


  // 간단한 언어 감지 함수 (한글/스페인어 문자 기반)
  const detectLanguage = (text: string): 'ko' | 'es' => {
    if (!text || text.trim().length === 0) return language // 기본값은 현재 언어
    
    // 한글 유니코드 범위: AC00-D7AF
    const koreanRegex = /[가-힣]/
    
    // 스페인어 특수 문자나 일반적인 스페인어 단어 패턴
    const spanishIndicators = /\b(es|el|la|los|las|un|una|del|de|en|con|por|para|que|está|están|son|soy|eres|somos|sois|música|más|juegos|cultura|coreano|coreana|intercambio|idioma|idiomas)\b/i
    
    // 스페인어 특수 문자 (á, é, í, ó, ú, ñ 등)
    const spanishChars = /[áéíóúñüÁÉÍÓÚÑÜ]/
    
    // 한글이 있으면 한국어로 판단
    const hasKorean = koreanRegex.test(text)
    
    // 스페인어 지시어나 특수 문자가 있고 한글이 없으면 스페인어로 판단
    const hasSpanish = (spanishIndicators.test(text) || spanishChars.test(text)) && !hasKorean
    
    // 한글이 있으면 한국어로 판단
    if (hasKorean) return 'ko'
    // 스페인어 지시어가 있고 한글이 없으면 스페인어로 판단
    if (hasSpanish) return 'es'
    // 둘 다 없으면 현재 언어 설정을 기본값으로
    return language
  }

  // 번역 함수들
  const handleTranslateToSpanish = async () => {
    if (translating) return
    // 텍스트 언어를 자동 감지하여 한국어 → 스페인어로 번역
    await performTranslation('ko', 'es')
  }

  const handleTranslateToKorean = async () => {
    if (translating) return
    // 텍스트 언어를 자동 감지하여 스페인어 → 한국어로 번역
    await performTranslation('es', 'ko')
  }

  const performTranslation = async (sourceLang: 'ko' | 'es', targetLang: 'ko' | 'es') => {
    if (!profile) {
      console.warn('[TRANSLATE] 프로필이 없어 번역을 수행할 수 없습니다.')
      return
    }

    console.log('[TRANSLATE] 번역 시작:', { sourceLang, targetLang, profileId: profile.id })
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

      // 관심사 번역 (배열)
      let translatedInterests: string[] | undefined = undefined
      if (profile.interests && profile.interests.length > 0) {
        try {
          console.log('[TRANSLATE] 관심사 번역 시작:', profile.interests)
          const interestTranslations: string[] = []
          for (const interest of profile.interests) {
            try {
              const detectedLang = detectLanguage(interest)
              
              // 감지된 언어가 targetLang과 같으면 번역하지 않음 (이미 번역된 상태)
              if (detectedLang === targetLang) {
                console.log(`[TRANSLATE] 관심사 "${interest}" 이미 ${targetLang}이므로 번역 건너뜀`)
                interestTranslations.push(interest)
                continue
              }
              
              // 감지된 언어를 sourceLang으로 사용
              const actualSourceLang = detectedLang
              
              // sourceLang이 targetLang과 같으면 번역하지 않음
              if (actualSourceLang === targetLang) {
                console.log(`[TRANSLATE] 관심사 "${interest}" sourceLang과 targetLang이 같아서 번역 건너뜀`)
                interestTranslations.push(interest)
                continue
              }
              
              console.log(`[TRANSLATE] 관심사 "${interest}" 번역 중:`, { detectedLang, actualSourceLang, targetLang })
              
              const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: interest,
                  targetLang: targetLang,
                  sourceLang: actualSourceLang
                }),
              })

              if (response.ok) {
                const data = await response.json()
                if (data.success && data.translatedText) {
                  // 번역된 텍스트가 이상한 에러 메시지인지 확인
                  const translatedText = data.translatedText.trim()
                  if (translatedText && 
                      !translatedText.includes('PLEASE SELECT') && 
                      !translatedText.includes('ERROR') &&
                      translatedText.length < 100) { // 너무 긴 텍스트는 에러일 가능성
                    interestTranslations.push(translatedText)
                    console.log(`[TRANSLATE] 관심사 "${interest}" 번역 성공:`, translatedText)
                  } else {
                    interestTranslations.push(interest) // 번역 실패 시 원문 사용
                    console.warn(`[TRANSLATE] 관심사 "${interest}" 번역 결과 이상, 원문 사용:`, translatedText)
                  }
                } else {
                  interestTranslations.push(interest) // 번역 실패 시 원문 사용
                  console.warn(`[TRANSLATE] 관심사 "${interest}" 번역 실패, 원문 사용:`, data.error)
                }
              } else {
                interestTranslations.push(interest) // 번역 실패 시 원문 사용
                const errorData = await response.json().catch(() => ({}))
                console.warn(`[TRANSLATE] 관심사 "${interest}" API 오류, 원문 사용:`, response.status, errorData)
              }
            } catch (error) {
              console.error(`[TRANSLATE] 관심사 "${interest}" 번역 예외:`, error)
              interestTranslations.push(interest) // 번역 실패 시 원문 사용
            }
          }
          // 번역된 관심사가 있으면 저장 (모든 관심사를 처리했는지 확인)
          if (interestTranslations.length === profile.interests.length) {
            translatedInterests = interestTranslations
            console.log('[TRANSLATE] 관심사 번역 완료:', translatedInterests)
          } else {
            console.warn(`[TRANSLATE] 관심사 번역 불완전: ${interestTranslations.length}/${profile.interests.length}`)
            // 일부만 번역된 경우에도 저장 (나머지는 원문 사용)
            if (interestTranslations.length > 0) {
              translatedInterests = interestTranslations
            }
          }
        } catch (error) {
          console.error('[TRANSLATE] 관심사 번역 오류:', error)
        }
      }

      console.log('[TRANSLATE] 번역할 필드:', fieldsToTranslate.map(f => f.key))

      if (fieldsToTranslate.length === 0) {
        console.warn('[TRANSLATE] 번역할 필드가 없습니다.')
        toast.info(language === 'ko' ? '번역할 내용이 없습니다.' : 'No hay contenido para traducir.')
        setTranslating(false)
        return
      }

      const translatedFieldsData: any = {}
      let successCount = 0
      let failCount = 0
      
      for (const field of fieldsToTranslate) {
        try {
          // 각 필드의 실제 언어를 감지
          const detectedLang = detectLanguage(field.value || '')
          // 감지된 언어가 sourceLang과 다르면 감지된 언어를 사용
          const actualSourceLang = detectedLang !== sourceLang ? detectedLang : sourceLang
          
          console.log(`[TRANSLATE] ${field.key} 번역 중:`, {
            text: field.value?.substring(0, 50),
            detectedLang,
            originalSourceLang: sourceLang,
            actualSourceLang,
            targetLang
          })
          
          // sourceLang을 명시하지 않으면 API가 자동 감지하도록 함
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: field.value,
              targetLang: targetLang,
              sourceLang: actualSourceLang // 감지된 언어 사용 (API가 자동 감지할 수도 있음)
            }),
          })

          console.log(`[TRANSLATE] ${field.key} API 응답:`, response.status, response.statusText)

          if (response.ok) {
            const data = await response.json()
            console.log(`[TRANSLATE] ${field.key} 번역 결과:`, data.success ? '성공' : '실패', data.translatedText?.substring(0, 50))
            
            if (data.success && data.translatedText) {
              translatedFieldsData[field.key] = data.translatedText
              successCount++
            } else {
              console.error(`[TRANSLATE] ${field.key} 번역 실패:`, data.error || '알 수 없는 오류')
              failCount++
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error(`[TRANSLATE] ${field.key} API 오류:`, response.status, errorData)
            failCount++
          }
        } catch (error) {
          console.error(`[TRANSLATE] ${field.key} 번역 예외:`, error)
          failCount++
        }
      }

      // 관심사 번역 결과 추가
      if (translatedInterests && translatedInterests.length > 0) {
        translatedFieldsData.interests = translatedInterests
        // 번역이 실제로 이루어진 관심사 개수 계산 (원문과 다른 것만)
        const actuallyTranslatedCount = translatedInterests.filter((translated, index) => {
          const original = profile.interests?.[index]
          return original && translated !== original
        }).length
        if (actuallyTranslatedCount > 0) {
          successCount += actuallyTranslatedCount
          console.log('[TRANSLATE] 관심사 번역 결과:', { 
            total: translatedInterests.length, 
            actuallyTranslated: actuallyTranslatedCount 
          })
        }
      }

      const totalFields = fieldsToTranslate.length + (profile.interests?.length || 0)
      console.log('[TRANSLATE] 번역 완료:', { successCount, failCount, total: totalFields })

      if (successCount > 0) {
        setTranslatedFields(translatedFieldsData)
        setTranslationMode(sourceLang === 'ko' ? 'ko-to-es' : 'es-to-ko')
        const successMessage = language === 'ko' 
          ? `번역이 완료되었습니다. (${successCount}/${totalFields})`
          : `Traducción completada. (${successCount}/${totalFields})`
        toast.success(successMessage)
      } else {
        const errorMessage = language === 'ko'
          ? '번역에 실패했습니다. 잠시 후 다시 시도해주세요.'
          : 'La traducción falló. Por favor, inténtalo de nuevo más tarde.'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('[TRANSLATE] 번역 오류:', error)
      const errorMessage = language === 'ko'
        ? '번역 중 오류가 발생했습니다.'
        : 'Ocurrió un error durante la traducción.'
      toast.error(errorMessage)
    } finally {
      setTranslating(false)
    }
  }

  const handleShowOriginal = () => {
    setTranslationMode('none')
    setTranslatedFields({}) // 번역된 필드 초기화 (관심사 포함)
  }

  const formatDate = (dateString: string) => {
    const locale = language === 'ko' ? 'ko-KR' : 'es-ES'
    return new Date(dateString).toLocaleDateString(locale, {
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
            }}>{t('auth.userProfile.title') || (language === 'ko' ? '사용자 프로필' : 'Perfil de Usuario')}</DialogTitle>
            
            {/* 번역 드롭다운 */}
            {profile && !loading && (
              <div className="flex items-center">
                {translationMode === 'none' ? (
                  <Select 
                    onValueChange={(value) => {
                      if (value === 'ko-to-es') {
                        handleTranslateToSpanish()
                      } else if (value === 'es-to-ko') {
                        handleTranslateToKorean()
                      }
                    }}
                    disabled={translating}
                  >
                    <SelectTrigger className="w-40 text-xs" disabled={translating}>
                      <div className="flex items-center gap-1">
                        {translating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Languages className="w-3 h-3" />
                        )}
                        <SelectValue placeholder={translating 
                          ? (language === 'ko' ? '번역 중...' : 'Traduciendo...')
                          : (language === 'ko' ? '번역 선택' : 'Traducción')
                        } />
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
                    disabled={translating}
                  >
                    {translating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Languages className="w-3 h-3" />
                    )}
                    {translating 
                      ? (language === 'ko' ? '번역 중...' : 'Traduciendo...')
                      : (language === 'ko' ? '원본 보기' : 'Ver Original')
                    }
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
                {/* 배지 */}
                <UserBadge totalPoints={profile.total_points || 0} isVip={profile.is_vip || false} />
              </h2>
              {/* 닉네임 표시 - nickname이 full_name과 다르고 의미 있는 값일 때만 표시 */}
              {(() => {
                // nickname이 full_name과 다르고, 자동 생성된 값이 아닐 때만 표시
                const displayNickname = profile.nickname && 
                  profile.nickname !== profile.full_name &&
                  !profile.nickname.match(/^user[a-z0-9]+$/i) && // userc017214c 같은 자동 생성 값 제외
                  profile.nickname.trim() !== ''
                
                return displayNickname ? (
                  <p className="text-sm md:text-base text-gray-600 mb-2" style={{ 
                    color: 'rgb(75 85 99) !important'
                  }}>
                    @{profile.nickname}
                    <UserBadge totalPoints={profile.total_points || 0} isVip={profile.is_vip || false} small />
                  </p>
                ) : null
              })()}
              
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
                  {formatDate(profile.join_date || profile.created_at)} {t('auth.userProfile.joinedOn')}
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
                  {profile.is_korean 
                    ? `🇰🇷 ${t('profileModal.koreanNationality')}` 
                    : `🌍 ${t('profileModal.nonKorean')}`}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {profile.user_type === 'student' 
                    ? `🎓 ${t('profileModal.student')}` 
                    : `💼 ${t('profileModal.professional') || t('profileModal.general') || (language === 'ko' ? '직장인' : 'Profesional')}`}
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
                    {t('profileModal.jobInfo')}
                  </>
                )}
              </h3>
              
              {/* 공개 설정 확인 */}
                {profile.user_type === 'student' ? (
                profile.academic_info_public ? (
                  <div className="space-y-1 md:space-y-2">
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
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Lock className="w-4 h-4" />
                    <span>{language === 'ko' ? '이 정보는 비공개로 설정되어 있습니다.' : 'Esta información está configurada como privada.'}</span>
                  </div>
                )
              ) : (
                profile.job_info_public ? (
                  <div className="space-y-1 md:space-y-2">
                    {profile.occupation && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('profileModal.occupation')}:</span>
                        <span className="font-medium">{getFieldValue('occupation', profile.occupation)}</span>
                      </div>
                    )}
                    {profile.company && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('profileModal.company')}:</span>
                        <span className="font-medium">{getFieldValue('company', profile.company)}</span>
                      </div>
                    )}
                    {profile.work_experience && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('profileModal.career')}:</span>
                        <span className="font-medium">{getFieldValue('work_experience', profile.work_experience)}</span>
                      </div>
                )}
              </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Lock className="w-4 h-4" />
                    <span>{language === 'ko' ? '이 정보는 비공개로 설정되어 있습니다.' : 'Esta información está configurada como privada.'}</span>
                  </div>
                )
              )}
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
                
                <InterestBadges 
                  interests={translationMode !== 'none' && translatedFields.interests ? translatedFields.interests : profile.interests} 
                  skipTranslation={translationMode !== 'none' && !!translatedFields.interests} 
                />
              </Card>
            )}

            {/* 신고하기 버튼 */}
            {profile && (
              <div className="mt-8 flex justify-end">
                {!user ? (
                  <p className="text-sm text-gray-600">
                    {language === 'ko'
                      ? '신고 기능을 사용하려면 먼저 로그인해주세요.'
                      : 'Inicia sesión para poder enviar una denuncia.'}
                  </p>
                ) : user.id !== profile.id ? (
                  <Button
                    onClick={() => setShowReportModal(true)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {language === 'ko' ? '이 사용자 신고하기' : 'Denunciar a este usuario'}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {/* 신고 모달 */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">
              {language === 'ko' ? '이 사용자 신고하기' : 'Denunciar a este usuario'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko'
                ? '부적절한 행동이나 콘텐츠를 신고해주세요.'
                : 'Reporta comportamientos o contenido inapropiado.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {language === 'ko' ? '신고 사유' : 'Motivo de la denuncia'}
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'ko' ? '사유를 선택하세요' : 'Selecciona un motivo'} />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((reason) => (
                    <SelectItem key={reason.key} value={reason.key}>
                      {language === 'ko' ? reason.ko : reason.es}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {language === 'ko'
                  ? '상세 설명 (선택)'
                  : 'Descripción detallada (opcional)'}
              </label>
              <Textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                rows={4}
                maxLength={500}
                className="text-sm"
                placeholder={
                  language === 'ko'
                    ? '문제가 발생한 상황이나 참고할 내용을 적어주세요.'
                    : 'Describe qué sucedió o agrega información adicional.'}
                disabled={reportSubmitting}
              />
              <p className="text-xs text-gray-400 mt-1">{reportDetails.length}/500</p>
            </div>

            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}

            {reportSuccess && (
              <p className="text-xs text-green-600">
                {language === 'ko'
                  ? '신고가 접수되었습니다. 운영자가 검토 후 조치하겠습니다.'
                  : 'Tu denuncia ha sido registrada. El equipo la revisará.'}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason('')
                  setReportDetails('')
                  setError(null)
                  setReportSuccess(false)
                }}
                disabled={reportSubmitting}
              >
                {language === 'ko' ? '취소' : 'Cancelar'}
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={reportSubmitting || !reportReason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {reportSubmitting
                  ? language === 'ko'
                    ? '전송 중...'
                    : 'Enviando...'
                  : language === 'ko'
                  ? '신고 제출'
                  : 'Enviar denuncia'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
