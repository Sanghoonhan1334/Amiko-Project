import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

// 🚀 최적화: EventTab용 포인트 및 랭킹 데이터 캐싱
export function useEventPoints() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['eventPoints', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          pointsData: {
            total: 0,
            available: 0,
            community: 0,
            videoCall: 0
          },
          rankingData: {
            ranking: [],
            userRank: null,
            totalUsers: 0
          }
        }
      }

      // 포인트 및 랭킹 데이터 병렬 호출
      const [pointsResponse, rankingResponse] = await Promise.all([
        fetch(`/api/points?userId=${user.id}`),
        fetch(`/api/points/ranking?userId=${user.id}&limit=10`)
      ])
      
      if (!pointsResponse.ok || !rankingResponse.ok) {
        // API 에러 시 기본값 사용
        console.warn('[EventTab] 포인트/랭킹 API 호출 실패, 기본값 사용')
        return {
          pointsData: {
            total: 0,
            available: 0,
            community: 0,
            videoCall: 0
          },
          rankingData: {
            ranking: [],
            userRank: null,
            totalUsers: 0
          }
        }
      }

      const [pointsResult, rankingResult] = await Promise.all([
        pointsResponse.json(),
        rankingResponse.json()
      ])

      // 포인트 데이터 설정
      const userPoints = pointsResult.userPoints
      const pointsData = {
        total: userPoints?.total_points || 0,
        available: userPoints?.available_points || 0,
        community: 0, // 히스토리에서 계산
        videoCall: 0  // 히스토리에서 계산
      }

      // 랭킹 데이터 설정
      const rankingData = {
        ranking: rankingResult.ranking || [],
        userRank: rankingResult.userRank,
        totalUsers: rankingResult.totalUsers || 0
      }

      return { pointsData, rankingData }
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3분간 캐시 유지
    refetchInterval: 90 * 1000, // 90초마다 업데이트 (3배 감소)
    refetchIntervalInBackground: false, // 백그라운드에서는 폴링 안 함
    retry: 2,
  })
}
