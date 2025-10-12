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

      // 🚀 최적화: 토큰 관리 간소화
      let token = authToken || localStorage.getItem('amiko_token')
      console.log('[MAIN_DATA] 토큰 확인:', token ? '있음' : '없음')
      
      // 토큰이 없는 경우에만 갱신 시도
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
            console.log('[MAIN] 토큰 갱신 성공')
          }
        } catch (refreshError) {
          console.log('[MAIN] 토큰 갱신 실패:', refreshError)
        }
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
        currentPoints = data.userPoints?.total_points || 0
      } else {
        console.error('포인트 조회 실패:', pointsResponse.status)
      }
      
      // 쿠폰 응답이 있을 때만 처리
      if (couponsResponse) {
        if (couponsResponse.ok) {
          const couponsData = await couponsResponse.json()
          availableAKO = couponsData.availableCoupons || 0
        } else {
          console.error('쿠폰 조회 실패:', couponsResponse.status)
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
    staleTime: 1 * 60 * 1000, // 1분간 캐시 유지
    refetchInterval: 30 * 1000, // 30초마다 백그라운드에서 업데이트
    retry: 2,
  })
}
