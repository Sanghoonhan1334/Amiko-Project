'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

import { Search, Video, Clock, Star, Zap, Users, Globe, MapPin, Heart } from 'lucide-react'
import VerificationGuard from '@/components/common/VerificationGuard'
import { useLanguage } from '@/context/LanguageContext'

// 목업 데이터 - 한국인 친구
const mockKoreanMentors = [
  {
    id: 1,
    name: '김민지',
    university: '서울대학교',
    major: '한국어교육학과',
    interests: ['한국어', '한국문화', '요리', '여행'],
    activityScore: 4.8,
    availableTags: ['온라인', '오프라인'],
    online: false,
    experience: '3년',
    languages: ['한국어', '영어'],
    profileImage: '👩‍🏫',
    profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80'
  },
  {
    id: 2,
    name: '박준호',
    university: '연세대학교',
    major: '한국문화학과',
    interests: ['한국역사', '전통문화', '음악', '영화'],
    activityScore: 4.9,
    availableTags: ['온라인', '오프라인'],
    online: true,
    experience: '5년',
    languages: ['한국어', '스페인어', '영어'],
    profileImage: '👨‍🎓',
    profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80'
  },
  {
    id: 3,
    name: '이수진',
    university: '고려대학교',
    major: '한국어문학과',
    interests: ['한국문학', '시', '소설', '드라마'],
    activityScore: 4.7,
    availableTags: ['온라인', '오프라인'],
    online: false,
    experience: '2년',
    languages: ['한국어', '일본어'],
    profileImage: '👩‍🎨',
    profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80'
  },
  {
    id: 4,
    name: '최동현',
    university: '성균관대학교',
    major: '경영학과',
    interests: ['한국경제', '비즈니스', 'K-팝', '패션'],
    activityScore: 4.6,
    availableTags: ['온라인', '오프라인'],
    online: false,
    experience: '4년',
    languages: ['한국어', '영어', '중국어'],
    profileImage: '👩‍💼',
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80'
  }
]

export default function MeetTab() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState('')
  const [sortBy, setSortBy] = useState('activityScore')


  // Mock user profile for testing verification guard
  const mockUserProfile = {
    id: 'user-1',
    kakao_linked_at: null,
    wa_verified_at: null,
    sms_verified_at: null,
    email_verified_at: null,
    is_korean: false,
    country: 'BR'
  }

  // Mock verified user profile for testing success state
  const mockVerifiedUserProfile = {
    id: 'user-2',
    kakao_linked_at: null,
    wa_verified_at: '2024-01-15T10:00:00Z',
    sms_verified_at: null,
    email_verified_at: null,
    is_korean: false,
    country: 'BR'
  }

  // Toggle between verified and unverified for testing
  const [useVerifiedProfile, setUseVerifiedProfile] = useState(false)
  const currentProfile = useVerifiedProfile ? mockVerifiedUserProfile : mockUserProfile

  // 빠른 매칭 (랜덤 pick)
  const handleQuickMatching = () => {
    if (mockKoreanMentors.length === 0) {
      alert('현재 친구가 없습니다.')
      return
    }
    
    const randomMentor = mockKoreanMentors[Math.floor(Math.random() * mockKoreanMentors.length)]
    alert(`🎯 빠른 매칭 성공!\n\n친구: ${randomMentor.name}\n전공: ${randomMentor.major}\n활동점수: ${randomMentor.activityScore}`)
  }

        // 필터링된 친구 목록
  const filteredMentors = mockKoreanMentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.interests.some(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  // 정렬
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    switch (sortBy) {
      case 'activityScore':
        return b.activityScore - a.activityScore
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  return (
    <div className="space-y-6 p-6">
      {/* 인증 가드 - 영상 매칭 기능 */}
      <VerificationGuard 
        profile={currentProfile} 
        requiredFeature="video_matching"
        className="mb-6"
      />



      {/* 상단 컨트롤 */}
      <div className="space-y-4">
        {/* 검색 및 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="relative md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('meetTab.searchFriends')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          

          
          {/* 정렬 기준 */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full min-w-32">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="activityScore">{t('meetTab.byActivityScore')}</SelectItem>
              <SelectItem value="name">{t('meetTab.byName')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* 테스트용 인증 상태 토글 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVerifiedProfile(!useVerifiedProfile)}
            className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50 whitespace-nowrap w-full"
          >
            {useVerifiedProfile ? '🔒 인증됨' : `❌ ${t('meetTab.unverified')}`} (테스트)
          </Button>
          
          {/* 15분 쿠폰 셀렉터 */}
          <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
            <SelectTrigger className="w-full min-w-48">
              <SelectValue placeholder={t('meetTab.selectCoupon')} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="free">🎁 {t('meetTab.freeCoupon')}</SelectItem>
              <SelectItem value="bundle1">💎 {t('meetTab.bundleCoupon2')}</SelectItem>
              <SelectItem value="bundle3">💎 {t('meetTab.bundleCoupon3')}</SelectItem>
            </SelectContent>
          </Select>

          {/* 빠른 매칭 버튼 */}
          <Button 
            className="bg-brand-500 hover:bg-brand-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap w-full"
            onClick={handleQuickMatching}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t('meetTab.quickMatch')}
          </Button>
        </div>
      </div>

              {/* 친구 카드 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedMentors.map((mentor) => (
                          <Card key={mentor.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-brand-200 !opacity-100 !transform-none">
            {/* 친구 정보 */}
            <div className="text-center mb-2">
              <div className="relative inline-block mb-2">
                <div className="text-5xl relative">
                  {/* 향후 실제 프로필 이미지로 교체 가능 */}
                  {mentor.profileImageUrl ? (
                    <img 
                      src={mentor.profileImageUrl} 
                      alt={`${mentor.name}의 프로필`}
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg relative z-10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-100 to-mint-100 flex items-center justify-center text-3xl border-2 border-gray-200 relative z-10">
                      {mentor.profileImage}
                    </div>
                  )}
                  {/* 온라인/오프라인 상태 표시 */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg z-20 ${
                    mentor.online 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`} />
                </div>
                {/* 온라인/오프라인 상태 테두리 효과 */}
                {mentor.online ? (
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-[length:400%_400%] animate-[rainbow-border_2s_ease-in-out_infinite] opacity-75 z-0" />
                ) : (
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 opacity-50 z-0" />
                )}
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-1">{mentor.name}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span className="text-sm text-gray-600">{mentor.university}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{mentor.major}</p>
              
              {/* 언어 및 경험 */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-brand-500" />
                <span className="text-xs text-gray-600">{mentor.languages.join(', ')}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">{mentor.experience} 경험</span>
              </div>
            </div>

            {/* 관심사 */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {mentor.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-brand-200 text-brand-700">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="mb-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">활동점수</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-700">{mentor.activityScore}</span>
                </div>
              </div>
            </div>

            {/* 온라인/오프라인 배지 */}
            <div className="flex gap-2 mb-1 justify-center">
              {mentor.online ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <Globe className="w-3 h-3 mr-1" />
                  {t('meetTab.online')}
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  <MapPin className="w-3 h-3 mr-1" />
                  {t('meetTab.offline')}
                </Badge>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <Button className="w-full bg-brand-500 hover:bg-brand-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Video className="w-4 h-4 mr-2" />
                {t('meetTab.bookConsultation')}
              </Button>
              <Button variant="outline" className="w-full border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400">
                {t('meetTab.viewProfile')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 결과 없음 */}
      {sortedMentors.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-600 mb-4">
            검색어나 필터 조건을 조정해보세요
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('')
            }}
          >
            필터 초기화
          </Button>
        </Card>
      )}

      {/* 추가 정보 */}
      <div className="mt-8 p-6 bg-gradient-to-r from-brand-50 to-mint-50 rounded-3xl border border-brand-200/50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎯 {t('meetTab.customizedMatching')}
          </h3>
                  <p className="text-gray-600 mb-4">
          {t('meetTab.customizedDescription')}
        </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-500" />
              {t('meetTab.videoSupport')}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-mint-500" />
              {t('meetTab.verifiedFriends')}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              {t('meetTab.flexibleTime')}
            </span>
          </div>
        </div>
      </div>

      {/* 추후 연동 포인트 주석 */}
      {/* 
      TODO: Google Meet 링크 생성/공유 자리(초기)
      TODO: 통역 ON: STT→번역→TTS/자막 오버레이 자리
      TODO: 통역 OFF: 포인트 보너스 규칙
      */}
    </div>
  )
}
