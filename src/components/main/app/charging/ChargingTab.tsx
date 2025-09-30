'use client'

import { useState, useEffect } from 'react'
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
  Clock
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function ChargingTab() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  
  console.log('ChargingTab 마운트됨, 사용자 상태:', { user: !!user, userId: user?.id })
  
  // 포인트 현황 상태
  const [availablePoints, setAvailablePoints] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  // 쿠폰 패키지 데이터 (1 AKO = $1.99 기준, 많이 살수록 할인, 1 AKO = 20분)
  const couponPackages = [
    { id: 1, count: 1, price: 1.99, minutes: 20, popular: false, discount: 0, perUnit: 1.99 },
    { id: 2, count: 5, price: 9.45, minutes: 100, popular: true, discount: 5, perUnit: 1.89 },
    { id: 3, count: 10, price: 17.90, minutes: 200, popular: false, discount: 10, perUnit: 1.79 },
    { id: 4, count: 20, price: 33.80, minutes: 400, popular: false, discount: 15, perUnit: 1.69 }
  ]

  // 상점 아이템 데이터
  const storeItems = [
    {
      id: 'coming_soon_1',
      name: t('storeTab.pointStore.items.pointShop'),
      description: t('storeTab.pointStore.descriptions.pointShop'),
      price: 0,
      icon: '🛍️',
      available: false
    },
    {
      id: 'coming_soon_2',
      name: t('storeTab.pointStore.items.specialFeatures'),
      description: t('storeTab.pointStore.descriptions.specialFeatures'),
      price: 0,
      icon: '✨',
      available: false
    },
    {
      id: 'coming_soon_3',
      name: t('storeTab.pointStore.items.premiumItems'),
      description: t('storeTab.pointStore.descriptions.premiumItems'),
      price: 0,
      icon: '👑',
      available: false
    },
    {
      id: 'coming_soon_4',
      name: t('storeTab.pointStore.items.newFeatures'),
      description: t('storeTab.pointStore.descriptions.newFeatures'),
      price: 0,
      icon: '🚀',
      available: false
    }
  ]

  // 포인트 데이터 가져오기
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) {
        // 사용자가 없으면 기본값 설정
        setAvailablePoints(0)
        setTotalPoints(0)
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setAvailablePoints(0)
          setTotalPoints(0)
          setLoading(false)
          return
        }

        const response = await fetch(`/api/points?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAvailablePoints(data.userPoints?.available_points || 0)
          setTotalPoints(data.userPoints?.total_points || 0)
        } else {
          console.error('포인트 조회 실패:', response.status)
          // API 실패 시 기본값 설정
          setAvailablePoints(0)
          setTotalPoints(0)
        }
      } catch (error) {
        console.error('포인트 조회 중 오류:', error)
        setAvailablePoints(0)
        setTotalPoints(0)
      } finally {
        setLoading(false)
      }
    }

    fetchPoints()
  }, [user?.id])

  // 쿠폰 구매 처리
  const handleCouponPurchase = async (packageData: any) => {
    try {
      // 사용자 국가 확인 (한국인은 구매 불가)
      const userCountry = await getUserCountry();
      if (userCountry === 'KR') {
        alert('한국 사용자는 쿠폰을 구매할 수 없습니다.');
        return;
      }

      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          package_id: packageData.id,
          count: packageData.count,
          price: packageData.price
        })
      });

      if (response.ok) {
        const { client_secret } = await response.json();
        // Stripe 결제 처리 로직
        console.log('결제 준비 완료:', client_secret);
        alert('결제 페이지로 이동합니다.');
      } else {
        const errorData = await response.json();
        alert(`결제 준비 실패: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('쿠폰 구매 중 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    }
  }

  // 사용자 국가 확인 함수
  const getUserCountry = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return data.country_code;
    } catch (error) {
      console.error('국가 확인 실패:', error);
      return 'US'; // 기본값
    }
  }

  // 상점 아이템 구매 함수
  const handleStoreItemPurchase = (item: any) => {
    if (availablePoints >= item.price) {
      setAvailablePoints(availablePoints - item.price)
      alert('구매가 완료되었습니다!')
    } else {
      alert('포인트가 부족합니다.')
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 -mt-8 sm:mt-0">

      {/* 슬라이드 컨테이너 */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          autoHeight={true}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet-custom',
            bulletActiveClass: 'swiper-pagination-bullet-active-custom',
          }}
          className="charging-swiper min-h-[400px]"
          onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
        >
        {/* 슬라이드 1: AKO 쿠폰 */}
        <SwiperSlide>
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-4 h-4 text-blue-500" />
                {t('storeTab.charging.title')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('storeTab.charging.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {couponPackages.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      pkg.popular ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleCouponPurchase(pkg)}
                  >
                    <CardContent className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Video className="w-3 h-3 text-blue-500" />
                        {pkg.popular && (
                          <Badge className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 border-blue-300">
                            {t('storeTab.charging.popular')}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-xs">{pkg.count}{t('storeTab.charging.units')}</h3>
                      <div className="text-sm font-bold text-blue-600 mb-1">
                        ${pkg.price}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {t('storeTab.charging.perUnit')} ${pkg.perUnit}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {pkg.minutes}{t('storeTab.charging.minutes')}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCouponPurchase(pkg)
                        }}
                      >
                        {t('storeTab.charging.chargeButton')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </SwiperSlide>

        {/* 슬라이드 2: VIP 멤버십 */}
        <SwiperSlide>
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="w-4 h-4 text-purple-500" />
                VIP 구독
              </CardTitle>
              <CardDescription className="text-sm">
                프리미엄 기능으로 더욱 특별한 Amiko를 경험하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {/* 월간 구독 */}
                <Card className="text-center p-1 border border-gray-200">
                  <CardContent className="p-1">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">{t('storeTab.vip.monthly')}</span>
                    </div>
                    <div className="text-base font-bold text-gray-800 mb-1">$10</div>
                    <div className="text-xs text-gray-600 mb-1">{t('storeTab.vip.monthly')}</div>
                    <Button size="sm" className="w-full text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                      {t('storeTab.vip.subscribe')}
                    </Button>
                  </CardContent>
                </Card>

                {/* 연간 구독 */}
                <Card className="text-center p-1 border border-purple-300 ring-1 ring-purple-200">
                  <CardContent className="p-1">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Crown className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-medium">{t('storeTab.vip.yearly')}</span>
                    </div>
                    <div className="text-base font-bold text-purple-600 mb-1">$80</div>
                    <div className="text-xs text-gray-600 mb-1">{t('storeTab.vip.yearly')}</div>
                    <div className="text-xs text-green-600 mb-1">{t('storeTab.vip.save')} $3.3</div>
                    <Button size="sm" className="w-full text-xs h-8 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                      {t('storeTab.vip.subscribe')}
                    </Button>
                    <div className="mt-1">
                      <Badge className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 border-purple-300">
                        {t('storeTab.vip.popular')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* VIP 기능 상세정보 */}
                <Card className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className='text-sm font-bold text-purple-700'>{t('storeTab.vip.features')}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-800">
                        • {t('storeTab.vip.beautyFilter')}
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        • {t('storeTab.vip.adRemoval')}
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        • {t('storeTab.vip.simultaneousInterpretation')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </SwiperSlide>

        {/* 슬라이드 3: 포인트 상점 */}
        <SwiperSlide>
          <Card className="bg-white shadow-lg h-auto relative">
            {/* 공사중 팻말 */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12">
                🚧 {t('storeTab.pointStore.comingSoon')}
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-4 h-4 text-green-500" />
                {t('storeTab.pointStore.title')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('storeTab.pointStore.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
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
                    <CardContent className="p-3 text-center">
                      <div className="mb-2">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-600 mb-1 leading-tight">{item.description}</p>
                        <div className="text-sm font-bold text-green-600 mb-2">
                          {item.price} {t('storeTab.pointStore.points')}
                        </div>
                        {!item.available && (
                          <div className="text-xs text-gray-500 mb-1">
                            {t('storeTab.pointStore.comingSoon')}
                          </div>
                        )}
                      </div>
                      {item.available && (
                        <Button 
                          size="sm" 
                          className="w-full text-xs h-8 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStoreItemPurchase(item)
                          }}
                        >
                          구매하기
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </SwiperSlide>
        </Swiper>

        {/* 좌우 화살표 네비게이션 버튼 */}
        <button className="swiper-button-prev-custom sticky left-4 top-1/3 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 ml-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="swiper-button-next-custom sticky right-4 top-1/3 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 mr-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 슬라이드 점들 */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className={`w-2 h-2 rounded-full transition-colors ${currentSlide === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
        <div className={`w-2 h-2 rounded-full transition-colors ${currentSlide === 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
        <div className={`w-2 h-2 rounded-full transition-colors ${currentSlide === 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
      </div>

      {/* 커스텀 스타일 */}
      <style jsx global>{`
        .charging-swiper {
          overflow: hidden;
        }
        .charging-swiper .swiper-wrapper {
          height: 100%;
        }
        .charging-swiper .swiper-slide {
          height: auto !important;
          overflow-y: visible;
        }
        .charging-swiper .swiper-pagination {
          bottom: -40px;
        }
        .swiper-pagination-bullet-custom {
          width: 8px;
          height: 8px;
          background: #d1d5db;
          border-radius: 50%;
          margin: 0 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .swiper-pagination-bullet-active-custom {
          background: #3b82f6;
          transform: scale(1.2);
        }
        .swiper-button-prev-custom,
        .swiper-button-next-custom {
          position: absolute;
          margin: 0;
          width: 40px;
          height: 40px;
        }
        .swiper-button-prev-custom:hover,
        .swiper-button-next-custom:hover {
          transform: translateY(-50%) scale(1.1);
        }
      `}</style>
    </div>
  )
}