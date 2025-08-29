'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Trophy, 
  Star, 
   
  Gift, 
   
   
  Bell, 
  Mail, 
  Clock, 
  MapPin, 
  Heart,
  TrendingUp,
  Zap,
  Crown,
  Target,
  Calendar,
  Settings,
  MessageSquare
} from 'lucide-react'
import VerificationGuard from '@/components/common/VerificationGuard'
import StorySettings from './StorySettings'
import { UserProfile, KoreanUserProfile, LatinUserProfile } from '@/types/user'

// 목업 데이터 - 현지인 사용자 프로필
const mockLatinUserProfile: LatinUserProfile = {
  id: 'user1',
  name: '마리아 곤잘레스',
  email: 'maria.gonzalez@email.com',
  avatar: '👩‍🎓',
  isKorean: false,
  country: 'MX',
  university: '서울대학교',
  major: '한국어교육학과',
  grade: '3학년',
  userType: 'student',
  introduction: '안녕하세요! 한국어를 공부하고 있는 마리아입니다. 한국 문화와 언어에 관심이 많아서 한국에 왔어요. 함께 한국어를 배워봐요! 😊',
  availableTime: ['평일저녁', '주말오후'],
  interests: ['한국어', '한국문화', '요리', '여행', '음악'],
  joinDate: '2023-09-01',
  level: '중급',
  exchangeCount: 12,
  points: 2847,
  storySettings: {
    autoPublic: true,
    showInProfile: true
  },
  coupons: [
    {
      id: '1',
      type: '15분 상담',
      quantity: 2,
      expiresAt: '2024-02-15',
      isUsed: false,
      price: '₩12,000'
    },
    {
      id: '2',
      type: '30분 상담',
      quantity: 1,
      expiresAt: '2024-02-20',
      isUsed: false,
      price: '₩20,000'
    }
  ],
  purchaseHistory: [
    {
      id: '1',
      item: '15분 상담 쿠폰 2장',
      amount: 12000,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '2',
      item: '30분 상담 쿠폰 1장',
      amount: 20000,
      date: '2024-01-20',
      status: 'completed'
    }
  ]
}

// 목업 데이터 - 한국인 사용자 프로필
const mockKoreanUserProfile: KoreanUserProfile = {
  id: 'user2',
  name: '김민지',
  email: 'kim.minji@email.com',
  avatar: '👩‍💼',
  isKorean: true,
  country: 'KR',
  university: '연세대학교',
  major: '국제학과',
  grade: '4학년',
  userType: 'student',
  introduction: '안녕하세요! 한국인 김민지입니다. 라틴 문화에 관심이 많아서 스페인어를 공부하고 있어요. 서로의 문화를 나누며 소통하고 싶어요! 😊',
  availableTime: ['평일오후', '주말전체'],
  interests: ['스페인어', '라틴문화', '여행', '음악', '요리'],
  joinDate: '2023-08-15',
  level: '고급',
  exchangeCount: 25,
  points: 4567,
  koreanRank: 8,
  totalKoreanUsers: 150,
  storySettings: {
    autoPublic: true,
    showInProfile: true
  }
}

  // Mock user profile for testing verification guard
  const mockUserProfileForGuard = {
    id: 'user-1',
    kakao_linked_at: null,
    wa_verified_at: null,
    sms_verified_at: null,
    email_verified_at: null,
    is_korean: false,
    country: 'BR'
  }

  // Mock verified user profile for testing success state
  const mockVerifiedUserProfileForGuard = {
    id: 'user-2',
    kakao_linked_at: null,
    wa_verified_at: '2024-01-15T10:00:00Z',
    sms_verified_at: null,
    email_verified_at: null,
    is_korean: false,
    country: 'BR'
  }



// 목업 데이터 - 포인트/등급
const mockUserStats = {
  points: 2847,
  level: '플래티넘',
  rank: 12,
  totalUsers: 1250,
  monthlyPoints: 156,
  streak: 23
}

// 목업 데이터 - 커뮤니티 활동 점수
const mockCommunityStats = {
  totalPoints: 1250,
  monthlyPoints: 89,
  questionsAsked: 15,
  answersGiven: 42,
  acceptedAnswers: 8,
  helpfulVotes: 156
}

// 목업 데이터 - 쿠폰/구매내역
const mockCoupons = [
  {
    id: 1,
    type: '15분 상담',
    quantity: 2,
    expiresAt: '2024-02-15',
    isUsed: false,
    price: '₩12,000'
  },
  {
    id: 2,
    type: '30분 상담',
    quantity: 1,
    expiresAt: '2024-01-30',
    isUsed: true,
    price: '₩15,000'
  },
  {
    id: 3,
    type: '무료 쿠폰',
    quantity: 1,
    expiresAt: '2024-01-20',
    isUsed: false,
    price: '무료'
  }
]

const mockPurchaseHistory = [
  {
    id: 1,
    item: '15분 상담 쿠폰 3장',
    date: '2024-01-10',
    amount: '₩16,000',
    status: '완료'
  },
  {
    id: 2,
    item: '30분 상담 쿠폰 1장',
    date: '2024-01-05',
    amount: '₩15,000',
    status: '완료'
  }
]



// 목업 데이터 - 알림 설정
const mockNotificationSettings = {
  webPush: true,
  email: false,
  sms: false,
  marketing: true
}

export default function MyTab() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<KoreanUserProfile | LatinUserProfile>(mockLatinUserProfile)
  const [notificationSettings, setNotificationSettings] = useState(mockNotificationSettings)
  const [useVerifiedProfile, setUseVerifiedProfile] = useState(false)
  
  // 현재 프로필 가드용 데이터
  const currentProfileForGuard = useVerifiedProfile ? mockVerifiedUserProfileForGuard : mockUserProfileForGuard
  
  // Toggle between Korean and Latin user for testing
  const [useKoreanProfile, setUseKoreanProfile] = useState(false)
  const currentUserProfile = useKoreanProfile ? mockKoreanUserProfile : mockLatinUserProfile
  
  // 프로필 편집 처리
  const handleSaveProfile = () => {
    // 여기서 실제 API 호출
    console.log('프로필 저장:', profile)
    setIsEditing(false)
    alert('프로필이 저장되었습니다!')
  }

  const handleCancelEdit = () => {
    setProfile(currentUserProfile)
    setIsEditing(false)
  }

  // 알림 설정 변경
  const handleNotificationChange = (key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 여기서 실제 API 호출
    console.log('알림 설정 변경:', key, value)
  }



  // 리더보드 순위 색상
  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
    if (rank <= 10) return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300'
    return 'bg-gradient-to-r from-brand-100 to-brand-200 text-brand-700 border-brand-300'
  }

  return (
    <div className="space-y-6 p-6">
      {/* 인증 가드 - 전체 서비스 이용 */}
      <VerificationGuard 
        profile={currentProfileForGuard} 
        requiredFeature="all"
        className="mb-6"
      />

      {/* 내 프로필 */}
      <Card className="bg-gradient-to-br from-brand-50 to-mint-50 border-2 border-brand-200/50 rounded-3xl p-6">
        <div className="flex items-start gap-8">
          {/* 프로필 정보 */}
          <div className="flex-1 space-y-6 px-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">내 프로필</h2>
              <div className="flex gap-2">
                {/* 테스트용 사용자 타입 토글 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseKoreanProfile(!useKoreanProfile)}
                  className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  {useKoreanProfile ? '🇰🇷 한국인' : '🌎 현지인'} (테스트)
                </Button>
                
                {/* 테스트용 인증 상태 토글 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseVerifiedProfile(!useVerifiedProfile)}
                  className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  {useVerifiedProfile ? '🔒 인증됨' : '❌ 미인증'} (테스트)
                </Button>
                
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleSaveProfile}
                      className="bg-brand-500 hover:bg-brand-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      저장
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      취소
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    편집
                  </Button>
                )}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">이름</label>
                {isEditing ? (
                  <Input
                    value={currentUserProfile.name}
                    onChange={(e) => setProfile({ ...currentUserProfile, name: e.target.value })}
                    className="border-brand-200 focus:border-brand-500"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{currentUserProfile.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">대학교</label>
                {isEditing ? (
                  <Input
                    value={currentUserProfile.university}
                    onChange={(e) => setProfile({ ...currentUserProfile, university: e.target.value })}
                    className="border-brand-200 focus:border-brand-500"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{currentUserProfile.university}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">전공</label>
                {isEditing ? (
                  <Input
                    value={currentUserProfile.major}
                    onChange={(e) => setProfile({ ...currentUserProfile, major: e.target.value })}
                    className="border-brand-200 focus:border-brand-500"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{currentUserProfile.major}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">학년</label>
                {isEditing ? (
                  <Select value={currentUserProfile.grade} onValueChange={(value) => setProfile({ ...currentUserProfile, grade: value })}>
                    <SelectTrigger className="border-brand-200 focus:border-brand-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1학년">1학년</SelectItem>
                      <SelectItem value="2학년">2학년</SelectItem>
                      <SelectItem value="3학년">3학년</SelectItem>
                      <SelectItem value="4학년">4학년</SelectItem>
                      <SelectItem value="대학원">대학원</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-800 font-medium">{currentUserProfile.grade}</p>
                )}
              </div>
            </div>

            {/* 소개 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block">자기소개</label>
              {isEditing ? (
                <Textarea
                  value={currentUserProfile.introduction}
                  onChange={(e) => setProfile({ ...currentUserProfile, introduction: e.target.value })}
                  rows={3}
                  className="border-brand-200 focus:border-brand-500"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{currentUserProfile.introduction}</p>
              )}
            </div>

            {/* 가능 시간 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block">가능 시간</label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {['평일오후', '평일저녁', '주말오전', '주말오후', '주말저녁'].map((time) => (
                    <Button
                      key={time}
                      variant={currentUserProfile.availableTime.includes(time) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newTimes = currentUserProfile.availableTime.includes(time)
                          ? currentUserProfile.availableTime.filter(t => t !== time)
                          : [...currentUserProfile.availableTime, time]
                        setProfile({ ...currentUserProfile, availableTime: newTimes })
                      }}
                      className={profile.availableTime.includes(time) 
                        ? 'bg-brand-500 hover:bg-brand-600' 
                        : 'border-brand-200 text-brand-700 hover:bg-brand-50'
                      }
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.availableTime.map((time) => (
                    <Badge key={time} className="bg-brand-100 text-brand-700 border-brand-300">
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 관심사 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block">관심사</label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {['한국어', '한국문화', '요리', '여행', '음악', '영화', '패션', '스포츠'].map((interest) => (
                    <Button
                      key={interest}
                      variant={profile.interests.includes(interest) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newInterests = profile.interests.includes(interest)
                          ? profile.interests.filter(i => i !== interest)
                          : [...profile.interests, interest]
                        setProfile({ ...profile, interests: newInterests })
                      }}
                      className={profile.interests.includes(interest) 
                        ? 'bg-mint-500 hover:bg-mint-600' 
                        : 'border-mint-200 text-mint-700 hover:bg-mint-50'
                      }
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentUserProfile.interests.map((interest) => (
                    <Badge key={interest} className="bg-mint-100 text-mint-700 border-mint-300">
                      <Heart className="w-3 h-3 mr-1" />
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 귀여운 아바타 원형 */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-gradient-to-br from-brand-100 to-mint-100 rounded-full flex items-center justify-center text-6xl shadow-lg border-4 border-white">
              {currentUserProfile.avatar}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">가입일: {currentUserProfile.joinDate}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 나의 포인트/등급/리더보드 랭크 미니 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 포인트 카드 */}
        <Card className="p-4 bg-gradient-to-r from-brand-50 to-brand-100 border-2 border-brand-200/50 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">내 포인트</h4>
              <p className="text-sm text-gray-600">이번 달 +{mockUserStats.monthlyPoints}점</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600 mb-2">{currentUserProfile.points.toLocaleString()}</div>
            <div className="text-sm text-gray-600">연속 {mockUserStats.streak}일</div>
          </div>
        </Card>

        {/* 교류 건수 카드 */}
        <Card className="p-4 bg-gradient-to-r from-mint-50 to-mint-100 border-2 border-mint-200/50 rounded-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-mint-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-mint-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">교류 건수</h4>
              <p className="text-sm text-gray-600">총 {currentUserProfile.exchangeCount}건 진행</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-mint-600 mb-2">{currentUserProfile.exchangeCount}건</div>
            <div className="text-sm text-gray-600">성공적인 교류</div>
          </div>
        </Card>

        {/* 한국인 전용: 한국인 순위 / 현지인 전용: 등급 */}
        {currentUserProfile.isKorean ? (
          <Card className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">한국인 순위</h4>
                <p className="text-sm text-gray-600">한국인 {currentUserProfile.totalKoreanUsers}명 중</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{currentUserProfile.koreanRank}위</div>
              <Badge className={`px-2 py-1 text-xs ${getRankColor(currentUserProfile.koreanRank)}`}>
                {currentUserProfile.koreanRank <= 3 ? '🏆 TOP 3' : currentUserProfile.koreanRank <= 10 ? '🥈 TOP 10' : '🥉 일반'}
              </Badge>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">커뮤니티 활동</h4>
                <p className="text-sm text-gray-600">질문/답변/채택</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{mockCommunityStats.totalPoints}점</div>
              <div className="text-sm text-gray-600">이번 달 +{mockCommunityStats.monthlyPoints}점</div>
            </div>
          </Card>
        )}
      </div>

      {/* 현지인 전용: 나의 쿠폰/구매내역 리스트 */}
      {!currentUserProfile.isKorean && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 쿠폰 리스트 */}
          <Card className="p-6 bg-gradient-to-r from-brand-50 to-brand-100 border-2 border-brand-200/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
                <Gift className="w-4 h-4 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-800">나의 쿠폰</h3>
            </div>
            
            <div className="space-y-3">
              {currentUserProfile.coupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-brand-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${coupon.isUsed ? 'bg-gray-300' : 'bg-brand-500'}`} />
                    <div>
                      <div className="font-medium text-gray-800">{coupon.type}</div>
                      <div className="text-sm text-gray-600">{coupon.quantity}장 • {coupon.price}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">만료일</div>
                    <div className="text-sm font-medium text-gray-700">{coupon.expiresAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 구매내역 리스트 */}
          <Card className="p-6 bg-gradient-to-r from-mint-50 to-mint-100 border-2 border-mint-200/50 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-mint-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-mint-600" />
              </div>
              <h3 className="font-semibold text-gray-800">구매내역</h3>
            </div>
            
            <div className="space-y-3">
              {currentUserProfile.purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-mint-200">
                  <div>
                    <div className="font-medium text-gray-800">{purchase.item}</div>
                    <div className="text-sm text-gray-600">{purchase.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">₩{purchase.amount.toLocaleString()}</div>
                    <Badge className={`mt-1 ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {purchase.status === 'completed' ? '완료' : 
                       purchase.status === 'pending' ? '진행중' : '취소됨'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}



      {/* 스토리 설정 */}
      <StorySettings />

      {/* 알림 설정 */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200/50 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
            <Settings className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">알림 설정</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-800">웹푸시 알림</div>
                <div className="text-sm text-gray-600">새로운 메시지, 업데이트 알림</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.webPush}
              onCheckedChange={(checked) => handleNotificationChange('webPush', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-800">이메일 알림</div>
                <div className="text-sm text-gray-600">주요 업데이트 및 이벤트 소식</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-800">마케팅 알림</div>
                <div className="text-sm text-gray-600">특별 혜택 및 이벤트 정보</div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.marketing}
              onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
            />
          </div>
        </div>
      </Card>

      {/* 추후 연동 포인트 주석 */}
      {/* 
      TODO: Supabase users 테이블과 연동
      TODO: 포인트 시스템 연동
      TODO: 쿠폰 시스템 연동
      TODO: 리워드 시스템 연동
      TODO: 알림 설정 저장/동기화
      */}
    </div>
  )
}
