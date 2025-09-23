'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Shield, Mail, Phone, User, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function VerificationExplanation() {
  const { t } = useLanguage()

  const steps = [
    {
      step: 1,
      title: t('auth.step1Title'),
      description: t('auth.step1Desc'),
      icon: Mail
    },
    {
      step: 2,
      title: t('auth.step2Title'),
      description: t('auth.step2Desc'),
      icon: Phone
    },
    {
      step: 3,
      title: t('auth.step3Title'),
      description: t('auth.step3Desc'),
      icon: User
    }
  ]

  return (
    <div className="space-y-6">
      {/* 검증 절차 필요성 설명 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900">
                {t('auth.verificationNeeded')}
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>{t('auth.verificationReason1').split(':')[0]}:</strong>
                    {t('auth.verificationReason1').split(':')[1]}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>{t('auth.verificationReason2').split(':')[0]}:</strong>
                    {t('auth.verificationReason2').split(':')[1]}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>{t('auth.verificationReason3').split(':')[0]}:</strong>
                    {t('auth.verificationReason3').split(':')[1]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 검증 단계별 설명 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center mb-6">
          {t('auth.verificationSteps')}
        </h3>
        
        {steps.map((step, index) => (
          <div key={step.step} className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {step.step}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <step.icon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold">{step.title}</h4>
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
