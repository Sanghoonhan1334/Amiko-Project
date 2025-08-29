export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  isKorean: boolean
  country: string
  
  // 기본 정보
  university?: string
  major?: string
  grade?: string
  graduationYear?: string
  workplace?: string
  jobTitle?: string
  userType: 'student' | 'graduate' | 'worker' | 'general' // 학생/졸업자/직장인/일반인
  
  // 자기소개
  introduction: string
  availableTime: string[]
  interests: string[]
  
  // 인증 정보
  kakao_linked_at?: string
  wa_verified_at?: string
  sms_verified_at?: string
  email_verified_at?: string
  
  // 활동 정보
  exchangeCount: number // 교류 건수
  points: number
  rank?: number // 한국인 중 순위
  totalUsers?: number
  
  // 가입 정보
  joinDate: string
  level?: string
  
  // 설정
  storySettings: {
    autoPublic: boolean
    showInProfile: boolean
  }
}

export interface KoreanUserProfile extends UserProfile {
  isKorean: true
  // 한국인 특화 정보
  koreanRank: number // 한국인 중 순위
  totalKoreanUsers: number
}

export interface LatinUserProfile extends UserProfile {
  isKorean: false
  // 현지인 특화 정보
  coupons: Coupon[]
  purchaseHistory: Purchase[]
}

export interface Coupon {
  id: string
  type: string
  quantity: number
  expiresAt: string
  isUsed: boolean
  price: string
}

export interface Purchase {
  id: string
  item: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'cancelled'
}
