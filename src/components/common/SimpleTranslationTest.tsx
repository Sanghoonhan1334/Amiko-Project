'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function SimpleTranslationTest() {
  const { t, language, toggleLanguage } = useLanguage()
  
  // 직접 번역 테스트
  const directTest = t('videoCall.interests.영화')
  const directTest2 = t('videoCall.interests.음악')
  
  return (
    <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
      <h3 className="font-bold mb-2">직접 번역 테스트</h3>
      <div className="space-y-1 text-sm">
        <div>현재 언어: <strong>{language}</strong></div>
        <div>영화 번역: <strong>"{directTest}"</strong></div>
        <div>음악 번역: <strong>"{directTest2}"</strong></div>
        
        <button 
          onClick={toggleLanguage}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
        >
          언어 전환 ({language === 'ko' ? 'Español' : '한국어'})
        </button>
        
        <div className="mt-2 text-xs text-gray-600">
          번역 키 테스트:
          <br />• videoCall.interests.영화
          <br />• videoCall.interests.음악
        </div>
      </div>
    </div>
  )
}
