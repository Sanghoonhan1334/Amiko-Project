'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { translations, Language } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => any
  toggleLanguage: () => void
  setUserLanguage: (userLanguage: string | null) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es')
  const [userLanguageSet, setUserLanguageSet] = useState(false)

  // 컴포넌트가 마운트된 후에만 localStorage 접근
  useEffect(() => {
    try {
      // 1. 사용자 프로필 언어 우선 확인
      const userLanguage = localStorage.getItem('amiko-user-language')
      if (userLanguage && (userLanguage === 'ko' || userLanguage === 'es')) {
        console.log('[LANGUAGE] 사용자 프로필 언어 적용:', userLanguage)
        setLanguage(userLanguage as Language)
        localStorage.setItem('amiko-language', userLanguage)
        setUserLanguageSet(true)
        return
      }

      // 2. 저장된 언어 설정 확인
      const savedLanguage = localStorage.getItem('amiko-language')
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'es')) {
        setLanguage(savedLanguage as Language)
      } else {
        // 3. 브라우저 언어 및 시간대 감지
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
          setLanguage('es')
          localStorage.setItem('amiko-language', 'es')
          console.log('[LANGUAGE] 브라우저/시간대 기반 스페인어 설정:', { browserLang, timezone })
        } else {
          setLanguage('ko')
          localStorage.setItem('amiko-language', 'ko')
          console.log('[LANGUAGE] 기본 한국어 설정:', { browserLang, timezone })
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      setLanguage('ko')
    }
  }, [])

  // 사용자 프로필 언어 설정 함수
  const setUserLanguage = useCallback((userLanguage: string | null) => {
    if (userLanguageSet) return // 이미 사용자 언어가 설정되었으면 무시

    if (userLanguage && (userLanguage === 'ko' || userLanguage === 'es')) {
      console.log('[LANGUAGE] 사용자 프로필 언어 적용:', userLanguage)
      setLanguage(userLanguage as Language)
      localStorage.setItem('amiko-language', userLanguage)
      setUserLanguageSet(true)
    }
  }, [userLanguageSet])

  // useCallback으로 t 함수 최적화 (불필요한 리렌더링 방지)
  const t = useCallback((key: string, params?: Record<string, string | number>): any => {
    try {
      const keys = key.split('.')
      let value: unknown = translations[language]

      for (const k of keys) {
        if (typeof value === 'object' && value !== null && k in value) {
          value = (value as Record<string, unknown>)[k]
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Translation key not found: ${key} in language ${language}`)
          }
          return key
        }
      }

      if (typeof value === 'string') {
        let result = value

        // Replace placeholders with parameters
        if (params) {
          for (const [paramKey, paramValue] of Object.entries(params)) {
            result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue))
          }
        }

        return result
      } else {
        return value
      }
    } catch (error) {
      console.error(`Error translating key ${key}:`, error)
      return key
    }
  }, [language])

  // useCallback으로 toggleLanguage 함수 최적화
  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'ko' ? 'es' : 'ko'
    setLanguage(newLanguage)
    try {
      localStorage.setItem('amiko-language', newLanguage)
    } catch (error) {
      console.error('Error saving language to localStorage:', error)
    }
  }, [language])

  // useMemo로 contextValue 최적화 (불필요한 리렌더링 방지)
  const contextValue: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    t,
    toggleLanguage,
    setUserLanguage
  }), [language, setLanguage, t, toggleLanguage, setUserLanguage])

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
