'use client'

import { useState, useEffect } from 'react'

export function useLocale(): 'ko' | 'es' {
  const [locale, setLocale] = useState<'ko' | 'es'>('ko') // LanguageContext와 동일한 기본값

  useEffect(() => {
    try {
      // 1. 저장된 언어 설정 확인
      const savedLanguage = localStorage.getItem('amiko-language')
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'es')) {
        setLocale(savedLanguage as 'ko' | 'es')
        return
      }

      // 2. 브라우저 언어 및 시간대 감지 (LanguageContext와 동일한 로직)
      const browserLang = navigator.language
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      // 시간대 기반 국가 추정
      const isSpanishSpeakingRegion = timezone.includes('America/') && 
        !timezone.includes('America/New_York') && 
        !timezone.includes('America/Chicago') && 
        !timezone.includes('America/Denver') && 
        !timezone.includes('America/Los_Angeles')
      
      // 브라우저 언어가 스페인어이거나 스페인어권 시간대인 경우
      if (browserLang.startsWith('es') || isSpanishSpeakingRegion) {
        setLocale('es')
        localStorage.setItem('amiko-language', 'es')
      } else {
        setLocale('ko')
        localStorage.setItem('amiko-language', 'ko')
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      setLocale('ko')
    }
  }, [])

  return locale
}
