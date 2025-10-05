'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Shield } from 'lucide-react'

// 인증 레벨 정의
export type AuthLevel = 'none' | 'email' | 'sms' | 'full'

interface AuthGuardProps {
  children: React.ReactNode
  requiredLevel: AuthLevel
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, requiredLevel, fallback }: AuthGuardProps) {
  const { user } = useAuth()
  const [userAuthLevel, setUserAuthLevel] = useState<AuthLevel>('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthLevel = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/status?userId=${user.id}`)
        const result = await response.json()

        if (response.ok) {
          setUserAuthLevel(result.authLevel)
        }
      } catch (error) {
        console.error('인증 레벨 확인 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthLevel()
  }, [user?.id])

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // 인증 레벨 확인
  const hasRequiredLevel = (required: AuthLevel, current: AuthLevel): boolean => {
    const levels = ['none', 'email', 'sms', 'full']
    const requiredIndex = levels.indexOf(required)
    const currentIndex = levels.indexOf(current)
    return currentIndex >= requiredIndex
  }

  // 로그인하지 않은 사용자 - 로그인 페이지로 이동
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle>로그인이 필요합니다</CardTitle>
          <CardDescription>
            게시글을 작성하려면 먼저 로그인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => window.location.href = '/sign-in'}
            className="w-full"
          >
            로그인하기
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            돌아가기
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 인증 레벨이 충족된 경우
  if (hasRequiredLevel(requiredLevel, userAuthLevel)) {
    return <>{children}</>
  }

  // 인증이 필요한 경우 (로그인은 했지만 인증 레벨이 부족)
  if (fallback) {
    return <>{fallback}</>
  }

  // 기본 인증 요청 화면
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {requiredLevel === 'email' && <Mail className="w-12 h-12 text-blue-600" />}
          {requiredLevel === 'sms' && <Phone className="w-12 h-12 text-green-600" />}
          {requiredLevel === 'full' && <Shield className="w-12 h-12 text-purple-600" />}
        </div>
        <CardTitle>
          {requiredLevel === 'email' && '이메일 인증이 필요합니다'}
          {requiredLevel === 'sms' && 'SMS 인증이 필요합니다'}
          {requiredLevel === 'full' && '전체 인증이 필요합니다'}
        </CardTitle>
        <CardDescription>
          {requiredLevel === 'email' && '커뮤니티 게시글을 작성하려면 이메일 인증이 필요합니다.'}
          {requiredLevel === 'sms' && '영상통화나 결제 서비스를 이용하려면 SMS 인증이 필요합니다.'}
          {requiredLevel === 'full' && '모든 서비스를 이용하려면 전체 인증이 필요합니다.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => window.location.href = '/verification'}
          className="w-full"
        >
          인증하기
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="w-full"
        >
          돌아가기
        </Button>
      </CardContent>
    </Card>
  )
}
