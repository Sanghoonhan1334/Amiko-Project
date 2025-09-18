'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Video, 
  Sparkles, 
  Globe,
  Crown,
  Zap,
  Gift,
  ShoppingBag,
  Clock,
  Lock
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function ChargingTab() {
  const { t } = useLanguage()
  const [, setSelectedCoupons] = useState(1)
  const [, setSelectedVipPlan] = useState('')
  
  // 포인트 현황 상태
  const [availablePoints, setAvailablePoints] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  const couponPackages = [
    { 
      count: 1, 
      price: 1.99, 
      originalPrice: 1.99,
      discount: 0, 
      popular: false, 
      minutes: 20,
      pricePerUnit: 1.99
    },
    { 
      count: 5, 
      price: 9.49, 
      originalPrice: 9.95,
      discount: 5, 
      popular: true, 
      minutes: 100,
      pricePerUnit: 1.90
    },
    { 
      count: 10, 
      price: 17.90, 
      originalPrice: 19.90,
      discount: 10, 
      popular: false, 
      minutes: 200,
      pricePerUnit: 1.79
    },
    { 
      count: 20, 
      price: 32.90, 
      originalPrice: 39.80,
      discount: 17, 
      popular: false, 
      minutes: 400,
      pricePerUnit: 1.65
    },
  ]

  const vipPlans = [
    {
      id: 'monthly',
      name: t('chargingTab.vip.monthly'),
      price: 9.99,
      period: t('chargingTab.vip.period'),
      features: [t('chargingTab.vip.features.beautyFilter'), t('chargingTab.vip.features.communityBadge'), t('chargingTab.vip.features.adRemoval'), t('chargingTab.vip.features.simultaneousInterpretation')],
      icon: Crown,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      popular: true
    },
    {
      id: 'yearly',
      name: t('chargingTab.vip.yearly'),
      price: 80.00,
      period: t('chargingTab.vip.periodYear'),
      features: [t('chargingTab.vip.features.beautyFilter'), t('chargingTab.vip.features.communityBadge'), t('chargingTab.vip.features.adRemoval'), t('chargingTab.vip.features.simultaneousInterpretation'), t('chargingTab.vip.monthlyLevel')],
      icon: Star,
      color: 'bg-gold-100 text-gold-700 border-gold-300',
      discount: t('chargingTab.vip.monthlySavings')
    }
  ]

  // 상점 아이템들
  const storeItems = [
    {
      id: 'chat_extension',
      name: t('storeTab.items.chatExtension.name'),
      description: t('storeTab.items.chatExtension.description'),
      price: 100,
      icon: '💬',
      available: true,
      category: 'utility'
    },
    {
      id: 'special_event_ticket',
      name: t('storeTab.items.specialEventTicket.name'),
      description: t('storeTab.items.specialEventTicket.description'),
      price: 2000,
      icon: '🎫',
      available: false,
      category: 'event'
    }
  ]

  const handleCouponPurchase = async (packageData: any) => {
    try {
      // 사용자 국가 확인 (한국인은 구매 불가)
      const userCountry = await getUserCountry();
      if (userCountry === 'KR') {
        alert('한국 사용자는 쿠폰을 구매할 수 없습니다.');
        return;
      }

      // PayPal 주문 생성
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: packageData.price * 100, // USD 센트 단위
          orderId: `coupon-${Date.now()}`,
          orderName: `${packageData.count}개 AKO 쿠폰 (${packageData.minutes}분)`,
          customerName: '고객',
          customerEmail: 'customer@example.com',
          productType: 'coupon',
          productData: {
            couponCount: packageData.count,
            couponMinutes: packageData.minutes,
            pricePerCoupon: packageData.price / packageData.count
          }
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('PayPal API 에러:', data);
        alert(`결제 처리 중 오류가 발생했습니다: ${data.error || '알 수 없는 오류'}`);
        return;
      }

      // PayPal 결제 페이지로 리다이렉트
      window.location.href = `/payments/paypal?orderId=${data.orderId}&amount=${packageData.price * 100}&type=coupon&count=${packageData.count}&minutes=${packageData.minutes}`;

    } catch (error) {
      console.error('쿠폰 구매 실패:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    }
  }

  // 사용자 국가 확인 함수
  const getUserCountry = async () => {
    try {
      const response = await fetch('/api/user/country');
      const data = await response.json();
      return data.country || 'US'; // 기본값은 US
    } catch (error) {
      console.error('국가 확인 실패:', error);
      return 'US'; // 기본값은 US
    }
  }

  const handleVipPurchase = async (plan: any) => {
    try {
      // PayPal 주문 생성
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price * 100, // USD 센트 단위
          orderId: `vip-${Date.now()}`,
          orderName: `${plan.name} VIP 구독`,
          customerName: '고객',
          customerEmail: 'customer@example.com',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('PayPal API 에러:', data);
        alert(`결제 처리 중 오류가 발생했습니다: ${data.error || '알 수 없는 오류'}`);
        return;
      }

      // PayPal 결제 페이지로 리다이렉트
      window.location.href = `/payments/paypal?orderId=${data.orderId}&amount=${plan.price * 100}&type=vip&plan=${plan.name}`;

    } catch (error) {
      console.error('VIP 구독 실패:', error);
      alert('결제 처리 중 오류가 발생했습니다. PayPal 설정을 확인해주세요.');
    }
  }

  // 상점 아이템 구매 함수
  const handleStoreItemPurchase = (item: any) => {
    if (availablePoints >= item.price) {
      setAvailablePoints(availablePoints - item.price)
      alert(t('storeTab.messages.purchaseSuccess'))
    } else {
      alert(t('storeTab.messages.insufficientPoints'))
    }
  }

  return (
    <div className="space-y-6">
      {/* 포인트 현황 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Star className="w-6 h-6" />
            {t('storeTab.pointStatus.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : availablePoints}
              </div>
              <div className="text-sm text-gray-600">{t('storeTab.pointStatus.availablePoints')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('storeTab.pointStatus.availablePointsDesc')}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : totalPoints}
              </div>
              <div className="text-sm text-gray-600">{t('storeTab.pointStatus.totalPoints')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('storeTab.pointStatus.totalPointsDesc')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 포인트 상점 */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-500" />
            {t('storeTab.subtitle')}
          </CardTitle>
          <CardDescription>
            {t('storeTab.pointEarning.title')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeItems.map((item) => (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all ${
                  item.available 
                    ? 'hover:shadow-md' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => item.available && handleStoreItemPurchase(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{item.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {item.price}{t('storeTab.points')}
                      </div>
                      {!item.available && (
                        <div className="text-xs text-gray-500">
                          {t('storeTab.comingSoon')}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.available && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStoreItemPurchase(item)
                      }}
                    >
                      {t('storeTab.buy')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 포인트 획득 방법 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">{t('storeTab.pointEarning.title')}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{t('storeTab.pointEarning.communityActivities')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-purple-500" />
                <span>{t('storeTab.pointEarning.videoCalls')}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">{t('storeTab.footerMessage')}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI 화상 채팅 쿠폰 섹션 */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            {t('chargingTab.coupons.title')}
          </CardTitle>
          <CardDescription>
            {t('chargingTab.coupons.subtitle')}
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
                        {t('chargingTab.coupons.popular')}
                      </Badge>
                    )}
                    <div className="flex items-center justify-center mb-2">
                      <IconComponent className="w-6 h-6 text-blue-500 mr-2" />
                      <span className="text-lg font-bold">{pkg.count}{t('chargingTab.coupons.unit')}</span>
                    </div>
                    {/* 가격 섹션 */}
                    <div className="text-center mb-3">
                      {pkg.discount > 0 && (
                        <div className="text-xs text-green-600 font-medium mb-1">
                          {pkg.discount}% {t('chargingTab.coupons.discount')}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        ${pkg.price}
                      </div>
                      {pkg.discount > 0 && (
                        <div className="text-sm text-gray-400 line-through">
                          ${pkg.originalPrice}
                        </div>
                      )}
                    </div>
                    
                    {/* 상세 정보 */}
                    <div className="space-y-1 mb-4">
                      <div className="text-sm text-gray-600">
                        {t('chargingTab.coupons.perUnit')} <span className="font-semibold">${pkg.pricePerUnit.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {pkg.minutes}{t('chargingTab.coupons.minutes')} = {pkg.count}AKO
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCouponPurchase(pkg)
                      }}
                    >
                      {t('chargingTab.coupons.buyNow')}
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
            {t('chargingTab.vip.title')}
          </CardTitle>
          <CardDescription>
            {t('chargingTab.vip.subtitle')}
            <br />
            <span className="text-sm text-orange-600 font-medium">
              ⚠️ {t('chargingTab.vip.warning')}
            </span>
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
                        {t('chargingTab.vip.mostPopular')}
                      </Badge>
                    )}

                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        // PayPal 설정 완료 후 활성화
                        alert('VIP 구독 기능은 준비 중입니다. 곧 이용하실 수 있습니다!\n\n⚠️ 참고: VIP 구독만으로는 통화가 불가능하며, 반드시 쿠폰을 구매해야 합니다.');
                        // handleVipPurchase(plan)
                      }}
                    >
                      {t('chargingTab.vip.subscribe')}
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
            {t('chargingTab.vip.title')} {t('chargingTab.vip.details')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600">✨</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{t('chargingTab.vip.features.beautyFilter')}</h4>
                <p className="text-sm text-gray-600">
                  {t('chargingTab.vip.featureDescriptions.beautyFilter')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{t('chargingTab.vip.features.communityBadge')}</h4>
                <p className="text-sm text-gray-600">
                  {t('chargingTab.vip.featureDescriptions.communityBadge')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">🚫</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{t('chargingTab.vip.features.adRemoval')}</h4>
                <p className="text-sm text-gray-600">
                  {t('chargingTab.vip.featureDescriptions.adRemoval')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{t('chargingTab.vip.features.simultaneousInterpretation')}</h4>
                <p className="text-sm text-gray-600">
                  {t('chargingTab.vip.featureDescriptions.simultaneousInterpretation')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
