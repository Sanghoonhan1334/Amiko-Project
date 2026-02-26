"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Receipt,
  DollarSign,
  Calendar,
  Package,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import PayPalPaymentButton from "@/components/payments/PayPalPaymentButton";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { PAYPAL_CONFIG } from "@/lib/paypal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PaymentsTab() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [selectedVip, setSelectedVip] = useState("");

  // Manual fetch effect to debug data visibility
  // useEffect(() => {
  //   const debugFetch = async () => {
  //     if (!user?.id) return

  //     console.log('PaymentsTab - Starting direct debug fetch...')
  //     const supabase = createSupabaseBrowserClient()

  //     const { data, error } = await supabase
  //       .from('purchases')
  //       .select('*')
  //       .eq('user_id', user.id)

  //     console.log('PaymentsTab - Direct debug fetch result:', {
  //       count: data?.length,
  //       firstRecord: data?.[0],
  //       error
  //     })
  //   }

  //   debugFetch()
  // }, [user?.id])

  // Fetch payment history
  const { data: paymentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["paymentHistory", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // console.log('PaymentsTab - React Query fn running...')
      const supabase = createSupabaseBrowserClient();

      // Debug: Check what we get without filters first
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // console.log('PaymentsTab - Raw fetch result:', { data, error })
      // console.log('PaymentsTab - Fetched payment history count:', data?.length || 0)

      if (error) {
        console.error("Error fetching payment history:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Group purchases by product type
  const groupedPurchases =
    paymentHistory?.reduce(
      (acc, purchase) => {
        const type = purchase.product_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(purchase);
        return acc;
      },
      {} as Record<string, typeof paymentHistory>,
    ) || {};

  // Debug: Log grouped purchases
  // console.log('PaymentsTab - Grouped purchases:', groupedPurchases)
  // console.log('PaymentsTab - Grouped purchases keys:', Object.keys(groupedPurchases))
  // console.log('PaymentsTab - Grouped purchases length:', Object.keys(groupedPurchases).length)

  // Payment options organized by category
  // useMemo ensures orderId stamps are stable and don't change on each re-render,
  // which would otherwise cause PayPalScriptProvider to unmount/remount and reload the SDK.
  const couponOptions = useMemo(
    () => [
      {
        id: "coupon_20min",
        name: t("payments.coupon20min"),
        amount: 1.99,
        description: t("payments.coupon20minDesc"),
        orderId: `coupon_20min_${Date.now()}`,
        orderName: "Coupon System - 20 Minutes",
        productType: "coupon",
        productData: {
          coupon_minutes: 20,
          coupon_count: 1,
          source: "purchase",
        },
      },
      {
        id: "coupon_100min",
        name: t("payments.coupon100min"),
        amount: 9.45,
        description: t("payments.coupon100minDesc"),
        orderId: `coupon_100min_${Date.now()}`,
        orderName: "Coupon System - 100 Minutes",
        productType: "coupon",
        productData: {
          coupon_minutes: 100,
          coupon_count: 1,
          source: "purchase",
        },
      },
      {
        id: "coupon_200min",
        name: t("payments.coupon200min"),
        amount: 17.9,
        description: t("payments.coupon200minDesc"),
        orderId: `coupon_200min_${Date.now()}`,
        orderName: "Coupon System - 200 Minutes",
        productType: "coupon",
        productData: {
          coupon_minutes: 200,
          coupon_count: 1,
          source: "purchase",
        },
      },
      {
        id: "coupon_400min",
        name: t("payments.coupon400min"),
        amount: 33.8,
        description: t("payments.coupon400minDesc"),
        orderId: `coupon_400min_${Date.now()}`,
        orderName: "Coupon System - 400 Minutes",
        productType: "coupon",
        productData: {
          coupon_minutes: 400,
          coupon_count: 1,
          source: "purchase",
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [],
  );

  const vipOptions = useMemo(
    () => [
      {
        id: "vip_monthly",
        name: t("payments.vipMonthly"),
        amount: 30,
        description: t("payments.vipMonthlyDesc"),
        orderId: `vip_monthly_${Date.now()}`,
        orderName: "VIP Monthly Subscription",
        productType: "vip_subscription",
        productData: {
          plan_type: "monthly",
          price: 30,
          duration_months: 1,
        },
      },
      {
        id: "vip_yearly",
        name: t("payments.vipYearly"),
        amount: 300,
        description: t("payments.vipYearlyDesc"),
        orderId: `vip_yearly_${Date.now()}`,
        orderName: "VIP Yearly Subscription",
        productType: "vip_subscription",
        productData: {
          plan_type: "yearly",
          price: 300,
          duration_months: 12,
        },
      },
      {
        id: "vip_lifetime",
        name: t("payments.vipLifetime"),
        amount: 1000,
        description: t("payments.vipLifetimeDesc"),
        orderId: `vip_lifetime_${Date.now()}`,
        orderName: "VIP Lifetime Subscription",
        productType: "vip_subscription",
        productData: {
          plan_type: "lifetime",
          price: 1000,
          duration_months: null,
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [],
  );

  const courseOptions = useMemo(
    () => [
      {
        id: "course1",
        name: t("payments.course1"),
        amount: 55,
        description: t("payments.course1Desc"),
        orderId: `course1_${Date.now()}`,
        orderName: "Course 1 - Korean Culture Basics",
        productType: "lecture",
        productData: {
          lecture_id: "course1",
          lecture_title: t("payments.koreanCultureBasic"),
          max_participants: 10,
          price_usd: 55,
          price_krw: 80000,
        },
      },
      {
        id: "course2",
        name: t("payments.course2"),
        amount: 75,
        description: t("payments.course2Desc"),
        orderId: `course2_${Date.now()}`,
        orderName: "Course 2 - Advanced Korean",
        productType: "lecture",
        productData: {
          lecture_id: "course2",
          lecture_title: "고급 한국어 실력 향상",
          max_participants: 8,
          price_usd: 75,
          price_krw: 110000,
        },
      },
      {
        id: "course3",
        name: t("payments.course3"),
        amount: 65,
        description: t("payments.course3Desc"),
        orderId: `course3_${Date.now()}`,
        orderName: "Course 3 - K-Pop & Entertainment",
        productType: "lecture",
        productData: {
          lecture_id: "course3",
          lecture_title: "K-Pop & 엔터테인먼트 문화",
          max_participants: 12,
          price_usd: 65,
          price_krw: 95000,
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [],
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("payments.loginRequired")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t("payments.loginRequiredDescription")}
          </p>
        </div>
      </div>
    );
  }

  // If PayPal is not configured, show notices instead of broken SDK buttons
  const isPayPalConfigured =
    !!PAYPAL_CONFIG.clientId && PAYPAL_CONFIG.clientId !== "test";

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CONFIG.clientId || "sb",
        currency: PAYPAL_CONFIG.currency,
        intent: PAYPAL_CONFIG.intent,
        components: "buttons",
      }}
    >
      <div className="space-y-8 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("payments.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("payments.subtitle")}
          </p>
        </div>

        {/* Three Main Payment Categories */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Sistema de Cupones */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                {t("payments.couponSystem")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("payments.selectOption")}
                </label>
                <Select
                  value={selectedCoupon}
                  onValueChange={setSelectedCoupon}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("payments.selectCoupon")} />
                  </SelectTrigger>
                  <SelectContent>
                    {couponOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Description - always visible with consistent height */}
                <div className="min-h-[3rem] flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedCoupon
                      ? couponOptions.find((opt) => opt.id === selectedCoupon)
                          ?.description
                      : "Selecciona una opción de cupón para ver los detalles y proceder con el pago."}
                  </p>
                </div>

                {selectedCoupon && (
                  <div className="flex items-center justify-center">
                    <Badge
                      variant="secondary"
                      className="text-lg font-bold px-4 py-2"
                    >
                      $
                      {
                        couponOptions.find((opt) => opt.id === selectedCoupon)
                          ?.amount
                      }
                    </Badge>
                  </div>
                )}
              </div>

              {selectedCoupon &&
                (isPayPalConfigured ? (
                  <PayPalPaymentButton
                    amount={
                      couponOptions.find((opt) => opt.id === selectedCoupon)
                        ?.amount || 0
                    }
                    orderId={
                      couponOptions.find((opt) => opt.id === selectedCoupon)
                        ?.orderId || ""
                    }
                    orderName={
                      couponOptions.find((opt) => opt.id === selectedCoupon)
                        ?.orderName || ""
                    }
                    customerName={
                      user?.user_metadata?.full_name || user?.email || ""
                    }
                    customerEmail={user?.email || ""}
                    userId={user?.id || ""}
                    productType={
                      couponOptions.find((opt) => opt.id === selectedCoupon)
                        ?.productType || ""
                    }
                    productData={
                      couponOptions.find((opt) => opt.id === selectedCoupon)
                        ?.productData || {}
                    }
                    className="w-full"
                  />
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                      PayPal no está configurado
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      El sistema de pagos estará disponible próximamente.
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* VIP Subscription */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-500" />
                {t("payments.vipSubscription")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("payments.selectOption")}
                </label>
                <Select value={selectedVip} onValueChange={setSelectedVip}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("payments.selectVip")} />
                  </SelectTrigger>
                  <SelectContent>
                    {vipOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Description - always visible with consistent height */}
                <div className="min-h-[3rem] flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {selectedVip
                      ? vipOptions.find((opt) => opt.id === selectedVip)
                          ?.description
                      : "Selecciona un plan VIP para acceder a funciones premium y beneficios exclusivos."}
                  </p>
                </div>

                {selectedVip && (
                  <div className="flex items-center justify-center">
                    <Badge
                      variant="secondary"
                      className="text-lg font-bold px-4 py-2"
                    >
                      $
                      {vipOptions.find((opt) => opt.id === selectedVip)?.amount}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedVip &&
                (isPayPalConfigured ? (
                  <PayPalPaymentButton
                    amount={
                      vipOptions.find((opt) => opt.id === selectedVip)
                        ?.amount || 0
                    }
                    orderId={
                      vipOptions.find((opt) => opt.id === selectedVip)
                        ?.orderId || ""
                    }
                    orderName={
                      vipOptions.find((opt) => opt.id === selectedVip)
                        ?.orderName || ""
                    }
                    customerName={
                      user?.user_metadata?.full_name || user?.email || ""
                    }
                    customerEmail={user?.email || ""}
                    userId={user?.id || ""}
                    productType={
                      vipOptions.find((opt) => opt.id === selectedVip)
                        ?.productType || ""
                    }
                    productData={
                      vipOptions.find((opt) => opt.id === selectedVip)
                        ?.productData || {}
                    }
                    className="w-full"
                  />
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                      PayPal no está configurado
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      El sistema de pagos estará disponible próximamente.
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Courses - Redirect to Education Tab */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                {t("payments.courses")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-50" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {t("payments.coursesDescription") ||
                    "Selecciona un curso en línea para aprender y mejorar tus habilidades."}
                </p>
                <Button
                  onClick={() => router.push("/main?tab=educacion")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {t("payments.goToEducation") || "Ir a Educación"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History Section - cierre del div principal antes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {t("payments.paymentHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading payment history...
                </span>
              </div>
            ) : Object.keys(groupedPurchases).length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t("payments.paymentHistoryEmpty")}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open("/payments", "_blank")}
                >
                  {t("payments.viewFullHistory")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Coupons */}
                {groupedPurchases.coupon && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t("payments.couponSystem")}
                    </h3>
                    <div className="space-y-3">
                      {groupedPurchases.coupon.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {purchase.product_data?.coupon_minutes
                                  ? `${purchase.product_data.coupon_minutes}분 쿠폰`
                                  : "쿠폰 구매"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  purchase.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              ${purchase.amount}
                            </Badge>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  purchase.status === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  purchase.status === "paid"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                }
                              >
                                {purchase.status === "paid" ? "완료" : "처리중"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Order: {purchase.order_id}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIP Subscriptions */}
                {groupedPurchases.vip_subscription && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t("payments.vipSubscription")}
                    </h3>
                    <div className="space-y-3">
                      {groupedPurchases.vip_subscription.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {purchase.product_data?.plan_type === "yearly"
                                  ? "VIP 연간 구독"
                                  : purchase.product_data?.plan_type ===
                                      "lifetime"
                                    ? "VIP 평생 구독"
                                    : "VIP 월간 구독"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  purchase.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              ${purchase.amount}
                            </Badge>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  purchase.status === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  purchase.status === "paid"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                }
                              >
                                {purchase.status === "paid"
                                  ? t("payments.statusPaid")
                                  : t("payments.statusPending")}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Order: {purchase.order_id}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lectures/Courses */}
                {groupedPurchases.lecture && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t("payments.courses")}
                    </h3>
                    <div className="space-y-3">
                      {groupedPurchases.lecture.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {purchase.product_data?.lecture_title ||
                                  "강의 구매"}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  purchase.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              ${purchase.amount}
                            </Badge>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  purchase.status === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  purchase.status === "paid"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                }
                              >
                                {purchase.status === "paid"
                                  ? t("payments.statusPaid")
                                  : t("payments.statusPending")}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Order: {purchase.order_id}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PayPalScriptProvider>
  );
}
