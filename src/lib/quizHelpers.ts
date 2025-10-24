/**
 * 퀴즈 네임스페이스 격리 헬퍼 함수들
 * Quiz Namespace Isolation Helper Functions
 * 
 * 목적: 퀴즈별 데이터 완전 격리를 위한 유틸리티 함수
 * Purpose: Utility functions for complete quiz data isolation
 */

/**
 * 퀴즈별 로컬 스토리지 키 생성
 * Generate quiz-specific localStorage key
 */
export function getQuizStorageKey(slug: string, key: string): string {
  return `quiz:${slug}:${key}`;
}

/**
 * 퀴즈별 React Query 키 생성
 * Generate quiz-specific React Query key
 */
export function getQuizQueryKey(slug: string, ...keys: string[]): string[] {
  return ['quiz', slug, ...keys];
}

/**
 * 퀴즈별 이미지 경로 생성
 * Generate quiz-specific image path
 */
export function getQuizImagePath(slug: string, imageName: string): string {
  return `/quizzes/${slug}/${imageName}`;
}

/**
 * 퀴즈 slug 검증
 * Validate quiz slug
 */
export function isValidSlug(slug: string): boolean {
  // slug는 영문 소문자, 숫자, 하이픈만 허용, 100자 이하
  return /^[a-z0-9-]{1,100}$/.test(slug);
}

/**
 * 제목에서 slug 생성
 * Generate slug from title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * UUID 형식 확인
 * Check if string is UUID format
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * 퀴즈 데이터 로컬 스토리지에 저장
 * Save quiz data to localStorage
 */
export function saveQuizProgress(slug: string, data: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getQuizStorageKey(slug, 'progress');
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[QUIZ_HELPERS] 로컬 스토리지 저장 실패:', error);
  }
}

/**
 * 퀴즈 데이터 로컬 스토리지에서 불러오기
 * Load quiz data from localStorage
 */
export function loadQuizProgress(slug: string): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getQuizStorageKey(slug, 'progress');
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[QUIZ_HELPERS] 로컬 스토리지 로드 실패:', error);
    return null;
  }
}

/**
 * 퀴즈 진행 상태 삭제
 * Clear quiz progress
 */
export function clearQuizProgress(slug: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getQuizStorageKey(slug, 'progress');
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[QUIZ_HELPERS] 로컬 스토리지 삭제 실패:', error);
  }
}

/**
 * 특정 퀴즈의 모든 로컬 스토리지 데이터 삭제
 * Clear all localStorage data for a specific quiz
 */
export function clearAllQuizData(slug: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const prefix = `quiz:${slug}:`;
    const keysToRemove: string[] = [];
    
    // 해당 퀴즈의 모든 키 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // 모든 키 삭제
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`[QUIZ_HELPERS] ${slug} 퀴즈의 데이터 ${keysToRemove.length}개 삭제됨`);
  } catch (error) {
    console.error('[QUIZ_HELPERS] 로컬 스토리지 전체 삭제 실패:', error);
  }
}

/**
 * 퀴즈 결과 캐싱
 * Cache quiz result
 */
export function cacheQuizResult(slug: string, result: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getQuizStorageKey(slug, 'result');
    const cacheData = {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7일 후 만료
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('[QUIZ_HELPERS] 결과 캐싱 실패:', error);
  }
}

/**
 * 캐시된 퀴즈 결과 불러오기
 * Load cached quiz result
 */
export function getCachedQuizResult(slug: string): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getQuizStorageKey(slug, 'result');
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    const cacheData = JSON.parse(data);
    
    // 만료 체크
    if (Date.now() > cacheData.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheData.result;
  } catch (error) {
    console.error('[QUIZ_HELPERS] 캐시된 결과 로드 실패:', error);
    return null;
  }
}

/**
 * 퀴즈 URL 생성
 * Generate quiz URL
 */
export function getQuizUrl(slug: string): string {
  return `/quiz/${slug}`;
}

/**
 * 퀴즈 결과 URL 생성
 * Generate quiz result URL
 */
export function getQuizResultUrl(slug: string, resultId?: string): string {
  if (resultId) {
    return `/quiz/${slug}/result?resultId=${resultId}`;
  }
  return `/quiz/${slug}/result`;
}

