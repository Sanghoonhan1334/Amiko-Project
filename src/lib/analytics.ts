/**
 * Google Analytics 4 (GA4) 이벤트 트래킹 유틸리티
 * 
 * 8개 퍼널별 이벤트 트래킹:
 * 1. 마케팅 퍼널
 * 2. 가입 퍼널
 * 3. 로그인 퍼널
 * 4. 메인 앱 DAU 퍼널
 * 5. 커뮤니티 퍼널
 * 6. 퀴즈 퍼널
 * 7. 예약 퍼널
 * 8. 포인트 충전 퍼널
 */

// 디바이스 타입 감지
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// gtag 함수가 로드되었는지 확인
function isGtagReady(): boolean {
  if (typeof window === 'undefined') return false
  return typeof (window as any).gtag === 'function'
}

// 기본 이벤트 파라미터
interface BaseEventParams {
  language?: string
  device?: string
  [key: string]: any
}

/**
 * GA4 이벤트 전송 함수
 */
export function trackEvent(
  eventName: string,
  params?: BaseEventParams
): void {
  if (typeof window === 'undefined') return
  
  // gtag가 준비되지 않았으면 대기 후 재시도
  if (!isGtagReady()) {
    setTimeout(() => trackEvent(eventName, params), 100)
    return
  }

  const defaultParams: BaseEventParams = {
    device: getDeviceType(),
    ...params
  }

  // 언어 정보 추가 (localStorage에서 가져오거나 기본값 사용)
  if (!defaultParams.language) {
    const savedLanguage = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('amiko-language') || localStorage.getItem('amiko_language') || 'es'
      : 'es'
    defaultParams.language = savedLanguage
  }

  try {
    ;(window as any).gtag('event', eventName, defaultParams)
    console.log(`[GA4] Event tracked: ${eventName}`, defaultParams)
  } catch (error) {
    console.error(`[GA4] Error tracking event ${eventName}:`, error)
  }
}

/**
 * Centralized GA4 event logging helper
 * This is the single entry point for all GA4 events as per requirements
 */
export function logEvent(eventName: string, params?: object): void {
  trackEvent(eventName, params as BaseEventParams)
}

/**
 * 페이지뷰 추적
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return

  if (!isGtagReady()) {
    setTimeout(() => trackPageView(path, title), 100)
    return
  }

  try {
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost')
    const debugMode = process.env.NODE_ENV === 'development' || isLocalhost

    ;(window as any).gtag('config', measurementId, {
      page_path: path,
      page_title: title || document.title,
      language: typeof localStorage !== 'undefined' 
        ? localStorage.getItem('amiko-language') || localStorage.getItem('amiko_language') || 'es'
        : 'es',
      device: getDeviceType(),
      debug_mode: debugMode
    })
    // Also emit page_view event for consistency
    logEvent('page_view', {
      page_path: path,
      page_title: title || document.title
    })
    console.log(`[GA4] Page view: ${path}`, { debugMode, hostname: window.location.hostname })
  } catch (error) {
    console.error('[GA4] Error tracking page view:', error)
  }
}

// ==================== Standardized GA4 Events ====================

/**
 * Session start detection and tracking
 * Should be called once per session
 */
export function trackSessionStart(): void {
  if (typeof window === 'undefined') return
  
  const sessionKey = 'ga4_session_started'
  const sessionStarted = sessionStorage.getItem(sessionKey)
  
  if (!sessionStarted) {
    logEvent('session_start', {
      timestamp: new Date().toISOString()
    })
    sessionStorage.setItem(sessionKey, 'true')
  }
}

/**
 * Revisit detection - checks if user has visited before
 * Should be called at session start to detect returning users
 * 기존 사용자(과거 방문 이력 있음)가 다시 사이트에 방문했을 때 1회 전송
 */
export function trackRevisit(): void {
  if (typeof window === 'undefined') return
  
  const revisitKey = 'ga4_revisit_tracked'
  const revisitTracked = sessionStorage.getItem(revisitKey)
  
  if (revisitTracked) {
    return // 이미 이 세션에서 추적됨
  }
  
  // 재방문 판별: localStorage에 방문 이력이 있는지 확인
  const isReturningUser = localStorage.getItem('amiko_is_returning_user') === 'true'
  
  // 최초 방문인 경우 플래그 설정 (다음 방문부터 재방문으로 간주)
  if (!isReturningUser) {
    localStorage.setItem('amiko_is_returning_user', 'true')
    // 최초 방문이므로 revisit 이벤트 전송하지 않음
    return
  }
  
  // 재방문 사용자인 경우 이벤트 전송
  trackEvent('revisit', {
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  sessionStorage.setItem(revisitKey, 'true')
}

/**
 * 재방문 세션에서 커뮤니티 진입
 * /community 진입 시 해당 세션에서 revisit가 이미 발생한 경우에만 전송
 */
export function trackRevisitCommunityEnter(): void {
  if (typeof window === 'undefined') return
  
  // revisit 이벤트가 이미 발생했는지 확인
  const revisitTracked = sessionStorage.getItem('ga4_revisit_tracked')
  if (!revisitTracked) {
    return // revisit가 발생하지 않았으면 전송하지 않음
  }
  
  // 이미 이 세션에서 추적되었는지 확인
  const communityEnterKey = 'ga4_revisit_community_enter_tracked'
  const alreadyTracked = sessionStorage.getItem(communityEnterKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('revisit_community_enter', {
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  sessionStorage.setItem(communityEnterKey, 'true')
}

/**
 * 재방문 후 이전에 했던 주요 행동 재실행
 * 재방문 후 글쓰기, 댓글, 퀴즈 등 이전 행동을 다시 실행했을 때 호출
 */
export function trackRevisitIntendedAction(actionType?: string): void {
  if (typeof window === 'undefined') return
  
  // revisit 이벤트가 이미 발생했는지 확인
  const revisitTracked = sessionStorage.getItem('ga4_revisit_tracked')
  if (!revisitTracked) {
    return // revisit가 발생하지 않았으면 전송하지 않음
  }
  
  trackEvent('revisit_intended_action', {
    action_type: actionType, // 'write_post', 'comment', 'quiz_retry' 등
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
}

// ==================== 퍼널 1: 마케팅 퍼널 ====================

export const marketingEvents = {
  /**
   * 랜딩 페이지 CTA 클릭
   */
  clickCTA: (ctaType: string) => {
    trackEvent('click_cta', {
      cta_type: ctaType,
      page_location: window.location.href
    })
  },

  /**
   * 회원가입 완료
   */
  signUp: (userId?: string, method?: string) => {
    trackEvent('sign_up', {
      user_id: userId,
      signup_method: method || 'email'
    })
  },

  /**
   * 세션 시작
   */
  sessionStart: () => {
    trackEvent('session_start', {})
  },

  /**
   * 재방문 (세션 반복)
   */
  sessionRepeat: () => {
    trackEvent('session_repeat', {})
  },

  /**
   * 스크롤 이벤트
   */
  scroll: (scrollDepth?: number) => {
    trackEvent('scroll', {
      scroll_depth: scrollDepth
    })
  },

  /**
   * 사용자 참여도
   */
  userEngagement: (engagementTime?: number) => {
    trackEvent('user_engagement', {
      engagement_time_msec: engagementTime
    })
  },

  /**
   * 재방문 사용자
   */
  returningUsers: () => {
    trackEvent('returning_users', {})
  }
}

// ==================== 퍼널 2: 가입 퍼널 ====================

export const signUpEvents = {
  /**
   * 회원가입 시작
   */
  startSignUp: () => {
    trackEvent('start_sign_up', {
      page_location: window.location.href
    })
  },

  /**
   * 폼 시작
   */
  formStart: () => {
    trackEvent('form_start', {})
  },

  /**
   * 이메일 입력 (회원가입)
   */
  enterEmail: () => {
    trackEvent('enter_email', {})
  },

  /**
   * 비밀번호 입력 (회원가입)
   */
  enterPassword: () => {
    trackEvent('enter_password', {})
  },

  /**
   * 생년월일 입력
   */
  enterBirthdate: () => {
    trackEvent('enter_birthdate', {})
  },

  /**
   * 생년월일 입력 (정확한 이벤트명)
   */
  enterBirthday: () => {
    trackEvent('enter_birthday', {})
  },

  /**
   * 닉네임 입력
   */
  enterNickname: () => {
    trackEvent('enter_nickname', {})
  },

  /**
   * 약관 동의
   */
  agreeTerms: (termsType?: string) => {
    trackEvent('agree_terms', {
      terms_type: termsType || 'all'
    })
  },

  /**
   * 휴대폰 번호 입력
   */
  enterPhone: () => {
    trackEvent('enter_phone', {})
  },

  /**
   * 이메일 인증 완료
   */
  verifyEmail: () => {
    trackEvent('verify_email', {})
  },

  /**
   * 휴대폰 인증 완료
   */
  verifyPhone: (method?: 'sms' | 'whatsapp') => {
    trackEvent('verify_phone', {
      verification_method: method || 'sms'
    })
  },

  /**
   * 비밀번호 검증 통과
   */
  passwordOk: () => {
    trackEvent('password_ok', {})
  },

  /**
   * 생년월일 검증 통과
   */
  birthdayOk: () => {
    trackEvent('birthday_ok', {})
  },

  /**
   * 닉네임 검증 통과
   */
  nicknameOk: () => {
    trackEvent('nickname_ok', {})
  },

  /**
   * 회원가입 제출
   */
  submitRegister: () => {
    trackEvent('submit_register', {})
  },

  /**
   * 회원가입 버튼 클릭
   */
  registerClick: () => {
    trackEvent('register_click', {})
  },

  /**
   * 사용자 생성
   */
  createUser: (userId?: string) => {
    trackEvent('create_user', {
      user_id: userId
    })
  },

  /**
   * 회원가입 완료
   */
  completeSignUp: (userId?: string) => {
    trackEvent('complete_sign_up', {
      user_id: userId,
      funnel_completed: true
    })
  },

  /**
   * 회원가입 성공 (정확한 이벤트명)
   */
  signUpSuccess: (userId?: string) => {
    trackEvent('sign_up_success', {
      user_id: userId
    })
  }
}

// ==================== 퍼널 3: 로그인 퍼널 ====================

export const signInEvents = {
  /**
   * 로그인 시작
   */
  startSignIn: () => {
    trackEvent('start_sign_in', {
      page_location: window.location.href
    })
  },

  /**
   * 로그인 페이지 방문
   */
  visitLogin: () => {
    trackEvent('visit_login', {})
  },

  /**
   * 이메일 입력
   */
  enterEmail: () => {
    trackEvent('enter_email', {})
  },

  /**
   * 로그인 이메일 입력 (정확한 이벤트명)
   */
  enterLoginEmail: () => {
    trackEvent('enter_login_email', {})
  },

  /**
   * 비밀번호 입력
   */
  enterPassword: () => {
    trackEvent('enter_password', {})
  },

  /**
   * 로그인 비밀번호 입력 (정확한 이벤트명)
   */
  enterLoginPassword: () => {
    trackEvent('enter_login_password', {})
  },

  /**
   * 로그인 시도
   */
  loginAttempt: () => {
    trackEvent('login_attempt', {})
  },

  /**
   * 로그인 성공
   */
  signInSuccess: (userId?: string, method?: 'email' | 'biometric') => {
    trackEvent('sign_in_success', {
      user_id: userId,
      signin_method: method || 'email'
    })
  },

  /**
   * 로그인 성공 (정확한 이벤트명)
   */
  loginSuccess: (userId?: string, method?: 'email' | 'biometric') => {
    trackEvent('login_success', {
      user_id: userId,
      signin_method: method || 'email'
    })
  },

  /**
   * 로그인 실패
   */
  signInError: (errorCode?: string, errorMessage?: string) => {
    trackEvent('sign_in_error', {
      error_code: errorCode,
      error_message: errorMessage
    })
  }
}

// ==================== 퍼널 4: 메인 앱 DAU 퍼널 ====================

export const appEngagementEvents = {
  /**
   * 홈 탭 방문
   */
  visitHomeTab: () => {
    trackEvent('view_home_tab', {})
  },

  /**
   * 만남 탭 방문
   */
  visitMeetTab: () => {
    trackEvent('view_meet_tab', {})
  },

  /**
   * 커뮤니티 탭 방문
   */
  visitCommunityTab: () => {
    trackEvent('view_community_tab', {})
  },

  /**
   * 이벤트 탭 방문
   */
  visitEventTab: () => {
    trackEvent('view_event_tab', {})
  },

  /**
   * 충전 탭 방문
   */
  visitChargingTab: () => {
    trackEvent('view_charging_tab', {})
  },

  /**
   * 프로필 탭 방문
   */
  visitProfileTab: () => {
    trackEvent('view_profile_tab', {})
  }
}

// ==================== 퍼널 5: 커뮤니티 퍼널 ====================

export const communityEvents = {
  /**
   * 커뮤니티 탭 열기 (view_community_tab과 동일하므로 중복 제거)
   * @deprecated Use view_community_tab instead. This will be removed in future versions.
   */
  communityTabOpen: () => {
    trackEvent('view_community_tab', {})
  },

  /**
   * 카테고리 방문
   */
  visitCategory: (categoryName?: string, categorySlug?: string) => {
    trackEvent('view_category', {
      category_name: categoryName,
      category_slug: categorySlug
    })
  },

  /**
   * 갤러리 조회
   */
  viewGallery: (gallerySlug?: string, galleryName?: string) => {
    trackEvent('view_gallery', {
      gallery_slug: gallerySlug,
      gallery_name: galleryName
    })
  },

  /**
   * 게시물 조회
   */
  viewPost: (postId?: string, postTitle?: string, gallerySlug?: string) => {
    trackEvent('view_post', {
      post_id: postId,
      post_title: postTitle,
      gallery_slug: gallerySlug
    })
  },

  /**
   * 게시물 작성 버튼 클릭
   */
  clickWritePost: (gallerySlug?: string) => {
    trackEvent('click_write_post', {
      gallery_slug: gallerySlug
    })
  },

  /**
   * 게시물 작성 시작
   */
  startPost: (gallerySlug?: string) => {
    trackEvent('start_post', {
      gallery_slug: gallerySlug
    })
  },

  /**
   * 게시물 제목 작성
   */
  writeTitle: (titleLength?: number) => {
    trackEvent('write_title', {
      title_length: titleLength
    })
  },

  /**
   * 게시물 내용 작성
   */
  writeContent: (contentLength?: number) => {
    trackEvent('write_content', {
      content_length: contentLength
    })
  },

  /**
   * 게시물 제출
   */
  submitPost: (gallerySlug?: string, postTitle?: string) => {
    trackEvent('submit_post', {
      gallery_slug: gallerySlug,
      post_title: postTitle
    })
  },

  /**
   * 게시물 작성 성공
   */
  postSuccess: (postId?: string, gallerySlug?: string, postTitle?: string) => {
    trackEvent('post_success', {
      post_id: postId,
      gallery_slug: gallerySlug,
      post_title: postTitle
    })
  },

  /**
   * 게시물 좋아요
   */
  likePost: (postId?: string, isLiked?: boolean) => {
    trackEvent('like_post', {
      post_id: postId,
      is_liked: isLiked !== false
    })
  },

  /**
   * 게시물 댓글 작성
   */
  commentPost: (postId?: string, commentLength?: number) => {
    trackEvent('comment_post', {
      post_id: postId,
      comment_length: commentLength
    })
  },

  /**
   * 게시물 생성
   */
  createPost: (gallerySlug?: string, postTitle?: string) => {
    trackEvent('create_post', {
      gallery_slug: gallerySlug,
      post_title: postTitle
    })
  },

  /**
   * 게시물 공유
   */
  sharePost: (postId?: string, shareMethod?: string) => {
    trackEvent('share_post', {
      post_id: postId,
      share_method: shareMethod
    })
  },

  /**
   * 게시물 읽기 시간
   */
  readTime: (postId?: string, readTimeSeconds?: number) => {
    trackEvent('read_time', {
      post_id: postId,
      read_time_seconds: readTimeSeconds
    })
  },

  /**
   * 스크롤 깊이
   */
  scrollDepth: (postId?: string, scrollDepth?: number) => {
    trackEvent('scroll_depth', {
      post_id: postId,
      scroll_depth: scrollDepth
    })
  }
}

// ==================== 퍼널 6: 퀴즈 퍼널 ====================

export const quizEvents = {
  /**
   * 퀴즈 시작
   */
  startQuiz: (quizId?: string, quizName?: string) => {
    trackEvent('start_quiz', {
      quiz_id: quizId,
      quiz_name: quizName
    })
  },

  /**
   * 퀴즈 질문 표시
   */
  quizQuestion: (quizId?: string, questionNumber?: number, questionId?: string) => {
    trackEvent('quiz_question', {
      quiz_id: quizId,
      question_number: questionNumber,
      question_id: questionId
    })
  },

  /**
   * 퀴즈 답변 선택
   */
  quizAnswer: (quizId?: string, questionNumber?: number, answerId?: string) => {
    trackEvent('quiz_answer', {
      quiz_id: quizId,
      question_number: questionNumber,
      answer_id: answerId
    })
  },

  /**
   * 퀴즈 로딩 페이지
   */
  quizLoading: (quizId?: string) => {
    trackEvent('quiz_loading', {
      quiz_id: quizId
    })
  },

  /**
   * 퀴즈 결과 확인
   */
  quizResult: (quizId?: string, resultId?: string, score?: number) => {
    trackEvent('quiz_result', {
      quiz_id: quizId,
      result_id: resultId,
      score: score
    })
  },

  /**
   * 퀴즈 재응시
   */
  quizRetry: (quizId?: string) => {
    trackEvent('quiz_retry', {
      quiz_id: quizId
    })
  },

  /**
   * 퀴즈 결과 공유
   */
  quizShare: (quizId?: string, resultId?: string, shareMethod?: string) => {
    trackEvent('quiz_share', {
      quiz_id: quizId,
      result_id: resultId,
      share_method: shareMethod
    })
  }
}

// ==================== 퍼널 7: 예약 퍼널 ====================

export const bookingEvents = {
  /**
   * 상담사 목록 조회
   */
  viewConsultants: () => {
    trackEvent('view_consultants', {})
  },

  /**
   * 상담사 상세 조회
   */
  viewConsultantDetail: (consultantId?: string, consultantName?: string) => {
    trackEvent('view_consultant_detail', {
      consultant_id: consultantId,
      consultant_name: consultantName
    })
  },

  /**
   * 예약 시작
   */
  startBooking: (consultantId?: string) => {
    trackEvent('start_booking', {
      consultant_id: consultantId
    })
  },

  /**
   * 예약 날짜 선택
   */
  selectDate: (consultantId?: string, selectedDate?: string) => {
    trackEvent('select_date', {
      consultant_id: consultantId,
      selected_date: selectedDate
    })
  },

  /**
   * 예약 시간 선택
   */
  selectTime: (consultantId?: string, selectedTime?: string) => {
    trackEvent('select_time', {
      consultant_id: consultantId,
      selected_time: selectedTime
    })
  },

  /**
   * 예약 사유 입력
   */
  enterReason: (consultantId?: string, reasonLength?: number) => {
    trackEvent('enter_reason', {
      consultant_id: consultantId,
      reason_length: reasonLength
    })
  },

  /**
   * 예약 생성 완료
   */
  bookingCreated: (bookingId?: string, consultantId?: string) => {
    trackEvent('booking_created', {
      booking_id: bookingId,
      consultant_id: consultantId
    })
  },

  /**
   * 결제 페이지 이동
   */
  goToPayment: (bookingId?: string, amount?: number) => {
    trackEvent('go_to_payment', {
      booking_id: bookingId,
      amount: amount
    })
  },

  /**
   * 결제 성공
   */
  paymentSuccess: (bookingId?: string, amount?: number, paymentMethod?: string) => {
    trackEvent('payment_success', {
      booking_id: bookingId,
      amount: amount,
      payment_method: paymentMethod
    })
  },

  /**
   * 결제 취소
   */
  paymentCancel: (bookingId?: string, reason?: string) => {
    trackEvent('payment_cancel', {
      booking_id: bookingId,
      cancel_reason: reason
    })
  }
}

// ==================== 퍼널 8: 포인트 충전 퍼널 ====================

export const paymentEvents = {
  /**
   * 충전 탭 열기
   */
  openChargingTab: () => {
    trackEvent('open_charging_tab', {})
  },

  /**
   * 결제 페이지 열기
   */
  openPaymentPage: (amount?: number) => {
    trackEvent('open_payment_page', {
      amount: amount
    })
  },

  /**
   * 체크아웃 시작
   */
  paymentCheckout: (amount?: number, paymentMethod?: string) => {
    trackEvent('payment_checkout', {
      amount: amount,
      payment_method: paymentMethod
    })
  },

  /**
   * 결제 성공
   */
  paymentSuccess: (amount?: number, paymentMethod?: string, transactionId?: string) => {
    trackEvent('payment_success', {
      amount: amount,
      payment_method: paymentMethod,
      transaction_id: transactionId
    })
  },

  /**
   * 결제 실패
   */
  paymentFail: (amount?: number, errorCode?: string, errorMessage?: string) => {
    trackEvent('payment_fail', {
      amount: amount,
      error_code: errorCode,
      error_message: errorMessage
    })
  }
}

// ==================== Standardized Event Helpers ====================

/**
 * Standardized GA4 event helpers matching required event names
 * These functions use the centralized logEvent helper
 */

// CTA Click
export function trackCTAClick(ctaType: string, location?: string) {
  logEvent('cta_click', {
    cta_type: ctaType,
    page_location: location || (typeof window !== 'undefined' ? window.location.href : '')
  })
}

// Signup Flow
export function trackStartSignup() {
  logEvent('start_signup', {
    page_location: typeof window !== 'undefined' ? window.location.href : ''
  })
}

export function trackSignupInput(fieldName: string) {
  logEvent('signup_input', {
    field_name: fieldName
  })
}

export function trackSignupSubmit() {
  logEvent('signup_submit', {})
}

export function trackSignupSuccess(userId?: string) {
  logEvent('signup_success', {
    user_id: userId
  })
}

// ==================== 회원가입 퍼널 GA4 이벤트 (요청된 이벤트명) ====================

/**
 * 회원가입 폼 입력 시작
 * 회원가입 페이지 진입 또는 입력 시작 시 호출
 */
export function trackSignUpFormStart() {
  trackEvent('sign_up_form_start', {
    page_location: typeof window !== 'undefined' ? window.location.href : ''
  })
}

/**
 * 필수 정보 입력 완료
 * 필수 정보(이름, 이메일, 비밀번호, 생년월일, 국가) 입력 완료 시 호출
 */
export function trackSignUpRequiredInfoCompleted() {
  trackEvent('sign_up_required_info_completed', {
    timestamp: new Date().toISOString()
  })
}

/**
 * 인증 완료
 * 이메일/SMS 등 인증 완료 시 호출
 */
export function trackSignUpVerificationCompleted(verificationMethod: 'email' | 'sms' | 'whatsapp' = 'email') {
  trackEvent('sign_up_verification_completed', {
    verification_method: verificationMethod,
    timestamp: new Date().toISOString()
  })
}

/**
 * 회원가입 제출
 * 회원가입 제출 버튼 클릭 시 호출
 */
export function trackSignUpSubmit() {
  trackEvent('sign_up_submit', {
    timestamp: new Date().toISOString()
  })
}

/**
 * 회원가입 성공
 * 회원가입 최종 성공 시 호출
 */
export function trackSignUpSuccess(userId?: string) {
  trackEvent('sign_up_success', {
    user_id: userId,
    timestamp: new Date().toISOString()
  })
}

// ==================== 커뮤니티 참여 퍼널 GA4 이벤트 ====================

/**
 * 댓글 영역 viewport 노출
 * 게시글 상세 페이지에서 댓글 영역이 viewport에 최초로 노출될 때 호출
 * 사용자당 1회만 전송
 */
export function trackCommunityCommentSectionView(postId?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_comment_section_view_${postId || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('community_comment_section_view', {
    post_id: postId,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 로그인 유도 UI 노출
 * 비로그인 상태에서 로그인 유도 UI(모달, 배너, CTA)가 실제로 사용자 화면에 노출되었을 때 호출
 * 사용자당 1회만 전송
 */
export function trackLoginPromptImpression(promptType?: string, location?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_login_prompt_impression_${promptType || 'default'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('login_prompt_impression', {
    prompt_type: promptType || 'comment_section',
    page_location: location || window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 댓글 입력 시작
 * 댓글 입력창에 포커스되거나 입력 시작 시 호출
 * 사용자당 1회만 전송 (postId별로 구분)
 */
export function trackCommunityCommentInputStart(postId?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_comment_input_start_${postId || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('community_comment_input_start', {
    post_id: postId,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 댓글 작성 완료 및 제출 성공
 * 댓글 작성 완료 및 제출 성공 시 호출
 * 사용자당 1회만 전송 (postId별로 구분)
 */
export function trackCommunityCommentSubmit(postId?: string, commentId?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_comment_submit_${postId || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('community_comment_submit', {
    post_id: postId,
    comment_id: commentId,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

// ==================== UGC 생성 퍼널 GA4 이벤트 ====================

/**
 * 글쓰기 버튼 클릭
 * 사용자가 "글쓰기" 버튼을 클릭했을 때 호출
 * 클릭당 1회만 전송
 */
export function trackUgcWriteClick(gallerySlug?: string) {
  trackEvent('ugc_write_click', {
    gallery_slug: gallerySlug,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
}

/**
 * 에디터 진입
 * 글쓰기 에디터 페이지가 최초 렌더링될 때 호출
 * 페이지 진입 기준 1회만 전송
 */
export function trackUgcEditorEnter(gallerySlug?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_ugc_editor_enter_${gallerySlug || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('ugc_editor_enter', {
    gallery_slug: gallerySlug,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 내용 입력 시작
 * 사용자가 처음으로 글자를 입력했을 때 호출
 * 입력 시작 최초 1회만 전송
 */
export function trackUgcContentInputStart(gallerySlug?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_ugc_content_input_start_${gallerySlug || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('ugc_content_input_start', {
    gallery_slug: gallerySlug,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 게시 시도
 * 게시 API 호출 직전에 호출
 * 클릭당 1회만 전송
 */
export function trackUgcSubmitAttempt(gallerySlug?: string) {
  trackEvent('ugc_submit_attempt', {
    gallery_slug: gallerySlug,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
}

/**
 * 게시 성공
 * 서버에서 게시 성공 응답을 받은 경우 호출
 * 성공 시 1회만 전송
 */
export function trackUgcSubmitSuccess(postId?: string, gallerySlug?: string) {
  trackEvent('ugc_submit_success', {
    post_id: postId,
    gallery_slug: gallerySlug,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
}

// Login Flow
export function trackLoginAttempt() {
  logEvent('login_attempt', {})
}

export function trackLoginSuccess(userId?: string, method?: string) {
  logEvent('login_success', {
    user_id: userId,
    login_method: method || 'email'
  })
  
  // GA4 이벤트로도 전송
  trackEvent('login_success', {
    user_id: userId,
    login_method: method || 'email',
    timestamp: new Date().toISOString()
  })
}

/**
 * 로그인 유도 UI 내 로그인 버튼 클릭
 * 로그인 유도 UI 내 로그인 버튼 클릭 시 호출
 * 클릭당 1회만 전송
 */
export function trackLoginClick(promptType?: string, intent?: string) {
  // intent를 sessionStorage에 저장 (로그인 성공 후 재시도 추적용)
  if (typeof window !== 'undefined' && intent) {
    sessionStorage.setItem('amiko_login_intent', JSON.stringify({
      intent,
      promptType,
      pageLocation: window.location.href,
      timestamp: new Date().toISOString()
    }))
  }
  
  trackEvent('login_click', {
    prompt_type: promptType,
    intent: intent,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
}

/**
 * 로그인 성공 후 원래 하려던 행동 재시도
 * 로그인 성공 후 사용자가 원래 하려던 행동을 다시 시도했을 때 호출
 * intent가 존재할 때만 전송
 */
export function trackIntendedActionResume(intent?: string, promptType?: string) {
  if (!intent) return // intent가 없으면 전송하지 않음
  
  trackEvent('intended_action_resume', {
    intent: intent,
    prompt_type: promptType,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
  
  // intent 사용 후 삭제
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('amiko_login_intent')
  }
}

// ==================== 퀴즈 퍼널 GA4 이벤트 ====================

/**
 * 테스트 진입
 * 퀴즈 소개 페이지 진입 시 호출
 * 페이지 진입 기준 1회만 전송 (testId별로 구분)
 */
export function trackQuizEnter(testId?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_quiz_enter_${testId || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('quiz_enter', {
    test_id: testId,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 시작 클릭
 * "시작하기" 버튼 클릭 시 호출
 * 클릭당 1회만 전송
 */
export function trackQuizStartClick(testId?: string) {
  trackEvent('quiz_start_click', {
    test_id: testId,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
}

/**
 * 질문 50% 도달
 * 전체 질문 수 대비 50% 이상 최초 도달 시 호출
 * 50% 최초 도달 시 1회만 전송 (testId별로 구분)
 */
export function trackQuizProgress50(testId?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_quiz_progress_50_${testId || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('quiz_progress_50', {
    test_id: testId,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 테스트 완료
 * 마지막 질문 완료 + 결과 페이지 진입 시 호출
 * 완료 시 1회만 전송 (testId별로 구분)
 */
export function trackQuizComplete(testId?: string, resultType?: string) {
  if (typeof window === 'undefined') return
  
  // 중복 전송 방지: sessionStorage 사용
  const storageKey = `ga4_quiz_complete_${testId || 'global'}`
  const alreadyTracked = sessionStorage.getItem(storageKey)
  
  if (alreadyTracked) {
    return // 이미 추적됨
  }
  
  trackEvent('quiz_complete', {
    test_id: testId,
    result_type: resultType,
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  // 추적 완료 표시
  sessionStorage.setItem(storageKey, 'true')
}

/**
 * 결과 공유
 * 결과 공유 버튼 클릭 시 호출
 * 클릭당 1회만 전송
 */
export function trackQuizResultShare(testId?: string, channel?: string) {
  trackEvent('quiz_result_share', {
    test_id: testId,
    channel: channel, // 'whatsapp', 'instagram', 'tiktok', 'system', 'copy' 등
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString()
  })
}

// Post Flow
export function trackPostStart() {
  logEvent('post_start', {
    page_location: typeof window !== 'undefined' ? window.location.href : ''
  })
}

export function trackPostSubmit() {
  logEvent('post_submit', {})
}

export function trackPostSuccess(postId?: string) {
  logEvent('post_success', {
    post_id: postId
  })
}

// Comment Flow
export function trackCommentStart(postId?: string) {
  logEvent('comment_start', {
    post_id: postId
  })
}

export function trackCommentSubmit(postId?: string) {
  logEvent('comment_submit', {
    post_id: postId
  })
}

export function trackCommentSuccess(commentId?: string, postId?: string) {
  logEvent('comment_success', {
    comment_id: commentId,
    post_id: postId
  })
}

