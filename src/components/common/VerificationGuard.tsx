'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@/context/UserContext'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MessageSquare, Smartphone, ArrowRight, Shield } from 'lucide-react'

// 인증 레벨 정의
export type AuthLevel = 
  | 'none'           // 인증 불필요 (커뮤니티 읽기)
  | 'email'          // 이메일 인증 (커뮤니티 게시글 작성)
  | 'sms'            // SMS 인증 (영상통화, 결제)
  | 'full'           // 전체 인증 (모든 기능)

interface VerificationGuardProps {
  children: React.ReactNode
  requiredLevel?: AuthLevel
  className?: string
}


export default function VerificationGuard({ 
  children, 
  requiredLevel = 'none',
  className = ''
}: VerificationGuardProps) {
  const { user } = useUser()
  const { user: authUser } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [userAuthLevel, setUserAuthLevel] = useState<AuthLevel>('none')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // 운영자 상태 확인 함수
  const checkAdminStatus = async (currentUser: any) => {
    if (!currentUser?.id && !currentUser?.email) return false
    
    try {
      const params = new URLSearchParams()
      if (currentUser?.id) params.append('userId', currentUser.id)
      if (currentUser?.email) params.append('email', currentUser.email)
      
      const response = await fetch(`/api/admin/check?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.isAdmin || false
      }
    } catch (error) {
      console.error('VerificationGuard: 운영자 상태 확인 실패:', error)
    }
    return false
  }

  useEffect(() => {
    const checkUserAuthLevel = async () => {
      const currentUser = user || authUser
      if (!currentUser?.id) {
        setLoading(false)
        return
      }

      try {
        // 먼저 운영자 상태 확인
        const adminStatus = await checkAdminStatus(currentUser)
        setIsAdmin(adminStatus)
        
        // 운영자면 인증 체크 건너뛰기
        if (adminStatus) {
          setUserAuthLevel('full')
          setLoading(false)
          return
        }

        // 사용자의 인증 상태 확인
        console.log('[VerificationGuard] API 호출 시작:', currentUser.id)
        const response = await fetch(`/api/auth/status?userId=${currentUser.id}`)
        console.log('[VerificationGuard] API 응답 상태:', response.status)
        const result = await response.json()
        console.log('[VerificationGuard] API 응답 데이터:', result)

        if (response.ok) {
          const { emailVerified, smsVerified, profileComplete } = result
          
          console.log('[VerificationGuard] 인증 상태:', { emailVerified, smsVerified, profileComplete })
          
          // 인증 레벨 결정 (프로필 완성 여부 우선 확인)
          if (profileComplete) {
            setUserAuthLevel('full') // 프로필 완성은 full 레벨로 설정
            console.log('[VerificationGuard] 프로필 완성됨, full 레벨로 설정')
          } else if (smsVerified) {
            setUserAuthLevel('sms')
            console.log('[VerificationGuard] SMS 인증됨, sms 레벨로 설정')
          } else if (emailVerified) {
            setUserAuthLevel('email')
            console.log('[VerificationGuard] 이메일 인증됨, email 레벨로 설정')
          } else {
            setUserAuthLevel('none')
            console.log('[VerificationGuard] 인증 없음, none 레벨로 설정')
          }
        } else {
          setUserAuthLevel('none')
          console.log('[VerificationGuard] API 응답 실패')
        }
      } catch (error) {
        console.error('인증 레벨 확인 오류:', error)
        setUserAuthLevel('none')
      } finally {
        setLoading(false)
      }
    }

    checkUserAuthLevel()
  }, [user?.id])

  // 인증 레벨 확인
  const hasRequiredLevel = (required: AuthLevel, current: AuthLevel): boolean => {
    const levels = ['none', 'email', 'sms', 'full']
    const requiredIndex = levels.indexOf(required)
    const currentIndex = levels.indexOf(current)
    const hasLevel = currentIndex >= requiredIndex
    
    console.log('[VerificationGuard] 레벨 확인:', { 
      required, 
      current, 
      requiredIndex, 
      currentIndex, 
      hasLevel 
    })
    
    return hasLevel
  }

  // 로딩 중
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-2 ${className}`}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-1"></div>
          <p className="text-gray-600 text-sm">{t('auth.checkingVerificationStatus')}</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 경우 - 아무것도 표시하지 않음
  const currentUser = user || authUser
  if (!currentUser) {
    return <div className={className}>{children}</div>
  }

  // 인증이 필요한 서비스인지 확인
  const needsVerification = requiredLevel !== 'none'

  // 인증이 필요하지 않은 서비스인 경우 바로 렌더링
  if (!needsVerification) {
    return <div className={className}>{children}</div>
  }

  // 사용자가 필요한 인증 레벨을 가지고 있는지 확인
  // 인증이 필요하지 않거나 충분한 경우 (운영자는 항상 통과)
  if (hasRequiredLevel(requiredLevel, userAuthLevel) || isAdmin) {
    return <div className={className}>{children}</div>
  }

  // 인증이 필요한 경우 - 아무것도 표시하지 않음 (모달 완전 제거)
  return <div className={className}></div>
}