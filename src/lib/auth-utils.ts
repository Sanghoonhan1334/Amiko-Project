// 인증 관련 유틸리티 함수들

export interface UserProfile {
  id: string
  email: string
  name?: string
  phone?: string
  role?: string
  permissions?: string[]
  [key: string]: unknown
}

/**
 * 사용자의 인증 상태를 확인합니다
 * @param profile 사용자 프로필 객체
 * @returns 인증 완료 여부
 */
export function isVerified(profile: UserProfile | null): boolean {
  if (!profile) return false
  
  return !!(
    profile.kakao_linked_at || 
    profile.wa_verified_at || 
    profile.sms_verified_at || 
    profile.email_verified_at
  )
}

/**
 * 사용자의 인증 채널을 반환합니다
 * @param profile 사용자 프로필 객체
 * @returns 인증된 채널 배열
 */
export function getVerifiedChannels(profile: UserProfile | null): string[] {
  if (!profile) return []
  
  const channels: string[] = []
  
  if (profile.kakao_linked_at) channels.push('kakao')
  if (profile.wa_verified_at) channels.push('wa')
  if (profile.sms_verified_at) channels.push('sms')
  if (profile.email_verified_at) channels.push('email')
  
  return channels
}

/**
 * 사용자가 한국인인지 확인합니다
 * @param profile 사용자 프로필 객체
 * @returns 한국인 여부
 */
export function isKorean(profile: UserProfile | null): boolean {
  if (!profile) return false
  
  return profile.is_korean === true || profile.country === 'KR'
}

/**
 * 인증 상태에 따른 권한을 확인합니다
 * @param profile 사용자 프로필 객체
 * @param requiredPermissions 필요한 권한들
 * @returns 권한 보유 여부
 */
export function hasPermission(
  user: UserProfile | null,
  _requiredPermissions: ('video_matching' | 'coupon_usage' | 'community_posting')[]
): boolean {
  if (!user) return false
  
  // 사용자 권한 확인
  const userPermissions = user.permissions || []
  
  // 필요한 권한이 모두 있는지 확인
  return _requiredPermissions.every(permission => userPermissions.includes(permission))
}

/**
 * 인증 상태에 따른 사용자 등급을 반환합니다
 * @param profile 사용자 프로필 객체
 * @returns 사용자 등급
 */
export function getUserLevel(profile: UserProfile | null): 'unverified' | 'verified' | 'premium' {
  if (!isVerified(profile)) return 'unverified'
  
  // TODO: 프리미엄 등급 로직 추가
  return 'verified'
}

/**
 * 인증이 필요한 액션을 체크하고 인증센터로 리다이렉트합니다
 * @param profile 사용자 프로필 객체 (선택사항)
 * @param router Next.js router 객체 (선택사항)
 * @param action 액션 이름 (로그용)
 * @returns 인증 완료 여부
 */
export function checkAuthAndRedirect(
  profile?: UserProfile | null, 
  router?: any, 
  action: string = '액션'
): boolean {
  // 매개변수가 없으면 브라우저의 window.location을 사용
  if (!router) {
    if (typeof window !== 'undefined') {
      window.location.href = '/verification-center'
      return false
    }
    return false
  }

  if (!isVerified(profile)) {
    console.log(`❌ ${action} 실행 실패: 인증이 필요합니다`)
    router.push('/verification-center')
    return false
  }
  return true
}

/**
 * 인증이 필요한 액션을 체크하고 콜백을 실행합니다
 * @param profile 사용자 프로필 객체 (선택사항)
 * @param router Next.js router 객체 (선택사항)
 * @param callback 인증 완료 시 실행할 콜백
 * @param action 액션 이름 (로그용)
 */
export function requireAuth(
  profile?: UserProfile | null,
  router?: any,
  callback?: () => void,
  action: string = '액션'
): void {
  if (checkAuthAndRedirect(profile, router, action)) {
    if (callback) {
      callback()
    }
  }
}

/**
 * Level 1 인증 체크 (게시글 작성용)
 * 인증센터에서 인증 완료한 경우 자동 통과
 * 또는 이메일 인증, SMS 인증, 전화번호 인증 중 하나라도 있으면 통과
 */
export function checkLevel1Auth(profile: UserProfile | null): {
  canAccess: boolean
  missingRequirements: string[]
} {
  if (!profile) {
    return { canAccess: false, missingRequirements: ['로그인'] }
  }

  // 인증센터에서 이미 인증을 완료한 경우 자동 통과
  const isVerified = profile.is_verified === true || profile.is_verified === 'true' || profile.is_verified === 1
  const verificationCompleted = profile.verification_completed === true || profile.verification_completed === 'true' || profile.verification_completed === 1
  
  if (isVerified || verificationCompleted) {
    console.log('[AUTH_UTILS] Level 1 인증: 인증센터에서 인증 완료됨, 자동 통과:', {
      is_verified: profile.is_verified,
      verification_completed: profile.verification_completed
    })
    return {
      canAccess: true,
      missingRequirements: []
    }
  }

  const missing: string[] = []
  
  // 인증센터 인증이 없으면 개별 인증 방법 확인
  // 이메일 인증, SMS 인증, 전화번호 인증 중 하나라도 있으면 통과
  const hasEmailVerification = !!profile.email_verified_at
  const hasSMSVerification = !!(profile.sms_verified_at || profile.phone_verified_at || profile.phone_verified)
  const hasOtherVerification = !!(profile.kakao_linked_at || profile.wa_verified_at)
  
  if (!hasEmailVerification && !hasSMSVerification && !hasOtherVerification) {
    missing.push('인증 (이메일, SMS, 전화번호 중 하나)')
  }

  return {
    canAccess: missing.length === 0,
    missingRequirements: missing
  }
}

/**
 * Level 2 인증 체크 (실시간 채팅, 화상통화용)
 * SMS + 완전한 프로필 (이메일 인증 제거)
 * 
 * ⚠️ 중요: 인증센터에서 이미 인증을 완료한 경우(is_verified 또는 verification_completed가 true)
 * 자동으로 통과시킵니다. 인증센터에서 통과했다면 개별 항목을 다시 체크하지 않습니다.
 */
export function checkLevel2Auth(profile: UserProfile | null): {
  canAccess: boolean
  missingRequirements: string[]
  hasBadge: boolean
} {
  if (!profile) {
    return { 
      canAccess: false, 
      missingRequirements: ['로그인'],
      hasBadge: false
    }
  }

  // 인증센터에서 이미 인증을 완료한 경우 자동 통과
  // 인증센터에서 통과했다면 개별 항목을 다시 체크할 필요가 없습니다
  // 데이터베이스에서 가져온 값이 boolean true이거나 문자열 "true"일 수 있으므로 유연하게 처리
  const isVerified = profile.is_verified === true || profile.is_verified === 'true' || profile.is_verified === 1
  const verificationCompleted = profile.verification_completed === true || profile.verification_completed === 'true' || profile.verification_completed === 1
  
  if (isVerified || verificationCompleted) {
    console.log('[AUTH_UTILS] 인증센터에서 인증 완료됨, 자동 통과:', {
      is_verified: profile.is_verified,
      is_verified_type: typeof profile.is_verified,
      isVerified,
      verification_completed: profile.verification_completed,
      verification_completed_type: typeof profile.verification_completed,
      verificationCompleted
    })
    return {
      canAccess: true,
      missingRequirements: [],
      hasBadge: true
    }
  }
  
  console.log('[AUTH_UTILS] 인증센터 인증 미완료, 개별 항목 체크:', {
    is_verified: profile.is_verified,
    is_verified_type: typeof profile.is_verified,
    verification_completed: profile.verification_completed,
    verification_completed_type: typeof profile.verification_completed
  })

  const missing: string[] = []
  
  // SMS 인증 확인
  if (!profile.sms_verified_at) {
    missing.push('SMS 인증')
  }

  // 실명 확인 (이름 + 성)
  // korean_name, spanish_name, full_name 중 하나라도 있으면 실명으로 인정
  const koreanName = profile.korean_name || ''
  const spanishName = profile.spanish_name || ''
  const fullName = profile.full_name || profile.name || ''
  
  // 한국인은 korean_name이 있으면 실명으로 인정 (공백 필수 아님)
  // 현지인은 spanish_name이 있으면 실명으로 인정
  // 또는 full_name이 있고 공백이 포함되어 있으면 실명으로 인정
  const hasRealName = (koreanName && koreanName.length >= 2) || 
                      (spanishName && spanishName.length >= 2) ||
                      (fullName && fullName.includes(' ') && fullName.length >= 3)
  
  if (!hasRealName) {
    missing.push('실명 (이름 + 성)')
  }

  // 프로필 사진 확인 (실용적 접근: 얼굴 사진 필수 아님, 실제 업로드 여부만 확인)
  const profileImage = profile.profile_image || profile.avatar_url || ''
  
  if (!profileImage) {
    missing.push('프로필 사진')
  } else {
    // 1. Supabase Storage에 업로드된 이미지인지 확인
    const isSupabaseStorageImage = 
      profileImage.includes('supabase.co/storage/v1/object/public/profile-images') ||
      profileImage.includes('/profile-images/')
    
    // 2. 기본 이미지 키워드 확인
    const defaultKeywords = [
      'default',
      'avatar-placeholder',
      'placeholder',
      '/icons/default-avatar',
      '/misc/placeholder'
    ]
    const hasDefaultKeyword = defaultKeywords.some(keyword => 
      profileImage.toLowerCase().includes(keyword.toLowerCase())
    )
    
    // 3. 파일명 패턴 확인 (사용자ID_타임스탬프 형식)
    // URL에서 파일명 추출: 마지막 경로 부분에서 {userId}_{timestamp}.{ext} 패턴 확인
    const userId = profile.id || ''
    const urlParts = profileImage.split('/')
    const fileName = urlParts[urlParts.length - 1] || ''
    const hasValidFileNamePattern = userId && 
      (fileName.includes(`${userId}_`) || 
       fileName.match(/^[^_]+_\d+\.(jpg|jpeg|png|webp|gif)$/i))
    
    // 4. 외부 URL이 아닌지 확인 (Supabase Storage 이미지만 허용)
    const isExternalUrl = profileImage.startsWith('http') && 
      !profileImage.includes('supabase.co')
    
    // 검증: Supabase Storage 이미지이고, 기본 키워드가 없으며, 유효한 파일명 패턴이면 통과
    // (얼굴 사진 여부는 확인하지 않음 - 사용자가 원하는 사진 업로드 가능)
    if (!isSupabaseStorageImage || hasDefaultKeyword || !hasValidFileNamePattern || isExternalUrl) {
      missing.push('프로필 사진')
    }
  }

  // 자기소개 확인 (20자 이상)
  // introduction, bio, one_line_intro 중 하나라도 20자 이상이면 통과
  const introduction = profile.introduction || ''
  const bio = profile.bio || ''
  const oneLineIntro = profile.one_line_intro || ''
  const customInterests = (profile as any).custom_interests || ''
  
  const hasBio = (introduction && introduction.length >= 20) ||
                 (bio && bio.length >= 20) ||
                 (oneLineIntro && oneLineIntro.length >= 20) ||
                 (customInterests && customInterests.length >= 20)
  
  if (!hasBio) {
    missing.push('자기소개 (20자 이상)')
  }

  const canAccess = missing.length === 0
  const hasBadge = canAccess // Level 2 완성 시 뱃지 보유

  return {
    canAccess,
    missingRequirements: missing,
    hasBadge
  }
}

/**
 * Level 2 인증 체크 및 리다이렉트
 */
export function checkLevel2AuthAndRedirect(
  profile: UserProfile | null,
  router?: any,
  action: string = '액션'
): boolean {
  const { canAccess, missingRequirements } = checkLevel2Auth(profile)
  
  if (!canAccess) {
    console.log(`❌ ${action} 실행 실패: Level 2 인증 필요`)
    console.log('누락된 요구사항:', missingRequirements)
    
    if (router) {
      router.push('/verification-center')
    } else if (typeof window !== 'undefined') {
      window.location.href = '/verification-center'
    }
    return false
  }
  
  return true
}
