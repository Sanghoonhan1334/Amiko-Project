'use client'

import { useState, useEffect } from 'react'

export function useLocale(): 'ko' | 'es' {
  const [locale, setLocale] = useState<'ko' | 'es'>('es') // 기본값은 스페인어

  useEffect(() => {
    // 브라우저 언어 감지
    const browserLanguage = navigator.language.toLowerCase()
    
    // 한국어 감지
    if (browserLanguage.startsWith('ko')) {
      setLocale('ko')
    } else {
      // 기본값은 스페인어
      setLocale('es')
    }
  }, [])

  return locale
}
