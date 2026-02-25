"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { paymentEvents } from "@/lib/analytics";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { PAYPAL_CONFIG } from "@/lib/paypal";
import PayPalPaymentButton from "@/components/payments/PayPalPaymentButton";

// Swiper CSS 임포트
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Static data - moved outside component to avoid recreation on every render
const COUPON_PACKAGES = [
  {
    id: 1,
    count: 1,
    price: 1.99,
    minutes: 20,
    popular: false,
    discount: 0,
    perUnit: 1.99,
  },
  {
    id: 2,
    count: 5,
    price: 9.45,
    minutes: 100,
    popular: false,
    discount: 5,
    perUnit: 1.89,
  },
  {
    id: 3,
    count: 10,
    price: 17.9,
    minutes: 200,
    popular: false,
    discount: 10,
    perUnit: 1.79,
  },
  {
    id: 4,
    count: 20,
    price: 33.8,
    minutes: 400,
    popular: false,
    discount: 15,
    perUnit: 1.69,
  },
] as const;

export default memo(function ChargingTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedVip, setSelectedVip] = useState<string | null>(null);

  // 포인트 현황 상태
  const [availablePoints, setAvailablePoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Use static coupon packages from module-level constant
  const couponPackages = COUPON_PACKAGES;

  // VIP PayPal 결제용 안정적인 orderId
  const vipOrderIds = useMemo(
    () => ({
      monthly: `vip_monthly_${user?.id || "guest"}_${Math.random().toString(36).slice(2, 8)}`,
      yearly: `vip_yearly_${user?.id || "guest"}_${Math.random().toString(36).slice(2, 8)}`,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  // PayPal 결제용 안정적인 orderId (렌더링마다 변경되지 않도록)
  const packageOrderIds = useMemo(
    () => ({
      1: `coupon_20min_${user?.id || "guest"}_${Math.random().toString(36).slice(2, 8)}`,
      2: `coupon_100min_${user?.id || "guest"}_${Math.random().toString(36).slice(2, 8)}`,
      3: `coupon_200min_${user?.id || "guest"}_${Math.random().toString(36).slice(2, 8)}`,
      4: `coupon_400min_${user?.id || "guest"}_${Math.random().toString(36).slice(2, 8)}`,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [user?.id],
  );

  // 상점 아이템 데이터 (memoized)
  const storeItems = useMemo(
    () => [
      {
        id: "coming_soon_1",
        name: t("storeTab.pointStore.items.pointShop"),
        description: t("storeTab.pointStore.descriptions.pointShop"),
        price: 0,
        icon: "🛍️",
        available: false,
      },
      {
        id: "coming_soon_2",
        name: t("storeTab.pointStore.items.specialFeatures"),
        description: t("storeTab.pointStore.descriptions.specialFeatures"),
        price: 0,
        icon: "✨",
        available: false,
      },
      {
        id: "coming_soon_3",
        name: t("storeTab.pointStore.items.premiumItems"),
        description: t("storeTab.pointStore.descriptions.premiumItems"),
        price: 0,
        icon: "👑",
        available: false,
      },
      {
        id: "coming_soon_4",
        name: t("storeTab.pointStore.items.newFeatures"),
        description: t("storeTab.pointStore.descriptions.newFeatures"),
        price: 0,
        icon: "🚀",
        available: false,
      },
    ],
    [t],
  );

  // 포인트 데이터 가져오기
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) {
        // 사용자가 없으면 기본값 설정
        setAvailablePoints(0);
        setTotalPoints(0);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setAvailablePoints(0);
          setTotalPoints(0);
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/points?userId=${user.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAvailablePoints(data.userPoints?.available_points || 0);
          setTotalPoints(data.userPoints?.total_points || 0);
        } else {
          console.error("포인트 조회 실패:", response.status);
          // API 실패 시 기본값 설정
          setAvailablePoints(0);
          setTotalPoints(0);
        }
      } catch (error) {
        console.error("포인트 조회 중 오류:", error);
        setAvailablePoints(0);
        setTotalPoints(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [user?.id]);

  // 쿠폰 구매 처리 - 패키지 선택 후 PayPal 버튼 표시
  const handleCouponPurchase = async (packageData: any) => {
    try {
      // 고급 등급: 인증센터 2차 인증 (프로필 완성) 체크
      if (user?.id) {
        const profileResponse = await fetch(`/api/profile?userId=${user.id}`);
        const profileResult = await profileResponse.json();

        if (profileResponse.ok && profileResult.user) {
          const userData = profileResult.user;
          const hasName = !!(
            userData.korean_name ||
            userData.spanish_name ||
            userData.full_name
          );
          const hasNickname = !!userData.nickname;
          const hasStudentInfo = !!(userData.university && userData.major);
          const hasWorkInfo = !!(userData.occupation && userData.company);
          const hasFullProfile =
            hasName && hasNickname && (hasStudentInfo || hasWorkInfo);

          if (!hasFullProfile) {
            alert(
              t("auth.fullVerificationRequired") ||
                "결제를 위해서는 인증센터에서 프로필을 완성해주세요.",
            );
            window.location.href = "/verification-center";
            return;
          }
        }
      }

      // 사용자 국가 확인 (한국인은 구매 불가)
      const userCountry = await getUserCountry();
      if (userCountry === "KR") {
        alert("한국 사용자는 쿠폰을 구매할 수 없습니다.");
        return;
      }

      // 선택된 패키지 설정 → PayPal 버튼 표시
      setSelectedPackage(packageData.id);
    } catch (error) {
      console.error("쿠폰 구매 중 오류:", error);
      alert("결제 처리 중 오류가 발생했습니다.");
    }
  };

  // 사용자 국가 확인 함수
  const getUserCountry = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      return data.country_code;
    } catch (error) {
      console.error("국가 확인 실패:", error);
      return "US"; // 기본값
    }
  };

  // 상점 아이템 구매 함수
  const handleStoreItemPurchase = (item: any) => {
    if (availablePoints >= item.price) {
      setAvailablePoints(availablePoints - item.price);
      alert("구매가 완료되었습니다!");
    } else {
      alert("포인트가 부족합니다.");
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CONFIG.clientId || "test",
        currency: PAYPAL_CONFIG.currency,
        locale: PAYPAL_CONFIG.locale,
      }}
    >
      <div className="px-2 sm:px-4 py-6 sm:py-8 -mt-8 sm:mt-0">
        {/* 슬라이드 컨테이너 */}
        <div className="relative mt-8">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            autoHeight={true}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet-custom",
              bulletActiveClass: "swiper-pagination-bullet-active-custom",
            }}
            className="charging-swiper min-h-[400px]"
            onSlideChange={(swiper) => {
              console.log("슬라이드 변경:", swiper.activeIndex);
              setCurrentSlide(swiper.activeIndex);
            }}
          >
            {/* 슬라이드 1: VIP 멤버십 */}
            <SwiperSlide>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {t("storeTab.vip.title")}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("storeTab.vip.subtitle")}
                </p>

                <div className="space-y-4">
                  {/* 구독 옵션들 */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* 월간 구독 */}
                    <div className="text-center p-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="p-1">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {t("storeTab.vip.monthly")}
                          </span>
                        </div>
                        <div className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
                          $10
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t("storeTab.vip.monthly")}
                        </div>
                        <Button
                          size="sm"
                          className={`w-full text-xs h-8 font-semibold shadow-md hover:shadow-lg transition-all duration-200 ${
                            selectedVip === "monthly"
                              ? "bg-purple-700 hover:bg-purple-800 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                          onClick={() =>
                            setSelectedVip(
                              selectedVip === "monthly" ? null : "monthly",
                            )
                          }
                        >
                          {selectedVip === "monthly" ? "✓ " : ""}
                          {t("storeTab.vip.subscribe")}
                        </Button>
                      </div>
                    </div>

                    {/* 연간 구독 */}
                    <div className="text-center p-1 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="p-1">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Crown className="w-3 h-3 text-purple-500" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {t("storeTab.vip.yearly")}
                          </span>
                        </div>
                        <div className="text-base font-bold text-purple-600 dark:text-purple-400 mb-1">
                          $80
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t("storeTab.vip.yearly")}
                        </div>
                        <Button
                          size="sm"
                          className={`w-full text-xs h-8 font-semibold shadow-md hover:shadow-lg transition-all duration-200 ${
                            selectedVip === "yearly"
                              ? "bg-purple-700 hover:bg-purple-800 text-white"
                              : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                          }`}
                          onClick={() =>
                            setSelectedVip(
                              selectedVip === "yearly" ? null : "yearly",
                            )
                          }
                        >
                          {selectedVip === "yearly" ? "✓ " : ""}
                          {t("storeTab.vip.subscribe")}
                        </Button>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {t("storeTab.vip.save")} $3.3
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PayPal 결제 버튼 - VIP 선택 시 표시 */}
                  {selectedVip && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                            VIP{" "}
                            {selectedVip === "monthly"
                              ? t("storeTab.vip.monthly")
                              : t("storeTab.vip.yearly")}
                          </p>
                          <p className="text-purple-600 dark:text-purple-400 font-bold">
                            ${selectedVip === "monthly" ? 10 : 80}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedVip(null)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <PayPalPaymentButton
                        amount={selectedVip === "monthly" ? 10 : 80}
                        orderId={
                          vipOrderIds[selectedVip as keyof typeof vipOrderIds]
                        }
                        orderName={`VIP ${selectedVip === "monthly" ? "Monthly" : "Yearly"} Subscription`}
                        customerName={
                          user?.user_metadata?.full_name || user?.email || ""
                        }
                        customerEmail={user?.email || ""}
                        userId={user?.id || ""}
                        productType="vip_subscription"
                        productData={{
                          plan_type: selectedVip,
                          price: selectedVip === "monthly" ? 10 : 80,
                          duration_months: selectedVip === "monthly" ? 1 : 12,
                        }}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* VIP 기능 상세정보 - 아래로 이동 */}
                  <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-700 border-2 border-purple-300 dark:border-gray-600 rounded-lg">
                    <div className="p-2">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                          {t("storeTab.vip.features.title")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          • {t("storeTab.vip.features.beautyFilter")}
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          • {t("storeTab.vip.features.aiTranslation")}
                        </div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          • {t("storeTab.vip.features.gameFunction")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 슬라이드 2: AKO 쿠폰 */}
            <SwiperSlide>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {t("storeTab.charging.title")}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("storeTab.charging.subtitle")}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {couponPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-2 text-center cursor-pointer transition-all hover:shadow-md border-2 ${
                        selectedPackage === pkg.id
                          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      onClick={() => handleCouponPurchase(pkg)}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Video className="w-3 h-3 text-blue-500" />
                      </div>
                      <h3 className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                        {pkg.count}
                        {t("storeTab.charging.units")}
                      </h3>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                        ${pkg.price}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">
                        {t("storeTab.charging.perUnit")} ${pkg.perUnit}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        {pkg.minutes}
                        {t("storeTab.charging.minutes")}
                      </div>
                      <Button
                        size="sm"
                        className={`w-full text-xs h-8 font-semibold shadow-md hover:shadow-lg transition-all duration-200 ${
                          selectedPackage === pkg.id
                            ? "bg-blue-700 hover:bg-blue-800 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCouponPurchase(pkg);
                        }}
                      >
                        {selectedPackage === pkg.id ? "✓ " : ""}
                        {t("storeTab.charging.chargeButton")}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* PayPal 결제 버튼 - 패키지 선택 시 표시 */}
                {selectedPackage &&
                  (() => {
                    const pkg = couponPackages.find(
                      (p) => p.id === selectedPackage,
                    )!;
                    return (
                      <div className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                              {pkg.count} AKO · {pkg.minutes}
                              {t("storeTab.charging.minutes")}
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold">
                              ${pkg.price}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedPackage(null)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        <PayPalPaymentButton
                          amount={pkg.price}
                          orderId={
                            packageOrderIds[
                              pkg.id as keyof typeof packageOrderIds
                            ]
                          }
                          orderName={`AKO Coupon - ${pkg.minutes} Minutes`}
                          customerName={
                            user?.user_metadata?.full_name || user?.email || ""
                          }
                          customerEmail={user?.email || ""}
                          userId={user?.id || ""}
                          productType="coupon"
                          productData={{
                            coupon_minutes: pkg.minutes,
                            coupon_count: pkg.count,
                            source: "purchase",
                          }}
                          className="w-full"
                        />
                      </div>
                    );
                  })()}

                {/* 무료 AKO 안내 문구 */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-800 border-2 border-blue-300 dark:border-gray-600 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-gray-200">
                      <p className="font-medium mb-1">
                        💡 {t("storeTab.charging.freeAkoTitle")}
                      </p>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: t("storeTab.charging.freeAkoDescription"),
                        }}
                      ></p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 슬라이드 3: 포인트 상점 - 숨김 처리 */}
            {/* <SwiperSlide>
          <div className="space-y-4 relative">
            {/* 공사중 팻말 */}
            {/* <div className="absolute top-0 right-0 z-10">
              <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12">
                🚧 {t('storeTab.pointStore.comingSoon')}
              </div>
            </div> */}

            {/* <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('storeTab.pointStore.title')}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('storeTab.pointStore.subtitle')}</p>

            <div className="grid grid-cols-2 gap-3">
              {storeItems.map((item) => (
                <div
                  key={item.id}
                  className={`text-center cursor-pointer transition-all ${
                    item.available
                      ? 'hover:opacity-80'
                      : 'opacity-75 cursor-not-allowed'
                  }`}
                  onClick={() => item.available && handleStoreItemPurchase(item)}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <h3 className="font-semibold text-sm mb-1 text-gray-800 dark:text-gray-200">{item.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 leading-tight">{item.description}</p>
                  <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">
                    {item.price} {t('storeTab.pointStore.points')}
                  </div>
                  {!item.available && (
                    <div className="text-xs text-gray-500 dark:text-gray-300 mb-1">
                      {t('storeTab.pointStore.comingSoon')}
                    </div>
                  )}
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
                </div>
              ))}
            </div>
          </div>
        </SwiperSlide> */}
          </Swiper>

          {/* 좌우 화살표 네비게이션 버튼 */}
          <button
            className={`swiper-button-prev-custom sticky -left-2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg rounded-full flex items-center justify-center transition-all duration-200 ${
              currentSlide === 0
                ? "top-[calc(33.333%+100px)]"
                : currentSlide === 1
                  ? "top-[calc(33.333%+100px)]"
                  : currentSlide === 2
                    ? "top-[calc(33.333%+100px)]"
                    : "top-[calc(33.333%+100px)]"
            }`}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className={`swiper-button-next-custom sticky -right-2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg rounded-full flex items-center justify-center transition-all duration-200 ${
              currentSlide === 0
                ? "top-[calc(33.333%+100px)]"
                : currentSlide === 1
                  ? "top-[calc(33.333%+100px)]"
                  : currentSlide === 2
                    ? "top-[calc(33.333%+100px)]"
                    : "top-[calc(33.333%+100px)]"
            }`}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* 슬라이드 점들 - 포인트 상점 숨김으로 2개만 표시 */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === 0 ? "bg-blue-500" : "bg-gray-300"}`}
          ></div>
          <div
            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === 1 ? "bg-blue-500" : "bg-gray-300"}`}
          ></div>
          {/* <div className={`w-2 h-2 rounded-full transition-colors ${currentSlide === 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div> */}
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
          .dark .swiper-pagination-bullet-custom {
            background: #6b7280;
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
    </PayPalScriptProvider>
  );
});
