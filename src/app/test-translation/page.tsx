'use client'

import InterestTranslationDemo from '@/components/common/InterestTranslationDemo'
import TranslatedInterests, { InterestBadges } from '@/components/common/TranslatedInterests'
import TranslationDebug from '@/components/common/TranslationDebug'
import SimpleTranslationTest from '@/components/common/SimpleTranslationTest'

export default function TestTranslationPage() {
  const testInterests = ['K-POP', '드라마', '여행', '요리', '음악']
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          관심사 번역 테스트 페이지
        </h1>
        
        {/* 디버깅 컴포넌트 */}
        <SimpleTranslationTest />
        <TranslationDebug />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* 데모 컴포넌트 */}
          <InterestTranslationDemo />
          
          {/* 직접 사용 예시 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">직접 사용 예시</h3>
            
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
              
              {/* 전체 관심사 표시 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2">전체 관심사:</h4>
                <TranslatedInterests 
                  interests={testInterests}
                  maxDisplay={5}
                  showCount={false}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 기대 결과 설명 */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">기대 결과</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>한국어:</strong> 관심사: K-POP, 드라마 외 3개
            </div>
            <div>
              <strong>스페인어:</strong> Intereses: K-POP, Dramas y 3 más
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
