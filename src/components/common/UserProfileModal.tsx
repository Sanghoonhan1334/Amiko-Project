'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/context/LanguageContext'
import { InterestBadges } from './TranslatedInterests'
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
  X
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
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
  user_type?: 'student' | 'professional'
  is_korean?: boolean
  created_at: string
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const { t } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 프로필 데이터 가져오기
  const fetchUserProfile = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
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
    }
  }, [isOpen])

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">사용자 프로필</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">프로필을 불러오는 중...</span>
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
          <div className="space-y-6">
            {/* 프로필 헤더 */}
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile.profile_image} alt={profile.full_name} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profile.full_name}
              </h2>
              
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(profile.created_at)} 가입
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
              </div>

              {/* 사용자 타입 배지 */}
              <div className="flex justify-center gap-2 mb-4">
                <Badge variant={profile.is_korean ? "default" : "secondary"}>
                  {profile.is_korean ? "🇰🇷 한국인" : "🌍 외국인"}
                </Badge>
                <Badge variant="outline">
                  {profile.user_type === 'student' ? "🎓 학생" : "💼 직장인"}
                </Badge>
              </div>
            </div>

            {/* 자기소개 */}
            {profile.bio && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  자기소개
                </h3>
                <p className="text-gray-700">{profile.bio}</p>
              </Card>
            )}

            {/* 학업/직업 정보 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                {profile.user_type === 'student' ? (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    학업 정보
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    직업 정보
                  </>
                )}
              </h3>
              
              <div className="space-y-2">
                {profile.user_type === 'student' ? (
                  <>
                    {profile.university && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">대학교:</span>
                        <span className="font-medium">{profile.university}</span>
                      </div>
                    )}
                    {profile.major && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">전공:</span>
                        <span className="font-medium">{profile.major}</span>
                      </div>
                    )}
                    {profile.grade && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">학년:</span>
                        <span className="font-medium">{profile.grade}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {profile.occupation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">직업:</span>
                        <span className="font-medium">{profile.occupation}</span>
                      </div>
                    )}
                    {profile.company && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">회사:</span>
                        <span className="font-medium">{profile.company}</span>
                      </div>
                    )}
                    {profile.work_experience && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">경력:</span>
                        <span className="font-medium">{profile.work_experience}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* 언어 수준 */}
            {profile.language_levels && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  언어 수준
                </h3>
                
                <div className="space-y-2">
                  {profile.language_levels.korean && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">한국어:</span>
                      <Badge variant="outline">{profile.language_levels.korean}</Badge>
                    </div>
                  )}
                  {profile.language_levels.english && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">영어:</span>
                      <Badge variant="outline">{profile.language_levels.english}</Badge>
                    </div>
                  )}
                  {profile.language_levels.spanish && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">스페인어:</span>
                      <Badge variant="outline">{profile.language_levels.spanish}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 관심 분야 */}
            {profile.interests && profile.interests.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {t('profile.interests')}
                </h3>
                
                <InterestBadges interests={profile.interests} />
              </Card>
            )}

            {/* 연락처 정보 (비공개) */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                연락처 정보
              </h3>
              <p className="text-sm text-gray-500">
                연락처 정보는 개인정보 보호를 위해 비공개됩니다.
              </p>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
