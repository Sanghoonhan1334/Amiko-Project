'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Video, 
  Phone, 
  Users,
  Settings,
  Clock,
  User
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Agora 관련 컴포넌트를 동적 임포트로 처리 (SSR 방지)
const VideoCall = dynamic(() => import('./VideoCall'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">영상통화 로딩 중...</div>
})

interface VideoCallStarterProps {
  onStartCall?: (channelName: string) => void
}

export default function VideoCallStarter({ onStartCall }: VideoCallStarterProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showOnlyKoreans, setShowOnlyKoreans] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  const handleStartCall = () => {
    if (!channelName.trim()) {
      alert('채널명을 입력해주세요.')
      return
    }
    
    setIsCallActive(true)
    setShowStartDialog(false)
    onStartCall?.(channelName)
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setChannelName('')
  }

  // 목업 데이터 - 실제로는 API에서 가져올 데이터
  const allPartners = [
    { 
      id: '1', 
      name: '김민수', 
      country: '한국', 
      status: 'online', 
      language: '한국어', 
      interests: ['스페인어', '멕시코 문화'],
      bio: '멕시코 문화에 관심이 많은 대학생입니다. 스페인어를 배우고 싶어요!',
      age: 23,
      occupation: '대학생',
      level: '초급',
      joinDate: '2024-01-15',
      totalCalls: 12,
      rating: 4.8,
      avatar: '/profiles/kim-minsu.jpg'
    },
    { 
      id: '2', 
      name: '이지은', 
      country: '한국', 
      status: 'online', 
      language: '한국어', 
      interests: ['브라질 음악', '포르투갈어'],
      bio: '브라질 보사노바를 좋아하는 음악학과 학생입니다.',
      age: 21,
      occupation: '대학생',
      level: '중급',
      joinDate: '2024-02-03',
      totalCalls: 8,
      rating: 4.9,
      avatar: '/profiles/lee-jieun.jpg'
    },
    { 
      id: '3', 
      name: '박서준', 
      country: '한국', 
      status: 'offline', 
      language: '한국어', 
      interests: ['아르헨티나 축구', '탱고'],
      bio: '축구와 탱고를 사랑하는 직장인입니다.',
      age: 28,
      occupation: '회사원',
      level: '고급',
      joinDate: '2023-11-20',
      totalCalls: 25,
      rating: 4.7,
      avatar: '/profiles/park-seojun.jpg'
    },
    { 
      id: '4', 
      name: '최유나', 
      country: '한국', 
      status: 'online', 
      language: '한국어', 
      interests: ['콜롬비아 커피', '스페인어'],
      bio: '콜롬비아 커피를 좋아하는 바리스타입니다.',
      age: 25,
      occupation: '바리스타',
      level: '중급',
      joinDate: '2024-01-08',
      totalCalls: 15,
      rating: 4.6,
      avatar: '/profiles/choi-yuna.jpg'
    },
    { 
      id: '5', 
      name: '정현우', 
      country: '한국', 
      status: 'online', 
      language: '한국어', 
      interests: ['페루 요리', '안데스 문화'],
      bio: '페루 요리를 배우고 싶은 요리사입니다.',
      age: 30,
      occupation: '요리사',
      level: '고급',
      joinDate: '2023-12-10',
      totalCalls: 18,
      rating: 4.8,
      avatar: '/profiles/jung-hyunwoo.jpg'
    },
    { 
      id: '6', 
      name: '마리아 (멕시코)', 
      country: '멕시코', 
      status: 'online', 
      language: '스페인어', 
      interests: ['한국 드라마', 'K-pop'],
      bio: '한국 드라마를 좋아하는 멕시코 대학생입니다.',
      age: 22,
      occupation: '대학생',
      level: '초급',
      joinDate: '2024-02-15',
      totalCalls: 5,
      rating: 4.5,
      avatar: '/profiles/maria-mexico.jpg'
    },
    { 
      id: '7', 
      name: '카를로스 (브라질)', 
      country: '브라질', 
      status: 'online', 
      language: '포르투갈어', 
      interests: ['한국 요리', '태권도'],
      bio: '한국 요리와 태권도에 관심이 많은 브라질인입니다.',
      age: 26,
      occupation: '엔지니어',
      level: '중급',
      joinDate: '2024-01-20',
      totalCalls: 10,
      rating: 4.7,
      avatar: '/profiles/carlos-brazil.jpg'
    },
    { 
      id: '8', 
      name: '소피아 (아르헨티나)', 
      country: '아르헨티나', 
      status: 'offline', 
      language: '스페인어', 
      interests: ['한국 문화', '여행'],
      bio: '한국 문화를 사랑하는 아르헨티나 여행가입니다.',
      age: 24,
      occupation: '여행가',
      level: '중급',
      joinDate: '2024-01-05',
      totalCalls: 7,
      rating: 4.6,
      avatar: '/profiles/sofia-argentina.jpg'
    },
  ]

  // 필터링된 파트너 목록
  const availablePartners = showOnlyKoreans 
    ? allPartners.filter(partner => partner.country === '한국')
    : allPartners

  return (
    <>
      {/* 영상통화 화면 */}
      {isCallActive && (
        <VideoCall 
          channelName={channelName} 
          onEndCall={handleEndCall} 
        />
      )}

      {/* 메인 화면 */}
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6 shadow-lg">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            영상소통
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            한국과 남미를 잇는 실시간 영상통화
            <br />
            <span className="text-blue-600 font-medium">언어 교환 파트너</span>와 함께 한국어와 스페인어를 배워보세요!
          </p>
        </div>

        {/* 빠른 시작 */}
        <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">빠른 시작</h3>
              <p className="text-gray-600">언어 교환 파트너와 바로 연결하세요</p>
            </div>
            <Button 
              onClick={() => setShowStartDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Phone className="w-5 h-5 mr-2" />
              통화 시작
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">1:1 영상통화</h4>
              <p className="text-sm text-gray-600">개인 맞춤 대화</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">언어 교환</h4>
              <p className="text-sm text-gray-600">한국어 ↔ 스페인어</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">15분 세션</h4>
              <p className="text-sm text-gray-600">효율적인 학습</p>
            </div>
          </div>
        </Card>

        {/* 대화 상대 목록 */}
        <Card className="p-8 bg-gradient-to-br from-white to-purple-50 border border-purple-100 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">대화 상대</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">한국인만 보기</span>
              <button
                onClick={() => setShowOnlyKoreans(!showOnlyKoreans)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnlyKoreans ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnlyKoreans ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {availablePartners.map((partner) => (
              <div 
                key={partner.id}
                className="flex items-center justify-between p-6 bg-white border border-purple-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                      <AvatarImage 
                        src={partner.avatar} 
                        alt={partner.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium">
                        {partner.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      partner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{partner.name}</h4>
                    <p className="text-sm text-purple-600 font-medium">{partner.language}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      관심사: {partner.interests.join(', ')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 italic">
                      "{partner.bio}"
                    </p>
                    {!showOnlyKoreans && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {partner.country}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPartner(partner)
                      setShowProfileDialog(true)
                    }}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    정보보기
                  </Button>
                  <Button 
                    variant={partner.status === 'online' ? 'default' : 'outline'}
                    size="sm"
                    disabled={partner.status === 'offline'}
                    className={partner.status === 'online' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white' 
                      : ''
                    }
                  >
                    {partner.status === 'online' ? '대화 시작' : '오프라인'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 통계 */}
        <Card className="p-8 bg-gradient-to-br from-white to-green-50 border border-green-100 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">나의 통화 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white rounded-xl border border-green-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">12</div>
              <div className="text-sm text-gray-600 font-medium">총 통화 횟수</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2">180</div>
              <div className="text-sm text-gray-600 font-medium">총 통화 시간(분)</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">5</div>
              <div className="text-sm text-gray-600 font-medium">대화 상대 수</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-100 shadow-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">360</div>
              <div className="text-sm text-gray-600 font-medium">획득 포인트</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 통화 시작 다이얼로그 */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-blue-50 border border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              영상통화 시작
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">채널명</label>
              <Input
                placeholder="예: korea-mexico-001"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                💡 채널명을 상대방과 공유하여 같은 방에 입장할 수 있습니다.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowStartDialog(false)}
                className="border-2 border-gray-300 hover:border-gray-400"
              >
                취소
              </Button>
              <Button 
                onClick={handleStartCall}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6"
              >
                통화 시작
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 프로필 상세보기 다이얼로그 */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-purple-50 border border-purple-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                selectedPartner?.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {selectedPartner?.name} 프로필
            </DialogTitle>
          </DialogHeader>
          
          {selectedPartner && (
            <div className="space-y-6">
              {/* 프로필 사진 및 기본 정보 */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={selectedPartner.avatar} 
                      alt={selectedPartner.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium text-xl">
                      {selectedPartner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-3 border-white ${
                    selectedPartner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPartner.name}</h3>
                  <p className="text-lg text-purple-600 font-medium">{selectedPartner.language}</p>
                  <p className="text-sm text-gray-500">{selectedPartner.country} • {selectedPartner.age}세 • {selectedPartner.occupation}</p>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                    <p className="text-gray-900 font-medium">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">국가</label>
                    <p className="text-gray-900">{selectedPartner.country}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">나이</label>
                    <p className="text-gray-900">{selectedPartner.age}세</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">직업</label>
                    <p className="text-gray-900">{selectedPartner.occupation}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">언어</label>
                    <p className="text-gray-900">{selectedPartner.language}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">레벨</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPartner.level === '초급' ? 'bg-green-100 text-green-800' :
                      selectedPartner.level === '중급' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPartner.level}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">평점</label>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-900 font-medium">{selectedPartner.rating}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">가입일</label>
                    <p className="text-gray-900">{selectedPartner.joinDate}</p>
                  </div>
                </div>
              </div>

              {/* 한줄소개 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">한줄소개</label>
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="text-gray-800 italic">"{selectedPartner.bio}"</p>
                </div>
              </div>

              {/* 관심사 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">관심사</label>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.interests.map((interest: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* 통계 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">통화 통계</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-purple-100 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPartner.totalCalls}</div>
                    <div className="text-sm text-gray-600">총 통화 횟수</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-100 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPartner.rating}</div>
                    <div className="text-sm text-gray-600">평균 평점</div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowProfileDialog(false)}
                  className="border-2 border-gray-300 hover:border-gray-400"
                >
                  닫기
                </Button>
                {selectedPartner.status === 'online' && (
                  <Button 
                    onClick={() => {
                      setShowProfileDialog(false)
                      setShowStartDialog(true)
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    대화 시작
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
