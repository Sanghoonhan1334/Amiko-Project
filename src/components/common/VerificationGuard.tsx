'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface VerificationGuardProps {
  children: React.ReactNode
  requiredFeature?: 'all' | 'consultation' | 'community' | 'community_posting'
  className?: string
}

interface VerificationStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
  message?: string
  submitted_at?: string
  reviewed_at?: string
  admin_notes?: string
}

export default function VerificationGuard({ 
  children, 
  requiredFeature = 'all',
  className = ''
}: VerificationGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/verification?userId=${user.id}`)
        const result = await response.json()

        if (response.ok) {
          setVerificationStatus(result.verification)
        } else {
          console.error('인증 상태 확인 실패:', result.error)
          setVerificationStatus({ status: 'not_submitted' })
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
        setVerificationStatus({ status: 'not_submitted' })
      } finally {
        setLoading(false)
      }
    }

    checkVerificationStatus()
  }, [user?.id])

  // 로딩 중
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              이 서비스를 이용하려면 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 인증이 필요한 서비스인지 확인
  const needsVerification = requiredFeature === 'all' || requiredFeature === 'consultation'

  // 인증이 필요하지 않은 서비스인 경우 바로 렌더링
  if (!needsVerification) {
    return <div className={className}>{children}</div>
  }

  // 인증 상태에 따른 처리
  const status = verificationStatus?.status || 'not_submitted'

  // 인증 승인된 경우
  if (status === 'approved') {
    return <div className={className}>{children}</div>
  }

  // 인증이 필요한 경우 가드 화면 표시
  const getStatusInfo = () => {
    switch (status) {
      case 'not_submitted':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
          title: '인증이 필요합니다',
          description: '상담 서비스를 이용하려면 사용자 인증을 완료해주세요.',
          badge: <Badge variant="outline" className="text-orange-600 border-orange-300">인증 필요</Badge>,
          buttonText: '인증하기',
          buttonAction: () => router.push('/verification')
        }
      case 'pending':
        return {
          icon: <Clock className="w-8 h-8 text-blue-500" />,
          title: '인증 검토 중',
          description: '제출하신 인증 정보를 검토 중입니다. 검토 완료 후 결과를 알려드리겠습니다.',
          badge: <Badge variant="outline" className="text-blue-600 border-blue-300">검토 중</Badge>,
          buttonText: '인증 상태 확인',
          buttonAction: () => router.push('/verification')
        }
      case 'rejected':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: '인증이 거부되었습니다',
          description: verificationStatus?.admin_notes || '제출하신 인증 정보에 문제가 있습니다. 다시 제출해주세요.',
          badge: <Badge variant="outline" className="text-red-600 border-red-300">인증 거부</Badge>,
          buttonText: '다시 인증하기',
          buttonAction: () => router.push('/verification')
        }
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-gray-500" />,
          title: '인증 상태를 확인할 수 없습니다',
          description: '인증 상태를 확인하는 중 오류가 발생했습니다.',
          badge: <Badge variant="outline" className="text-gray-600 border-gray-300">상태 불명</Badge>,
          buttonText: '인증하기',
          buttonAction: () => router.push('/verification')
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {statusInfo.title}
            {statusInfo.badge}
          </CardTitle>
          <CardDescription className="text-center">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus?.submitted_at && (
            <div className="text-sm text-gray-600 text-center">
              제출일: {new Date(verificationStatus.submitted_at).toLocaleDateString('ko-KR')}
            </div>
          )}
          
          <Button 
            onClick={statusInfo.buttonAction}
            className="w-full"
          >
            {statusInfo.buttonText}
          </Button>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/main')}
            >
              메인으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}