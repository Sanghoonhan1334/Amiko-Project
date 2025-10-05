'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { translations, Language } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko')

  // 컴포넌트가 마운트된 후에만 localStorage 접근
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('amiko-language')
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'es')) {
        setLanguage(savedLanguage as Language)
      } else {
        // 브라우저 언어 감지
        const browserLang = navigator.language
        if (browserLang.startsWith('es')) {
          setLanguage('es')
          localStorage.setItem('amiko-language', 'es')
        } else {
          setLanguage('ko')
          localStorage.setItem('amiko-language', 'ko')
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      setLanguage('ko')
    }
  }, [])

  // useCallback으로 t 함수 최적화 (불필요한 리렌더링 방지)
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    try {
      const keys = key.split('.')
      let value: unknown = translations[language]
      
      for (const k of keys) {
        if (typeof value === 'object' && value !== null && k in value) {
          value = (value as Record<string, unknown>)[k]
        } else {
          console.warn(`Translation key not found: ${key} in language ${language}`)
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
        console.warn(`Translation value is not a string for key: ${key}`, value)
        return key
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
    toggleLanguage
  }), [language, setLanguage, t, toggleLanguage])

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
