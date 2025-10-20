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
