/**
 * 퀴즈 관련 타입 정의
 * Quiz-related type definitions
 */

/**
 * 퀴즈 기본 정보
 * Basic quiz information
 */
export interface Quiz {
  id: string
  slug: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  total_questions: number
  total_participants: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * 퀴즈 질문
 * Quiz question
 */
export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_order: number
  question_type: 'single_choice' | 'multiple_choice'
  created_at: string
  quiz_options?: QuizOption[]
}

/**
 * 퀴즈 선택지
 * Quiz option
 */
export interface QuizOption {
  id: string
  question_id: string
  option_text: string
  option_order: number
  score_value: number
  result_type: string | null
  mbti_axis?: string | null
  axis_weight?: number | null
  created_at: string
}

/**
 * 퀴즈 결과 타입
 * Quiz result type
 */
export interface QuizResult {
  id: string
  quiz_id: string
  slug: string
  result_type: string
  title: string
  description: string
  image_url: string | null
  characteristic: string | null
  recommendation: string | null
  mbti_code?: string | null
  created_at: string
}

/**
 * 사용자 퀴즈 응답
 * User quiz response
 */
export interface UserQuizResponse {
  id: string
  user_id: string | null
  quiz_id: string
  question_id: string
  option_id: string
  created_at: string
}

/**
 * 퀴즈 전체 데이터 (질문 + 선택지 + 결과)
 * Complete quiz data (questions + options + results)
 */
export interface QuizData {
  quiz: Quiz
  questions: QuizQuestion[]
  results: QuizResult[]
}

/**
 * 퀴즈 제출 데이터
 * Quiz submission data
 */
export interface QuizSubmission {
  quizId: string
  userId?: string
  answers: {
    question_id: string
    option_id: string
  }[]
}

/**
 * 퀴즈 결과 응답
 * Quiz result response
 */
export interface QuizResultResponse {
  success: boolean
  result: QuizResult
  mbti_code?: string
  axis_scores?: {
    EI: number
    SN: number
    TF: number
    JP: number
  }
  celebrities?: Celebrity[]
  stats?: { [key: string]: number }
  completed_at?: string
}

/**
 * 연예인 프로필 (MBTI 매칭용)
 * Celebrity profile (for MBTI matching)
 */
export interface Celebrity {
  id: string
  stage_name: string
  group_name: string | null
  mbti_code: string
  profile_image_url: string | null
  source_url: string | null
  source_note: string | null
  source_date: string | null
  is_verified: boolean
  created_at: string
}

/**
 * 퀴즈 진행 상태 (로컬 스토리지용)
 * Quiz progress state (for localStorage)
 */
export interface QuizProgress {
  slug: string
  currentQuestion: number
  selectedOptions: { [questionId: string]: string }
  startedAt: number
  lastUpdated: number
}

/**
 * 퀴즈 카테고리
 * Quiz categories
 */
export type QuizCategory = 
  | 'personality'   // 성격/성향형
  | 'celebrity'     // 연예인/셀럽형
  | 'knowledge'     // 지식형
  | 'fun'           // 재미/유머형
  | 'fortune'       // 운세/별자리형
  | 'psychology'    // 심리형
  | 'meme'          // 밈형
  | 'culture'       // 문화/라이프형

/**
 * 퀴즈 생성 요청
 * Quiz creation request
 */
export interface CreateQuizRequest {
  title: string
  description: string
  category: QuizCategory
  slug?: string
  thumbnail_url?: string
}

/**
 * 퀴즈 API 응답
 * Quiz API response
 */
export interface QuizApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

