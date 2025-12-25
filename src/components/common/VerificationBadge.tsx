'use client'

import { CheckCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface VerificationBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function VerificationBadge({ className = '', size = 'md' }: VerificationBadgeProps) {
  const { language } = useLanguage()

  const sizeClasses = {
    sm: 'w-3 h-3 text-xs px-1.5 py-0.5',
    md: 'w-4 h-4 text-xs px-2 py-0.5',
    lg: 'w-5 h-5 text-sm px-2.5 py-1'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium ${sizeClasses[size]} ${className}`}
      title={language === 'ko' ? '인증된 사용자' : 'Usuario verificado'}
    >
      <CheckCircle className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'}`} />
      <span className="hidden sm:inline">
        {language === 'ko' ? '인증됨' : 'Verified'}
      </span>
    </span>
  )
}

