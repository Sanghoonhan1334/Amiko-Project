/**
 * 퀴즈 데이터 검증 및 보호 규칙
 * Quiz data validation and protection rules
 */

import type { Quiz, QuizQuestion, QuizResult, CreateQuizRequest } from '@/types/quiz'

/**
 * 검증 에러
 * Validation error
 */
export class QuizValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'QuizValidationError'
  }
}

/**
 * Slug 검증
 * Validate slug
 */
export function validateSlug(slug: string): boolean {
  // slug는 영문 소문자, 숫자, 하이픈만 허용, 1-100자
  const slugRegex = /^[a-z0-9-]{1,100}$/
  
  if (!slug) {
    throw new QuizValidationError('Slug는 필수입니다.', 'slug')
  }
  
  if (!slugRegex.test(slug)) {
    throw new QuizValidationError(
      'Slug는 영문 소문자, 숫자, 하이픈만 사용 가능합니다.',
      'slug'
    )
  }
  
  // 예약어 체크
  const reservedSlugs = ['api', 'admin', 'new', 'create', 'edit', 'delete', 'submit', 'result']
  if (reservedSlugs.includes(slug)) {
    throw new QuizValidationError(
      `'${slug}'는 예약된 slug입니다. 다른 이름을 사용해주세요.`,
      'slug'
    )
  }
  
  return true
}

/**
 * 퀴즈 생성 데이터 검증
 * Validate quiz creation data
 */
export function validateCreateQuizRequest(data: CreateQuizRequest): boolean {
  // 제목 검증
  if (!data.title || data.title.trim().length === 0) {
    throw new QuizValidationError('퀴즈 제목은 필수입니다.', 'title')
  }
  
  if (data.title.length > 200) {
    throw new QuizValidationError('퀴즈 제목은 200자를 초과할 수 없습니다.', 'title')
  }
  
  // 설명 검증
  if (!data.description || data.description.trim().length === 0) {
    throw new QuizValidationError('퀴즈 설명은 필수입니다.', 'description')
  }
  
  if (data.description.length > 1000) {
    throw new QuizValidationError('퀴즈 설명은 1000자를 초과할 수 없습니다.', 'description')
  }
  
  // 카테고리 검증
  const validCategories = [
    'personality',
    'celebrity',
    'knowledge',
    'fun',
    'fortune',
    'psychology',
    'meme',
    'culture'
  ]
  
  if (!validCategories.includes(data.category)) {
    throw new QuizValidationError('유효하지 않은 카테고리입니다.', 'category')
  }
  
  // slug 검증
  if (data.slug) {
    validateSlug(data.slug)
  }
  
  // 이미지 URL 검증
  if (data.thumbnail_url) {
    validateQuizImagePath(data.thumbnail_url, data.slug)
  }
  
  return true
}

/**
 * 퀴즈 이미지 경로 검증
 * Validate quiz image path
 */
export function validateQuizImagePath(imagePath: string, slug?: string): boolean {
  if (!imagePath) {
    return true // 이미지는 선택사항
  }
  
  // 이미지 경로는 반드시 /quizzes/로 시작해야 함
  if (!imagePath.startsWith('/quizzes/')) {
    throw new QuizValidationError(
      '이미지 경로는 /quizzes/[slug]/ 형식이어야 합니다.',
      'image_url'
    )
  }
  
  // slug가 제공된 경우, 경로에 slug가 포함되어야 함
  if (slug && !imagePath.startsWith(`/quizzes/${slug}/`)) {
    throw new QuizValidationError(
      `이미지 경로는 /quizzes/${slug}/ 로 시작해야 합니다.`,
      'image_url'
    )
  }
  
  // 허용된 이미지 확장자 확인
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  const hasValidExtension = validExtensions.some(ext => 
    imagePath.toLowerCase().endsWith(ext)
  )
  
  if (!hasValidExtension) {
    throw new QuizValidationError(
      '지원되는 이미지 형식: jpg, jpeg, png, webp, gif',
      'image_url'
    )
  }
  
  return true
}

/**
 * 퀴즈 질문 검증
 * Validate quiz question
 */
export function validateQuizQuestion(question: Partial<QuizQuestion>): boolean {
  // quiz_id 필수 체크
  if (!question.quiz_id) {
    throw new QuizValidationError('quiz_id는 필수입니다.', 'quiz_id')
  }
  
  // 질문 텍스트 검증
  if (!question.question_text || question.question_text.trim().length === 0) {
    throw new QuizValidationError('질문 텍스트는 필수입니다.', 'question_text')
  }
  
  if (question.question_text.length > 500) {
    throw new QuizValidationError('질문 텍스트는 500자를 초과할 수 없습니다.', 'question_text')
  }
  
  // 질문 순서 검증
  if (question.question_order !== undefined && question.question_order < 1) {
    throw new QuizValidationError('질문 순서는 1 이상이어야 합니다.', 'question_order')
  }
  
  return true
}

/**
 * 퀴즈 결과 검증
 * Validate quiz result
 */
export function validateQuizResult(result: Partial<QuizResult>, quizSlug: string): boolean {
  // quiz_id 필수 체크
  if (!result.quiz_id) {
    throw new QuizValidationError('quiz_id는 필수입니다.', 'quiz_id')
  }
  
  // slug 필수 체크
  if (!result.slug) {
    throw new QuizValidationError('결과 slug는 필수입니다.', 'slug')
  }
  
  // 제목 검증
  if (!result.title || result.title.trim().length === 0) {
    throw new QuizValidationError('결과 제목은 필수입니다.', 'title')
  }
  
  // 이미지 경로 검증
  if (result.image_url) {
    validateQuizImagePath(result.image_url, quizSlug)
  }
  
  return true
}

/**
 * API 응답 데이터 검증 - quiz_id가 모든 관련 데이터에 포함되어 있는지 확인
 * Validate API response data - ensure quiz_id is present in all related data
 */
export function validateQuizDataIntegrity(
  quizId: string,
  questions: QuizQuestion[],
  results: QuizResult[]
): boolean {
  // 모든 질문이 올바른 quiz_id를 가지고 있는지 확인
  const invalidQuestions = questions.filter(q => q.quiz_id !== quizId)
  if (invalidQuestions.length > 0) {
    throw new QuizValidationError(
      `잘못된 quiz_id를 가진 질문이 ${invalidQuestions.length}개 발견되었습니다.`,
      'quiz_id'
    )
  }
  
  // 모든 결과가 올바른 quiz_id를 가지고 있는지 확인
  const invalidResults = results.filter(r => r.quiz_id !== quizId)
  if (invalidResults.length > 0) {
    throw new QuizValidationError(
      `잘못된 quiz_id를 가진 결과가 ${invalidResults.length}개 발견되었습니다.`,
      'quiz_id'
    )
  }
  
  return true
}

/**
 * DB 쿼리 검증 - quiz_id 필터링이 있는지 확인 (개발 모드용)
 * Validate DB query - ensure quiz_id filtering exists (for development)
 */
export function warnMissingQuizIdFilter(
  queryDescription: string,
  hasQuizIdFilter: boolean
): void {
  if (process.env.NODE_ENV === 'development' && !hasQuizIdFilter) {
    console.warn(
      `⚠️ [QUIZ_VALIDATION] "${queryDescription}" 쿼리에 quiz_id 필터가 없습니다!`,
      '\n이는 퀴즈 데이터가 섞일 수 있는 위험한 상황입니다.',
      '\n반드시 .eq("quiz_id", quizId)를 추가하세요.'
    )
  }
}

/**
 * 로컬 스토리지 키 검증
 * Validate localStorage key
 */
export function validateStorageKey(key: string): boolean {
  // 퀴즈 관련 스토리지 키는 'quiz:' prefix 필수
  if (!key.startsWith('quiz:')) {
    throw new QuizValidationError(
      '퀴즈 스토리지 키는 "quiz:" prefix로 시작해야 합니다.',
      'storage_key'
    )
  }
  
  // 'quiz:<slug>:<key>' 형식 확인
  const parts = key.split(':')
  if (parts.length < 3) {
    throw new QuizValidationError(
      '퀴즈 스토리지 키는 "quiz:<slug>:<key>" 형식이어야 합니다.',
      'storage_key'
    )
  }
  
  return true
}

/**
 * React Query 키 검증
 * Validate React Query key
 */
export function validateQueryKey(queryKey: unknown[]): boolean {
  if (!Array.isArray(queryKey)) {
    throw new QuizValidationError('Query key는 배열이어야 합니다.', 'query_key')
  }
  
  // 퀴즈 관련 쿼리 키는 ['quiz', slug, ...] 형식 필수
  if (queryKey[0] !== 'quiz') {
    throw new QuizValidationError(
      '퀴즈 Query key는 ["quiz", slug, ...] 형식이어야 합니다.',
      'query_key'
    )
  }
  
  if (!queryKey[1] || typeof queryKey[1] !== 'string') {
    throw new QuizValidationError(
      'Query key의 두 번째 요소는 slug(string)여야 합니다.',
      'query_key'
    )
  }
  
  return true
}

/**
 * 종합 검증 헬퍼
 * Comprehensive validation helper
 */
export const QuizValidator = {
  slug: validateSlug,
  createRequest: validateCreateQuizRequest,
  imagePath: validateQuizImagePath,
  question: validateQuizQuestion,
  result: validateQuizResult,
  dataIntegrity: validateQuizDataIntegrity,
  storageKey: validateStorageKey,
  queryKey: validateQueryKey,
  warnMissingQuizIdFilter
}

