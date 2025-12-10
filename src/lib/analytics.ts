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
 * Revisit detection - checks if user has logged in previously
 * Should be called when user logs in or when app initializes with existing session
 */
export function trackRevisit(userId?: string): void {
  if (typeof window === 'undefined') return
  
  const revisitKey = 'ga4_revisit_tracked'
  const revisitTracked = sessionStorage.getItem(revisitKey)
  
  // Check if user has logged in before (has stored session or user ID)
  const hasPreviousSession = 
    localStorage.getItem('amiko_session') || 
    localStorage.getItem('amiko_user') ||
    userId
  
  if (hasPreviousSession && !revisitTracked) {
    logEvent('revisit', {
      user_id: userId,
      timestamp: new Date().toISOString()
    })
    sessionStorage.setItem(revisitKey, 'true')
  }
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

// Login Flow
export function trackLoginAttempt() {
  logEvent('login_attempt', {})
}

export function trackLoginSuccess(userId?: string, method?: string) {
  logEvent('login_success', {
    user_id: userId,
    login_method: method || 'email'
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

