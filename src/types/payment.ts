// 결제 및 포인트 관련 타입 정의

// 포인트 관련
export interface PointsData {
  total: number;
  available: number;
  community: number;
  videoCall: number;
  daily: number;
}

export interface PointsHistory {
  id: string;
  userId: string;
  type: PointsType;
  amount: number;
  description: string;
  createdAt: string;
}

export type PointsType = 
  | 'earn'      // 획득
  | 'use'       // 사용
  | 'bonus'     // 보너스
  | 'refund';   // 환불

// 쿠폰 관련
export interface Coupon {
  id: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  unit: CouponUnit;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
}

export type CouponType = 'discount' | 'free' | 'bonus';
export type CouponUnit = 'minutes' | 'points' | 'percentage';

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  amount: number;
  usedAt: string;
}

// VIP 구독 관련
export interface VIPSubscription {
  id: string;
  userId: string;
  plan: VIPPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

export type VIPPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface VIPFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
}

// 결제 관련
export interface PaymentMethod {
  id: string;
  type: PaymentType;
  provider: PaymentProvider;
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiresAt?: string;
}

export type PaymentType = 'card' | 'paypal' | 'bank_transfer';
export type PaymentProvider = 'stripe' | 'paypal' | 'kakao' | 'toss';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// AKO 관련 (화상 통화 크레딧)
export interface AKOCredit {
  id: string;
  userId: string;
  amount: number;
  unit: 'minutes';
  expiresAt?: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface AKOPurchase {
  id: string;
  userId: string;
  package: AKOPackage;
  amount: number;
  minutes: number;
  price: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface AKOPackage {
  id: string;
  name: string;
  minutes: number;
  price: number;
  currency: string;
  discount?: number;
  isPopular?: boolean;
}
