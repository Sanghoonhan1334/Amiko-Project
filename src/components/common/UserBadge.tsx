import React from 'react'
import { getUserLevel } from '@/lib/user-level'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLanguage } from '@/context/LanguageContext'

type Props = {
  totalPoints: number
  isVip?: boolean
  userId?: string // 로그/분석용
  showLabel?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const ICONS: Record<string, string> = {
  sprout: '🌱',
  lv: '🌿',
  rose: '🌹',
  vip: '👑',
}

export default function UserBadge({ totalPoints, isVip, userId, showLabel = true, className = '', size = 'md' }: Props) {
  const { t } = useLanguage()
  const { level, label } = getUserLevel(totalPoints)
  const isRose = level === 'rose'
  const isSprout = level === 'sprout'
  
  // 번역된 레벨 라벨
  const translatedLabel = t(`myTab.levelLabels.${level}`)

  React.useEffect(() => {
    // 주요 배지 노출 로그(브라우저 콘솔, e.g. analytics/DB 확장 가능)
    if (typeof window !== 'undefined') {
      console.log('[UserBadge 노출]', { userId, totalPoints, level, label, isVip, timestamp: new Date().toISOString() })
    }
  }, [userId, totalPoints, level, label, isVip])

  // 사이즈 별 클래스
  const iconSizeClass = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg',
  }[size]
  const labelSizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5',
  }[size]

  // 병렬 표기 정책
  const badges: React.ReactNode[] = []
  if (isVip) badges.push(<span key="vip" className={iconSizeClass} title="VIP">{ICONS.vip}</span>)
  if (isRose) badges.push(<span key="rose" className={iconSizeClass} title={t('myTab.levelTooltip.rosePoints')}>{ICONS.rose}</span>)
  if (!isRose) {
    badges.push(<span key="leaf" className={iconSizeClass} title={translatedLabel}>{isSprout ? ICONS.sprout : ICONS.lv}</span>)
    if (!isSprout && showLabel) {
      badges.push(
        <span
          key="lv"
          className={`inline-flex items-center rounded-full bg-green-100 text-green-800 font-medium ${labelSizeClass}`}
        >
          {translatedLabel}
        </span>
      )
    }
  }

  // 툴팁 내용
  const tooltipContent = (
    <TooltipContent>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{translatedLabel} {isVip && '(VIP)'}</span>
        <span className="text-xs text-gray-500">{t('myTab.levelTooltip.totalPoints', { points: totalPoints })}</span>
        {(isRose || isVip) && (
          <span className="text-xs text-pink-600">
            {isRose && t('myTab.levelTooltip.roseSpecial')}
            {isVip && t('myTab.levelTooltip.vipSpecial')}
          </span>
        )}
        {(!isRose && !isVip) && (
          <span className="text-xs text-gray-400">{t('myTab.levelTooltip.levelUp')}</span>
        )}
      </div>
    </TooltipContent>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`${t('myTab.levelTooltip.totalPoints', { points: totalPoints })} • ${translatedLabel}`}>{badges}</span>
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    </TooltipProvider>
  )
}


