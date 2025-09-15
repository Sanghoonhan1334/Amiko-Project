'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  country: string
  is_korean: boolean
  avatar_url?: string
  bio?: string
  native_language: string
  kakao_linked_at?: string
  wa_verified_at?: string
  sms_verified_at?: string
  email_verified_at?: string
  points: number
  daily_points: number
}

interface UserContextType {
  user: User | null
  loading: boolean
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
  signOut: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 사용자 정보 로드
  const loadUser = async () => {
    try {
      const storedUser = localStorage.getItem('amiko_user')
      const storedSession = localStorage.getItem('amiko_session')
      
      if (storedUser && storedSession) {
        const userData = JSON.parse(storedUser)
        const sessionData = JSON.parse(storedSession)
        
        // 세션 만료 확인
        if (sessionData.expires_at && new Date(sessionData.expires_at) > new Date()) {
          setUser(userData)
          console.log('[USER] 사용자 정보 로드됨:', userData.email)
        } else {
          // 세션 만료 - 로그아웃
          localStorage.removeItem('amiko_user')
          localStorage.removeItem('amiko_session')
          setUser(null)
        }
      }
    } catch (error) {
      console.error('[USER] 사용자 정보 로드 실패:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/profile?userId=${user.id}`)
      const result = await response.json()

      if (response.ok) {
        const updatedUser = {
          ...user,
          ...result.user,
          ...result.profile,
          points: result.points.total_points,
          daily_points: result.points.daily_points
        }
        
        setUser(updatedUser)
        localStorage.setItem('amiko_user', JSON.stringify(updatedUser))
        console.log('[USER] 사용자 정보 새로고침 완료')
      }
    } catch (error) {
      console.error('[USER] 사용자 정보 새로고침 실패:', error)
    }
  }

  // 사용자 정보 업데이트
  const updateUser = (userData: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem('amiko_user', JSON.stringify(updatedUser))
    console.log('[USER] 사용자 정보 업데이트됨')
  }

  // 로그아웃
  const signOut = () => {
    setUser(null)
    localStorage.removeItem('amiko_user')
    localStorage.removeItem('amiko_session')
    console.log('[USER] 로그아웃 완료')
  }

  // 초기 로드
  useEffect(() => {
    loadUser()
  }, [])

  // 포인트 업데이트 이벤트 리스너
  useEffect(() => {
    const handlePointsUpdate = (event: CustomEvent) => {
      // 이벤트 detail이 있는 경우에만 처리
      if (event.detail) {
        const { points, dailyPoints } = event.detail
        updateUser({ points, daily_points: dailyPoints })
      }
      // detail이 없는 경우 (MyTab에서 발생한 이벤트)는 무시
    }

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener)
    }
  }, [user])

  return (
    <UserContext.Provider value={{
      user,
      loading,
      updateUser,
      refreshUser,
      signOut
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
