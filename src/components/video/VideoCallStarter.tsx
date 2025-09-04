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
  Clock
} from 'lucide-react'

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
  const availablePartners = [
    { id: '1', name: '마리아 (멕시코)', status: 'online', language: '스페인어', interests: ['한국 드라마', 'K-pop'] },
    { id: '2', name: '카를로스 (브라질)', status: 'online', language: '포르투갈어', interests: ['한국 요리', '태권도'] },
    { id: '3', name: '소피아 (아르헨티나)', status: 'offline', language: '스페인어', interests: ['한국 문화', '여행'] },
  ]

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
          <h3 className="text-2xl font-bold text-gray-800 mb-6">대화 상대</h3>
          <div className="space-y-4">
            {availablePartners.map((partner) => (
              <div 
                key={partner.id}
                className="flex items-center justify-between p-6 bg-white border border-purple-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${
                    partner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{partner.name}</h4>
                    <p className="text-sm text-purple-600 font-medium">{partner.language}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      관심사: {partner.interests.join(', ')}
                    </p>
                  </div>
                </div>
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
    </>
  )
}
