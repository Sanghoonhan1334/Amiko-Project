'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function TranslationDebug() {
  const { t, language } = useLanguage()
  
  const testCount = 3
  const testInterests = ['영화', '음악', '여행']
  
  return (
    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
      <h3 className="font-bold mb-2">번역 디버깅</h3>
      <div className="space-y-1 text-sm">
        <div>현재 언어: <strong>{language}</strong></div>
        <div>관심사: <strong>"{t('profile.interests')}"</strong></div>
        <div>외 3개: <strong>"{t('profile.interestsWithCount', { count: testCount })}"</strong></div>
        
        <div className="mt-2">
          <div className="font-medium">개별 관심사 번역:</div>
          {testInterests.map(interest => (
            <div key={interest}>
              {interest}: <strong>"{t(`videoCall.interests.${interest}`)}"</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
