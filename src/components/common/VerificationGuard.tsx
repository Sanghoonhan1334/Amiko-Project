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
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
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

  // 인증이 필요한 경우 가드 화면 표시
  const getStatusInfo = () => {
    const getRequiredLevelText = (level: AuthLevel) => {
      switch (level) {
        case 'email':
          return '이메일 인증'
        case 'sms':
          return '전화번호 인증'
        case 'full':
          return '프로필 완성'
        default:
          return '인증'
      }
    }

    if (requiredLevel === 'sms') {
      return {
        icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
        title: '전화번호 인증이 필요합니다',
        description: '게시판 참여와 영상통화를 위해 전화번호 인증이 필요합니다.',
        badge: <Badge variant="outline" className="text-orange-600 border-orange-300">인증 필요</Badge>,
        buttonText: '인증센터로 이동',
        buttonAction: () => router.push('/verification-center'),
        showDualOptions: false
      }
    }

    return {
      icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
      title: `${getRequiredLevelText(requiredLevel)}이 필요합니다`,
      description: `이 기능을 이용하려면 ${getRequiredLevelText(requiredLevel)}을 완료해주세요.`,
      badge: <Badge variant="outline" className="text-orange-600 border-orange-300">인증 필요</Badge>,
      buttonText: '인증하기',
      buttonAction: () => router.push('/verification'),
      showDualOptions: false
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`flex items-center justify-center p-2 ${className}`}>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-1">
          <div className="flex justify-center mb-0">
            {statusInfo.icon}
          </div>
          <CardTitle className="flex items-center justify-center gap-1 text-lg">
            {statusInfo.title}
            {statusInfo.badge}
          </CardTitle>
          <CardDescription className="text-center text-sm">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {statusInfo.showDualOptions ? (
            <div className="space-y-1">
              {/* WhatsApp 인증 버튼 */}
              <Button 
                onClick={() => router.push('/verification-simple?method=whatsapp')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200 border-0"
              >
                <div className="flex items-center justify-center w-full">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-base">WhatsApp으로 인증</div>
                    <div className="text-xs opacity-90 font-medium">WhatsApp 메시지로 인증번호 받기</div>
                  </div>
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Button>
              
              {/* SMS 인증 버튼 */}
              <Button 
                onClick={() => router.push('/verification-simple?method=sms')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200 border-0"
              >
                <div className="flex items-center justify-center w-full">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-base">SMS로 인증</div>
                    <div className="text-xs opacity-90 font-medium">문자 메시지로 인증번호 받기</div>
                  </div>
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Button>
            </div>
          ) : (
            <Button 
              onClick={statusInfo.buttonAction}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                {statusInfo.buttonText}
                <ArrowRight className="w-3 h-3" />
              </div>
            </Button>
          )}
          
          <div className="text-center">
          </div>
        </CardContent>
      </Card>
    </div>
  )
}