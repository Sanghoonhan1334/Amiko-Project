'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Badge } from '@/components/ui/badge'

interface TranslatedInterestsProps {
  interests: string[]
  maxDisplay?: number
  showCount?: boolean
  className?: string
}

export default function TranslatedInterests({ 
  interests, 
  maxDisplay = 2, 
  showCount = true,
  className = ""
}: TranslatedInterestsProps) {
  const { t, language } = useLanguage()
  
  if (!interests || interests.length === 0) {
    return <span className="text-gray-500">{t('profile.noInterests')}</span>
  }
  
  // 번역된 관심사들 가져오기
  const translatedInterests = interests.map(interest => {
    const translationKey = `videoCall.interests.${interest}`
    const translated = t(translationKey)
    
    // 디버깅 로그
    console.log(`[TranslatedInterests] 번역 시도: "${interest}" -> "${translationKey}" -> "${translated}"`)
    
    // 번역 키가 그대로 반환되면 번역 실패 (원문 사용)
    return translated === translationKey ? interest : translated
  })
  
  // 표시할 관심사와 숨겨진 개수
  const visibleInterests = translatedInterests.slice(0, maxDisplay)
  const remainingCount = translatedInterests.length - maxDisplay
  
  // 디버깅: 번역 테스트
  console.log('[TranslatedInterests] 언어:', language)
  console.log('[TranslatedInterests] remainingCount:', remainingCount)
  console.log('[TranslatedInterests] 번역 결과:', t('profile.interestsWithCount', { count: remainingCount }))
  
  return (
    <div className={className}>
      <span className="text-gray-600 dark:text-gray-300">
        {t('profile.interests')}: 
      </span>
      <span className="ml-1">
        {visibleInterests.join(', ')}
        {showCount && remainingCount > 0 && (
          <span className="text-gray-500">
            {t('profile.interestsWithCount', { count: remainingCount })}
          </span>
        )}
      </span>
    </div>
  )
}

// 관심사 배지 형태로 표시하는 컴포넌트
export function InterestBadges({ 
  interests, 
  maxDisplay = 5,
  className = ""
}: Omit<TranslatedInterestsProps, 'showCount'>) {
  const { t } = useLanguage()
  
  if (!interests || interests.length === 0) {
    return (
      <Badge variant="secondary" className="text-gray-500">
        {t('profile.noInterests')}
      </Badge>
    )
  }
  
  const translatedInterests = interests.map(interest => {
    const translationKey = `videoCall.interests.${interest}`
    const translated = t(translationKey)
    // 번역 키가 그대로 반환되면 번역 실패 (원문 사용)
    return translated === translationKey ? interest : translated
  })
  
  const visibleInterests = translatedInterests.slice(0, maxDisplay)
  const remainingCount = translatedInterests.length - maxDisplay
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visibleInterests.map((interest, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {interest}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs text-gray-500">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
