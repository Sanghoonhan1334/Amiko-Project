'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Search, Filter, Video, Clock, Star, Zap, Users, Globe, MapPin, Heart, Award, Info } from 'lucide-react'
import VerificationGuard from '@/components/common/VerificationGuard'

// 목업 데이터 - 한국인 친구
const mockKoreanMentors = [
  {
    id: 1,
    name: '김민지',
    university: '서울대학교',
    major: '한국어교육학과',
    interests: ['한국어', '한국문화', '요리', '여행'],
    activityScore: 4.8,
    availableTags: ['평일저녁', '주말오후', '초급', '중급'],
    translation: false,
    experience: '3년',
    languages: ['한국어', '영어'],
    profileImage: '👩‍🏫'
  },
  {
    id: 2,
    name: '박준호',
    university: '연세대학교',
    major: '한국문화학과',
    interests: ['한국역사', '전통문화', '음악', '영화'],
    activityScore: 4.9,
    availableTags: ['주말오후', '평일저녁', '중급', '고급'],
    translation: true,
    experience: '5년',
    languages: ['한국어', '스페인어', '영어'],
    profileImage: '👨‍🎓'
  },
  {
    id: 3,
    name: '이수진',
    university: '고려대학교',
    major: '한국어문학과',
    interests: ['한국문학', '시', '소설', '드라마'],
    activityScore: 4.7,
    availableTags: ['평일저녁', '주말오전', '초급', '중급'],
    translation: false,
    experience: '2년',
    languages: ['한국어', '일본어'],
    profileImage: '👩‍🎨'
  },
  {
    id: 4,
    name: '최동현',
    university: '성균관대학교',
    major: '경영학과',
    interests: ['한국경제', '비즈니스', 'K-팝', '패션'],
    activityScore: 4.6,
    availableTags: ['평일오후', '주말저녁', '중급', '고급'],
    translation: true,
    experience: '4년',
    languages: ['한국어', '영어', '중국어'],
    profileImage: '👨‍💼'
  }
]

export default function MeetTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState('')
  const [sortBy, setSortBy] = useState('activityScore')
  const [timeFilter, setTimeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [showTranslationInfo, setShowTranslationInfo] = useState(false)

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
    const availableMentors = mockKoreanMentors.filter(mentor => 
      mentor.availableTags.some(tag => 
        (timeFilter === 'all' || mentor.availableTags.includes(timeFilter)) &&
        (levelFilter === 'all' || mentor.availableTags.includes(levelFilter))
      )
    )
    
    if (availableMentors.length === 0) {
              alert('현재 조건에 맞는 친구가 없습니다. 필터를 조정해보세요.')
      return
    }
    
    const randomMentor = availableMentors[Math.floor(Math.random() * availableMentors.length)]
            alert(`🎯 빠른 매칭 성공!\n\n친구: ${randomMentor.name}\n전공: ${randomMentor.major}\n활동점수: ${randomMentor.activityScore}`)
  }

        // 필터링된 친구 목록
  const filteredMentors = mockKoreanMentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.interests.some(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTime = timeFilter === 'all' || mentor.availableTags.includes(timeFilter)
    const matchesLevel = levelFilter === 'all' || mentor.availableTags.includes(levelFilter)
    
    return matchesSearch && matchesTime && matchesLevel
  })

  // 정렬
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    switch (sortBy) {
      case 'activityScore':
        return b.activityScore - a.activityScore
      case 'experience':
        return parseInt(b.experience) - parseInt(a.experience)
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

      {/* 통역 모드 안내 토글 (한국인에게만 보이는 UI) */}
      <Card className="p-4 bg-gradient-to-r from-brand-50 to-mint-50 border-2 border-brand-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
              <Info className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">통역 모드 안내</h4>
              <p className="text-sm text-gray-600">한국인 친구에게만 표시되는 설정</p>
            </div>
          </div>
          <Switch
            checked={showTranslationInfo}
            onCheckedChange={setShowTranslationInfo}
          />
        </div>
        
        {showTranslationInfo && (
          <div className="mt-3 p-3 bg-white/80 rounded-xl border border-brand-200">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-300">통역 ON</Badge>
                <span>STT → 번역 → TTS / 자막 오버레이</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-brand-100 text-brand-700 border-brand-300">통역 OFF</Badge>
                <span>+보너스 포인트 (한국어 학습 효과 증대)</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 상단 컨트롤 */}
      <div className="space-y-4">
        {/* 검색 및 필터 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="친구 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* 시간대 필터 */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="시간대" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="평일오후">평일오후</SelectItem>
              <SelectItem value="평일저녁">평일저녁</SelectItem>
              <SelectItem value="주말오전">주말오전</SelectItem>
              <SelectItem value="주말오후">주말오후</SelectItem>
              <SelectItem value="주말저녁">주말저녁</SelectItem>
            </SelectContent>
          </Select>
          
          {/* 레벨 필터 */}
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="레벨" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="초급">초급</SelectItem>
              <SelectItem value="중급">중급</SelectItem>
              <SelectItem value="고급">고급</SelectItem>
            </SelectContent>
          </Select>
          
          {/* 정렬 기준 */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activityScore">활동점수순</SelectItem>
              <SelectItem value="experience">경험순</SelectItem>
              <SelectItem value="name">이름순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 테스트용 인증 상태 토글 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVerifiedProfile(!useVerifiedProfile)}
            className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            {useVerifiedProfile ? '🔒 인증됨' : '❌ 미인증'} (테스트)
          </Button>
          
          {/* 15분 쿠폰 셀렉터 */}
          <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="15분 쿠폰 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">🎁 신규 무료 쿠폰 (1장)</SelectItem>
              <SelectItem value="bundle1">💎 15분 쿠폰 2장 묶음 (₩12,000)</SelectItem>
              <SelectItem value="bundle2">💎 15분 쿠폰 3장 묶음 (₩16,000)</SelectItem>
              <SelectItem value="earned">🏆 포인트 적립 쿠폰</SelectItem>
            </SelectContent>
          </Select>

          {/* 빠른 매칭 버튼 */}
          <Button 
            className="bg-brand-500 hover:bg-brand-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={handleQuickMatching}
          >
            <Zap className="w-4 h-4 mr-2" />
            빠른 매칭
          </Button>
        </div>
      </div>

              {/* 친구 카드 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedMentors.map((mentor) => (
          <Card key={mentor.id} className="p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-brand-200">
            {/* 친구 정보 */}
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">{mentor.profileImage}</div>
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
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">활동점수</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-700">{mentor.activityScore}</span>
                </div>
              </div>
              
              {/* 가능 시간 태그 */}
              <div className="flex flex-wrap gap-1">
                {mentor.availableTags.map((tag, index) => (
                  <Badge key={index} className="text-xs bg-mint-100 text-mint-700 border-mint-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 통역 배지 */}
            <div className="flex gap-2 mb-4 justify-center">
              {mentor.translation ? (
                <Badge className="bg-mint-100 text-mint-700 border-mint-300">
                  <Users className="w-3 h-3 mr-1" />
                  통역 ON
                </Badge>
              ) : (
                <Badge className="bg-brand-100 text-brand-700 border-brand-300">
                  <Award className="w-3 h-3 mr-1" />
                  통역 OFF 시 +보너스 포인트
                </Badge>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <Button className="w-full bg-brand-500 hover:bg-brand-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Video className="w-4 h-4 mr-2" />
                상담 예약
              </Button>
              <Button variant="outline" className="w-full border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400">
                프로필 보기
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
              setTimeFilter('all')
              setLevelFilter('all')
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
            🎯 맞춤형 친구 매칭
          </h3>
                  <p className="text-gray-600 mb-4">
          한국어 수준, 관심 분야, 선호 시간을 고려하여 최적의 친구와 만남을 추천해드립니다
        </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-500" />
              화상 상담 지원
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-mint-500" />
              검증된 한국인 친구
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              유연한 시간 조율
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
