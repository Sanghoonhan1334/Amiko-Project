import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuizQueryKey, getQuizStorageKey } from '@/lib/quizHelpers'

/**
 * 퀴즈 데이터 조회 훅 (slug 기반 네임스페이스 격리)
 * Quiz data fetching hook with slug-based namespace isolation
 */
export function useQuizData(slug: string) {
  return useQuery({
    queryKey: getQuizQueryKey(slug, 'data'),
    queryFn: async () => {
      console.log(`[USE_QUIZ_DATA] 퀴즈 데이터 조회: ${slug}`);
      
      // 임시로 ID 기반 API 사용 (slug 컬럼이 없으므로)
      const response = await fetch(`/api/quizzes/dea20361-fd46-409d-880f-f91869c1d184`);
      
      if (!response.ok) {
        throw new Error('퀴즈를 불러올 수 없습니다.');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '퀴즈 데이터를 불러올 수 없습니다.');
      }

      return result.data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
    retry: 2,
  });
}

/**
 * 퀴즈 목록 조회 훅
 * Quiz list fetching hook
 */
export function useQuizList(category?: string) {
  return useQuery({
    queryKey: ['quizzes', 'list', category || 'all'],
    queryFn: async () => {
      console.log(`[USE_QUIZ_LIST] 퀴즈 목록 조회: ${category || 'all'}`);
      
      const url = category 
        ? `/api/quizzes?category=${category}`
        : '/api/quizzes';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('퀴즈 목록을 불러올 수 없습니다.');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '퀴즈 목록을 불러올 수 없습니다.');
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: 2,
  });
}

/**
 * 퀴즈 제출 뮤테이션 훅
 * Quiz submission mutation hook
 */
export function useQuizSubmit(slug: string, quizId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ answers, userId }: { answers: any[], userId?: string }) => {
      console.log(`[USE_QUIZ_SUBMIT] 퀴즈 제출: ${slug} (${quizId})`);
      
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, userId }),
      });

      if (!response.ok) {
        throw new Error('퀴즈 제출에 실패했습니다.');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '퀴즈 제출에 실패했습니다.');
      }

      return result;
    },
    onSuccess: (data) => {
      // 퀴즈 결과 캐시 무효화
      queryClient.invalidateQueries({ queryKey: getQuizQueryKey(slug, 'result') });
      
      console.log(`[USE_QUIZ_SUBMIT] 제출 완료: ${slug}`);
    },
  });
}

/**
 * 퀴즈 결과 조회 훅
 * Quiz result fetching hook
 */
export function useQuizResult(slug: string, quizId: string, userId?: string) {
  return useQuery({
    queryKey: getQuizQueryKey(slug, 'result', userId || 'anonymous'),
    queryFn: async () => {
      if (!userId) {
        throw new Error('사용자 ID가 필요합니다.');
      }
      
      console.log(`[USE_QUIZ_RESULT] 결과 조회: ${slug} (${quizId})`);
      
      const response = await fetch(`/api/quizzes/${quizId}/result?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('결과를 불러올 수 없습니다.');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '결과를 불러올 수 없습니다.');
      }

      return result;
    },
    enabled: !!userId && !!quizId,
    staleTime: 60 * 60 * 1000, // 1시간 캐시 유지
    retry: 1,
  });
}

/**
 * 퀴즈 진행 상태 관리 훅 (localStorage 기반)
 * Quiz progress management hook (localStorage-based)
 */
export function useQuizProgress(slug: string) {
  const storageKey = getQuizStorageKey(slug, 'progress');
  
  const getProgress = (): any | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[USE_QUIZ_PROGRESS] 진행 상태 로드 실패:', error);
      return null;
    }
  };
  
  const saveProgress = (data: any): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log(`[USE_QUIZ_PROGRESS] 진행 상태 저장: ${slug}`);
    } catch (error) {
      console.error('[USE_QUIZ_PROGRESS] 진행 상태 저장 실패:', error);
    }
  };
  
  const clearProgress = (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(storageKey);
      console.log(`[USE_QUIZ_PROGRESS] 진행 상태 삭제: ${slug}`);
    } catch (error) {
      console.error('[USE_QUIZ_PROGRESS] 진행 상태 삭제 실패:', error);
    }
  };
  
  return {
    progress: getProgress(),
    saveProgress,
    clearProgress,
  };
}

