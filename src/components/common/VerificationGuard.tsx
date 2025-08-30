'use client'

import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { isVerified, UserProfile } from '@/lib/auth-utils'
import { useLanguage } from '@/context/LanguageContext'

interface VerificationGuardProps {
  profile: UserProfile | null
  requiredFeature?: 'video_matching' | 'coupon_usage' | 'community_posting' | 'all'
  showSuccess?: boolean
  className?: string
}

export default function VerificationGuard({
  profile,
  requiredFeature = 'all',
  showSuccess = false,
  className = ''
}: VerificationGuardProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const verified = isVerified(profile)

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

  // 인증이 필요한 경우 경고 배너 표시
  const getFeatureName = (feature: string) => {
    switch (feature) {
      case 'video_matching':
        return t('meetTab.verificationRequired').includes('Verificación') ? 'Emparejamiento por video' : '영상 매칭'
      case 'coupon_usage':
        return t('meetTab.verificationRequired').includes('Verificación') ? 'Uso de cupones' : '쿠폰 사용'
      case 'community_posting':
        return t('meetTab.verificationRequired').includes('Verificación') ? 'Actividades comunitarias' : '커뮤니티 활동'
      case 'all':
      default:
        return t('meetTab.verificationRequired').includes('Verificación') ? 'este servicio' : '이 서비스'
    }
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
export function VideoMatchingGuard({ profile, ...props }: Omit<VerificationGuardProps, 'requiredFeature'>) {
  return <VerificationGuard profile={profile} requiredFeature="video_matching" {...props} />
}

export function CouponUsageGuard({ profile, ...props }: Omit<VerificationGuardProps, 'requiredFeature'>) {
  return <VerificationGuard profile={profile} requiredFeature="coupon_usage" {...props} />
}

export function CommunityPostingGuard({ profile, ...props }: Omit<VerificationGuardProps, 'requiredFeature'>) {
  return <VerificationGuard profile={profile} requiredFeature="community_posting" {...props} />
}
