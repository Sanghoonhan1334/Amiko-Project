'use client'

import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useUser } from '@/context/UserContext'

interface VerificationGuardProps {
  requiredFeature?: 'video_matching' | 'coupon_usage' | 'community_posting' | 'all'
  showSuccess?: boolean
  className?: string
}

// 인증 상태 확인 함수
const isVerified = (user: any) => {
  if (!user) return false
  
  // 최소 하나의 인증 방법이 완료되어야 함
  return !!(user.email_verified_at || user.sms_verified_at || user.wa_verified_at || user.kakao_linked_at)
}

export default function VerificationGuard({
  showSuccess = false,
  className = ''
}: VerificationGuardProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useUser()
  const verified = isVerified(user)

  // 인증이 완료된 경우 성공 메시지 표시 (선택사항)
  if (verified && showSuccess) {
    return (
      <Alert className={`border-green-200 bg-green-50 text-green-800 ${className}`}>
        <CheckCircle className="h-4 w-4" />
              <AlertTitle>¡Verificación completada!</AlertTitle>
      <AlertDescription>
        La verificación de identidad se ha completado y puede usar todos los servicios.
      </AlertDescription>
      </Alert>
    )
  }

  // 인증이 완료된 경우 아무것도 표시하지 않음
  if (verified) {
    return null
  }



  const handleVerify = () => {
    router.push('/verify')
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 text-orange-800 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('meetTab.verificationRequired')}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>
            {t('meetTab.verificationDescription')}
          </p>
          
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <Shield className="h-4 w-4" />
            <span>{t('meetTab.verificationBenefits')}</span>
          </div>
          
          <Button
            onClick={handleVerify}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {t('meetTab.verifyNow')}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// 특정 기능별 인증 가드 컴포넌트들
export function VideoMatchingGuard(props: Omit<VerificationGuardProps, 'requiredFeature'>) {
  return <VerificationGuard requiredFeature="video_matching" {...props} />
}

export function CouponUsageGuard(props: Omit<VerificationGuardProps, 'requiredFeature'>) {
  return <VerificationGuard requiredFeature="coupon_usage" {...props} />
}

export function CommunityPostingGuard(props: Omit<VerificationGuardProps, 'requiredFeature'>) {
  return <VerificationGuard requiredFeature="community_posting" {...props} />
}
