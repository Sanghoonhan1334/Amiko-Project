import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

// 🚀 최적화: 사용자 프로필 데이터 캐싱 및 중복 요청 방지
export function useUserProfile() {
  const { user, token } = useAuth()
  
  return useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id || !token) {
        throw new Error('사용자 정보가 없습니다')
      }

      const [profileResponse, authResponse, adminResponse] = await Promise.all([
        fetch(`/api/profile?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(token)}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/auth/status?userId=${user.id}`),
        fetch(`/api/admin/check?${new URLSearchParams({
          ...(user?.id && { userId: user.id }),
          ...(user?.email && { email: user.email })
        })}`)
      ])

      const [profileResult, authResult, adminResult] = await Promise.all([
        profileResponse.ok ? profileResponse.json() : { error: 'Profile load failed' },
        authResponse.ok ? authResponse.json() : { emailVerified: false, smsVerified: false },
        adminResponse.ok ? adminResponse.json() : { isAdmin: false }
      ])

      return {
        profile: profileResult,
        authStatus: authResult,
        adminStatus: adminResult
      }
    },
    enabled: !!user?.id && !!token,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: 2,
  })
}

// 🚀 최적화: 프로필 업데이트 뮤테이션
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, token } = useAuth()

  return useMutation({
    mutationFn: async (profileData: any) => {
      if (!user?.id || !token) {
        throw new Error('사용자 정보가 없습니다')
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${encodeURIComponent(token)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '프로필 업데이트에 실패했습니다')
      }

      return response.json()
    },
    onSuccess: () => {
      // 프로필 업데이트 후 캐시 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
    },
  })
}

// 🚀 최적화: 포인트 데이터 캐싱
export function useUserPoints() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['userPoints', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('사용자 정보가 없습니다')
      }

      const response = await fetch(`/api/points?userId=${user.id}`)
      if (!response.ok) {
        throw new Error('포인트 정보를 가져올 수 없습니다')
      }

      return response.json()
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchInterval: false, // 자동 refetch 비활성화 - 필요시 수동으로만
  })
}
