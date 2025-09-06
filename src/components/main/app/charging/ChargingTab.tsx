'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Star, 
  Video, 
  Sparkles, 
  Globe,
  Crown,
  Zap,
  Gift
} from 'lucide-react'

export default function ChargingTab() {
  const [selectedCoupons, setSelectedCoupons] = useState(1)
  const [selectedVipPlan, setSelectedVipPlan] = useState('')

  const couponPackages = [
    { count: 1, price: 1.99, discount: 0, popular: false },
    { count: 5, price: 8.99, discount: 10, popular: true },
    { count: 10, price: 15.99, discount: 20, popular: false },
    { count: 20, price: 29.99, discount: 25, popular: false },
  ]

  const vipPlans = [
    {
      id: 'daily',
      name: '일일 VIP',
      price: 2.99,
      period: '1일',
      features: ['뷰티 기능', '실시간 통역', '고화질 화상'],
      icon: Zap,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    },
    {
      id: 'monthly',
      name: '월간 VIP',
      price: 19.99,
      period: '1개월',
      features: ['뷰티 기능', '실시간 통역', '고화질 화상', '무제한 사용'],
      icon: Crown,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      popular: true
    },
    {
      id: 'yearly',
      name: '연간 VIP',
      price: 199.99,
      period: '1년',
      features: ['뷰티 기능', '실시간 통역', '고화질 화상', '무제한 사용', '우선 지원'],
      icon: Star,
      color: 'bg-gold-100 text-gold-700 border-gold-300',
      discount: '2개월 무료'
    }
  ]

  const handleCouponPurchase = (packageData: any) => {
    // 결제 로직 구현
    console.log('쿠폰 구매:', packageData)
    alert(`${packageData.count}개 쿠폰을 $${packageData.price}에 구매하시겠습니까?`)
  }

  const handleVipPurchase = (plan: any) => {
    // VIP 구독 로직 구현
    console.log('VIP 구독:', plan)
    alert(`${plan.name}을 $${plan.price}에 구독하시겠습니까?`)
  }

  return (
    <div className="space-y-6">
      {/* 화상대화 쿠폰 섹션 */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            화상대화 쿠폰
          </CardTitle>
          <CardDescription>
            1개당 $1.99로 화상대화를 즐기세요. 여러 개 구매 시 할인 혜택!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {couponPackages.map((pkg) => {
              const IconComponent = pkg.popular ? Gift : Video
              return (
                <Card 
                  key={pkg.count}
                  className={`cursor-pointer transition-all ${
                    pkg.popular 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCoupons(pkg.count)}
                >
                  <CardContent className="p-4 text-center">
                    {pkg.popular && (
                      <Badge className="mb-2 bg-blue-500 text-white">
                        인기
                      </Badge>
                    )}
                    <div className="flex items-center justify-center mb-2">
                      <IconComponent className="w-6 h-6 text-blue-500 mr-2" />
                      <span className="text-lg font-bold">{pkg.count}개</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ${pkg.price}
                    </div>
                    {pkg.discount > 0 && (
                      <div className="text-sm text-green-600 mb-2">
                        {pkg.discount}% 할인
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mb-3">
                      개당 ${(pkg.price / pkg.count).toFixed(2)}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCouponPurchase(pkg)
                      }}
                    >
                      구매하기
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* VIP 기능 섹션 */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            VIP 기능
          </CardTitle>
          <CardDescription>
            뷰티 기능과 실시간 통역을 포함한 프리미엄 서비스
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vipPlans.map((plan) => {
              const IconComponent = plan.icon
              return (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    plan.popular 
                      ? 'ring-2 ring-purple-500 bg-purple-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedVipPlan(plan.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-6 h-6 text-purple-500" />
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-sm text-gray-500">{plan.period}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${plan.price}
                        </div>
                        {plan.discount && (
                          <div className="text-sm text-green-600">
                            {plan.discount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {plan.popular && (
                      <Badge className={`mb-3 ${plan.color}`}>
                        가장 인기
                      </Badge>
                    )}

                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVipPurchase(plan)
                      }}
                    >
                      구독하기
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* VIP 기능 상세 설명 */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            VIP 기능 상세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600">✨</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">뷰티 기능</h4>
                <p className="text-sm text-gray-600">
                  실시간 얼굴 보정, 피부톤 개선, 눈 크기 조정 등 다양한 뷰티 효과
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">실시간 통역</h4>
                <p className="text-sm text-gray-600">
                  고품질 AI 통역으로 언어 장벽 없이 소통하세요
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Video className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">고화질 화상</h4>
                <p className="text-sm text-gray-600">
                  최고 품질의 화상 통화로 더 선명한 대화를 즐기세요
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
