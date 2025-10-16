'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // 🚀 최적화: QueryClient를 컴포넌트 내부에서 생성하여 SSR 이슈 방지
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 캐시 유지 시간 (5분)
        staleTime: 5 * 60 * 1000,
        // 메모리에서 보관 시간 (10분)
        cacheTime: 10 * 60 * 1000,
        // 백그라운드에서 자동 재검증 비활성화
        refetchOnWindowFocus: false,
        // 네트워크 재연결 시 자동 재검증
        refetchOnReconnect: true,
        // 에러 시 재시도 횟수
        retry: 2,
        // 재시도 간격 (지수 백오프)
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {/* React Query DevTools 비활성화 */}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </QueryClientProvider>
  )
}
