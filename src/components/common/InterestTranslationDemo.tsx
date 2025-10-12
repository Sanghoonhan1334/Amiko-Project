'use client'

import { useLanguage } from '@/context/LanguageContext'
import TranslatedInterests, { InterestBadges } from './TranslatedInterests'
import { Button } from '@/components/ui/button'

export default function InterestTranslationDemo() {
  const { language, toggleLanguage } = useLanguage()
  
  // 테스트용 관심사 데이터
  const testInterests = ['K-POP', '드라마', '여행', '요리', '음악']
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">관심사 번역 테스트</h3>
        <Button onClick={toggleLanguage} variant="outline" size="sm">
          {language === 'ko' ? 'Español' : '한국어'}로 변경
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* 텍스트 형태 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">텍스트 형태:</h4>
          <TranslatedInterests 
            interests={testInterests}
            maxDisplay={2}
            showCount={true}
          />
        </div>
        
        {/* 배지 형태 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">배지 형태:</h4>
          <InterestBadges 
            interests={testInterests}
            maxDisplay={3}
          />
        </div>
        
        {/* 현재 언어 표시 */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          현재 언어: {language === 'ko' ? '한국어' : 'Español'}
        </div>
      </div>
    </div>
  )
}
