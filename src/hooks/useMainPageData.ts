import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

// 🚀 최적화: 메인 페이지용 포인트 및 쿠폰 데이터 캐싱
export function useMainPageData() {
  const { user, token: authToken } = useAuth()
  
  return useQuery({
    queryKey: ['mainPageData', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          currentPoints: 0,
          availableAKO: 0
        }
      }

      // 🚀 최적화: 토큰 관리 간소화 - 항상 최신 토큰 사용
      let token = authToken
      console.log('[MAIN_DATA] AuthContext 토큰 확인:', token ? '있음' : '없음')
      
      // AuthContext에 토큰이 없으면 Supabase 세션에서 가져오기
      if (!token) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (session && !sessionError) {
            token = session.access_token
            localStorage.setItem('amiko_token', token)
            console.log('[MAIN_DATA] Supabase 세션에서 토큰 갱신 성공')
          } else {
            console.log('[MAIN_DATA] Supabase 세션 없음 또는 오류:', sessionError)
          }
        } catch (refreshError) {
          console.log('[MAIN_DATA] 토큰 갱신 실패:', refreshError)
        }
      }
      
      // 여전히 토큰이 없으면 localStorage에서 시도 (마지막 수단)
      if (!token) {
        token = localStorage.getItem('amiko_token')
        console.log('[MAIN_DATA] localStorage 토큰 사용:', token ? '있음' : '없음')
      }
      
      // 포인트와 AKO 쿠폰을 병렬로 조회
      const baseUrl = window.location.origin
      const promises = [
        fetch(`${baseUrl}/api/points?userId=${user.id}`, {
          headers: { 
            'Authorization': `Bearer ${encodeURIComponent(token)}`,
            'Content-Type': 'application/json'
          }
        }),
        token ? fetch(`${baseUrl}/api/coupons/check`, {
          headers: { 
            'Authorization': `Bearer ${encodeURIComponent(token)}`,
            'Content-Type': 'application/json'
          }
        }) : Promise.resolve(null)
      ]
      
      const responses = await Promise.all(promises)
      const [pointsResponse, couponsResponse] = responses
      
      let currentPoints = 0
      let availableAKO = 0
      
      if (pointsResponse.ok) {
        const data = await pointsResponse.json()
        currentPoints = data.userPoints?.total_points || data.totalPoints || 0
        
        // 더미 데이터인 경우 로그 출력
        if (data.isDummy) {
          console.log('[POINTS] 더미 데이터 사용:', data.reason)
        }
      } else {
        console.error('포인트 조회 실패:', pointsResponse.status)
        // API 오류 시에도 기본값 사용
        currentPoints = 0
      }
      
      // 쿠폰 응답이 있을 때만 처리
      if (couponsResponse) {
        if (couponsResponse.ok) {
          const couponsData = await couponsResponse.json()
          availableAKO = couponsData.availableCoupons || 0
        } else if (couponsResponse.status === 401) {
          console.log('[MAIN_DATA] 쿠폰 조회 401 오류 - 토큰 갱신 후 재시도')
          
          // 401 오류 시 토큰 갱신 시도
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
            if (session && !sessionError) {
              const newToken = session.access_token
              localStorage.setItem('amiko_token', newToken)
              console.log('[MAIN_DATA] 토큰 갱신 성공, 쿠폰 조회 재시도')
              
              // 새 토큰으로 쿠폰 조회 재시도
              const retryResponse = await fetch(`${baseUrl}/api/coupons/check`, {
                headers: { 
                  'Authorization': `Bearer ${encodeURIComponent(newToken)}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (retryResponse.ok) {
                const retryCouponsData = await retryResponse.json()
                availableAKO = retryCouponsData.availableCoupons || 0
                console.log('[MAIN_DATA] 쿠폰 조회 재시도 성공:', availableAKO)
              } else {
                console.error('[MAIN_DATA] 쿠폰 조회 재시도 실패:', retryResponse.status)
                const errorData = await retryResponse.json()
                console.error('[MAIN_DATA] 재시도 오류 상세:', errorData)
                availableAKO = 0
              }
            } else {
              console.error('[MAIN_DATA] 세션 갱신 실패:', sessionError)
              availableAKO = 0
            }
          } catch (refreshError) {
            console.error('[MAIN_DATA] 토큰 갱신 중 오류:', refreshError)
            availableAKO = 0
          }
        } else {
          console.error('[MAIN_DATA] 쿠폰 조회 실패:', couponsResponse.status)
          const errorData = await couponsResponse.json().catch(() => ({}))
          console.error('[MAIN_DATA] 오류 상세:', errorData)
          // 쿠폰 조회 실패 시에도 기본값으로 계속 진행
          availableAKO = 0
        }
      }
      
      return {
        currentPoints,
        availableAKO
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지 (연장)
    refetchInterval: 60 * 1000, // 60초마다 업데이트 (2배 감소)
    refetchIntervalInBackground: false, // 백그라운드에서는 폴링 안 함
    retry: 2,
  })
}
