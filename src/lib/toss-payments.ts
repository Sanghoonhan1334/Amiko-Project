// Toss Payments 설정
export const TOSS_CONFIG = {
  // 테스트 환경 (실제 운영 시에는 production으로 변경)
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.tosspayments.com' 
    : 'https://api.tosspayments.com',
  
  // Toss Payments Secret Key (환경변수에서 가져오기)
  SECRET_KEY: process.env.TOSS_SECRET_KEY || 'test_sk_D5GePWvyJnrK0W9kqG8R5BaBN0k',
  
  // 결제 성공/실패/취소 URL
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/success`,
  FAIL_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/fail`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/cancel`,
}

// 결제 요청 데이터 타입
export interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail: string
  successUrl: string
  failUrl: string
  cancelUrl?: string
}

// 결제 응답 데이터 타입
export interface PaymentResponse {
  paymentKey: string
  orderId: string
  amount: number
  status: string
  method: string
  customerEmail: string
  requestedAt: string
  approvedAt?: string
  useEscrow: boolean
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  virtualAccount?: {
    accountNumber: string
    accountType: string
    bankCode: string
    customerName: string
    dueDate: string
    refundStatus: string
    expired: boolean
    settlementStatus: string
  }
  transfer?: {
    bankCode: string
    settlementStatus: string
  }
  mobilePhone?: {
    customerMobilePhone: string
    settlementStatus: string
    receiptUrl: string
  }
  giftCertificate?: {
    paymentMethod: string
    settlementStatus: string
    method: string
  }
  foreignCard?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  cashReceipt?: {
    type: string
    amount: number
    taxFreeAmount: number
    issueNumber: string
    receiptUrl: string
  }
  discount?: {
    amount: number
  }
  cancels?: Array<{
    cancelAmount: number
    cancelReason: string
    taxFreeAmount: number
    taxAmount?: number
    refundableAmount: number
    easyPayDiscountAmount: number
    canceledAt: string
    transactionKey: string
    receiptKey: string
  }>
  receipt?: {
    url: string
  }
  checkout?: {
    url: string
  }
  currency: string
  totalDiscountAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  taxFreeAmount: number
  useDiscount: boolean
}

// 결제 승인 요청 데이터 타입
export interface PaymentConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

// 결제 승인 응답 데이터 타입
export interface PaymentConfirmResponse {
  paymentKey: string
  orderId: string
  orderName: string
  method: string
  status: string
  requestedAt: string
  approvedAt: string
  useEscrow: boolean
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  virtualAccount?: {
    accountNumber: string
    accountType: string
    bankCode: string
    customerName: string
    dueDate: string
    refundStatus: string
    expired: boolean
    settlementStatus: string
  }
  transfer?: {
    bankCode: string
    settlementStatus: string
  }
  mobilePhone?: {
    customerMobilePhone: string
    settlementStatus: string
    receiptUrl: string
  }
  giftCertificate?: {
    paymentMethod: string
    settlementStatus: string
    method: string
  }
  foreignCard?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  cashReceipt?: {
    type: string
    amount: number
    taxFreeAmount: number
    issueNumber: string
    receiptUrl: string
  }
  discount?: {
    amount: number
  }
  cancels?: Array<{
    cancelAmount: number
    cancelReason: string
    taxFreeAmount: number
    taxAmount?: number
    refundableAmount: number
    easyPayDiscountAmount: number
    canceledAt: string
    transactionKey: string
    receiptKey: string
  }>
  receipt?: {
    url: string
  }
  checkout?: {
    url: string
  }
  currency: string
  totalDiscountAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  taxFreeAmount: number
  useDiscount: boolean
}

// 결제 취소 요청 데이터 타입
export interface PaymentCancelRequest {
  cancelReason: string
  cancelAmount?: number
  refundBankCode?: string
  refundAccountNumber?: string
  refundHolderName?: string
}

// 결제 취소 응답 데이터 타입
export interface PaymentCancelResponse {
  paymentKey: string
  orderId: string
  orderName: string
  method: string
  status: string
  requestedAt: string
  approvedAt: string
  useEscrow: boolean
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  virtualAccount?: {
    accountNumber: string
    accountType: string
    bankCode: string
    customerName: string
    dueDate: string
    refundStatus: string
    expired: boolean
    settlementStatus: string
  }
  transfer?: {
    bankCode: string
    settlementStatus: string
  }
  mobilePhone?: {
    customerMobilePhone: string
    settlementStatus: string
    receiptUrl: string
  }
  giftCertificate?: {
    paymentMethod: string
    settlementStatus: string
    method: string
  }
  foreignCard?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    useCardPoint: boolean
    cardType: string
    ownerType: string
    acquireStatus: string
    amount: number
  }
  cashReceipt?: {
    type: string
    amount: number
    taxFreeAmount: number
    issueNumber: string
    receiptUrl: string
  }
  discount?: {
    amount: number
  }
  cancels?: Array<{
    cancelAmount: number
    cancelReason: string
    taxFreeAmount: number
    taxAmount?: number
    refundableAmount: number
    easyPayDiscountAmount: number
    canceledAt: string
    transactionKey: string
    receiptKey: string
  }>
  receipt?: {
    url: string
  }
  checkout?: {
    url: string
  }
  currency: string
  totalDiscountAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  taxFreeAmount: number
  useDiscount: boolean
}
