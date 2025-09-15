'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  Clock, 
  Lock, 
  Gift,
  Sparkles,
  Star
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function StoreTab() {
  const { t } = useLanguage()
  const { user } = useAuth()
  
  // 사용자 포인트 상태
  const [availablePoints, setAvailablePoints] = useState(0) // 사용 가능한 포인트
  const [totalPoints, setTotalPoints] = useState(0) // 누적 포인트 (랭킹용)
  const [loading, setLoading] = useState(true)

  // 포인트 데이터 가져오기
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) {
        setAvailablePoints(0)
        setTotalPoints(0)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/points?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setAvailablePoints(data.userPoints?.available_points || 0)
          setTotalPoints(data.userPoints?.total_points || 0)
        } else {
          // API 실패 시 기본값 사용
          setAvailablePoints(0)
          setTotalPoints(0)
        }
      } catch (error) {
        console.error('포인트 조회 실패:', error)
        setAvailablePoints(0)
        setTotalPoints(0)
      } finally {
        setLoading(false)
      }
    }

    fetchPoints()
  }, [user?.id])

  // 상점 아이템들
  const storeItems = [
    {
      id: 'chat_extension',
      name: '채팅 연장권',
      description: '모든 멘토와 채팅 연장 (6시간)',
      price: 100,
      icon: '💬',
      available: true,
      category: 'chat'
    },
    {
      id: 'amiko_merchandise',
      name: 'Amiko 굿즈',
      description: 'Amiko 브랜드 굿즈 (머그컵, 스티커 등)',
      price: 500,
      icon: '🎁',
      available: false,
      category: 'merchandise'
    },
    {
      id: 'k_beauty_ticket',
      name: 'K-뷰티 체험권',
      description: '한국 뷰티 체험 및 상품 제공',
      price: 1000,
      icon: '💄',
      available: false,
      category: 'experience'
    },
    {
      id: 'special_event_ticket',
      name: '스페셜 이벤트 응모권',
      description: '특별 이벤트 참여 기회',
      price: 2000,
      icon: '🎫',
      available: false,
      category: 'event'
    }
  ]

  // 채팅 연장권 구매 함수
  const handlePurchaseChatExtension = () => {
    if (availablePoints >= 100) {
      setAvailablePoints(availablePoints - 100)
      // 실제로는 API 호출하여 채팅 연장 처리
      alert('채팅 연장권이 구매되었습니다! 모든 멘토와 6시간 동안 채팅할 수 있습니다.')
    } else {
      alert('포인트가 부족합니다. 더 많은 포인트를 모아주세요!')
    }
  }

  return (
    <div className="space-y-6">
      {/* 포인트 현황 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Star className="w-6 h-6" />
            내 포인트 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : availablePoints}
              </div>
              <div className="text-sm text-gray-600">사용 가능한 포인트</div>
              <div className="text-xs text-gray-500 mt-1">상점 구매용</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : totalPoints}
              </div>
              <div className="text-sm text-gray-600">누적 포인트</div>
              <div className="text-xs text-gray-500 mt-1">랭킹/이벤트용</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상점 아이템들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storeItems.map((item) => (
          <Card 
            key={item.id} 
            className={`relative ${
              item.available 
                ? 'bg-white border-gray-200 hover:shadow-lg transition-shadow' 
                : 'bg-gray-50 border-gray-300 opacity-75'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                  </div>
                </div>
                {!item.available && (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                    <Lock className="w-3 h-3 mr-1" />
                    Coming Soon
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-blue-600">
                  {item.price}점
                </div>
                {item.available ? (
                  <Button 
                    onClick={handlePurchaseChatExtension}
                    disabled={availablePoints < item.price}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    구매하기
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="text-gray-400">
                    <Lock className="w-4 h-4 mr-2" />
                    준비 중
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 포인트 획득 안내 */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Sparkles className="w-6 h-6" />
            포인트 획득 방법
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 커뮤니티 활동 상세 */}
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">💬</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-blue-800">커뮤니티 활동</h4>
                  <p className="text-sm text-blue-600">하루 최대 +20점</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• 질문 작성: +5점</div>
                <div>• 답변 작성: +5점</div>
                <div>• 스토리 작성: +5점</div>
                <div>• 자유게시판: +2점</div>
              </div>
            </div>

            {/* 영상통화 상세 */}
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-purple-800">영상통화</h4>
                  <p className="text-sm text-purple-600">1회 완료 시 +40점</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• 화상채팅 완료: +40점</div>
                <div>• 채팅 자동 활성화</div>
                <div>• 6시간 채팅 연장</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 하단 안내 문구 */}
      <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-center gap-2 text-orange-600 font-medium">
          <Gift className="w-5 h-5" />
          <span>✨ 앞으로 더 많은 리워드가 추가될 예정입니다! 포인트를 모아두세요 🙌</span>
        </div>
      </div>
    </div>
  )
}
